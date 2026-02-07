import { Test, TestingModule } from '@nestjs/testing';
import { PhotoUploadService } from '../../src/main/business/services/photo-upload.service';
import { PrismaService } from '../../src/database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import * as sharp from 'sharp';

// Mock AWS S3
jest.mock('aws-sdk');
// Mock Sharp
jest.mock('sharp');

describe('PhotoUploadService', () => {
  let service: PhotoUploadService;
  let prismaService: PrismaService;
  let configService: ConfigService;
  let s3Mock: any;

  const mockPrismaService = {
    businessProfile: {
      findUnique: jest.fn(),
    },
    businessPhoto: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        AWS_ACCESS_KEY_ID: 'test-access-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret-key',
        AWS_REGION: 'eu-west-1',
        AWS_S3_BUSINESS_PHOTOS_BUCKET: 'test-bucket',
        CDN_DOMAIN: 'https://test-cdn.cloudfront.net',
      };
      return config[key] || defaultValue;
    }),
  };

  const mockBusinessProfile = {
    id: 1,
    userId: 100,
    businessName: 'Sunset Beach Bar',
    photos: [],
  };

  const mockPhoto = {
    id: 1,
    businessProfileId: 1,
    fileName: 'photo.jpg',
    fileUrl: 'https://test-cdn.cloudfront.net/standard.jpg',
    thumbnailUrl: 'https://test-cdn.cloudfront.net/thumb.jpg',
    fileSizeBytes: 1024000,
    width: 1200,
    height: 800,
    uploadOrder: 0,
    isPrimary: true,
  };

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup S3 mock
    s3Mock = {
      getSignedUrlPromise: jest.fn(),
      putObject: jest.fn().mockReturnThis(),
      getObject: jest.fn().mockReturnThis(),
      deleteObject: jest.fn().mockReturnThis(),
      promise: jest.fn(),
    };

    (AWS.S3 as jest.Mock).mockImplementation(() => s3Mock);

    // Setup Sharp mock
    const mockSharpInstance = {
      resize: jest.fn().mockReturnThis(),
      jpeg: jest.fn().mockReturnThis(),
      toBuffer: jest.fn(),
      metadata: jest.fn().mockResolvedValue({
        width: 1200,
        height: 800,
      }),
    };

    (sharp as any).mockImplementation(() => mockSharpInstance);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhotoUploadService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PhotoUploadService>(PhotoUploadService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('generatePresignedUploadUrl', () => {
    it('should generate presigned URL successfully', async () => {
      const presignedUrl = 'https://s3.amazonaws.com/test-bucket/presigned-url';
      s3Mock.getSignedUrlPromise.mockResolvedValue(presignedUrl);

      mockPrismaService.businessProfile.findUnique.mockResolvedValue(mockBusinessProfile);

      const result = await service.generatePresignedUploadUrl(1, 'photo.jpg', 'image/jpeg', 100);

      expect(result).toHaveProperty('uploadUrl');
      expect(result).toHaveProperty('fileKey');
      expect(result).toHaveProperty('expiresIn');
      expect(result.uploadUrl).toBe(presignedUrl);
      expect(result.expiresIn).toBe(900);
    });

    it('should throw NotFoundException when business profile does not exist', async () => {
      mockPrismaService.businessProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.generatePresignedUploadUrl(999, 'photo.jpg', 'image/jpeg', 100)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own profile', async () => {
      const otherUserProfile = { ...mockBusinessProfile, userId: 200 };
      mockPrismaService.businessProfile.findUnique.mockResolvedValue(otherUserProfile);

      await expect(
        service.generatePresignedUploadUrl(1, 'photo.jpg', 'image/jpeg', 100)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when photo limit reached (10 photos)', async () => {
      const profileWith10Photos = {
        ...mockBusinessProfile,
        photos: Array(10).fill({ id: 1 }),
      };
      mockPrismaService.businessProfile.findUnique.mockResolvedValue(profileWith10Photos);

      await expect(
        service.generatePresignedUploadUrl(1, 'photo.jpg', 'image/jpeg', 100)
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.generatePresignedUploadUrl(1, 'photo.jpg', 'image/jpeg', 100)
      ).rejects.toThrow('Maximum limit of 10 photos reached');
    });

    it('should throw BadRequestException for invalid file type', async () => {
      mockPrismaService.businessProfile.findUnique.mockResolvedValue(mockBusinessProfile);

      await expect(
        service.generatePresignedUploadUrl(1, 'document.pdf', 'application/pdf', 100)
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.generatePresignedUploadUrl(1, 'document.pdf', 'application/pdf', 100)
      ).rejects.toThrow('Invalid file type. Only JPEG, PNG, and WEBP are allowed');
    });

    it('should accept valid file types', async () => {
      s3Mock.getSignedUrlPromise.mockResolvedValue('https://s3.amazonaws.com/test-bucket/presigned-url');
      mockPrismaService.businessProfile.findUnique.mockResolvedValue(mockBusinessProfile);

      await expect(
        service.generatePresignedUploadUrl(1, 'photo.jpg', 'image/jpeg', 100)
      ).resolves.toBeDefined();
      await expect(
        service.generatePresignedUploadUrl(1, 'photo.png', 'image/png', 100)
      ).resolves.toBeDefined();
      await expect(
        service.generatePresignedUploadUrl(1, 'photo.webp', 'image/webp', 100)
      ).resolves.toBeDefined();
    });
  });

  describe('confirmPhotoUpload', () => {
    const mockImageBuffer = Buffer.from('mock-image-data');

    beforeEach(() => {
      // Setup S3 getObject mock
      s3Mock.getObject.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Body: mockImageBuffer,
        }),
      });

      // Setup S3 putObject mock
      s3Mock.putObject.mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      // Setup S3 deleteObject mock
      s3Mock.deleteObject.mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });
    });

    it('should confirm photo upload and process image successfully', async () => {
      mockPrismaService.businessProfile.findUnique.mockResolvedValue(mockBusinessProfile);
      mockPrismaService.businessPhoto.create.mockResolvedValue(mockPhoto);

      const result = await service.confirmPhotoUpload(1, 'business-profiles/1/photos/photo.jpg', 100);

      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Photo uploaded and processed successfully!');
      expect(result.photo).toHaveProperty('id');
      expect(result.photo).toHaveProperty('fileUrl');
      expect(result.photo).toHaveProperty('thumbnailUrl');
    });

    it('should set first photo as primary', async () => {
      const profileWithNoPhotos = { ...mockBusinessProfile, photos: [] };
      mockPrismaService.businessProfile.findUnique.mockResolvedValue(profileWithNoPhotos);
      mockPrismaService.businessPhoto.create.mockResolvedValue({
        ...mockPhoto,
        isPrimary: true,
      });

      await service.confirmPhotoUpload(1, 'business-profiles/1/photos/photo.jpg', 100);

      expect(mockPrismaService.businessPhoto.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isPrimary: true,
          }),
        })
      );
    });

    it('should not set subsequent photos as primary', async () => {
      const profileWithPhoto = {
        ...mockBusinessProfile,
        photos: [{ id: 1, uploadOrder: 0 }],
      };
      mockPrismaService.businessProfile.findUnique.mockResolvedValue(profileWithPhoto);
      mockPrismaService.businessPhoto.create.mockResolvedValue({
        ...mockPhoto,
        isPrimary: false,
        uploadOrder: 1,
      });

      await service.confirmPhotoUpload(1, 'business-profiles/1/photos/photo.jpg', 100);

      expect(mockPrismaService.businessPhoto.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isPrimary: false,
            uploadOrder: 1,
          }),
        })
      );
    });

    it('should throw BadRequestException for small image dimensions', async () => {
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue({
          width: 300,
          height: 200,
        }),
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn(),
      };

      (sharp as any).mockImplementation(() => mockSharpInstance);

      mockPrismaService.businessProfile.findUnique.mockResolvedValue(mockBusinessProfile);

      await expect(
        service.confirmPhotoUpload(1, 'business-profiles/1/photos/photo.jpg', 100)
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.confirmPhotoUpload(1, 'business-profiles/1/photos/photo.jpg', 100)
      ).rejects.toThrow('Image dimensions must be at least 400x400 pixels');
    });

    it('should throw BadRequestException for large image dimensions', async () => {
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue({
          width: 9000,
          height: 9000,
        }),
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn(),
      };

      (sharp as any).mockImplementation(() => mockSharpInstance);

      mockPrismaService.businessProfile.findUnique.mockResolvedValue(mockBusinessProfile);

      await expect(
        service.confirmPhotoUpload(1, 'business-profiles/1/photos/photo.jpg', 100)
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.confirmPhotoUpload(1, 'business-profiles/1/photos/photo.jpg', 100)
      ).rejects.toThrow('Image dimensions cannot exceed 8000x8000 pixels');
    });

    it('should throw BadRequestException for file size exceeding 5MB', async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB

      s3Mock.getObject.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Body: largeBuffer,
        }),
      });

      mockPrismaService.businessProfile.findUnique.mockResolvedValue(mockBusinessProfile);

      await expect(
        service.confirmPhotoUpload(1, 'business-profiles/1/photos/photo.jpg', 100)
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.confirmPhotoUpload(1, 'business-profiles/1/photos/photo.jpg', 100)
      ).rejects.toThrow('File size cannot exceed 5MB');
    });

    it('should clean up uploaded file on processing failure', async () => {
      s3Mock.getObject.mockImplementation(() => {
        throw new Error('Processing failed');
      });

      mockPrismaService.businessProfile.findUnique.mockResolvedValue(mockBusinessProfile);

      await expect(
        service.confirmPhotoUpload(1, 'business-profiles/1/photos/photo.jpg', 100)
      ).rejects.toThrow();

      // Verify cleanup was called
      expect(s3Mock.deleteObject).toHaveBeenCalled();
    });
  });

  describe('deletePhoto', () => {
    it('should delete photo successfully', async () => {
      const profileWithPhoto = {
        ...mockBusinessProfile,
        photos: [mockPhoto],
      };

      mockPrismaService.businessProfile.findUnique.mockResolvedValue(profileWithPhoto);
      mockPrismaService.businessPhoto.count.mockResolvedValue(2); // More than 1 photo
      mockPrismaService.businessPhoto.delete.mockResolvedValue(mockPhoto);
      mockPrismaService.businessPhoto.findFirst.mockResolvedValue(null);

      const result = await service.deletePhoto(1, 1, 100);

      expect(result.message).toBe('Photo deleted successfully!');
      expect(s3Mock.deleteObject).toHaveBeenCalledTimes(2); // Original + thumbnail
      expect(mockPrismaService.businessPhoto.delete).toHaveBeenCalled();
    });

    it('should throw BadRequestException when deleting only photo', async () => {
      const profileWithOnePhoto = {
        ...mockBusinessProfile,
        photos: [mockPhoto],
      };

      mockPrismaService.businessProfile.findUnique.mockResolvedValue(profileWithOnePhoto);
      mockPrismaService.businessPhoto.count.mockResolvedValue(1);

      await expect(service.deletePhoto(1, 1, 100)).rejects.toThrow(BadRequestException);
      await expect(service.deletePhoto(1, 1, 100)).rejects.toThrow(
        'Cannot delete the only photo'
      );
    });

    it('should set next photo as primary when deleting primary photo', async () => {
      const profileWithPhoto = {
        ...mockBusinessProfile,
        photos: [{ ...mockPhoto, isPrimary: true }],
      };

      mockPrismaService.businessProfile.findUnique.mockResolvedValue(profileWithPhoto);
      mockPrismaService.businessPhoto.count.mockResolvedValue(2);
      mockPrismaService.businessPhoto.findFirst.mockResolvedValue({ id: 2 });
      mockPrismaService.businessPhoto.update.mockResolvedValue({});
      mockPrismaService.businessPhoto.delete.mockResolvedValue(mockPhoto);

      await service.deletePhoto(1, 1, 100);

      expect(mockPrismaService.businessPhoto.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { isPrimary: true },
      });
    });
  });

  describe('reorderPhotos', () => {
    it('should reorder photos successfully', async () => {
      mockPrismaService.businessProfile.findUnique.mockResolvedValue(mockBusinessProfile);
      mockPrismaService.businessPhoto.findMany.mockResolvedValue([
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ]);
      mockPrismaService.businessPhoto.update.mockResolvedValue({});

      const result = await service.reorderPhotos(1, [3, 1, 2], 100);

      expect(result.message).toBe('Photos reordered successfully!');
      expect(mockPrismaService.businessPhoto.update).toHaveBeenCalledTimes(3);
    });

    it('should throw BadRequestException when photos do not belong to profile', async () => {
      mockPrismaService.businessProfile.findUnique.mockResolvedValue(mockBusinessProfile);
      mockPrismaService.businessPhoto.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      await expect(service.reorderPhotos(1, [1, 2, 3], 100)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.reorderPhotos(1, [1, 2, 3], 100)).rejects.toThrow(
        'Some photos do not belong to this business profile'
      );
    });
  });

  describe('setPrimaryPhoto', () => {
    it('should set primary photo successfully', async () => {
      const profileWithPhotos = {
        ...mockBusinessProfile,
        photos: [{ id: 1, isPrimary: false }],
      };

      mockPrismaService.businessProfile.findUnique.mockResolvedValue(profileWithPhotos);
      mockPrismaService.businessPhoto.updateMany.mockResolvedValue({});
      mockPrismaService.businessPhoto.update.mockResolvedValue({});

      const result = await service.setPrimaryPhoto(1, 1, 100);

      expect(result.message).toBe('Primary photo set successfully!');
      expect(mockPrismaService.businessPhoto.updateMany).toHaveBeenCalledWith({
        where: { businessProfileId: 1, isPrimary: true },
        data: { isPrimary: false },
      });
      expect(mockPrismaService.businessPhoto.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isPrimary: true },
      });
    });

    it('should throw NotFoundException when photo does not exist', async () => {
      const profileWithNoPhotos = {
        ...mockBusinessProfile,
        photos: [],
      };

      mockPrismaService.businessProfile.findUnique.mockResolvedValue(profileWithNoPhotos);

      await expect(service.setPrimaryPhoto(1, 999, 100)).rejects.toThrow(NotFoundException);
    });
  });
});
