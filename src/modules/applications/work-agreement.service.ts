import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import { AgreementStatus, ApplicationStatus } from '@prisma/client';
import { ProposeAgreementDto, ConfirmAgreementDto } from './dto';
import * as crypto from 'crypto';

/**
 * Work Agreement Service
 * REQ-APP-007, REQ-APP-008, REQ-APP-009: Work Agreement Proposal, Confirmation, and Storage
 */
@Injectable()
export class WorkAgreementService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Propose a work agreement
   * REQ-APP-007: Either party can initiate
   */
  async proposeAgreement(
    applicationId: number,
    userId: number,
    dto: ProposeAgreementDto,
  ) {
    // Get application with relations
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        jobPosting: true,
        workerProfile: { include: { user: true } },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Verify user is either worker or business owner
    const isWorker = application.workerProfile.userId === userId;
    let isBusiness = false;

    if (!isWorker) {
      const businessProfile = await this.prisma.businessProfile.findFirst({
        where: { userId },
      });
      isBusiness =
        businessProfile &&
        application.jobPosting.businessId === businessProfile.id;
    }

    if (!isWorker && !isBusiness) {
      throw new ForbiddenException(
        'You can only propose agreements for your own applications',
      );
    }

    // Check if application is in correct state
    if (application.status !== ApplicationStatus.ACCEPTED) {
      throw new BadRequestException(
        'Agreements can only be proposed for accepted applications',
      );
    }

    // Check if agreement already exists
    const existingAgreement = await this.prisma.workAgreement.findUnique({
      where: { applicationId },
    });

    // Create or update agreement
    const agreement = await this.prisma.workAgreement.upsert({
      where: { applicationId },
      create: {
        applicationId,
        jobTitle: dto.jobTitle,
        jobDescription: dto.jobDescription,
        responsibilities: dto.responsibilities as any, // Prisma Json
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        expectedSchedule: dto.expectedSchedule as any,
        agreedCompensation: dto.agreedCompensation as any,
        status: AgreementStatus.PROPOSED,
        version: 1,
      },
      update: {
        jobTitle: dto.jobTitle,
        jobDescription: dto.jobDescription,
        responsibilities: dto.responsibilities as any,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        expectedSchedule: dto.expectedSchedule as any,
        agreedCompensation: dto.agreedCompensation as any,
        status: AgreementStatus.PROPOSED,
        version: { increment: 1 },
        versions: {
          create: {
            version: (existingAgreement?.version || 0) + 1,
            changes: this.detectChanges(existingAgreement, dto),
            changedBy: userId,
          },
        },
      },
    });

    // Update application status to NEGOTIATING
    await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: ApplicationStatus.NEGOTIATING,
        statusHistory: {
          create: {
            fromStatus: application.status,
            toStatus: ApplicationStatus.NEGOTIATING,
            changedBy: userId,
            reason: 'Work agreement proposed',
          },
        },
      },
    });

    // Trigger notification to other party
    // TODO: Integrate with NotificationsService

    return agreement;
  }

  /**
   * Confirm work agreement
   * REQ-APP-008: Digital confirmation with IP and user agent
   */
  async confirmAgreement(
    agreementId: number,
    userId: number,
    dto: ConfirmAgreementDto,
  ) {
    const agreement = await this.prisma.workAgreement.findUnique({
      where: { id: agreementId },
      include: {
        application: {
          include: {
            workerProfile: { include: { user: true } },
            jobPosting: { include: { businessProfile: { include: { user: true } } } },
          },
        },
      },
    });

    if (!agreement) {
      throw new NotFoundException('Agreement not found');
    }

    // Verify user is party to the agreement
    const isWorker = agreement.application.workerProfile.userId === userId;
    const isBusiness =
      agreement.application.jobPosting.businessProfile.userId === userId;

    if (!isWorker && !isBusiness) {
      throw new ForbiddenException(
        'You can only confirm agreements you are party to',
      );
    }

    // Validate consent text
    if (
      !dto.consentText ||
      !dto.consentText.toLowerCase().includes('confirm')
    ) {
      throw new BadRequestException(
        'Consent text must explicitly confirm agreement',
      );
    }

    // Update digital signature
    const updateData: any = {
      status: agreement.status,
    };

    if (isWorker) {
      updateData.workerConfirmedAt = new Date();
      updateData.workerIpAddress = dto.ipAddress;
      updateData.workerUserAgent = dto.userAgent;
    } else {
      updateData.businessConfirmedAt = new Date();
      updateData.businessIpAddress = dto.ipAddress;
      updateData.businessUserAgent = dto.userAgent;
    }

    const updatedAgreement = await this.prisma.workAgreement.update({
      where: { id: agreementId },
      data: updateData,
    });

    // Check if both parties have confirmed
    if (
      updatedAgreement.workerConfirmedAt &&
      updatedAgreement.businessConfirmedAt
    ) {
      // Both parties confirmed - generate PDF and update status
      await this.finalizeAgreement(agreementId);
    }

    return updatedAgreement;
  }

  /**
   * Get agreement by ID
   */
  async findById(agreementId: number) {
    return this.prisma.workAgreement.findUnique({
      where: { id: agreementId },
      include: {
        application: {
          include: {
            workerProfile: true,
            jobPosting: {
              include: {
                businessProfile: true,
              },
            },
          },
        },
        versions: {
          include: {
            changedByUser: {
              select: {
                id: true,
                email: true,
              },
            },
          },
          orderBy: {
            version: 'desc',
          },
        },
      },
    });
  }

  /**
   * Get agreement versions (negotiation history)
   */
  async getAgreementVersions(agreementId: number) {
    const agreement = await this.prisma.workAgreement.findUnique({
      where: { id: agreementId },
    });

    if (!agreement) {
      throw new NotFoundException('Agreement not found');
    }

    return this.prisma.agreementVersion.findMany({
      where: { agreementId },
      include: {
        changedByUser: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { version: 'desc' },
    });
  }

  /**
   * Finalize agreement after both parties confirm
   * REQ-APP-009: Agreement Record Storage
   */
  private async finalizeAgreement(agreementId: number) {
    const agreement = await this.prisma.workAgreement.findUnique({
      where: { id: agreementId },
      include: {
        application: true,
      },
    });

    if (!agreement) {
      throw new NotFoundException('Agreement not found');
    }

    // Generate PDF (TODO: Implement PDF generation)
    const pdfUrl = await this.generateAgreementPDF(agreement);

    // Calculate document hash for integrity
    const documentHash = this.calculateDocumentHash(agreement);

    // Update agreement
    const updated = await this.prisma.workAgreement.update({
      where: { id: agreementId },
      data: {
        status: AgreementStatus.CONFIRMED,
        confirmedAt: new Date(),
        pdfUrl,
        documentHash,
      },
    });

    // Update application status
    await this.prisma.application.update({
      where: { id: agreement.applicationId },
      data: {
        status: ApplicationStatus.CONFIRMED,
        statusHistory: {
          create: {
            fromStatus: ApplicationStatus.NEGOTIATING,
            toStatus: ApplicationStatus.CONFIRMED,
            changedBy: agreement.application.workerId,
            reason: 'Work agreement confirmed by both parties',
          },
        },
      },
    });

    // Send email copies to both parties
    // TODO: Integrate with NotificationsService

    return updated;
  }

  /**
   * Generate PDF for agreement
   * TODO: Implement with PDFKit (REQ-APP-009)
   */
  private async generateAgreementPDF(agreement: any): Promise<string> {
    // Placeholder for PDF generation
    // In production, this would:
    // 1. Generate PDF with PDFKit
    // 2. Upload to S3
    // 3. Return S3 URL

    const pdfKey = `agreements/${agreement.id}/v${agreement.version}.pdf`;
    return `https://s3.amazonaws.com/nomadshift/${pdfKey}`;
  }

  /**
   * Calculate SHA-256 hash of agreement data
   * REQ-APP-009: Document hash for integrity
   */
  private calculateDocumentHash(agreement: any): string {
    const data = JSON.stringify({
      jobTitle: agreement.jobTitle,
      jobDescription: agreement.jobDescription,
      responsibilities: agreement.responsibilities,
      startDate: agreement.startDate,
      endDate: agreement.endDate,
      expectedSchedule: agreement.expectedSchedule,
      agreedCompensation: agreement.agreedCompensation,
      version: agreement.version,
    });

    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Detect changes between agreement versions
   */
  private detectChanges(
    existingAgreement: any | null,
    newDto: ProposeAgreementDto,
  ): any {
    if (!existingAgreement) {
      return { initial: true };
    }

    const changes: any = {};

    if (existingAgreement.jobTitle !== newDto.jobTitle) {
      changes.jobTitle = {
        from: existingAgreement.jobTitle,
        to: newDto.jobTitle,
      };
    }

    if (existingAgreement.jobDescription !== newDto.jobDescription) {
      changes.jobDescription = {
        from: existingAgreement.jobDescription,
        to: newDto.jobDescription,
      };
    }

    // Add more field comparisons as needed...

    return changes;
  }
}
