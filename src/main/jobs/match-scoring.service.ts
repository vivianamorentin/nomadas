import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/database/prisma.service';
import { RequiredExperience, JobStatus } from '@prisma/client';

/**
 * Match Scoring Service
 * Calculates job-worker match scores using weighted heuristic algorithm
 * SPEC-JOB-001 Phase 5
 *
 * Weight Factors:
 * - Location proximity: 30%
 * - Skills match: 25%
 * - Compensation fit: 20%
 * - Reputation: 15%
 * - Other factors: 10% (duration, experience, languages)
 */
@Injectable()
export class MatchScoringService {
  private readonly logger = new Logger(MatchScoringService.name);

  // Weight factors (sum to 100%)
  private readonly WEIGHTS = {
    LOCATION_PROXIMITY: 0.30,
    SKILLS_MATCH: 0.25,
    COMPENSATION_FIT: 0.20,
    REPUTATION: 0.15,
    OTHER: 0.10,
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate match score for a worker-job pair
   * Returns score (0-100) with detailed breakdown
   */
  async calculateMatchScore(workerId: number, jobPostingId: number) {
    try {
      // Get worker profile
      const worker = await this.prisma.workerProfile.findUnique({
        where: { id: workerId },
        include: {
          user: {
            select: {
              averageRating: true,
              totalReviews: true,
            },
          },
        },
      });

      if (!worker) {
        throw new NotFoundException(`Worker profile with ID ${workerId} not found`);
      }

      // Get job posting
      const job = await this.prisma.jobPosting.findUnique({
        where: { id: jobPostingId },
        include: {
          locations: true,
          businessProfile: {
            select: {
              prestigeLevel: true,
              averageRating: true,
              totalReviews: true,
              hasGoodEmployerBadge: true,
            },
          },
        },
      });

      if (!job) {
        throw new NotFoundException(`Job posting with ID ${jobPostingId} not found`);
      }

      // Calculate individual factor scores
      const locationScore = this.calculateLocationScore(worker, job);
      const skillsScore = this.calculateSkillsScore(worker, job);
      const compensationScore = this.calculateCompensationScore(worker, job);
      const reputationScore = this.calculateReputationScore(worker, job);
      const otherScore = this.calculateOtherScore(worker, job);

      // Calculate weighted total
      const totalScore =
        locationScore.score * this.WEIGHTS.LOCATION_PROXIMITY +
        skillsScore.score * this.WEIGHTS.SKILLS_MATCH +
        compensationScore.score * this.WEIGHTS.COMPENSATION_FIT +
        reputationScore.score * this.WEIGHTS.REPUTATION +
        otherScore.score * this.WEIGHTS.OTHER;

      return {
        worker_id: workerId,
        job_id: jobPostingId,
        match_score: Math.round(totalScore * 100) / 100, // Round to 2 decimal places
        breakdown: {
          location: locationScore,
          skills: skillsScore,
          compensation: compensationScore,
          reputation: reputationScore,
          other: otherScore,
        },
        is_good_match: totalScore >= 70, // Good match threshold
        is_excellent_match: totalScore >= 85, // Excellent match threshold
      };
    } catch (error) {
      this.logger.error(`Error calculating match score for worker ${workerId} and job ${jobPostingId}`, error);
      throw error;
    }
  }

  /**
   * Get top matching workers for a job
   */
  async getTopMatchingWorkers(
    jobPostingId: number,
    limit: number = 20,
    minScore?: number
  ) {
    try {
      const job = await this.prisma.jobPosting.findUnique({
        where: { id: jobPostingId },
        include: { locations: true },
      });

      if (!job) {
        throw new NotFoundException(`Job posting with ID ${jobPostingId} not found`);
      }

      // Get all workers
      const workers = await this.prisma.workerProfile.findMany({
        where: {
          availabilityStatus: 'AVAILABLE', // Only available workers
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              averageRating: true,
              totalReviews: true,
            },
          },
        },
        take: 500, // Limit to 500 for performance (BR-MATCH-001)
      });

      // Calculate scores for all workers
      const matches = [];
      for (const worker of workers) {
        const scoreData = await this.calculateMatchScore(worker.id, jobPostingId);

        // Filter by minimum score if provided
        if (minScore === undefined || scoreData.match_score >= minScore) {
          matches.push({
            worker_id: worker.id,
            worker_name: `${worker.user.firstName} ${worker.user.lastName}`,
            worker_rating: worker.user.averageRating,
            availability_date: worker.availableFromDate,
            match_score: scoreData.match_score,
            is_good_match: scoreData.is_good_match,
            is_excellent_match: scoreData.is_excellent_match,
            breakdown: scoreData.breakdown,
          });
        }
      }

      // Sort by match score descending and limit
      matches.sort((a, b) => b.match_score - a.match_score);
      const topMatches = matches.slice(0, limit);

      this.logger.log(`Found ${topMatches.length} top matches for job ${jobPostingId}`);

      return {
        job_id: jobPostingId,
        total_candidates_evaluated: workers.length,
        matches_found: matches.length,
        top_matches: topMatches,
      };
    } catch (error) {
      this.logger.error(`Error getting top matching workers for job ${jobPostingId}`, error);
      throw error;
    }
  }

  /**
   * Get top matching jobs for a worker
   */
  async getTopMatchingJobs(
    workerId: number,
    limit: number = 20,
    minScore?: number
  ) {
    try {
      const worker = await this.prisma.workerProfile.findUnique({
        where: { id: workerId },
      });

      if (!worker) {
        throw new NotFoundException(`Worker profile with ID ${workerId} not found`);
      }

      // Get all active jobs
      const jobs = await this.prisma.jobPosting.findMany({
        where: {
          status: JobStatus.ACTIVE,
          startDate: {
            gte: new Date(), // Only future jobs
          },
        },
        include: {
          locations: true,
          businessProfile: {
            select: {
              businessName: true,
              prestigeLevel: true,
              averageRating: true,
              hasGoodEmployerBadge: true,
            },
          },
        },
        take: 500, // Limit for performance
      });

      // Calculate scores for all jobs
      const matches = [];
      for (const job of jobs) {
        const scoreData = await this.calculateMatchScore(workerId, job.id);

        // Filter by minimum score if provided
        if (minScore === undefined || scoreData.match_score >= minScore) {
          matches.push({
            job_id: job.id,
            title: job.title,
            description: job.description,
            category: job.category,
            workType: job.workType,
            startDate: job.startDate,
            endDate: job.endDate,
            compensationMin: job.compensationMin,
            compensationMax: job.compensationMax,
            location_city: job.locations[0]?.city,
            location_country: job.locations[0]?.country,
            business_name: job.businessProfile.businessName,
            business_rating: job.businessProfile.averageRating,
            match_score: scoreData.match_score,
            is_good_match: scoreData.is_good_match,
            is_excellent_match: scoreData.is_excellent_match,
            breakdown: scoreData.breakdown,
          });
        }
      }

      // Sort by match score descending and limit
      matches.sort((a, b) => b.match_score - a.match_score);
      const topMatches = matches.slice(0, limit);

      this.logger.log(`Found ${topMatches.length} top matches for worker ${workerId}`);

      return {
        worker_id: workerId,
        total_jobs_evaluated: jobs.length,
        matches_found: matches.length,
        top_matches: topMatches,
      };
    } catch (error) {
      this.logger.error(`Error getting top matching jobs for worker ${workerId}`, error);
      throw error;
    }
  }

  /**
   * Calculate location proximity score (0-100)
   * BR-MATCH-001: Distance-based scoring
   */
  private calculateLocationScore(worker: any, job: any): any {
    if (!worker.latitude || !worker.longitude || !job.locations || job.locations.length === 0) {
      return {
        score: 50, // Neutral score if location data missing
        factor: 'Location proximity cannot be calculated - location data missing',
        details: { worker_has_location: !!worker.latitude, job_has_locations: !!job.locations?.length },
      };
    }

    // Use worker's preferred location or actual location
    const workerLat = worker.preferredLatitude || worker.latitude;
    const workerLng = worker.preferredLongitude || worker.longitude;

    // Find closest job location
    let minDistance = Infinity;
    for (const location of job.locations) {
      const distance = this.calculateDistance(
        workerLat,
        workerLng,
        location.latitude,
        location.longitude
      );
      minDistance = Math.min(minDistance, distance);
    }

    // Score based on distance (BR-MATCH-001)
    // < 10km = 100, 10-50km = linear scale, > 50km = 0
    let score: number;
    if (minDistance <= 10) {
      score = 100;
    } else if (minDistance <= 50) {
      score = 100 - ((minDistance - 10) / 40) * 100;
    } else {
      score = 0;
    }

    return {
      score: Math.round(score),
      factor: 'Location proximity',
      details: {
        distance_km: Math.round(minDistance * 10) / 10,
        worker_location: { lat: workerLat, lng: workerLng },
        job_locations: job.locations.map((l: any) => ({ lat: l.latitude, lng: l.longitude })),
      },
    };
  }

  /**
   * Calculate skills match score (0-100)
   */
  private calculateSkillsScore(worker: any, job: any): any {
    if (!job.skills || job.skills.length === 0) {
      return {
        score: 100, // No skills required = perfect match
        factor: 'Skills match',
        details: { reason: 'Job has no required skills' },
      };
    }

    if (!worker.skills || worker.skills.length === 0) {
      return {
        score: 0, // Worker has no skills but job requires them
        factor: 'Skills match',
        details: { reason: 'Worker has no skills' },
      };
    }

    const requiredSkills = new Set(job.skills.map((s: any) => s.toLowerCase()));
    const workerSkills = new Set(worker.skills.map((s: any) => s.toLowerCase()));

    // Count matching skills
    let matchCount = 0;
    for (const skill of requiredSkills) {
      if (workerSkills.has(skill)) {
        matchCount++;
      }
    }

    const score = (matchCount / requiredSkills.size) * 100;

    return {
      score: Math.round(score),
      factor: 'Skills match',
      details: {
        required_skills: Array.from(requiredSkills),
        worker_skills: Array.from(workerSkills),
        matched_skills: matchCount,
        total_required: requiredSkills.size,
        match_percentage: Math.round(score),
      },
    };
  }

  /**
   * Calculate compensation fit score (0-100)
   */
  private calculateCompensationScore(worker: any, job: any): any {
    if (!job.compensationMin && !job.compensationMax) {
      return {
        score: 50, // Neutral score if job has no compensation data
        factor: 'Compensation fit',
        details: { reason: 'Job has no compensation data' },
      };
    }

    if (!worker.expectedCompensationMin && !worker.expectedCompensationMax) {
      return {
        score: 50, // Neutral score if worker has no expectations
        factor: 'Compensation fit',
        details: { reason: 'Worker has no compensation expectations' },
      };
    }

    const workerMin = worker.expectedCompensationMin || 0;
    const workerMax = worker.expectedCompensationMax || Infinity;
    const jobMin = job.compensationMin || 0;
    const jobMax = job.compensationMax || Infinity;

    // Check if ranges overlap
    if (workerMax < jobMin || workerMin > jobMax) {
      return {
        score: 0, // No overlap
        factor: 'Compensation fit',
        details: {
          reason: 'No compensation overlap',
          worker_range: { min: workerMin, max: workerMax },
          job_range: { min: jobMin, max: jobMax },
        },
      };
    }

    // Calculate overlap percentage
    const overlapMin = Math.max(workerMin, jobMin);
    const overlapMax = Math.min(workerMax, jobMax);

    // Score based on how well job compensation covers worker expectations
    // If job max >= worker max, full score. Otherwise, partial score.
    let score: number;
    if (jobMax >= workerMax && jobMin <= workerMin) {
      score = 100; // Job range fully covers worker range
    } else if (jobMax >= workerMax) {
      // Job max is good, but min is higher than worker min
      score = 75; // Still acceptable
    } else {
      // Job max is less than worker max
      const gap = workerMax - jobMax;
      const range = workerMax - workerMin;
      score = Math.max(0, 100 - (gap / range) * 100);
    }

    return {
      score: Math.round(score),
      factor: 'Compensation fit',
      details: {
        worker_range: { min: workerMin, max: workerMax === Infinity ? null : workerMax },
        job_range: { min: jobMin, max: jobMax === Infinity ? null : jobMax },
        overlap: { min: overlapMin, max: overlapMax === Infinity ? null : overlapMax },
      },
    };
  }

  /**
   * Calculate reputation score (0-100)
   * Based on worker rating, business rating, and badges
   */
  private calculateReputationScore(worker: any, job: any): any {
    const workerRating = worker.user?.averageRating || 0;
    const businessRating = job.businessProfile?.averageRating || 0;
    const hasGoodEmployerBadge = job.businessProfile?.hasGoodEmployerBadge || false;

    // Calculate individual scores (0-50 each, max 100 total)
    const workerScore = Math.min((workerRating / 5) * 50, 50); // Max 50 points
    const businessScore = Math.min((businessRating / 5) * 40, 40); // Max 40 points
    const badgeScore = hasGoodEmployerBadge ? 10 : 0; // Bonus 10 points

    const totalScore = workerScore + businessScore + badgeScore;

    return {
      score: Math.round(totalScore),
      factor: 'Reputation',
      details: {
        worker_rating: workerRating || 'No rating',
        business_rating: businessRating || 'No rating',
        has_good_employer_badge: hasGoodEmployerBadge,
        worker_score: Math.round(workerScore),
        business_score: Math.round(businessScore),
        badge_score: badgeScore,
      },
    };
  }

  /**
   * Calculate other factors score (0-100)
   * Based on duration, experience level, and languages
   */
  private calculateOtherScore(worker: any, job: any): any {
    const scores = [];

    // Experience level match (40 points)
    if (job.requiredExperience && worker.experienceLevel) {
      const experienceLevels = ['NONE', 'BASIC', 'INTERMEDIATE', 'ADVANCED'];
      const workerLevel = experienceLevels.indexOf(worker.experienceLevel);
      const requiredLevel = experienceLevels.indexOf(job.requiredExperience);

      if (workerLevel >= requiredLevel) {
        scores.push(40); // Worker meets or exceeds requirement
      } else {
        scores.push(20); // Worker below requirement but not disqualified
      }
    } else {
      scores.push(40); // No requirement or worker data = neutral
    }

    // Languages match (30 points)
    if (job.requiredLanguages && job.requiredLanguages.length > 0) {
      const workerLanguages = new Set(
        worker.languages?.map((l: any) => l.language) || []
      );
      let matchCount = 0;
      for (const reqLang of job.requiredLanguages) {
        if (workerLanguages.has(reqLang.language)) {
          matchCount++;
        }
      }
      const languageScore = (matchCount / job.requiredLanguages.length) * 30;
      scores.push(languageScore);
    } else {
      scores.push(30); // No language requirements
    }

    // Duration preference (30 points)
    if (worker.preferredDurationMin || worker.preferredDurationMax) {
      const workerPrefMin = worker.preferredDurationMin || 0;
      const workerPrefMax = worker.preferredDurationMax || Infinity;
      const jobDuration = job.durationAmount || 0;

      if (jobDuration >= workerPrefMin && jobDuration <= workerPrefMax) {
        scores.push(30); // Within preferred range
      } else if (jobDuration < workerPrefMin) {
        scores.push(15); // Shorter than preferred but acceptable
      } else {
        scores.push(10); // Longer than preferred
      }
    } else {
      scores.push(30); // No preference
    }

    const totalScore = scores.reduce((sum, score) => sum + score, 0);

    return {
      score: Math.round(totalScore),
      factor: 'Other factors',
      details: {
        experience_match: scores[0],
        language_match: scores[1],
        duration_match: scores[2],
      },
    };
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * Returns distance in kilometers
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
