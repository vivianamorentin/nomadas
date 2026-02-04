import { Module, Global } from '@nestjs/common';
import { OpenSearchService } from './opensearch.service';

/**
 * OpenSearch Module
 * Provides search service globally
 */
@Global()
@Module({
  providers: [OpenSearchService],
  exports: [OpenSearchService],
})
export class SearchModule {}
