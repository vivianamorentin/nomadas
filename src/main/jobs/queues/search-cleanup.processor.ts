import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { SavedSearchService } from '../saved-search.service';

/**
 * Search Cleanup Processor
 * Archives old saved searches (BR-SEARCH-004)
 * SPEC-JOB-001 Phase 6
 */
@Processor('searches-cleanup')
export class SearchCleanupProcessor {
  private readonly logger = new Logger(SearchCleanupProcessor.name);

  constructor(private readonly savedSearchService: SavedSearchService) {}

  /**
   * Process search cleanup queue
   * Runs weekly to archive old saved searches
   */
  @Process('archive-old-searches')
  async handleArchiveOldSearches(job: Job) {
    try {
      this.logger.log('Starting search cleanup processing...');

      const result = await this.savedSearchService.archiveOldSavedSearches();

      this.logger.log(`Archived ${result.archived_count} old saved searches`);

      return {
        success: true,
        archived: result.archived_count,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Error processing search cleanup', error);
      throw error;
    }
  }
}
