import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/database/prisma.service';
import { JobStatus } from '@prisma/client';

/**
 * Saved Job Service
 * Manages worker bookmarked jobs
 * SPEC-JOB-001 Phase 3
 */
@Injectable()
export class SavedJobService {
  private readonly logger = new Logger(SavedJobService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Save a job for a worker
   * Business rule: Max 100 saved jobs per worker (BR-SEARCH-005)
   */
  async saveJob(userId: number, jobPostingId: number, notes?: string) {
    try {
      // Verify job exists and is active
      const job = await this.prisma.jobPosting.findUnique({
        where: { id: jobPostingId },
      });

      if (!job) {
        throw new NotFoundException(`Job posting with ID ${jobPostingId} not found`);
      }

      if (job.status !== JobStatus.ACTIVE) {
        throw new BadRequestException('Can only save active job postings');
      }

      // Get worker profile
      const workerProfile = await this.getWorkerProfile(userId);

      // Check if already saved
      const existing = await this.prisma.savedJob.findUnique({
        where: {
          workerId_jobPostingId: {
            workerId: workerProfile.id,
            jobPostingId,
          },
        },
      });

      if (existing) {
        throw new BadRequestException('Job already saved');
      }

      // Check max saved jobs limit (BR-SEARCH-005)
      const savedCount = await this.prisma.savedJob.count({
        where: { workerId: workerProfile.id },
      });

      if (savedCount >= 100) {
        throw new BadRequestException(
          'Maximum limit of 100 saved jobs reached. Please remove some saved jobs first.'
        );
      }

      // Create saved job
      const savedJob = await this.prisma.savedJob.create({
        data: {
          workerId: workerProfile.id,
          jobPostingId,
          notes,
        },
      });

      this.logger.log(`Job ${jobPostingId} saved by worker ${workerProfile.id}`);

      return {
        message: 'Job saved successfully!',
        saved_job: savedJob,
      };
    } catch (error) {
      this.logger.error(`Error saving job ${jobPostingId} for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Remove a saved job
   */
  async removeSavedJob(userId: number, savedJobId: number) {
    try {
      const workerProfile = await this.getWorkerProfile(userId);

      const savedJob = await this.prisma.savedJob.findUnique({
        where: { id: savedJobId },
      });

      if (!savedJob) {
        throw new NotFoundException(`Saved job with ID ${savedJobId} not found`);
      }

      if (savedJob.workerId !== workerProfile.id) {
        throw new ForbiddenException('You do not have permission to remove this saved job');
      }

      await this.prisma.savedJob.delete({
        where: { id: savedJobId },
      });

      this.logger.log(`Saved job ${savedJobId} removed by worker ${workerProfile.id}`);

      return {
        message: 'Saved job removed successfully!',
      };
    } catch (error) {
      this.logger.error(`Error removing saved job ${savedJobId} for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Get all saved jobs for a worker
   */
  async getSavedJobs(
    userId: number,
    params: { page?: number; limit?: number; sort?: string }
  ) {
    try {
      const workerProfile = await this.getWorkerProfile(userId);

      const page = params.page || 1;
      const limit = Math.min(params.limit || 20, 50);
      const skip = (page - 1) * limit;

      // Determine sorting
      let orderBy: any = { createdAt: 'desc' };
      if (params.sort === 'deadline') {
        orderBy = { jobPosting: { startDate: 'asc' } };
      } else if (params.sort === 'compensation') {
        orderBy = { jobPosting: { compensationMax: 'desc' } };
      }

      const [savedJobs, total] = await Promise.all([
        this.prisma.savedJob.findMany({
          where: { workerId: workerProfile.id },
          include: {
            jobPosting: {
              include: {
                businessProfile: {
                  select: {
                    businessName: true,
                    locationCity: true,
                    locationCountry: true,
                    prestigeLevel: true,
                    averageRating: true,
                    hasGoodEmployerBadge: true,
                  },
                },
                locations: true,
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        this.prisma.savedJob.count({
          where: { workerId: workerProfile.id },
        }),
      ]);

      return {
        saved_jobs: savedJobs.map((sj) => ({
          id: sj.id,
          notes: sj.notes,
          savedAt: sj.createdAt,
          job: {
            id: sj.jobPosting.id,
            title: sj.jobPosting.title,
            description: sj.jobPosting.description,
            category: sj.jobPosting.category,
            workType: sj.jobPosting.workType,
            startDate: sj.jobPosting.startDate,
            endDate: sj.jobPosting.endDate,
            compensationMin: sj.jobPosting.compensationMin,
            compensationMax: sj.jobPosting.compensationMax,
            accommodationIncluded: sj.jobPosting.accommodationIncluded,
            mealsIncluded: sj.jobPosting.mealsIncluded,
            status: sj.jobPosting.status,
            viewCount: sj.jobPosting.viewCount,
            locations: sj.jobPosting.locations,
            businessProfile: sj.jobPosting.businessProfile,
          },
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Error getting saved jobs for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Update saved job notes
   */
  async updateNotes(userId: number, savedJobId: number, notes: string) {
    try {
      const workerProfile = await this.getWorkerProfile(userId);

      const savedJob = await this.prisma.savedJob.findUnique({
        where: { id: savedJobId },
      });

      if (!savedJob) {
        throw new NotFoundException(`Saved job with ID ${savedJobId} not found`);
      }

      if (savedJob.workerId !== workerProfile.id) {
        throw new ForbiddenException('You do not have permission to update this saved job');
      }

      const updated = await this.prisma.savedJob.update({
        where: { id: savedJobId },
        data: { notes },
      });

      this.logger.log(`Saved job notes updated: ${savedJobId}`);

      return {
        message: 'Notes updated successfully!',
        saved_job: updated,
      };
    } catch (error) {
      this.logger.error(`Error updating notes for saved job ${savedJobId}`, error);
      throw error;
    }
  }

  /**
   * Check if a job is saved by the worker
   */
  async isJobSaved(userId: number, jobPostingId: number): Promise<boolean> {
    try {
      const workerProfile = await this.getWorkerProfile(userId);

      const savedJob = await this.prisma.savedJob.findUnique({
        where: {
          workerId_jobPostingId: {
            workerId: workerProfile.id,
            jobPostingId,
          },
        },
      });

      return !!savedJob;
    } catch (error) {
      this.logger.error(`Error checking if job ${jobPostingId} is saved`, error);
      return false;
    }
  }

  /**
   * Get worker profile
   */
  private async getWorkerProfile(userId: number) {
    const workerProfile = await this.prisma.workerProfile.findFirst({
      where: { userId },
    });

    if (!workerProfile) {
      throw new NotFoundException(
        'Worker profile not found. Please create a worker profile first.'
      );
    }

    return workerProfile;
  }
}
