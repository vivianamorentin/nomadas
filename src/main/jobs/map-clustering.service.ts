import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/database/prisma.service';
import { JobStatus } from '@prisma/client';

/**
 * Map Clustering Service
 * Grid-based clustering algorithm for job map visualization
 * SPEC-JOB-001 Phase 4
 */
@Injectable()
export class MapClusteringService {
  private readonly logger = new Logger(MapClusteringService.name);

  // Grid cell sizes at different zoom levels (in degrees)
  private readonly GRID_SIZES = [
    360, // zoom 0
    180, // zoom 1
    90, // zoom 2
    45, // zoom 3
    22.5, // zoom 4
    11.25, // zoom 5
    5.625, // zoom 6
    2.8125, // zoom 7
    1.40625, // zoom 8
    0.703125, // zoom 9
    0.3515625, // zoom 10
    0.17578125, // zoom 11
    0.087890625, // zoom 12
    0.0439453125, // zoom 13
    0.02197265625, // zoom 14
    0.010986328125, // zoom 15
    0.0054931640625, // zoom 16
    0.00274658203125, // zoom 17
    0.001373291015625, // zoom 18
    0.0006866455078125, // zoom 19
    0.00034332275390625, // zoom 20
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get job clusters for a map viewport
   * Uses grid-based clustering algorithm
   */
  async getClustersForViewport(params: {
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
    zoom: number;
    filters?: any;
  }) {
    try {
      const { bounds, zoom, filters } = params;

      // Get jobs within viewport
      const jobs = await this.getJobsInViewport(bounds, filters);

      // Cluster jobs based on zoom level
      const clusters = this.clusterJobs(jobs, zoom);

      // Enforce max clusters limit (BR-SEARCH-002)
      const maxClusters = 100;
      const limitedClusters = clusters.slice(0, maxClusters);

      if (clusters.length > maxClusters) {
        this.logger.warn(
          `Clusters limited to ${maxClusters} from ${clusters.length} for viewport`
        );
      }

      return {
        clusters: limitedClusters,
        total_jobs: jobs.length,
        cluster_count: limitedClusters.length,
        truncated: clusters.length > maxClusters,
      };
    } catch (error) {
      this.logger.error('Error getting clusters for viewport', error);
      throw error;
    }
  }

  /**
   * Get individual jobs in viewport (no clustering)
   * For high zoom levels when showing individual markers
   */
  async getJobsInViewport(
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    },
    filters?: any,
    limit: number = 100
  ) {
    try {
      const where: any = {
        status: JobStatus.ACTIVE,
        locations: {
          some: {
            latitude: {
              gte: bounds.south,
              lte: bounds.north,
            },
            longitude: {
              gte: bounds.west,
              lte: bounds.east,
            },
          },
        },
      };

      // Apply additional filters
      if (filters) {
        if (filters.categories && filters.categories.length > 0) {
          where.category = { in: filters.categories };
        }
        if (filters.workType) {
          where.workType = filters.workType;
        }
        if (filters.compensationMin !== undefined) {
          where.compensationMin = { gte: filters.compensationMin };
        }
        if (filters.compensationMax !== undefined) {
          where.compensationMax = { lte: filters.compensationMax };
        }
        if (filters.accommodationIncluded !== undefined) {
          where.accommodationIncluded = filters.accommodationIncluded;
        }
        if (filters.mealsIncluded !== undefined) {
          where.mealsIncluded = filters.mealsIncluded;
        }
      }

      const jobs = await this.prisma.jobPosting.findMany({
        where,
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
          locations: {
            where: {
              latitude: {
                gte: bounds.south,
                lte: bounds.north,
              },
              longitude: {
                gte: bounds.west,
                lte: bounds.east,
              },
            },
          },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return jobs;
    } catch (error) {
      this.logger.error('Error getting jobs in viewport', error);
      throw error;
    }
  }

  /**
   * Cluster jobs using grid-based algorithm
   */
  private clusterJobs(jobs: any[], zoom: number) {
    if (jobs.length === 0) {
      return [];
    }

    // Get grid cell size for zoom level
    const gridSize = this.getGridSize(zoom);

    // Create clusters
    const clustersMap = new Map<string, any>();

    jobs.forEach((job) => {
      // Get primary location (first location)
      const location = job.locations[0];
      if (!location) return;

      // Calculate grid cell key
      const latCell = Math.floor(location.latitude / gridSize);
      const lngCell = Math.floor(location.longitude / gridSize);
      const cellKey = `${latCell}_${lngCell}`;

      // Add to cluster or create new cluster
      if (!clustersMap.has(cellKey)) {
        clustersMap.set(cellKey, {
          id: cellKey,
          latitude: (latCell + 0.5) * gridSize,
          longitude: (lngCell + 0.5) * gridSize,
          job_count: 0,
          job_ids: [],
          categories: new Set(),
          compensation_range: { min: Infinity, max: -Infinity },
        });
      }

      const cluster = clustersMap.get(cellKey);
      cluster.job_count++;
      cluster.job_ids.push(job.id);
      cluster.categories.add(job.category);

      // Update compensation range
      if (job.compensationMin !== undefined && job.compensationMin !== null) {
        cluster.compensation_range.min = Math.min(
          cluster.compensation_range.min,
          job.compensationMin
        );
      }
      if (job.compensationMax !== undefined && job.compensationMax !== null) {
        cluster.compensation_range.max = Math.max(
          cluster.compensation_range.max,
          job.compensationMax
        );
      }
    });

    // Convert map to array and format
    const clusters = Array.from(clustersMap.values()).map((cluster) => ({
      ...cluster,
      categories: Array.from(cluster.categories),
      // Fix compensation range if no jobs have compensation
      compensation_range: {
        min: cluster.compensation_range.min === Infinity ? null : cluster.compensation_range.min,
        max: cluster.compensation_range.max === -Infinity ? null : cluster.compensation_range.max,
      },
    }));

    return clusters;
  }

  /**
   * Get grid cell size for zoom level
   */
  private getGridSize(zoom: number): number {
    const zoomLevel = Math.max(0, Math.min(20, Math.floor(zoom)));
    return this.GRID_SIZES[zoomLevel];
  }

  /**
   * Calculate cluster center (weighted average of positions)
   * For more accurate cluster positioning
   */
  private calculateClusterCenter(jobs: any[]): { lat: number; lng: number } {
    if (jobs.length === 0) {
      return { lat: 0, lng: 0 };
    }

    let totalLat = 0;
    let totalLng = 0;

    jobs.forEach((job) => {
      const location = job.locations[0];
      if (location) {
        totalLat += location.latitude;
        totalLng += location.longitude;
      }
    });

    return {
      lat: totalLat / jobs.length,
      lng: totalLng / jobs.length,
    };
  }

  /**
   * Get job view analytics for map
   * Tracks which jobs are viewed from map
   */
  async trackMapView(jobIds: number[], viewerType: string, viewerId?: number) {
    try {
      // Track views for all jobs
      await this.prisma.jobView.createMany({
        data: jobIds.map((jobId) => ({
          jobPostingId: jobId,
          viewerType,
          viewerId,
          viewSource: 'MAP',
        })),
      });

      // Increment view counts (batch update would be better for high traffic)
      await this.prisma.jobPosting.updateMany({
        where: {
          id: { in: jobIds },
        },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });

      this.logger.log(`Tracked map views for ${jobIds.length} jobs`);
    } catch (error) {
      this.logger.error('Error tracking map views', error);
      // Don't throw - view tracking shouldn't break the request
    }
  }
}
