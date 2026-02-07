import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { BusinessStatus } from '@prisma/client';

describe('Photo Upload E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testUser = {
    id: 1,
    email: 'test@example.com',
    passwordHash: 'hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    verifiedAt: new Date(),
  };

  const testBusinessProfile = {
    businessName: 'Test Beach Bar',
    businessType: 'BAR',
    description: 'A beautiful beach bar located on the coast.',
    locationAddress: '123 Beach Road',
    locationCity: 'Barcelona',
    locationCountry: 'Spain',
    locationPostalCode: '08001',
    locationLatitude: 41.3851,
    locationLongitude: 2.1734,
    contactEmail: 'contact@beachbar.com',
    contactPhone: '+34 931 23 45 67',
    websiteUrl: 'https://beachbar.com',
    isPrimary: true,
  };

  let authToken: string;
  let businessProfileId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.businessPhoto.deleteMany({});
    await prisma.businessProfile.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test business profile
    const profile = await prisma.businessProfile.create({
      data: {
        ...testBusinessProfile,
        userId: testUser.id,
        status: BusinessStatus.ACTIVE,
      },
    });

    businessProfileId = profile.id;
  });

  describe('POST /business-profiles/:id/photos/presigned-url', () => {
    it('should generate presigned URL for photo upload', async () => {
      const response = await request(app.getHttpServer())
        .post(`/business-profiles/${businessProfileId}/photos/presigned-url`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fileName: 'photo.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      expect(response.body).toHaveProperty('uploadUrl');
      expect(response.body).toHaveProperty('fileKey');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body.expiresIn).toBe(900);
    });

    it('should throw validation error for missing fileName', async () => {
      await request(app.getHttpServer())
        .post(`/business-profiles/${businessProfileId}/photos/presigned-url`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contentType: 'image/jpeg',
        })
        .expect(400);
    });

    it('should throw validation error for invalid file type', async () => {
      await request(app.getHttpServer())
        .post(`/business-profiles/${businessProfileId}/photos/presigned-url`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fileName: 'document.pdf',
          contentType: 'application/pdf',
        })
        .expect(400);
    });

    it('should throw 404 when business profile does not exist', async () => {
      await request(app.getHttpServer())
        .post('/business-profiles/999999/photos/presigned-url')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fileName: 'photo.jpg',
          contentType: 'image/jpeg',
        })
        .expect(404);
    });

    it('should throw 403 when user does not own profile', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          passwordHash: 'hashedpassword',
          firstName: 'Other',
          lastName: 'User',
          verifiedAt: new Date(),
        },
      });

      const otherProfile = await prisma.businessProfile.create({
        data: {
          ...testBusinessProfile,
          userId: otherUser.id,
          status: BusinessStatus.ACTIVE,
        },
      });

      await request(app.getHttpServer())
        .post(`/business-profiles/${otherProfile.id}/photos/presigned-url`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fileName: 'photo.jpg',
          contentType: 'image/jpeg',
        })
        .expect(403);
    });

    it('should throw 400 when photo limit is reached', async () => {
      // Create 10 photos
      for (let i = 0; i < 10; i++) {
        await prisma.businessPhoto.create({
          data: {
            businessProfileId,
            fileName: `photo${i}.jpg`,
            fileUrl: `https://cdn.example.com/photo${i}.jpg`,
            thumbnailUrl: `https://cdn.example.com/thumb${i}.jpg`,
            fileSizeBytes: 1024000,
            width: 1200,
            height: 800,
            uploadOrder: i,
            isPrimary: i === 0,
          },
        });
      }

      await request(app.getHttpServer())
        .post(`/business-profiles/${businessProfileId}/photos/presigned-url`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fileName: 'photo.jpg',
          contentType: 'image/jpeg',
        })
        .expect(400);
    });
  });

  describe('POST /business-profiles/:id/photos/confirm', () => {
    it('should confirm photo upload successfully', async () => {
      const response = await request(app.getHttpServer())
        .post(`/business-profiles/${businessProfileId}/photos/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fileKey: 'business-profiles/1/photos/photo.jpg',
        })
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('uploaded and processed successfully');
      expect(response.body).toHaveProperty('photo');
      expect(response.body.photo).toHaveProperty('id');
      expect(response.body.photo).toHaveProperty('fileUrl');
      expect(response.body.photo).toHaveProperty('thumbnailUrl');
    });

    it('should set first photo as primary', async () => {
      const response = await request(app.getHttpServer())
        .post(`/business-profiles/${businessProfileId}/photos/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fileKey: 'business-profiles/1/photos/photo.jpg',
        })
        .expect(201);

      expect(response.body.photo.isPrimary).toBe(true);
    });

    it('should not set subsequent photos as primary', async () => {
      // Create first photo
      await prisma.businessPhoto.create({
        data: {
          businessProfileId,
          fileName: 'photo1.jpg',
          fileUrl: 'https://cdn.example.com/photo1.jpg',
          thumbnailUrl: 'https://cdn.example.com/thumb1.jpg',
          fileSizeBytes: 1024000,
          width: 1200,
          height: 800,
          uploadOrder: 0,
          isPrimary: true,
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/business-profiles/${businessProfileId}/photos/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fileKey: 'business-profiles/1/photos/photo2.jpg',
        })
        .expect(201);

      expect(response.body.photo.isPrimary).toBe(false);
      expect(response.body.photo.uploadOrder).toBe(1);
    });

    it('should throw validation error for missing fileKey', async () => {
      await request(app.getHttpServer())
        .post(`/business-profiles/${businessProfileId}/photos/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('DELETE /business-profiles/:id/photos/:photoId', () => {
    it('should delete photo successfully', async () => {
      const photo = await prisma.businessPhoto.create({
        data: {
          businessProfileId,
          fileName: 'photo.jpg',
          fileUrl: 'https://cdn.example.com/photo.jpg',
          thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
          fileSizeBytes: 1024000,
          width: 1200,
          height: 800,
          uploadOrder: 0,
          isPrimary: true,
        },
      });

      const response = await request(app.getHttpServer())
        .delete(`/business-profiles/${businessProfileId}/photos/${photo.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should throw 400 when deleting the only photo', async () => {
      const photo = await prisma.businessPhoto.create({
        data: {
          businessProfileId,
          fileName: 'photo.jpg',
          fileUrl: 'https://cdn.example.com/photo.jpg',
          thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
          fileSizeBytes: 1024000,
          width: 1200,
          height: 800,
          uploadOrder: 0,
          isPrimary: true,
        },
      });

      await request(app.getHttpServer())
        .delete(`/business-profiles/${businessProfileId}/photos/${photo.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should set next photo as primary when deleting primary photo', async () => {
      const photo1 = await prisma.businessPhoto.create({
        data: {
          businessProfileId,
          fileName: 'photo1.jpg',
          fileUrl: 'https://cdn.example.com/photo1.jpg',
          thumbnailUrl: 'https://cdn.example.com/thumb1.jpg',
          fileSizeBytes: 1024000,
          width: 1200,
          height: 800,
          uploadOrder: 0,
          isPrimary: true,
        },
      });

      const photo2 = await prisma.businessPhoto.create({
        data: {
          businessProfileId,
          fileName: 'photo2.jpg',
          fileUrl: 'https://cdn.example.com/photo2.jpg',
          thumbnailUrl: 'https://cdn.example.com/thumb2.jpg',
          fileSizeBytes: 1024000,
          width: 1200,
          height: 800,
          uploadOrder: 1,
          isPrimary: false,
        },
      });

      await request(app.getHttpServer())
        .delete(`/business-profiles/${businessProfileId}/photos/${photo1.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify photo2 is now primary
      const updatedPhoto2 = await prisma.businessPhoto.findUnique({
        where: { id: photo2.id },
      });

      expect(updatedPhoto2.isPrimary).toBe(true);
    });

    it('should throw 403 when user does not own profile', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          passwordHash: 'hashedpassword',
          firstName: 'Other',
          lastName: 'User',
          verifiedAt: new Date(),
        },
      });

      const otherProfile = await prisma.businessProfile.create({
        data: {
          ...testBusinessProfile,
          userId: otherUser.id,
          status: BusinessStatus.ACTIVE,
        },
      });

      const photo = await prisma.businessPhoto.create({
        data: {
          businessProfileId: otherProfile.id,
          fileName: 'photo.jpg',
          fileUrl: 'https://cdn.example.com/photo.jpg',
          thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
          fileSizeBytes: 1024000,
          width: 1200,
          height: 800,
          uploadOrder: 0,
          isPrimary: true,
        },
      });

      await request(app.getHttpServer())
        .delete(`/business-profiles/${otherProfile.id}/photos/${photo.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('PATCH /business-profiles/:id/photos/reorder', () => {
    beforeEach(async () => {
      // Create multiple photos
      for (let i = 0; i < 3; i++) {
        await prisma.businessPhoto.create({
          data: {
            businessProfileId,
            fileName: `photo${i}.jpg`,
            fileUrl: `https://cdn.example.com/photo${i}.jpg`,
            thumbnailUrl: `https://cdn.example.com/thumb${i}.jpg`,
            fileSizeBytes: 1024000,
            width: 1200,
            height: 800,
            uploadOrder: i,
            isPrimary: i === 0,
          },
        });
      }
    });

    it('should reorder photos successfully', async () => {
      const photos = await prisma.businessPhoto.findMany({
        where: { businessProfileId },
        orderBy: { uploadOrder: 'asc' },
      });

      const photoIds = photos.map((p) => p.id).reverse();

      const response = await request(app.getHttpServer())
        .patch(`/business-profiles/${businessProfileId}/photos/reorder`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ photoIds })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('reordered successfully');
    });

    it('should throw validation error for missing photoIds', async () => {
      await request(app.getHttpServer())
        .patch(`/business-profiles/${businessProfileId}/photos/reorder`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });

    it('should throw validation error for non-array photoIds', async () => {
      await request(app.getHttpServer())
        .patch(`/business-profiles/${businessProfileId}/photos/reorder`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ photoIds: 'not-an-array' })
        .expect(400);
    });
  });

  describe('PATCH /business-profiles/:id/photos/:photoId/set-primary', () => {
    beforeEach(async () => {
      // Create multiple photos
      for (let i = 0; i < 3; i++) {
        await prisma.businessPhoto.create({
          data: {
            businessProfileId,
            fileName: `photo${i}.jpg`,
            fileUrl: `https://cdn.example.com/photo${i}.jpg`,
            thumbnailUrl: `https://cdn.example.com/thumb${i}.jpg`,
            fileSizeBytes: 1024000,
            width: 1200,
            height: 800,
            uploadOrder: i,
            isPrimary: i === 0,
          },
        });
      }
    });

    it('should set primary photo successfully', async () => {
      const photos = await prisma.businessPhoto.findMany({
        where: { businessProfileId },
      });

      const newPrimaryPhoto = photos[1]; // Second photo

      const response = await request(app.getHttpServer())
        .patch(`/business-profiles/${businessProfileId}/photos/${newPrimaryPhoto.id}/set-primary`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('set successfully');

      // Verify only one photo is primary
      const allPhotos = await prisma.businessPhoto.findMany({
        where: { businessProfileId, isPrimary: true },
      });

      expect(allPhotos.length).toBe(1);
      expect(allPhotos[0].id).toBe(newPrimaryPhoto.id);
    });

    it('should throw 404 when photo does not exist', async () => {
      await request(app.getHttpServer())
        .patch(`/business-profiles/${businessProfileId}/photos/999999/set-primary`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should throw 403 when user does not own profile', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          passwordHash: 'hashedpassword',
          firstName: 'Other',
          lastName: 'User',
          verifiedAt: new Date(),
        },
      });

      const otherProfile = await prisma.businessProfile.create({
        data: {
          ...testBusinessProfile,
          userId: otherUser.id,
          status: BusinessStatus.ACTIVE,
        },
      });

      const photo = await prisma.businessPhoto.create({
        data: {
          businessProfileId: otherProfile.id,
          fileName: 'photo.jpg',
          fileUrl: 'https://cdn.example.com/photo.jpg',
          thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
          fileSizeBytes: 1024000,
          width: 1200,
          height: 800,
          uploadOrder: 0,
          isPrimary: true,
        },
      });

      await request(app.getHttpServer())
        .patch(`/business-profiles/${otherProfile.id}/photos/${photo.id}/set-primary`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });
});
