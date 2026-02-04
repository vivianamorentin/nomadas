import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import { OpenSearchService } from 'src/shared/infrastructure/search/opensearch.service';

/**
 * Job Marketplace Service
 * Handles job posting and search logic
 */
@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openSearch: OpenSearchService,
  ) {}

  async search(searchParams: any) {
    // Use OpenSearch for advanced search
    return this.openSearch.searchJobs(searchParams);
  }

  async findById(jobId: number) {
    const job = await this.prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        businessProfile: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async create(userId: number, createDto: any) {
    // Get business profile
    const businessProfile = await this.prisma.businessProfile.findUnique({
      where: { userId },
    });

    if (!businessProfile) {
      throw new NotFoundException('Business profile not found');
    }

    // Create job
    const job = await this.prisma.jobPosting.create({
      data: {
        businessId: businessProfile.id,
        ...createDto,
      },
    });

    // Index in OpenSearch
    await this.openSearch.indexJob(job);

    return job;
  }

  async update(jobId: number, updateDto: any) {
    const job = await this.prisma.jobPosting.update({
      where: { id: jobId },
      data: updateDto,
    });

    // Update OpenSearch index
    await this.openSearch.indexJob(job);

    return job;
  }

  async delete(jobId: number) {
    await this.prisma.jobPosting.delete({
      where: { id: jobId },
    });

    // Delete from OpenSearch
    await this.openSearch.deleteJob(jobId);
  }

  async apply(jobId: number, userId: number) {
    // Get worker profile
    const workerProfile = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });

    if (!workerProfile) {
      throw new NotFoundException('Worker profile not found');
    }

    // Create application
    return this.prisma.application.create({
      data: {
        jobId,
        workerId: workerProfile.id,
        status: 'PENDING',
      },
    });
  }
}
