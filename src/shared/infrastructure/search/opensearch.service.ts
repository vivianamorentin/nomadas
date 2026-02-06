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
   * SPEC-JOB-001 Phase 2: Enhanced schema with new fields
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
            analysis: {
              analyzer: {
                multilingual: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'stop'],
                },
              },
            },
          },
          mappings: {
            properties: {
              // Text fields with full-text search
              title: {
                type: 'text',
                analyzer: 'multilingual',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              description: {
                type: 'text',
                analyzer: 'multilingual',
              },
              requirements: {
                type: 'text',
                analyzer: 'multilingual',
              },

              // Keyword fields for exact filtering
              category: { type: 'keyword' },
              workType: { type: 'keyword' },
              status: { type: 'keyword' },
              compensationType: { type: 'keyword' },
              compensationCurrency: { type: 'keyword' },
              durationUnit: { type: 'keyword' },
              requiredExperience: { type: 'keyword' },

              // Geospatial field for location-based search
              location: {
                type: 'geo_point',
              },

              // Date fields
              startDate: { type: 'date' },
              endDate: { type: 'date' },
              closedAt: { type: 'date' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' },

              // Numeric fields
              compensationMin: { type: 'integer' },
              compensationMax: { type: 'integer' },
              durationAmount: { type: 'integer' },
              applicantCount: { type: 'integer' },
              viewCount: { type: 'integer' },

              // Nested and object fields
              requiredLanguages: {
                type: 'nested',
                properties: {
                  language: { type: 'keyword' },
                  level: { type: 'keyword' },
                },
              },
              skills: { type: 'keyword' },

              // Business information
              businessId: { type: 'integer' },
              businessName: {
                type: 'text',
                analyzer: 'multilingual',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              businessType: { type: 'keyword' },
              businessCity: { type: 'keyword' },
              businessCountry: { type: 'keyword' },
              prestigeLevel: { type: 'keyword' },
              averageRating: { type: 'float' },
              hasGoodEmployerBadge: { type: 'boolean' },

              // Benefits
              accommodationIncluded: { type: 'boolean' },
              mealsIncluded: { type: 'boolean' },
            },
          },
        },
      });

      this.logger.log(`Created index: ${this.jobsIndex}`);
    }
  }

  /**
   * Index job document
   * SPEC-JOB-001 Phase 2: Enhanced indexing with new fields and multiple locations
   */
  async indexJob(job: any) {
    try {
      // Use the first location as the primary location for geospatial search
      const primaryLocation = job.locations && job.locations.length > 0 ? job.locations[0] : null;

      await this.client.index({
        index: this.jobsIndex,
        id: job.id.toString(),
        body: {
          // Basic job information
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          category: job.category,
          workType: job.workType,

          // Duration (SPEC-JOB-001)
          durationAmount: job.durationAmount,
          durationUnit: job.durationUnit,

          // Dates
          startDate: job.startDate,
          endDate: job.endDate,
          closedAt: job.closedAt,

          // Compensation (SPEC-JOB-001)
          compensationType: job.compensationType,
          compensationMin: job.compensationMin,
          compensationMax: job.compensationMax,
          compensationCurrency: job.compensationCurrency,

          // Benefits
          accommodationIncluded: job.accommodationIncluded,
          mealsIncluded: job.mealsIncluded,

          // Requirements
          requiredLanguages: job.requiredLanguages,
          skills: job.skills,
          requiredExperience: job.requiredExperience,

          // Status and analytics
          status: job.status,
          applicantCount: job.applicantCount,
          viewCount: job.viewCount,

          // Geospatial - use primary location
          location: primaryLocation
            ? {
                lat: primaryLocation.latitude,
                lon: primaryLocation.longitude,
              }
            : undefined,

          // All locations (for reference)
          locations: job.locations
            ? job.locations.map((loc: any) => ({
                city: loc.city,
                country: loc.country,
                latitude: loc.latitude,
                longitude: loc.longitude,
              }))
            : [],

          // Business information
          businessId: job.businessId,
          businessName: job.businessName,
          businessType: job.businessType,
          businessCity: job.businessCity,
          businessCountry: job.businessCountry,
          prestigeLevel: job.prestigeLevel,
          averageRating: job.averageRating,
          hasGoodEmployerBadge: job.hasGoodEmployerBadge,

          // Timestamps
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
   * Search jobs with advanced filters
   * SPEC-JOB-001 Phase 3: Enhanced search with all filter options
   */
  async searchJobs(searchParams: {
    query?: string;
    categories?: string[];
    workType?: string;
    lat?: number;
    lon?: number;
    radius?: string; // "10km", "25km", "50km", "100km"
    startDateFrom?: string;
    startDateTo?: string;
    endDateFrom?: string;
    endDateTo?: string;
    durationMin?: number;
    durationMax?: number;
    durationUnit?: string;
    compensationMin?: number;
    compensationMax?: number;
    compensationCurrency?: string;
    compensationType?: string;
    languages?: string[];
    skills?: string[];
    requiredExperience?: string;
    accommodationIncluded?: boolean;
    mealsIncluded?: boolean;
    sort?: string; // 'relevance', 'date', 'compensation', 'distance'
    page?: number;
    limit?: number;
  }) {
    try {
      const must = [];
      const filter = [];
      const should = [];

      // Full-text search (boosted title field)
      if (searchParams.query) {
        must.push({
          multi_match: {
            query: searchParams.query,
            fields: ['title^3', 'description^2', 'requirements'],
            fuzziness: 'AUTO',
            operator: 'and',
          },
        });
      }

      // Category filter (multiple values supported)
      if (searchParams.categories && searchParams.categories.length > 0) {
        filter.push({
          terms: { category: searchParams.categories },
        });
      }

      // Work type filter
      if (searchParams.workType) {
        filter.push({
          term: { workType: searchParams.workType },
        });
      }

      // Geospatial filter (BR-SEARCH-001: Max 100km radius)
      if (searchParams.lat && searchParams.lon) {
        const radius = searchParams.radius || '25km';
        const radiusValue = parseInt(radius);
        if (radiusValue > 100) {
          throw new Error('Maximum search radius is 100km');
        }

        filter.push({
          geo_distance: {
            distance: radius,
            location: {
              lat: searchParams.lat,
              lon: searchParams.lon,
            },
          },
        });
      }

      // Date range filters
      if (searchParams.startDateFrom || searchParams.startDateTo) {
        const range = {};
        if (searchParams.startDateFrom) range['gte'] = searchParams.startDateFrom;
        if (searchParams.startDateTo) range['lte'] = searchParams.startDateTo;

        filter.push({
          range: { startDate: range },
        });
      }

      if (searchParams.endDateFrom || searchParams.endDateTo) {
        const range = {};
        if (searchParams.endDateFrom) range['gte'] = searchParams.endDateFrom;
        if (searchParams.endDateTo) range['lte'] = searchParams.endDateTo;

        filter.push({
          range: { endDate: range },
        });
      }

      // Duration filters
      if (searchParams.durationMin || searchParams.durationMax) {
        const range = {};
        if (searchParams.durationMin) range['gte'] = searchParams.durationMin;
        if (searchParams.durationMax) range['lte'] = searchParams.durationMax;

        if (searchParams.durationUnit) {
          filter.push({
            bool: {
              must: [
                { term: { durationUnit: searchParams.durationUnit } },
                { range: { durationAmount: range } },
              ],
            },
          });
        } else {
          filter.push({
            range: { durationAmount: range },
          });
        }
      }

      // Compensation range filter
      if (searchParams.compensationMin || searchParams.compensationMax) {
        const range = {};
        if (searchParams.compensationMin) range['gte'] = searchParams.compensationMin;
        if (searchParams.compensationMax) range['lte'] = searchParams.compensationMax;

        if (searchParams.compensationCurrency) {
          filter.push({
            bool: {
              must: [
                { term: { compensationCurrency: searchParams.compensationCurrency } },
                { range: { compensationMin: range } },
              ],
            },
          });
        } else {
          filter.push({
            range: { compensationMin: range },
          });
        }
      }

      // Compensation type filter
      if (searchParams.compensationType) {
        filter.push({
          term: { compensationType: searchParams.compensationType },
        });
      }

      // Languages filter (nested query)
      if (searchParams.languages && searchParams.languages.length > 0) {
        filter.push({
          nested: {
            path: 'requiredLanguages',
            query: {
              bool: {
                should: searchParams.languages.map((lang) => ({
                  term: { 'requiredLanguages.language': lang },
                })),
                minimum_should_match: 1,
              },
            },
          },
        });
      }

      // Skills filter
      if (searchParams.skills && searchParams.skills.length > 0) {
        filter.push({
          terms: { skills: searchParams.skills },
        });
      }

      // Required experience filter
      if (searchParams.requiredExperience) {
        // Include jobs with lower or equal experience requirements
        const experienceLevels = ['NONE', 'BASIC', 'INTERMEDIATE', 'ADVANCED'];
        const requestedLevelIndex = experienceLevels.indexOf(searchParams.requiredExperience);

        if (requestedLevelIndex >= 0) {
          // Allow jobs with requirement level at or below requested
          const allowedLevels = experienceLevels.slice(0, requestedLevelIndex + 1);
          filter.push({
            terms: { requiredExperience: allowedLevels },
          });
        }
      }

      // Benefits filters
      if (searchParams.accommodationIncluded !== undefined) {
        filter.push({
          term: { accommodationIncluded: searchParams.accommodationIncluded },
        });
      }

      if (searchParams.mealsIncluded !== undefined) {
        filter.push({
          term: { mealsIncluded: searchParams.mealsIncluded },
        });
      }

      // Status filter (only active jobs)
      filter.push({
        term: { status: 'ACTIVE' },
      });

      // Sorting
      let sort = [];
      switch (searchParams.sort) {
        case 'date':
          sort = [{ createdAt: 'desc' }];
          break;
        case 'compensation':
          sort = [{ compensationMax: 'desc' }];
          break;
        case 'distance':
          if (searchParams.lat && searchParams.lon) {
            sort = [
              {
                _geo_distance: {
                  location: {
                    lat: searchParams.lat,
                    lon: searchParams.lon,
                  },
                  order: 'asc',
                  unit: 'km',
                },
              },
            ];
          } else {
            sort = [{ createdAt: 'desc' }];
          }
          break;
        case 'relevance':
        default:
          // Relevance is default OpenSearch scoring
          if (!searchParams.query) {
            sort = [{ createdAt: 'desc' }];
          }
          break;
      }

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
              should,
            },
          },
          from,
          size: limit,
          sort,
        },
      });

      return {
        hits: response.body.hits.total.value,
        jobs: response.body.hits.hits.map((hit: any) => ({
          id: hit._id,
          ...hit._source,
          score: hit._score,
          // Add distance if geospatial sort was used
          ...(hit.sort && hit.sort[0] && typeof hit.sort[0] === 'number'
            ? { distanceKm: Math.round(hit.sort[0] * 10) / 10 }
            : {}),
        })),
        page,
        limit,
        totalPages: Math.ceil(response.body.hits.total.value / limit),
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
   * SPEC-JOB-001 Phase 2: Enhanced bulk indexing with new fields
   */
  async bulkIndexJobs(jobs: any[]) {
    try {
      const body = jobs.flatMap((job) => {
        const primaryLocation = job.locations && job.locations.length > 0 ? job.locations[0] : null;

        return [
          { index: { _index: this.jobsIndex, _id: job.id.toString() } },
          {
            title: job.title,
            description: job.description,
            requirements: job.requirements,
            category: job.category,
            workType: job.workType,
            durationAmount: job.durationAmount,
            durationUnit: job.durationUnit,
            startDate: job.startDate,
            endDate: job.endDate,
            closedAt: job.closedAt,
            compensationType: job.compensationType,
            compensationMin: job.compensationMin,
            compensationMax: job.compensationMax,
            compensationCurrency: job.compensationCurrency,
            accommodationIncluded: job.accommodationIncluded,
            mealsIncluded: job.mealsIncluded,
            requiredLanguages: job.requiredLanguages,
            skills: job.skills,
            requiredExperience: job.requiredExperience,
            status: job.status,
            applicantCount: job.applicantCount,
            viewCount: job.viewCount,
            location: primaryLocation
              ? {
                  lat: primaryLocation.latitude,
                  lon: primaryLocation.longitude,
                }
              : undefined,
            locations: job.locations
              ? job.locations.map((loc: any) => ({
                  city: loc.city,
                  country: loc.country,
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                }))
              : [],
            businessId: job.businessId,
            businessName: job.businessName,
            businessType: job.businessType,
            businessCity: job.businessCity,
            businessCountry: job.businessCountry,
            prestigeLevel: job.prestigeLevel,
            averageRating: job.averageRating,
            hasGoodEmployerBadge: job.hasGoodEmployerBadge,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt,
          },
        ];
      });

      await this.client.bulk({ body });

      this.logger.log(`Bulk indexed ${jobs.length} jobs`);
    } catch (error) {
      this.logger.error('Error bulk indexing jobs', error);
      throw error;
    }
  }
}
