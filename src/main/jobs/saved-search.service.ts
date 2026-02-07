import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/database/prisma.service';
import { SearchJobsDto } from './dto';

/**
 * Saved Search Service
 * Manages worker search alerts
 * SPEC-JOB-001 Phase 3
 */
@Injectable()
export class SavedSearchService {
  private readonly logger = new Logger(SavedSearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Save a search for alerts
   */
  async saveSearch(userId: number, name: string, searchFilters: SearchJobsDto) {
    try {
      const workerProfile = await this.getWorkerProfile(userId);

      // Validate search filters
      if (!searchFilters || Object.keys(searchFilters).length === 0) {
        throw new BadRequestException('Search filters cannot be empty');
      }

      // Create saved search
      const savedSearch = await this.prisma.savedSearch.create({
        data: {
          workerId: workerProfile.id,
          name,
          searchFilters: searchFilters as any,
          notificationEnabled: true,
        },
      });

      this.logger.log(`Search saved: ${savedSearch.id} for worker ${workerProfile.id}`);

      return {
        message: 'Search saved successfully!',
        saved_search: savedSearch,
      };
    } catch (error) {
      this.logger.error(`Error saving search for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Get all saved searches for a worker
   */
  async getSavedSearches(userId: number) {
    try {
      const workerProfile = await this.getWorkerProfile(userId);

      const savedSearches = await this.prisma.savedSearch.findMany({
        where: { workerId: workerProfile.id },
        orderBy: { createdAt: 'desc' },
      });

      return {
        saved_searches: savedSearches.map((ss) => ({
          id: ss.id,
          name: ss.name,
          search_filters: ss.searchFilters as any,
          notification_enabled: ss.notificationEnabled,
          last_used_at: ss.lastUsedAt,
          created_at: ss.createdAt,
        })),
        total: savedSearches.length,
      };
    } catch (error) {
      this.logger.error(`Error getting saved searches for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Update a saved search
   */
  async updateSavedSearch(
    userId: number,
    savedSearchId: number,
    updates: {
      name?: string;
      searchFilters?: SearchJobsDto;
      notificationEnabled?: boolean;
    }
  ) {
    try {
      const workerProfile = await this.getWorkerProfile(userId);

      const savedSearch = await this.prisma.savedSearch.findUnique({
        where: { id: savedSearchId },
      });

      if (!savedSearch) {
        throw new NotFoundException(`Saved search with ID ${savedSearchId} not found`);
      }

      if (savedSearch.workerId !== workerProfile.id) {
        throw new ForbiddenException('You do not have permission to update this saved search');
      }

      // Build update data
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.searchFilters !== undefined) updateData.searchFilters = updates.searchFilters as any;
      if (updates.notificationEnabled !== undefined) {
        updateData.notificationEnabled = updates.notificationEnabled;
      }

      const updated = await this.prisma.savedSearch.update({
        where: { id: savedSearchId },
        data: updateData,
      });

      this.logger.log(`Saved search updated: ${savedSearchId}`);

      return {
        message: 'Saved search updated successfully!',
        saved_search: updated,
      };
    } catch (error) {
      this.logger.error(`Error updating saved search ${savedSearchId}`, error);
      throw error;
    }
  }

  /**
   * Delete a saved search
   */
  async removeSavedSearch(userId: number, savedSearchId: number) {
    try {
      const workerProfile = await this.getWorkerProfile(userId);

      const savedSearch = await this.prisma.savedSearch.findUnique({
        where: { id: savedSearchId },
      });

      if (!savedSearch) {
        throw new NotFoundException(`Saved search with ID ${savedSearchId} not found`);
      }

      if (savedSearch.workerId !== workerProfile.id) {
        throw new ForbiddenException('You do not have permission to delete this saved search');
      }

      await this.prisma.savedSearch.delete({
        where: { id: savedSearchId },
      });

      this.logger.log(`Saved search deleted: ${savedSearchId}`);

      return {
        message: 'Saved search deleted successfully!',
      };
    } catch (error) {
      this.logger.error(`Error deleting saved search ${savedSearchId}`, error);
      throw error;
    }
  }

  /**
   * Execute a saved search
   * Updates lastUsedAt timestamp
   */
  async executeSavedSearch(userId: number, savedSearchId: number) {
    try {
      const workerProfile = await this.getWorkerProfile(userId);

      const savedSearch = await this.prisma.savedSearch.findUnique({
        where: { id: savedSearchId },
      });

      if (!savedSearch) {
        throw new NotFoundException(`Saved search with ID ${savedSearchId} not found`);
      }

      if (savedSearch.workerId !== workerProfile.id) {
        throw new ForbiddenException('You do not have permission to execute this saved search');
      }

      // Update last used timestamp
      await this.prisma.savedSearch.update({
        where: { id: savedSearchId },
        data: { lastUsedAt: new Date() },
      });

      // Return search filters for execution by JobSearchService
      return {
        saved_search_id: savedSearch.id,
        name: savedSearch.name,
        search_filters: savedSearch.searchFilters as any,
      };
    } catch (error) {
      this.logger.error(`Error executing saved search ${savedSearchId}`, error);
      throw error;
    }
  }

  /**
   * Archive old saved searches (BR-SEARCH-004)
   * Should be called by background job
   */
  async archiveOldSavedSearches() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const result = await this.prisma.savedSearch.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      this.logger.log(`Archived ${result.count} old saved searches`);

      return {
        archived_count: result.count,
      };
    } catch (error) {
      this.logger.error('Error archiving old saved searches', error);
      throw error;
    }
  }

  /**
   * Get saved searches that should receive notifications
   * For background job processing
   */
  async getSearchesForNotification() {
    try {
      const savedSearches = await this.prisma.savedSearch.findMany({
        where: {
          notificationEnabled: true,
        },
        include: {
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

      return savedSearches.map((ss) => ({
        id: ss.id,
        worker_id: ss.workerId,
        worker_email: ss.workerProfile.user.email,
        search_filters: ss.searchFilters,
        name: ss.name,
      }));
    } catch (error) {
      this.logger.error('Error getting searches for notification', error);
      throw error;
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
