import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import { ApplicationStatus } from '@prisma/client';
import { SubmitApplicationDto, UpdateApplicationStatusDto } from './dto';

/**
 * Application Workflow Service
 * SPEC-APP-001: Enhanced application workflow with state machine
 */
@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Submit a new job application
   * REQ-APP-001: Job Application Submission
   */
  async submitApplication(userId: number, jobId: number, dto: SubmitApplicationDto) {
    // Get worker profile
    const workerProfile = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });

    if (!workerProfile) {
      throw new NotFoundException('Worker profile not found');
    }

    // Verify job exists and is active
    const job = await this.prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: { screeningQuestions: true },
    });

    if (!job) {
      throw new NotFoundException('Job posting not found');
    }

    if (job.status !== 'ACTIVE') {
      throw new BadRequestException('Job is not accepting applications');
    }

    // Check for duplicate application
    const existingApplication = await this.prisma.application.findUnique({
      where: {
        jobId_workerId: {
          jobId,
          workerId: workerProfile.id,
        },
      },
    });

    if (existingApplication) {
      throw new ConflictException('You have already applied to this job');
    }

    // Validate screening answers if required
    if (job.screeningQuestions.length > 0) {
      this.validateScreeningAnswers(job.screeningQuestions, dto.screeningAnswers || []);
    }

    // Create application
    const application = await this.prisma.application.create({
      data: {
        jobId,
        workerId: workerProfile.id,
        status: ApplicationStatus.PENDING,
        coverLetter: dto.coverLetter,
        statusHistory: {
          create: {
            toStatus: ApplicationStatus.PENDING,
            changedBy: userId,
            reason: 'Initial application submission',
          },
        },
        screeningAnswers: dto.screeningAnswers
          ? {
              create: dto.screeningAnswers.map((answer) => ({
                questionId: answer.questionId,
                answer: answer.answer as any, // Prisma Json field
              })),
            }
          : undefined,
      },
      include: {
        workerProfile: {
          include: {
            user: true,
          },
        },
        jobPosting: {
          include: {
            businessProfile: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    // Create conversation for messaging (REQ-APP-006)
    const businessUserId = application.jobPosting.businessProfile.user.id;
    await this.prisma.conversation.create({
      data: {
        user1Id: userId,
        user2Id: businessUserId,
        jobApplicationId: application.id,
      },
    });

    // Trigger notification (integration point)
    // TODO: Integrate with NotificationsService

    return application;
  }

  /**
   * Accept an application
   * REQ-APP-004: Accept/Reject Workflow
   */
  async acceptApplication(applicationId: number, userId: number, reason?: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        jobPosting: true,
        workerProfile: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Verify business owns the job
    const businessProfile = await this.prisma.businessProfile.findFirst({
      where: { userId },
    });

    if (!businessProfile || application.jobPosting.businessId !== businessProfile.id) {
      throw new ForbiddenException('You can only accept applications for your own jobs');
    }

    // Validate status transition
    this.validateStatusTransition(application.status, ApplicationStatus.ACCEPTED);

    // Update application status
    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: ApplicationStatus.ACCEPTED,
        acceptedAt: new Date(),
        statusHistory: {
          create: {
            fromStatus: application.status,
            toStatus: ApplicationStatus.ACCEPTED,
            changedBy: userId,
            reason: reason || 'Application accepted',
          },
        },
      },
      include: {
        workerProfile: {
          include: {
            user: true,
          },
        },
        jobPosting: true,
      },
    });

    // Trigger notification to worker
    // TODO: Integrate with NotificationsService.notifyApplicationStatusChanged()

    return updated;
  }

  /**
   * Reject an application
   * REQ-APP-004: Accept/Reject Workflow
   */
  async rejectApplication(applicationId: number, userId: number, reason?: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { jobPosting: true },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Verify business owns the job
    const businessProfile = await this.prisma.businessProfile.findFirst({
      where: { userId },
    });

    if (!businessProfile || application.jobPosting.businessId !== businessProfile.id) {
      throw new ForbiddenException('You can only reject applications for your own jobs');
    }

    // Validate status transition
    this.validateStatusTransition(application.status, ApplicationStatus.REJECTED);

    // Update application status
    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: ApplicationStatus.REJECTED,
        rejectedAt: new Date(),
        statusHistory: {
          create: {
            fromStatus: application.status,
            toStatus: ApplicationStatus.REJECTED,
            changedBy: userId,
            reason: reason || 'Application rejected',
          },
        },
      },
    });

    // Trigger notification to worker
    // TODO: Integrate with NotificationsService.notifyApplicationStatusChanged()

    return updated;
  }

  /**
   * Withdraw an application
   * Worker can withdraw their own application
   */
  async withdrawApplication(applicationId: number, userId: number, reason?: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { workerProfile: true },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Verify worker owns the application
    if (application.workerProfile.userId !== userId) {
      throw new ForbiddenException('You can only withdraw your own applications');
    }

    // Validate status transition
    this.validateStatusTransition(application.status, ApplicationStatus.WITHDRAWN);

    // Update application status
    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: ApplicationStatus.WITHDRAWN,
        withdrawnAt: new Date(),
        statusHistory: {
          create: {
            fromStatus: application.status,
            toStatus: ApplicationStatus.WITHDRAWN,
            changedBy: userId,
            reason: reason || 'Application withdrawn by worker',
          },
        },
      },
    });

    return updated;
  }

  /**
   * Get applicant profile for business owners
   * REQ-APP-003: Applicant Profile Viewing
   */
  async getApplicantProfile(applicationId: number, userId: number) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        jobPosting: true,
        workerProfile: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Verify business owns the job
    const businessProfile = await this.prisma.businessProfile.findFirst({
      where: { userId },
    });

    if (!businessProfile || application.jobPosting.businessId !== businessProfile.id) {
      throw new ForbiddenException('You can only view profiles for your own job applications');
    }

    return application.workerProfile;
  }

  /**
   * Get application status history
   */
  async getApplicationStatusHistory(applicationId: number) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return this.prisma.applicationStatusHistory.findMany({
      where: { applicationId },
      orderBy: { changedAt: 'desc' },
      include: {
        changedByUser: {
          select: {
            id: true,
            email: true,
            workerProfile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            businessProfiles: {
              select: {
                businessName: true,
              },
              take: 1,
            },
          },
        },
      },
    });
  }

  /**
   * Find applications by user (worker or business)
   */
  async findByUserId(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user.role === 'WORKER') {
      const workerProfile = await this.prisma.workerProfile.findUnique({
        where: { userId },
      });

      return this.prisma.application.findMany({
        where: { workerId: workerProfile.id },
        include: {
          jobPosting: {
            include: {
              businessProfile: true,
            },
          },
        },
      });
    } else {
      const businessProfile = await this.prisma.businessProfile.findUnique({
        where: { userId },
      });

      const jobPostings = await this.prisma.jobPosting.findMany({
        where: { businessId: businessProfile.id },
        select: { id: true },
      });

      return this.prisma.application.findMany({
        where: {
          jobId: { in: jobPostings.map((j) => j.id) },
        },
        include: {
          workerProfile: {
            include: {
              user: true,
            },
          },
          jobPosting: true,
        },
      });
    }
  }

  /**
   * Find application by ID
   */
  async findById(applicationId: number) {
    return this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        workerProfile: {
          include: {
            user: true,
          },
        },
        jobPosting: {
          include: {
            businessProfile: true,
          },
        },
        screeningAnswers: {
          include: {
            question: true,
          },
        },
      },
    });
  }

  /**
   * Validate status transition based on state machine rules
   */
  private validateStatusTransition(from: ApplicationStatus, to: ApplicationStatus) {
    const validTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
      [ApplicationStatus.DRAFT]: [ApplicationStatus.PENDING, ApplicationStatus.CANCELLED],
      [ApplicationStatus.PENDING]: [
        ApplicationStatus.ACCEPTED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.WITHDRAWN,
        ApplicationStatus.CANCELLED,
      ],
      [ApplicationStatus.ACCEPTED]: [
        ApplicationStatus.NEGOTIATING,
        ApplicationStatus.CANCELLED,
        ApplicationStatus.WITHDRAWN,
      ],
      [ApplicationStatus.NEGOTIATING]: [
        ApplicationStatus.CONFIRMED,
        ApplicationStatus.CANCELLED,
        ApplicationStatus.ACCEPTED,
      ],
      [ApplicationStatus.CONFIRMED]: [
        ApplicationStatus.ACTIVE,
        ApplicationStatus.CANCELLED,
      ],
      [ApplicationStatus.ACTIVE]: [
        ApplicationStatus.COMPLETED,
        ApplicationStatus.CANCELLED,
      ],
      [ApplicationStatus.COMPLETED]: [], // Terminal state
      [ApplicationStatus.CANCELLED]: [], // Terminal state
      [ApplicationStatus.WITHDRAWN]: [], // Terminal state
      [ApplicationStatus.REJECTED]: [], // Terminal state
    };

    const allowed = validTransitions[from]?.includes(to);

    if (!allowed) {
      throw new BadRequestException(
        `Invalid status transition from ${from} to ${to}`,
      );
    }
  }

  /**
   * Validate screening answers against required questions
   */
  private validateScreeningAnswers(
    questions: any[],
    answers: any[],
  ) {
    const requiredQuestions = questions.filter((q) => q.required);
    const answeredQuestionIds = new Set(answers.map((a) => a.questionId));

    for (const question of requiredQuestions) {
      if (!answeredQuestionIds.has(question.id)) {
        throw new BadRequestException(
          `Required screening question is missing: ${question.question}`,
        );
      }
    }
  }
}
