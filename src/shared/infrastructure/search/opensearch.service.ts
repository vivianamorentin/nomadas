import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@opensearch-project/opensearch';

/**
 * OpenSearch Service
 * Handles full-text search and geospatial queries
 */
@Injectable()
export class OpenSearchService implements OnModuleInit {
  private client: Client;
  private readonly logger = new Logger(OpenSearchService.name);
  private readonly jobsIndex = 'nomadas-jobs';

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      this.client = new Client({
        node: this.configService.get<string>('OPENSEARCH_NODE'),
        auth: {
          username: this.configService.get<string>('OPENSEARCH_USERNAME'),
          password: this.configService.get<string>('OPENSEARCH_PASSWORD'),
        },
      });

      await this.client.ping();
      this.logger.log('OpenSearch connected successfully');

      // Create index if it doesn't exist
      await this.createJobsIndex();
    } catch (error) {
      this.logger.error('Failed to connect to OpenSearch', error);
      throw error;
    }
  }

  /**
   * Create jobs index with mappings
   */
  private async createJobsIndex() {
    const indexExists = await this.client.indices.exists({
      index: this.jobsIndex,
    });

    if (!indexExists) {
      await this.client.indices.create({
        index: this.jobsIndex,
        body: {
          settings: {
            number_of_shards: 3,
            number_of_replicas: 1,
          },
          mappings: {
            properties: {
              title: { type: 'text' },
              description: { type: 'text' },
              requirements: { type: 'text' },
              category: { type: 'keyword' },
              workType: { type: 'keyword' },
              location: {
                type: 'geo_point',
              },
              startDate: { type: 'date' },
              endDate: { type: 'date' },
              compensationMin: { type: 'integer' },
              compensationMax: { type: 'integer' },
              requiredLanguages: { type: 'keyword' },
              skills: { type: 'keyword' },
              status: { type: 'keyword' },
              businessId: { type: 'integer' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' },
            },
          },
        },
      });

      this.logger.log(`Created index: ${this.jobsIndex}`);
    }
  }

  /**
   * Index job document
   */
  async indexJob(job: any) {
    try {
      await this.client.index({
        index: this.jobsIndex,
        id: job.id.toString(),
        body: {
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          category: job.category,
          workType: job.workType,
          location: {
            lat: job.latitude,
            lon: job.longitude,
          },
          startDate: job.startDate,
          endDate: job.endDate,
          compensationMin: job.compensationMin,
          compensationMax: job.compensationMax,
          requiredLanguages: job.requiredLanguages,
          skills: job.skills,
          status: job.status,
          businessId: job.businessId,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        },
      });

      this.logger.log(`Job indexed: ${job.id}`);
    } catch (error) {
      this.logger.error(`Error indexing job: ${job.id}`, error);
      throw error;
    }
  }

  /**
   * Search jobs with filters
   */
  async searchJobs(searchParams: {
    query?: string;
    category?: string;
    lat?: number;
    lon?: number;
    radius?: string; // "10km", "25km", "50km", "100km"
    startDate?: Date;
    endDate?: Date;
    compensationMin?: number;
    compensationMax?: number;
    languages?: string[];
    skills?: string[];
    page?: number;
    limit?: number;
  }) {
    try {
      const must = [];
      const filter = [];

      // Full-text search
      if (searchParams.query) {
        must.push({
          multi_match: {
            query: searchParams.query,
            fields: ['title^2', 'description', 'requirements'],
            fuzziness: 'AUTO',
          },
        });
      }

      // Category filter
      if (searchParams.category) {
        filter.push({
          term: { category: searchParams.category },
        });
      }

      // Geospatial filter
      if (searchParams.lat && searchParams.lon) {
        filter.push({
          geo_distance: {
            distance: searchParams.radius || '25km',
            location: {
              lat: searchParams.lat,
              lon: searchParams.lon,
            },
          },
        });
      }

      // Date range filter
      if (searchParams.startDate || searchParams.endDate) {
        const range = {};
        if (searchParams.startDate) range['gte'] = searchParams.startDate;
        if (searchParams.endDate) range['lte'] = searchParams.endDate;

        filter.push({
          range: { startDate: range },
        });
      }

      // Compensation range filter
      if (searchParams.compensationMin || searchParams.compensationMax) {
        const range = {};
        if (searchParams.compensationMin) range['gte'] = searchParams.compensationMin;
        if (searchParams.compensationMax) range['lte'] = searchParams.compensationMax;

        filter.push({
          range: { compensationMin: range },
        });
      }

      // Languages filter
      if (searchParams.languages && searchParams.languages.length > 0) {
        filter.push({
          terms: { requiredLanguages: searchParams.languages },
        });
      }

      // Skills filter
      if (searchParams.skills && searchParams.skills.length > 0) {
        filter.push({
          terms: { skills: searchParams.skills },
        });
      }

      // Status filter (only active jobs)
      filter.push({
        term: { status: 'active' },
      });

      const page = searchParams.page || 1;
      const limit = searchParams.limit || 20;
      const from = (page - 1) * limit;

      const response = await this.client.search({
        index: this.jobsIndex,
        body: {
          query: {
            bool: {
              must,
              filter,
            },
          },
          from,
          size: limit,
          sort: [{ createdAt: 'desc' }],
        },
      });

      return {
        hits: response.body.hits.total.value,
        jobs: response.body.hits.hits.map((hit: any) => ({
          id: hit._id,
          ...hit._source,
          score: hit._score,
        })),
        page,
        limit,
      };
    } catch (error) {
      this.logger.error('Error searching jobs', error);
      throw error;
    }
  }

  /**
   * Delete job from index
   */
  async deleteJob(jobId: number) {
    try {
      await this.client.delete({
        index: this.jobsIndex,
        id: jobId.toString(),
      });

      this.logger.log(`Job deleted from index: ${jobId}`);
    } catch (error) {
      this.logger.error(`Error deleting job from index: ${jobId}`, error);
      throw error;
    }
  }

  /**
   * Bulk index jobs
   */
  async bulkIndexJobs(jobs: any[]) {
    try {
      const body = jobs.flatMap((job) => [
        { index: { _index: this.jobsIndex, _id: job.id.toString() } },
        {
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          category: job.category,
          workType: job.workType,
          location: {
            lat: job.latitude,
            lon: job.longitude,
          },
          startDate: job.startDate,
          endDate: job.endDate,
          compensationMin: job.compensationMin,
          compensationMax: job.compensationMax,
          requiredLanguages: job.requiredLanguages,
          skills: job.skills,
          status: job.status,
          businessId: job.businessId,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        },
      ]);

      await this.client.bulk({ body });

      this.logger.log(`Bulk indexed ${jobs.length} jobs`);
    } catch (error) {
      this.logger.error('Error bulk indexing jobs', error);
      throw error;
    }
  }
}
