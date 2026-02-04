import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';

/**
 * Application Workflow Service
 * Handles job application logic
 */
@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

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
      },
    });
  }

  async updateStatus(applicationId: number, status: string) {
    return this.prisma.application.update({
      where: { id: applicationId },
      data: { status },
    });
  }
}
