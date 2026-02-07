import { Test, TestingModule } from '@nestjs/testing';
import { MatchScoringService } from '../../src/main/jobs/match-scoring.service';
import { PrismaService } from '../../src/shared/infrastructure/database/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { RequiredExperience, JobStatus, WorkType, JobCategory } from '@prisma/client';

describe('MatchScoringService', () => {
  let service: MatchScoringService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    workerProfile: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    jobPosting: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    jobView: {
      createMany: jest.fn(),
    },
    jobPosting: {
      updateMany: jest.fn(),
    },
  };

  const mockWorker = {
    id: 1,
    userId: 100,
    latitude: 41.3851,
    longitude: 2.1734,
    preferredLatitude: 41.39,
    preferredLongitude: 2.18,
    skills: ['english', 'customer service', 'team work'],
    languages: [{ language: 'en', level: 'C1' }],
    experienceLevel: 'INTERMEDIATE',
    expectedCompensationMin: 300,
    expectedCompensationMax: 500,
    preferredDurationMin: 4,
    preferredDurationMax: 12,
    availabilityStatus: 'AVAILABLE',
    availableFromDate: new Date('2024-06-01'),
    user: {
      id: 100,
      firstName: 'John',
      lastName: 'Doe',
      averageRating: 4.5,
      totalReviews: 15,
    },
  };

  const mockJob = {
    id: 1,
    businessId: 10,
    title: 'Summer Server',
    description: 'Beach restaurant server',
    category: JobCategory.FOOD_SERVICE,
    workType: WorkType.SEASONAL,
    durationAmount: 8,
    durationUnit: 'WEEKS',
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-08-31'),
    compensationType: 'WEEKLY',
    compensationMin: 350,
    compensationMax: 450,
    accommodationIncluded: true,
    mealsIncluded: true,
    requiredExperience: RequiredExperience.BASIC,
    requiredLanguages: [{ language: 'en', level: 'B2' }],
    skills: ['english', 'customer service'],
    status: JobStatus.ACTIVE,
    locations: [
      {
        id: 1,
        latitude: 41.39,
        longitude: 2.18,
        city: 'Barcelona',
        country: 'Spain',
      },
    ],
    businessProfile: {
      businessName: 'Sunset Beach Bar',
      prestigeLevel: 'GOLD',
      averageRating: 4.2,
      totalReviews: 8,
      hasGoodEmployerBadge: true,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchScoringService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MatchScoringService>(MatchScoringService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('calculateMatchScore', () => {
    it('should calculate match score successfully', async () => {
      mockPrismaService.workerProfile.findUnique.mockResolvedValue(mockWorker);
      mockPrismaService.jobPosting.findUnique.mockResolvedValue(mockJob);

      const result = await service.calculateMatchScore(1, 1);

      expect(result).toHaveProperty('worker_id', 1);
      expect(result).toHaveProperty('job_id', 1);
      expect(result).toHaveProperty('match_score');
      expect(result.match_score).toBeGreaterThan(0);
      expect(result.match_score).toBeLessThanOrEqual(100);
      expect(result).toHaveProperty('breakdown');
      expect(result.breakdown).toHaveProperty('location');
      expect(result.breakdown).toHaveProperty('skills');
      expect(result.breakdown).toHaveProperty('compensation');
      expect(result.breakdown).toHaveProperty('reputation');
      expect(result.breakdown).toHaveProperty('other');
    });

    it('should throw NotFoundException when worker not found', async () => {
      mockPrismaService.workerProfile.findUnique.mockResolvedValue(null);

      await expect(service.calculateMatchScore(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when job not found', async () => {
      mockPrismaService.workerProfile.findUnique.mockResolvedValue(mockWorker);
      mockPrismaService.jobPosting.findUnique.mockResolvedValue(null);

      await expect(service.calculateMatchScore(1, 999)).rejects.toThrow(NotFoundException);
    });

    it('should calculate location score correctly for close distance', async () => {
      mockPrismaService.workerProfile.findUnique.mockResolvedValue(mockWorker);
      mockPrismaService.jobPosting.findUnique.mockResolvedValue(mockJob);

      const result = await service.calculateMatchScore(1, 1);

      expect(result.breakdown.location.score).toBe(100); // < 10km
      expect(result.breakdown.location.details.distance_km).toBeLessThan(10);
    });

    it('should calculate location score correctly for far distance', async () => {
      const farJob = {
        ...mockJob,
        locations: [
          { latitude: 51.5074, longitude: -0.1278, city: 'London', country: 'UK' },
        ],
      };

      mockPrismaService.workerProfile.findUnique.mockResolvedValue(mockWorker);
      mockPrismaService.jobPosting.findUnique.mockResolvedValue(farJob);

      const result = await service.calculateMatchScore(1, 1);

      expect(result.breakdown.location.score).toBe(0); // > 50km from Barcelona to London
    });

    it('should calculate skills score correctly', async () => {
      mockPrismaService.workerProfile.findUnique.mockResolvedValue(mockWorker);
      mockPrismaService.jobPosting.findUnique.mockResolvedValue(mockJob);

      const result = await service.calculateMatchScore(1, 1);

      expect(result.breakdown.skills.score).toBeGreaterThan(0);
      expect(result.breakdown.skills.details.matched_skills).toBeGreaterThan(0);
    });

    it('should give 100 skills score when job has no requirements', async () => {
      const jobNoSkills = {
        ...mockJob,
        skills: [],
      };

      mockPrismaService.workerProfile.findUnique.mockResolvedValue(mockWorker);
      mockPrismaService.jobPosting.findUnique.mockResolvedValue(jobNoSkills);

      const result = await service.calculateMatchScore(1, 1);

      expect(result.breakdown.skills.score).toBe(100);
    });

    it('should calculate compensation score correctly for good match', async () => {
      mockPrismaService.workerProfile.findUnique.mockResolvedValue(mockWorker);
      mockPrismaService.jobPosting.findUnique.mockResolvedValue(mockJob);

      const result = await service.calculateMatchScore(1, 1);

      expect(result.breakdown.compensation.score).toBeGreaterThan(70);
    });
  });

  describe('getTopMatchingWorkers', () => {
    it('should return top matching workers for a job', async () => {
      mockPrismaService.jobPosting.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.workerProfile.findMany.mockResolvedValue([mockWorker]);

      jest.spyOn(service, 'calculateMatchScore').mockResolvedValue({
        worker_id: 1,
        job_id: 1,
        match_score: 85,
        breakdown: {},
        is_good_match: true,
        is_excellent_match: true,
      });

      const result = await service.getTopMatchingWorkers(1, 10);

      expect(result).toHaveProperty('job_id', 1);
      expect(result).toHaveProperty('total_candidates_evaluated');
      expect(result).toHaveProperty('matches_found');
      expect(result).toHaveProperty('top_matches');
      expect(Array.isArray(result.top_matches)).toBe(true);
    });

    it('should filter by minimum score', async () => {
      mockPrismaService.jobPosting.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.workerProfile.findMany.mockResolvedValue([mockWorker]);

      jest.spyOn(service, 'calculateMatchScore').mockResolvedValue({
        worker_id: 1,
        job_id: 1,
        match_score: 65,
        breakdown: {},
        is_good_match: false,
        is_excellent_match: false,
      });

      const result = await service.getTopMatchingWorkers(1, 10, 70);

      expect(result.top_matches).toHaveLength(0); // Score below 70
    });
  });

  describe('getTopMatchingJobs', () => {
    it('should return top matching jobs for a worker', async () => {
      mockPrismaService.workerProfile.findUnique.mockResolvedValue(mockWorker);
      mockPrismaService.jobPosting.findMany.mockResolvedValue([mockJob]);

      jest.spyOn(service, 'calculateMatchScore').mockResolvedValue({
        worker_id: 1,
        job_id: 1,
        match_score: 88,
        breakdown: {},
        is_good_match: true,
        is_excellent_match: true,
      });

      const result = await service.getTopMatchingJobs(1, 10);

      expect(result).toHaveProperty('worker_id', 1);
      expect(result).toHaveProperty('total_jobs_evaluated');
      expect(result).toHaveProperty('matches_found');
      expect(result).toHaveProperty('top_matches');
      expect(Array.isArray(result.top_matches)).toBe(true);
    });
  });
});
