import { Test, TestingModule } from '@nestjs/testing';
import { BusinessProfileService } from '../../src/main/business/services/business-profile.service';
import { PrismaService } from '../../src/database/prisma.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { BusinessStatus, PrestigeLevel } from '@prisma/client';

describe('BusinessProfileService', () => {
  let service: BusinessProfileService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    businessProfile: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    businessProfileChange: {
      createMany: jest.fn(),
    },
    review: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockBusinessProfile = {
    id: 1,
    userId: 100,
    businessName: 'Sunset Beach Bar',
    businessType: 'BAR',
    description: 'A vibrant beach bar located on the beautiful coast of Barcelona.',
    locationAddress: '123 Passeig de Gràcia',
    locationCity: 'Barcelona',
    locationCountry: 'Spain',
    locationPostalCode: '08001',
    locationLatitude: 41.3851,
    locationLongitude: 2.1734,
    contactEmail: 'contact@sunsetbeachbar.com',
    contactPhone: '+34 931 23 45 67',
    websiteUrl: 'https://sunsetbeachbar.com',
    isPrimary: true,
    status: BusinessStatus.ACTIVE,
    isVerified: false,
    totalReviews: 0,
    averageRating: 0,
    prestigeLevel: PrestigeLevel.BRONZE,
    hasGoodEmployerBadge: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    photos: [],
    verificationDocuments: [],
    jobPostings: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessProfileService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BusinessProfileService>(BusinessProfileService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new business profile successfully', async () => {
      const createDto = {
        businessName: 'Sunset Beach Bar',
        businessType: 'BAR',
        description: 'A vibrant beach bar located on the beautiful coast of Barcelona with stunning views.',
        locationAddress: '123 Passeig de Gràcia',
        locationCity: 'Barcelona',
        locationCountry: 'Spain',
        locationPostalCode: '08001',
        locationLatitude: 41.3851,
        locationLongitude: 2.1734,
        contactEmail: 'contact@sunsetbeachbar.com',
        contactPhone: '+34 931 23 45 67',
        websiteUrl: 'https://sunsetbeachbar.com',
        isPrimary: true,
      };

      mockPrismaService.businessProfile.count.mockResolvedValue(0);
      mockPrismaService.businessProfile.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.businessProfile.create.mockResolvedValue(mockBusinessProfile);

      const result = await service.create(100, createDto);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Business profile created successfully!');
      expect(result.profile).toHaveProperty('businessName');
      expect(mockPrismaService.businessProfile.count).toHaveBeenCalledWith({ where: { userId: 100 } });
      expect(mockPrismaService.businessProfile.create).toHaveBeenCalled();
    });

    it('should throw error when user has 10 business profiles', async () => {
      const createDto = {
        businessName: 'Test Business',
        businessType: 'CAFE',
        description: 'A test cafe description that is at least 50 characters long for testing purposes.',
        locationAddress: '123 Test St',
        locationCity: 'Test City',
        locationCountry: 'Test Country',
        locationLatitude: 41.3851,
        locationLongitude: 2.1734,
        contactEmail: 'test@test.com',
        contactPhone: '+1234567890',
      };

      mockPrismaService.businessProfile.count.mockResolvedValue(10);

      await expect(service.create(100, createDto)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.create(100, createDto)).rejects.toThrow(
        'You have reached the maximum limit of 10 business profiles'
      );
    });

    it('should unset other primary businesses when creating a primary profile', async () => {
      const createDto = {
        businessName: 'New Primary Business',
        businessType: 'RESTAURANT',
        description: 'A restaurant description that is at least 50 characters long for testing purposes.',
        locationAddress: '456 New St',
        locationCity: 'New City',
        locationCountry: 'New Country',
        locationLatitude: 41.3851,
        locationLongitude: 2.1734,
        contactEmail: 'new@business.com',
        contactPhone: '+9876543210',
        isPrimary: true,
      };

      mockPrismaService.businessProfile.count.mockResolvedValue(1);
      mockPrismaService.businessProfile.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.businessProfile.create.mockResolvedValue(mockBusinessProfile);

      await service.create(100, createDto);

      expect(mockPrismaService.businessProfile.updateMany).toHaveBeenCalledWith({
        where: { userId: 100, isPrimary: true },
        data: { isPrimary: false },
      });
    });

    it('should set isPrimary to false when not provided', async () => {
      const createDto = {
        businessName: 'Secondary Business',
        businessType: 'HOSTEL',
        description: 'A hostel description that is at least 50 characters long for testing purposes.',
        locationAddress: '789 Hostel St',
        locationCity: 'Hostel City',
        locationCountry: 'Hostel Country',
        locationLatitude: 41.3851,
        locationLongitude: 2.1734,
        contactEmail: 'hostel@test.com',
        contactPhone: '+5555555555',
      };

      mockPrismaService.businessProfile.count.mockResolvedValue(0);
      mockPrismaService.businessProfile.create.mockResolvedValue({
        ...mockBusinessProfile,
        isPrimary: false,
      });

      await service.create(100, createDto);

      expect(mockPrismaService.businessProfile.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isPrimary: false,
          }),
        })
      );
    });
  });

  describe('findAllByUser', () => {
    it('should return all business profiles for a user ordered by isPrimary', async () => {
      const mockProfiles = [
        { ...mockBusinessProfile, isPrimary: true },
        { ...mockBusinessProfile, id: 2, isPrimary: false },
      ];

      mockPrismaService.businessProfile.findMany.mockResolvedValue(mockProfiles);

      const result = await service.findAllByUser(100);

      expect(result).toHaveLength(2);
      expect(result[0].isPrimary).toBe(true);
      expect(mockPrismaService.businessProfile.findMany).toHaveBeenCalledWith({
        where: { userId: 100 },
        include: {
          photos: {
            orderBy: { uploadOrder: 'asc' },
          },
        },
        orderBy: { isPrimary: 'desc' },
      });
    });

    it('should return empty array when user has no profiles', async () => {
      mockPrismaService.businessProfile.findMany.mockResolvedValue([]);

      const result = await service.findAllByUser(100);

      expect(result).toEqual([]);
      expect(mockPrismaService.businessProfile.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a business profile by id', async () => {
      mockPrismaService.businessProfile.findUnique.mockResolvedValue(mockBusinessProfile);

      const result = await service.findOne(1);

      expect(result).toHaveProperty('businessName');
      expect(result.businessName).toBe('Sunset Beach Bar');
      expect(mockPrismaService.businessProfile.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          photos: {
            orderBy: { uploadOrder: 'asc' },
          },
          verificationDocuments: {
            orderBy: { uploadDate: 'desc' },
          },
        },
      });
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      mockPrismaService.businessProfile.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Business profile with ID 999 not found'
      );
    });

    it('should throw ForbiddenException when user does not own profile', async () => {
      mockPrismaService.businessProfile.findUnique.mockResolvedValue({
        ...mockBusinessProfile,
        userId: 200, // Different user
      });

      await expect(service.findOne(1, 100)).rejects.toThrow(ForbiddenException);
      await expect(service.findOne(1, 100)).rejects.toThrow(
        'You do not have permission to view this business profile'
      );
    });

    it('should return profile without userId when userId is not provided', async () => {
      mockPrismaService.businessProfile.findUnique.mockResolvedValue(mockBusinessProfile);

      const result = await service.findOne(1);

      expect(result).not.toHaveProperty('userId');
    });
  });

  describe('update', () => {
    it('should update a business profile successfully', async () => {
      const updateDto = {
        businessName: 'Updated Beach Bar',
        description: 'Updated description for the beach bar.',
      };

      const existingProfile = { ...mockBusinessProfile };
      const updatedProfile = { ...mockBusinessProfile, ...updateDto };

      mockPrismaService.businessProfile.findUnique.mockResolvedValue(existingProfile);
      mockPrismaService.businessProfile.update.mockResolvedValue(updatedProfile);
      mockPrismaService.businessProfileChange.createMany.mockResolvedValue({ count: 1 });

      const result = await service.update(1, 100, updateDto);

      expect(result.message).toBe('Business profile updated successfully!');
      expect(result.profile.businessName).toBe('Updated Beach Bar');
      expect(mockPrismaService.businessProfileChange.createMany).toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating non-existent profile', async () => {
      mockPrismaService.businessProfile.findUnique.mockResolvedValue(null);

      await expect(service.update(999, 100, { businessName: 'New Name' })).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException when user does not own profile', async () => {
      mockPrismaService.businessProfile.findUnique.mockResolvedValue({
        ...mockBusinessProfile,
        userId: 200, // Different user
      });

      await expect(service.update(1, 100, { businessName: 'New Name' })).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should unset other primary businesses when setting isPrimary to true', async () => {
      const updateDto = { isPrimary: true };

      mockPrismaService.businessProfile.findUnique.mockResolvedValue(mockBusinessProfile);
      mockPrismaService.businessProfile.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.businessProfile.update.mockResolvedValue(mockBusinessProfile);

      await service.update(1, 100, updateDto);

      expect(mockPrismaService.businessProfile.updateMany).toHaveBeenCalledWith({
        where: { userId: 100, id: { not: 1 }, isPrimary: true },
        data: { isPrimary: false },
      });
    });

    it('should track changes in audit log', async () => {
      const updateDto = {
        businessName: 'New Name',
        description: 'New description',
      };

      mockPrismaService.businessProfile.findUnique.mockResolvedValue(mockBusinessProfile);
      mockPrismaService.businessProfile.update.mockResolvedValue({
        ...mockBusinessProfile,
        ...updateDto,
      });
      mockPrismaService.businessProfileChange.createMany.mockResolvedValue({ count: 2 });

      await service.update(1, 100, updateDto);

      expect(mockPrismaService.businessProfileChange.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            businessProfileId: 1,
            changedField: 'businessName',
            oldValue: 'Sunset Beach Bar',
            newValue: 'New Name',
            changedBy: 100,
          }),
        ]),
      });
    });
  });

  describe('remove', () => {
    it('should delete a business profile successfully', async () => {
      const profileWithNoActiveJobs = {
        ...mockBusinessProfile,
        jobPostings: [],
      };

      mockPrismaService.businessProfile.findUnique.mockResolvedValue(profileWithNoActiveJobs);
      mockPrismaService.businessProfile.delete.mockResolvedValue(mockBusinessProfile);

      const result = await service.remove(1, 100);

      expect(result.message).toBe('Business profile deleted successfully!');
      expect(mockPrismaService.businessProfile.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException when deleting non-existent profile', async () => {
      mockPrismaService.businessProfile.findUnique.mockResolvedValue(null);

      await expect(service.remove(999, 100)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own profile', async () => {
      mockPrismaService.businessProfile.findUnique.mockResolvedValue({
        ...mockBusinessProfile,
        userId: 200, // Different user
      });

      await expect(service.remove(1, 100)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when profile has active job postings', async () => {
      const profileWithActiveJobs = {
        ...mockBusinessProfile,
        jobPostings: [
          { id: 1, status: 'ACTIVE' },
          { id: 2, status: 'DRAFT' },
        ],
      };

      mockPrismaService.businessProfile.findUnique.mockResolvedValue(profileWithActiveJobs);

      await expect(service.remove(1, 100)).rejects.toThrow(BadRequestException);
      await expect(service.remove(1, 100)).rejects.toThrow(
        'Cannot delete this business profile because it has active job postings'
      );
    });

    it('should allow deletion when profile has only closed job postings', async () => {
      const profileWithClosedJobs = {
        ...mockBusinessProfile,
        jobPostings: [
          { id: 1, status: 'CLOSED' },
          { id: 2, status: 'FILLED' },
        ],
      };

      mockPrismaService.businessProfile.findUnique.mockResolvedValue(profileWithClosedJobs);
      mockPrismaService.businessProfile.delete.mockResolvedValue(mockBusinessProfile);

      const result = await service.remove(1, 100);

      expect(result.message).toBe('Business profile deleted successfully!');
    });
  });

  describe('calculatePrestigeLevel', () => {
    it('should return BRONZE for low reviews or rating', () => {
      expect(service.calculatePrestigeLevel(3, 3.5)).toBe(PrestigeLevel.BRONZE);
      expect(service.calculatePrestigeLevel(10, 3.8)).toBe(PrestigeLevel.BRONZE);
      expect(service.calculatePrestigeLevel(0, 0)).toBe(PrestigeLevel.BRONZE);
    });

    it('should return SILVER for 5-9 reviews with 4.0-4.4 rating', () => {
      expect(service.calculatePrestigeLevel(5, 4.0)).toBe(PrestigeLevel.SILVER);
      expect(service.calculatePrestigeLevel(7, 4.2)).toBe(PrestigeLevel.SILVER);
      expect(service.calculatePrestigeLevel(9, 4.4)).toBe(PrestigeLevel.SILVER);
    });

    it('should return GOLD for 10-24 reviews with 4.5-4.7 rating', () => {
      expect(service.calculatePrestigeLevel(10, 4.5)).toBe(PrestigeLevel.GOLD);
      expect(service.calculatePrestigeLevel(15, 4.6)).toBe(PrestigeLevel.GOLD);
      expect(service.calculatePrestigeLevel(24, 4.7)).toBe(PrestigeLevel.GOLD);
    });

    it('should return PLATINUM for 25+ reviews with 4.8+ rating', () => {
      expect(service.calculatePrestigeLevel(25, 4.8)).toBe(PrestigeLevel.PLATINUM);
      expect(service.calculatePrestigeLevel(50, 4.9)).toBe(PrestigeLevel.PLATINUM);
      expect(service.calculatePrestigeLevel(100, 5.0)).toBe(PrestigeLevel.PLATINUM);
    });

    it('should return BRONZE as default for edge cases', () => {
      expect(service.calculatePrestigeLevel(5, 4.5)).toBe(PrestigeLevel.BRONZE);
      expect(service.calculatePrestigeLevel(10, 4.4)).toBe(PrestigeLevel.BRONZE);
    });
  });

  describe('hasGoodEmployerBadge', () => {
    it('should return true for 10+ reviews with 4.5+ rating', () => {
      expect(service.hasGoodEmployerBadge(10, 4.5)).toBe(true);
      expect(service.hasGoodEmployerBadge(25, 4.8)).toBe(true);
      expect(service.hasGoodEmployerBadge(100, 5.0)).toBe(true);
    });

    it('should return false for less than 10 reviews', () => {
      expect(service.hasGoodEmployerBadge(9, 4.8)).toBe(false);
      expect(service.hasGoodEmployerBadge(5, 5.0)).toBe(false);
      expect(service.hasGoodEmployerBadge(0, 0)).toBe(false);
    });

    it('should return false for rating below 4.5', () => {
      expect(service.hasGoodEmployerBadge(10, 4.4)).toBe(false);
      expect(service.hasGoodEmployerBadge(15, 4.0)).toBe(false);
      expect(service.hasGoodEmployerBadge(20, 3.5)).toBe(false);
    });
  });

  describe('updatePrestigeMetrics', () => {
    it('should update prestige metrics based on reviews', async () => {
      const mockReviews = [
        { overallRating: 5 },
        { overallRating: 4 },
        { overallRating: 5 },
        { overallRating: 4 },
        { overallRating: 5 },
      ];

      mockPrismaService.review.findMany.mockResolvedValue(mockReviews);
      mockPrismaService.businessProfile.update.mockResolvedValue(mockBusinessProfile);

      const result = await service.updatePrestigeMetrics(1);

      expect(result.totalReviews).toBe(5);
      expect(result.averageRating).toBe(4.4);
      expect(result.prestigeLevel).toBe(PrestigeLevel.BRONZE);
      expect(result.hasGoodEmployerBadge).toBe(false);
      expect(mockPrismaService.businessProfile.update).toHaveBeenCalled();
    });

    it('should handle zero reviews gracefully', async () => {
      mockPrismaService.review.findMany.mockResolvedValue([]);
      mockPrismaService.businessProfile.update.mockResolvedValue(mockBusinessProfile);

      const result = await service.updatePrestigeMetrics(1);

      expect(result.totalReviews).toBe(0);
      expect(result.averageRating).toBe(0);
      expect(result.prestigeLevel).toBe(PrestigeLevel.BRONZE);
    });

    it('should calculate PLATINUM level for excellent reviews', async () => {
      const mockReviews = Array(30).fill({ overallRating: 5 });

      mockPrismaService.review.findMany.mockResolvedValue(mockReviews);
      mockPrismaService.businessProfile.update.mockResolvedValue(mockBusinessProfile);

      const result = await service.updatePrestigeMetrics(1);

      expect(result.totalReviews).toBe(30);
      expect(result.averageRating).toBe(5.0);
      expect(result.prestigeLevel).toBe(PrestigeLevel.PLATINUM);
      expect(result.hasGoodEmployerBadge).toBe(true);
    });
  });

  describe('sanitizeProfile', () => {
    it('should remove userId from profile', () => {
      const profile = {
        ...mockBusinessProfile,
        userId: 100,
      };

      const result = (service as any).sanitizeProfile(profile);

      expect(result).not.toHaveProperty('userId');
      expect(result).toHaveProperty('businessName');
    });
  });

  describe('toCamelCase', () => {
    it('should convert snake_case to camelCase', () => {
      expect((service as any).toCamelCase('business_name')).toBe('businessName');
      expect((service as any).toCamelCase('location_city')).toBe('locationCity');
      expect((service as any).toCamelCase('contact_email')).toBe('contactEmail');
      expect((service as any).toCamelCase('is_primary')).toBe('isPrimary');
    });
  });
});
