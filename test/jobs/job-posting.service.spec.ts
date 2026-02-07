import { Test, TestingModule } from '@nestjs/testing';
import { JobPostingService } from '../../src/main/jobs/job-posting.service';
import { PrismaService } from '../../src/database/prisma.service';
import { OpenSearchService } from '../../src/shared/infrastructure/search/opensearch.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { JobStatus, JobCategory, WorkType } from '@prisma/client';

describe('JobPostingService', () => {
  let service: JobPostingService;
  let prismaService: PrismaService;
  let openSearchService: OpenSearchService;

  const mockPrismaService = {
    businessProfile: {
      findFirst: jest.fn(),
    },
    jobPosting: {
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      $transaction: jest.fn(),
    },
    jobLocation: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    jobView: {
      create: jest.fn(),
    },
  };

  const mockOpenSearchService = {
    indexJob: jest.fn(),
    deleteJob: jest.fn(),
  };

  const mockBusinessProfile = {
    id: 1,
    userId: 100,
    businessName: 'Sunset Beach Bar',
    businessType: 'BAR',
    locationCity: 'Barcelona',
    locationCountry: 'Spain',
  };

  const mockJobPosting = {
    id: 1,
    businessId: 1,
    title: 'Summer Server',
    description: 'A vibrant beach bar located in Barcelona looking for summer staff.',
    requirements: 'Must speak English',
    category: JobCategory.FOOD_SERVICE,
    workType: WorkType.SEASONAL,
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-08-31'),
    compensationMin: 300,
    compensationMax: 400,
    accommodationIncluded: true,
    mealsIncluded: true,
    status: JobStatus.DRAFT,
    applicantCount: 0,
    viewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    locations: [],
    businessProfile: mockBusinessProfile,
    _count: { applications: 0 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobPostingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: OpenSearchService,
          useValue: mockOpenSearchService,
        },
      ],
    }).compile();

    service = module.get<JobPostingService>(JobPostingService);
    prismaService = module.get<PrismaService>(PrismaService);
    openSearchService = module.get<OpenSearchService>(OpenSearchService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      title: 'Summer Server',
      description: 'A vibrant beach bar looking for summer staff with at least 50 characters description.',
      category: JobCategory.FOOD_SERVICE,
      workType: WorkType.SEASONAL,
      startDate: '2024-06-01',
      endDate: '2024-08-31',
      compensationMin: 300,
      compensationMax: 400,
      accommodationIncluded: true,
      mealsIncluded: true,
      locations: [
        {
          address: '123 Beach Ave',
          city: 'Barcelona',
          country: 'Spain',
          latitude: 41.3851,
          longitude: 2.1734,
        },
      ],
    };

    it('should create a new job posting successfully', async () => {
      mockPrismaService.businessProfile.findFirst.mockResolvedValue(mockBusinessProfile);
      mockPrismaService.jobPosting.count.mockResolvedValue(0);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.jobPosting.create.mockResolvedValue(mockJobPosting);
      mockPrismaService.jobLocation.createMany.mockResolvedValue({ count: 1 });
      mockPrismaService.jobPosting.findUnique.mockResolvedValue({
        ...mockJobPosting,
        locations: createDto.locations,
      });

      const result = await service.create(100, createDto);

      expect(result).toHaveProperty('id');
      expect(result.message).toBe('Job posting created successfully!');
      expect(mockPrismaService.jobPosting.create).toHaveBeenCalled();
    });

    it('should throw error when user has no business profile', async () => {
      mockPrismaService.businessProfile.findFirst.mockResolvedValue(null);

      await expect(service.create(100, createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(100, createDto)).rejects.toThrow('Business profile not found');
    });

    it('should throw error when business has 50 active jobs', async () => {
      mockPrismaService.businessProfile.findFirst.mockResolvedValue(mockBusinessProfile);
      mockPrismaService.jobPosting.count.mockResolvedValue(50);

      await expect(service.create(100, createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(100, createDto)).rejects.toThrow('maximum limit of 50 active job postings');
    });

    it('should throw error when description is too short', async () => {
      const shortDescriptionDto = { ...createDto, description: 'Too short' };

      mockPrismaService.businessProfile.findFirst.mockResolvedValue(mockBusinessProfile);

      await expect(service.create(100, shortDescriptionDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(100, shortDescriptionDto)).rejects.toThrow('at least 50 characters');
    });

    it('should throw error when compensation is zero or negative', async () => {
      const invalidCompensationDto = { ...createDto, compensationMin: 0 };

      mockPrismaService.businessProfile.findFirst.mockResolvedValue(mockBusinessProfile);

      await expect(service.create(100, invalidCompensationDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(100, invalidCompensationDto)).rejects.toThrow('Compensation must be greater than 0');
    });

    it('should throw error when min compensation exceeds max', async () => {
      const invalidRangeDto = { ...createDto, compensationMin: 500, compensationMax: 400 };

      mockPrismaService.businessProfile.findFirst.mockResolvedValue(mockBusinessProfile);

      await expect(service.create(100, invalidRangeDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(100, invalidRangeDto)).rejects.toThrow('Minimum compensation cannot be greater');
    });

    it('should throw error when start date is in the past', async () => {
      const pastDateDto = { ...createDto, startDate: '2020-01-01' };

      mockPrismaService.businessProfile.findFirst.mockResolvedValue(mockBusinessProfile);

      await expect(service.create(100, pastDateDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(100, pastDateDto)).rejects.toThrow('Start date must be in the future');
    });

    it('should throw error when end date is before start date', async () => {
      const invalidDatesDto = { ...createDto, startDate: '2024-08-01', endDate: '2024-06-01' };

      mockPrismaService.businessProfile.findFirst.mockResolvedValue(mockBusinessProfile);

      await expect(service.create(100, invalidDatesDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(100, invalidDatesDto)).rejects.toThrow('End date must be after start date');
    });

    it('should throw error when no locations provided', async () => {
      const noLocationsDto = { ...createDto, locations: [] };

      mockPrismaService.businessProfile.findFirst.mockResolvedValue(mockBusinessProfile);

      await expect(service.create(100, noLocationsDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(100, noLocationsDto)).rejects.toThrow('At least one job location is required');
    });
  });

  describe('findAllByBusiness', () => {
    it('should return all job postings for a business', async () => {
      mockPrismaService.businessProfile.findFirst.mockResolvedValue(mockBusinessProfile);
      mockPrismaService.jobPosting.findMany.mockResolvedValue([mockJobPosting]);
      mockPrismaService.jobPosting.count.mockResolvedValue(1);

      const result = await service.findAllByBusiness(100, {});

      expect(result).toHaveProperty('jobs');
      expect(result).toHaveProperty('total');
      expect(result.jobs).toHaveLength(1);
      expect(mockPrismaService.jobPosting.findMany).toHaveBeenCalled();
    });

    it('should filter by status when provided', async () => {
      mockPrismaService.businessProfile.findFirst.mockResolvedValue(mockBusinessProfile);
      mockPrismaService.jobPosting.findMany.mockResolvedValue([mockJobPosting]);
      mockPrismaService.jobPosting.count.mockResolvedValue(1);

      await service.findAllByBusiness(100, { status: JobStatus.ACTIVE });

      expect(mockPrismaService.jobPosting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: JobStatus.ACTIVE,
          }),
        })
      );
    });

    it('should paginate results', async () => {
      mockPrismaService.businessProfile.findFirst.mockResolvedValue(mockBusinessProfile);
      mockPrismaService.jobPosting.findMany.mockResolvedValue([]);
      mockPrismaService.jobPosting.count.mockResolvedValue(50);

      const result = await service.findAllByBusiness(100, { page: 2, limit: 10 });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(5);
      expect(mockPrismaService.jobPosting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a job posting by id', async () => {
      mockPrismaService.jobPosting.findUnique.mockResolvedValue(mockJobPosting);

      const result = await service.findOne(1);

      expect(result).toHaveProperty('title');
      expect(result.title).toBe('Summer Server');
      expect(mockPrismaService.jobPosting.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.objectContaining({
          businessProfile: expect.any(Object),
          locations: true,
          _count: true,
        }),
      });
    });

    it('should throw NotFoundException when job does not exist', async () => {
      mockPrismaService.jobPosting.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Job posting with ID 999 not found');
    });
  });

  describe('update', () => {
    const updateDto = {
      title: 'Updated Job Title',
      description: 'Updated description with at least 50 characters for testing purposes.',
    };

    it('should update a job posting successfully', async () => {
      mockPrismaService.businessProfile.findFirst.mockResolvedValue(mockBusinessProfile);
      mockPrismaService.jobPosting.findUnique.mockResolvedValue({
        ...mockJobPosting,
        status: JobStatus.ACTIVE,
      });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.jobPosting.update.mockResolvedValue({
        ...mockJobPosting,
        ...updateDto,
      });
      mockPrismaService.jobLocation.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.jobLocation.createMany.mockResolvedValue({ count: 1 });
      mockPrismaService.jobPosting.findUnique.mockResolvedValue({
        ...mockJobPosting,
        ...updateDto,
      });

      const result = await service.update(1, 100, updateDto);

      expect(result.message).toBe('Job posting updated successfully!');
      expect(mockPrismaService.jobPosting.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when job does not exist', async () => {
      mockPrismaService.jobPosting.findUnique.mockResolvedValue(null);

      await expect(service.update(999, 100, updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own job', async () => {
      mockPrismaService.jobPosting.findUnique.mockResolvedValue({
        ...mockJobPosting,
        businessId: 999, // Different business
      });
      mockPrismaService.businessProfile.findFirst.mockResolvedValue({
        ...mockBusinessProfile,
        id: 1,
      });

      await expect(service.update(1, 100, updateDto)).rejects.toThrow(ForbiddenException);
      await expect(service.update(1, 100, updateDto)).rejects.toThrow('do not have permission to update');
    });

    it('should throw BadRequestException when job is closed', async () => {
      mockPrismaService.jobPosting.findUnique.mockResolvedValue({
        ...mockJobPosting,
        status: JobStatus.CLOSED,
      });
      mockPrismaService.businessProfile.findFirst.mockResolvedValue(mockBusinessProfile);

      await expect(service.update(1, 100, updateDto)).rejects.toThrow(BadRequestException);
      await expect(service.update(1, 100, updateDto)).rejects.toThrow('Cannot update job with status CLOSED');
    });
  });

  describe('changeStatus', () => {
    const changeDto = {
      status: JobStatus.ACTIVE,
    };

    it('should change job status successfully', async () => {
      mockPrismaService.jobPosting.findUnique.mockResolvedValue(mockJobPosting);
      mockPrismaService.businessProfile.findFirst.mockResolvedValue(mockBusinessProfile);
      mockPrismaService.jobPosting.update.mockResolvedValue({
        ...mockJobPosting,
        status: JobStatus.ACTIVE,
      });
      mockPrismaService.jobPosting.findUnique.mockResolvedValue({
        ...mockJobPosting,
        status: JobStatus.ACTIVE,
      });

      const result = await service.changeStatus(1, 100, changeDto);

      expect(result.message).toContain('Job status changed to ACTIVE');
      expect(mockPrismaService.jobPosting.update).toHaveBeenCalled();
    });

    it('should throw error when trying to reactivate closed job', async () => {
      mockPrismaService.jobPosting.findUnique.mockResolvedValue({
        ...mockJobPosting,
        status: JobStatus.CLOSED,
      });
      mockPrismaService.businessProfile.findFirst.mockResolvedValue(mockBusinessProfile);

      await expect(service.changeStatus(1, 100, changeDto)).rejects.toThrow(BadRequestException);
      await expect(service.changeStatus(1, 100, changeDto)).rejects.toThrow('Cannot reactivate a closed job');
    });

    it('should throw error when trying to cancel filled job', async () => {
      const cancelDto = { status: JobStatus.CANCELLED };
      mockPrismaService.jobPosting.findUnique.mockResolvedValue({
        ...mockJobPosting,
        status: JobStatus.FILLED,
      });
      mockPrismaService.businessProfile.findFirst.mockResolvedValue(mockBusinessProfile);

      await expect(service.changeStatus(1, 100, cancelDto)).rejects.toThrow(BadRequestException);
      await expect(service.changeStatus(1, 100, cancelDto)).rejects.toThrow('Cannot cancel a job with status FILLED');
    });

    it('should throw error when marking non-active job as filled', async () => {
      const filledDto = { status: JobStatus.FILLED };
      mockPrismaService.jobPosting.findUnique.mockResolvedValue({
        ...mockJobPosting,
        status: JobStatus.DRAFT,
      });
      mockPrismaService.businessProfile.findFirst.mockResolvedValue(mockBusinessProfile);

      await expect(service.changeStatus(1, 100, filledDto)).rejects.toThrow(BadRequestException);
      await expect(service.changeStatus(1, 100, filledDto)).rejects.toThrow('Can only mark ACTIVE jobs as FILLED');
    });
  });

  describe('remove', () => {
    it('should soft delete a job posting successfully', async () => {
      mockPrismaService.jobPosting.findUnique.mockResolvedValue(mockJobPosting);
      mockPrismaService.businessProfile.findFirst.mockResolvedValue(mockBusinessProfile);
      mockPrismaService.jobPosting.update.mockResolvedValue({
        ...mockJobPosting,
        status: JobStatus.CLOSED,
      });

      const result = await service.remove(1, 100);

      expect(result.message).toBe('Job posting deleted successfully!');
      expect(mockPrismaService.jobPosting.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: JobStatus.CLOSED,
          closedAt: expect.any(Date),
        }),
      });
    });

    it('should throw ForbiddenException when user does not own job', async () => {
      mockPrismaService.jobPosting.findUnique.mockResolvedValue({
        ...mockJobPosting,
        businessId: 999,
      });
      mockPrismaService.businessProfile.findFirst.mockResolvedValue({
        ...mockBusinessProfile,
        id: 1,
      });

      await expect(service.remove(1, 100)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('trackView', () => {
    it('should track job view successfully', async () => {
      mockPrismaService.jobView.create.mockResolvedValue({});
      mockPrismaService.jobPosting.update.mockResolvedValue({});

      await service.trackView(1, 'WORKER', 200, 'SEARCH');

      expect(mockPrismaService.jobView.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          jobPostingId: 1,
          viewerType: 'WORKER',
          viewerId: 200,
          viewSource: 'SEARCH',
        }),
      });
      expect(mockPrismaService.jobPosting.update).toHaveBeenCalled();
    });

    it('should not throw error if tracking fails', async () => {
      mockPrismaService.jobView.create.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(service.trackView(1, 'GUEST')).resolves.not.toThrow();
    });
  });
});
