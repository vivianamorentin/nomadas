import { Test, TestingModule } from '@nestjs/testing';
import { VerificationService } from '../../src/main/business/services/verification.service';
import { PrismaService } from '../../src/database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { VerificationDocumentType, VerificationStatus } from '@prisma/client';

// Mock AWS S3
jest.mock('aws-sdk');

describe('VerificationService', () => {
  let service: VerificationService;
  let prismaService: PrismaService;
  let configService: ConfigService;
  let s3Mock: any;

  const mockPrismaService = {
    businessProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    businessVerificationDocument: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        AWS_ACCESS_KEY_ID: 'test-access-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret-key',
        AWS_REGION: 'eu-west-1',
        AWS_S3_VERIFICATION_DOCS_BUCKET: 'test-verification-bucket',
        CDN_DOMAIN: 'https://test-cdn.cloudfront.net',
      };
      return config[key] || defaultValue;
    }),
  };

  const mockBusinessProfile = {
    id: 1,
    userId: 100,
    businessName: 'Sunset Beach Bar',
    isVerified: false,
    verificationDocuments: [],
  };

  const mockVerificationDocument = {
    id: 1,
    businessProfileId: 1,
    documentType: VerificationDocumentType.BUSINESS_LICENSE,
    fileName: 'license.pdf',
    fileUrl: 'verification-documents/1/license.pdf',
    uploadDate: new Date(),
    verificationStatus: VerificationStatus.PENDING,
    rejectionReason: null,
    reviewedBy: null,
    reviewDate: null,
  };

  const mockAdminUser = {
    id: 200,
    role: 'ADMIN',
    email: 'admin@nomadshift.com',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Setup S3 mock
    s3Mock = {
      putObject: jest.fn().mockReturnThis(),
      deleteObject: jest.fn().mockReturnThis(),
      promise: jest.fn(),
    };

    (AWS.S3 as jest.Mock).mockImplementation(() => s3Mock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationService,
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

    service = module.get<VerificationService>(VerificationService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('uploadDocument', () => {
    const fileBuffer = Buffer.from('mock-pdf-content');

    it('should upload verification document successfully', async () => {
      s3Mock.putObject.mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      mockPrismaService.businessProfile.findUnique.mockResolvedValue(mockBusinessProfile);
      mockPrismaService.businessVerificationDocument.create.mockResolvedValue(
        mockVerificationDocument
      );

      const result = await service.uploadDocument(
        1,
        VerificationDocumentType.BUSINESS_LICENSE,
        'license.pdf',
        fileBuffer,
        100
      );

      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Verification document uploaded successfully!');
      expect(result.document).toHaveProperty('id');
      expect(result.document.documentType).toBe(VerificationDocumentType.BUSINESS_LICENSE);
      expect(s3Mock.putObject).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'test-verification-bucket',
          ServerSideEncryption: 'AES256',
        })
      );
    });

    it('should throw NotFoundException when business profile does not exist', async () => {
      mockPrismaService.businessProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.uploadDocument(
          999,
          VerificationDocumentType.BUSINESS_LICENSE,
          'license.pdf',
          fileBuffer,
          100
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own profile', async () => {
      const otherUserProfile = { ...mockBusinessProfile, userId: 200 };
      mockPrismaService.businessProfile.findUnique.mockResolvedValue(otherUserProfile);

      await expect(
        service.uploadDocument(
          1,
          VerificationDocumentType.BUSINESS_LICENSE,
          'license.pdf',
          fileBuffer,
          100
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when business is already verified', async () => {
      const verifiedProfile = { ...mockBusinessProfile, isVerified: true };
      mockPrismaService.businessProfile.findUnique.mockResolvedValue(verifiedProfile);

      await expect(
        service.uploadDocument(
          1,
          VerificationDocumentType.BUSINESS_LICENSE,
          'license.pdf',
          fileBuffer,
          100
        )
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.uploadDocument(
          1,
          VerificationDocumentType.BUSINESS_LICENSE,
          'license.pdf',
          fileBuffer,
          100
        )
      ).rejects.toThrow('This business is already verified');
    });

    it('should throw BadRequestException when document limit reached (3 documents)', async () => {
      const profileWith3Docs = {
        ...mockBusinessProfile,
        verificationDocuments: [
          { id: 1, verificationStatus: VerificationStatus.PENDING },
          { id: 2, verificationStatus: VerificationStatus.PENDING },
          { id: 3, verificationStatus: VerificationStatus.APPROVED },
        ],
      };
      mockPrismaService.businessProfile.findUnique.mockResolvedValue(profileWith3Docs);

      await expect(
        service.uploadDocument(
          1,
          VerificationDocumentType.BUSINESS_LICENSE,
          'license.pdf',
          fileBuffer,
          100
        )
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.uploadDocument(
          1,
          VerificationDocumentType.BUSINESS_LICENSE,
          'license.pdf',
          fileBuffer,
          100
        )
      ).rejects.toThrow('Maximum limit of 3 verification documents reached');
    });

    it('should throw BadRequestException for invalid file type', async () => {
      mockPrismaService.businessProfile.findUnique.mockResolvedValue(mockBusinessProfile);

      await expect(
        service.uploadDocument(
          1,
          VerificationDocumentType.BUSINESS_LICENSE,
          'document.docx',
          fileBuffer,
          100
        )
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.uploadDocument(
          1,
          VerificationDocumentType.BUSINESS_LICENSE,
          'document.docx',
          fileBuffer,
          100
        )
      ).rejects.toThrow('Invalid file type. Only PDF, JPEG, and PNG are allowed');
    });

    it('should accept PDF file type', async () => {
      s3Mock.putObject.mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      mockPrismaService.businessProfile.findUnique.mockResolvedValue(mockBusinessProfile);
      mockPrismaService.businessVerificationDocument.create.mockResolvedValue(
        mockVerificationDocument
      );

      await expect(
        service.uploadDocument(
          1,
          VerificationDocumentType.BUSINESS_LICENSE,
          'license.pdf',
          fileBuffer,
          100
        )
      ).resolves.toBeDefined();
    });

    it('should accept JPEG file type', async () => {
      s3Mock.putObject.mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      mockPrismaService.businessProfile.findUnique.mockResolvedValue(mockBusinessProfile);
      mockPrismaService.businessVerificationDocument.create.mockResolvedValue(
        mockVerificationDocument
      );

      await expect(
        service.uploadDocument(
          1,
          VerificationDocumentType.BUSINESS_LICENSE,
          'license.jpg',
          fileBuffer,
          100
        )
      ).resolves.toBeDefined();
    });

    it('should accept PNG file type', async () => {
      s3Mock.putObject.mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      mockPrismaService.businessProfile.findUnique.mockResolvedValue(mockBusinessProfile);
      mockPrismaService.businessVerificationDocument.create.mockResolvedValue(
        mockVerificationDocument
      );

      await expect(
        service.uploadDocument(
          1,
          VerificationDocumentType.BUSINESS_LICENSE,
          'license.png',
          fileBuffer,
          100
        )
      ).resolves.toBeDefined();
    });

    it('should throw BadRequestException for file size exceeding 10MB', async () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

      mockPrismaService.businessProfile.findUnique.mockResolvedValue(mockBusinessProfile);

      await expect(
        service.uploadDocument(
          1,
          VerificationDocumentType.BUSINESS_LICENSE,
          'license.pdf',
          largeBuffer,
          100
        )
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.uploadDocument(
          1,
          VerificationDocumentType.BUSINESS_LICENSE,
          'license.pdf',
          largeBuffer,
          100
        )
      ).rejects.toThrow('File size cannot exceed 10MB');
    });
  });

  describe('getVerificationStatus', () => {
    it('should return verification status for business profile', async () => {
      const profileWithDocs = {
        ...mockBusinessProfile,
        verificationDocuments: [mockVerificationDocument],
      };

      mockPrismaService.businessProfile.findUnique.mockResolvedValue(profileWithDocs);

      const result = await service.getVerificationStatus(1);

      expect(result).toHaveProperty('isVerified');
      expect(result).toHaveProperty('documents');
      expect(Array.isArray(result.documents)).toBe(true);
      expect(result.documents).toHaveLength(1);
    });

    it('should throw NotFoundException when business profile does not exist', async () => {
      mockPrismaService.businessProfile.findUnique.mockResolvedValue(null);

      await expect(service.getVerificationStatus(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own profile', async () => {
      const otherUserProfile = { ...mockBusinessProfile, userId: 200 };
      mockPrismaService.businessProfile.findUnique.mockResolvedValue(otherUserProfile);

      await expect(service.getVerificationStatus(1, 100)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should return status without ownership check when userId is not provided', async () => {
      mockPrismaService.businessProfile.findUnique.mockResolvedValue(mockBusinessProfile);

      await expect(service.getVerificationStatus(1)).resolves.toBeDefined();
    });
  });

  describe('approveVerification', () => {
    it('should approve verification document successfully', async () => {
      const documentWithProfile = {
        ...mockVerificationDocument,
        businessProfile: mockBusinessProfile,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrismaService.businessVerificationDocument.findUnique.mockResolvedValue(
        documentWithProfile
      );
      mockPrismaService.businessVerificationDocument.update.mockResolvedValue({});
      mockPrismaService.businessProfile.update.mockResolvedValue({});

      const result = await service.approveVerification(1, 200);

      expect(result.message).toBe('Verification approved successfully!');
      expect(result.businessProfileId).toBe(1);
      expect(mockPrismaService.businessVerificationDocument.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          verificationStatus: VerificationStatus.APPROVED,
          reviewedBy: 200,
          reviewDate: expect.any(Date),
        },
      });
      expect(mockPrismaService.businessProfile.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isVerified: true },
      });
    });

    it('should throw ForbiddenException when user is not admin', async () => {
      const regularUser = { ...mockAdminUser, role: 'BUSINESS_OWNER' };
      mockPrismaService.user.findUnique.mockResolvedValue(regularUser);

      await expect(service.approveVerification(1, 200)).rejects.toThrow(ForbiddenException);
      await expect(service.approveVerification(1, 200)).rejects.toThrow(
        'Only administrators can approve verifications'
      );
    });

    it('should throw ForbiddenException when admin user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.approveVerification(1, 200)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when document does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrismaService.businessVerificationDocument.findUnique.mockResolvedValue(null);

      await expect(service.approveVerification(999, 200)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when document is already approved', async () => {
      const approvedDocument = {
        ...mockVerificationDocument,
        verificationStatus: VerificationStatus.APPROVED,
        businessProfile: mockBusinessProfile,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrismaService.businessVerificationDocument.findUnique.mockResolvedValue(
        approvedDocument
      );

      await expect(service.approveVerification(1, 200)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.approveVerification(1, 200)).rejects.toThrow(
        'This document is already approved'
      );
    });
  });

  describe('rejectVerification', () => {
    it('should reject verification document successfully', async () => {
      const documentWithProfile = {
        ...mockVerificationDocument,
        businessProfile: mockBusinessProfile,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrismaService.businessVerificationDocument.findUnique.mockResolvedValue(
        documentWithProfile
      );
      mockPrismaService.businessVerificationDocument.update.mockResolvedValue({});

      const result = await service.rejectVerification(1, 'Invalid document', 200);

      expect(result.message).toBe('Verification rejected successfully!');
      expect(result.businessProfileId).toBe(1);
      expect(mockPrismaService.businessVerificationDocument.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          verificationStatus: VerificationStatus.REJECTED,
          reviewedBy: 200,
          reviewDate: expect.any(Date),
          rejectionReason: 'Invalid document',
        },
      });
    });

    it('should throw BadRequestException when rejection reason is empty', async () => {
      await expect(service.rejectVerification(1, '', 200)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.rejectVerification(1, '', 200)).rejects.toThrow(
        'Rejection reason is required'
      );

      await expect(service.rejectVerification(1, '   ', 200)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException when document is already approved', async () => {
      const approvedDocument = {
        ...mockVerificationDocument,
        verificationStatus: VerificationStatus.APPROVED,
        businessProfile: mockBusinessProfile,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrismaService.businessVerificationDocument.findUnique.mockResolvedValue(
        approvedDocument
      );

      await expect(
        service.rejectVerification(1, 'Invalid', 200)
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.rejectVerification(1, 'Invalid', 200)
      ).rejects.toThrow('Cannot reject an already approved document');
    });
  });

  describe('getPendingVerifications', () => {
    it('should return pending verifications for admin', async () => {
      const pendingDocuments = [
        {
          ...mockVerificationDocument,
          businessProfile: mockBusinessProfile,
        },
      ];

      mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrismaService.businessVerificationDocument.findMany.mockResolvedValue(
        pendingDocuments
      );

      const result = await service.getPendingVerifications(200);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('businessProfile');
    });

    it('should throw ForbiddenException when user is not admin', async () => {
      const regularUser = { ...mockAdminUser, role: 'BUSINESS_OWNER' };
      mockPrismaService.user.findUnique.mockResolvedValue(regularUser);

      await expect(service.getPendingVerifications(200)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should return empty array when no pending verifications', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrismaService.businessVerificationDocument.findMany.mockResolvedValue([]);

      const result = await service.getPendingVerifications(200);

      expect(result).toEqual([]);
    });
  });

  describe('deleteDocument', () => {
    it('should delete verification document successfully', async () => {
      const documentWithProfile = {
        ...mockVerificationDocument,
        businessProfile: mockBusinessProfile,
      };

      s3Mock.deleteObject.mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      mockPrismaService.businessVerificationDocument.findUnique.mockResolvedValue(
        documentWithProfile
      );
      mockPrismaService.businessVerificationDocument.delete.mockResolvedValue({});

      const result = await service.deleteDocument(1, 100);

      expect(result.message).toBe('Verification document deleted successfully!');
      expect(s3Mock.deleteObject).toHaveBeenCalled();
      expect(mockPrismaService.businessVerificationDocument.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException when document does not exist', async () => {
      mockPrismaService.businessVerificationDocument.findUnique.mockResolvedValue(null);

      await expect(service.deleteDocument(999, 100)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own document', async () => {
      const otherProfile = { ...mockBusinessProfile, userId: 200 };
      const documentWithOtherProfile = {
        ...mockVerificationDocument,
        businessProfile: otherProfile,
      };

      mockPrismaService.businessVerificationDocument.findUnique.mockResolvedValue(
        documentWithOtherProfile
      );

      await expect(service.deleteDocument(1, 100)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when trying to delete approved document', async () => {
      const approvedDocument = {
        ...mockVerificationDocument,
        verificationStatus: VerificationStatus.APPROVED,
        businessProfile: mockBusinessProfile,
      };

      mockPrismaService.businessVerificationDocument.findUnique.mockResolvedValue(
        approvedDocument
      );

      await expect(service.deleteDocument(1, 100)).rejects.toThrow(BadRequestException);
      await expect(service.deleteDocument(1, 100)).rejects.toThrow(
        'Cannot delete an approved verification document'
      );
    });
  });

  describe('getFileType', () => {
    it('should return correct MIME type for PDF', () => {
      expect((service as any).getFileType('document.pdf')).toBe('application/pdf');
    });

    it('should return correct MIME type for JPG', () => {
      expect((service as any).getFileType('photo.jpg')).toBe('image/jpeg');
      expect((service as any).getFileType('photo.jpeg')).toBe('image/jpeg');
    });

    it('should return correct MIME type for PNG', () => {
      expect((service as any).getFileType('photo.png')).toBe('image/png');
    });

    it('should return octet-stream for unknown extensions', () => {
      expect((service as any).getFileType('document.docx')).toBe(
        'application/octet-stream'
      );
    });

    it('should handle uppercase extensions', () => {
      expect((service as any).getFileType('document.PDF')).toBe('application/pdf');
      expect((service as any).getFileType('photo.JPG')).toBe('image/jpeg');
      expect((service as any).getFileType('photo.PNG')).toBe('image/png');
    });
  });
});
