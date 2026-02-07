import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { JobPostingController } from './job-posting.controller';
import { JobSearchController } from './job-search.controller';
import { JobMapController } from './job-map.controller';
import { TopMatchesController } from './top-matches.controller';
import { JobPostingService } from './job-posting.service';
import { JobSearchService } from './job-search.service';
import { SavedJobService } from './saved-job.service';
import { SavedSearchService } from './saved-search.service';
import { MapClusteringService } from './map-clustering.service';
import { MatchScoringService } from './match-scoring.service';
import { ScheduledTasksService } from './scheduled-tasks.service';
import { PrismaService } from '../../shared/infrastructure/database/prisma.service';
import { SearchModule } from '../../shared/infrastructure/search/opensearch.module';
import { JobsQueueModule } from './queues/jobs-queue.module';

/**
 * Job Marketplace Context Module
 * SPEC-JOB-001 - Phases 1-6
 *
 * Provides comprehensive job marketplace functionality including:
 * - Phase 1: Job CRUD operations with business rules
 * - Phase 2: OpenSearch integration for search
 * - Phase 3: Advanced search & discovery
 * - Phase 4: Map view & geospatial features
 * - Phase 5: Match scoring & recommendations
 * - Phase 6: Background jobs & notifications
 */
@Module({
  imports: [
    ConfigModule,
    SearchModule,
    JobsQueueModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [
    JobPostingController,
    JobSearchController,
    JobMapController,
    TopMatchesController,
  ],
  providers: [
    PrismaService,
    JobPostingService,
    JobSearchService,
    SavedJobService,
    SavedSearchService,
    MapClusteringService,
    MatchScoringService,
    ScheduledTasksService,
  ],
  exports: [
    JobPostingService,
    JobSearchService,
    SavedJobService,
    SavedSearchService,
    MapClusteringService,
    MatchScoringService,
  ],
})
export class JobsModule {}
