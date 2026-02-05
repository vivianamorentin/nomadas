import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { BusinessStatus, PrestigeLevel } from '@prisma/client';

describe('Business Profile E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Test data
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
  let createdProfileId: number;

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

    // Setup test database
    // In real E2E tests, you'd set up a test database
    // For now, we'll use mocked data
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.businessProfile.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('POST /business-profiles', () => {
    it('should create a new business profile', async () => {
      const response = await request(app.getHttpServer())
        .post('/business-profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testBusinessProfile)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('created successfully');
      expect(response.body).toHaveProperty('profile');
      expect(response.body.profile).toHaveProperty('id');
      expect(response.body.profile.businessName).toBe(testBusinessProfile.businessName);

      createdProfileId = response.body.profile.id;
    });

    it('should throw validation error for missing required fields', async () => {
      const incompleteProfile = {
        businessName: 'Test Business',
      };

      await request(app.getHttpServer())
        .post('/business-profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteProfile)
        .expect(400);
    });

    it('should throw validation error for invalid email', async () => {
      const invalidProfile = {
        ...testBusinessProfile,
        contactEmail: 'invalid-email',
      };

      await request(app.getHttpServer())
        .post('/business-profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProfile)
        .expect(400);
    });

    it('should throw validation error for description that is too short', async () => {
      const invalidProfile = {
        ...testBusinessProfile,
        description: 'Short',
      };

      await request(app.getHttpServer())
        .post('/business-profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProfile)
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/business-profiles')
        .send(testBusinessProfile)
        .expect(401);
    });
  });

  describe('GET /business-profiles', () => {
    it('should return all business profiles for authenticated user', async () => {
      // First create a test profile
      await prisma.businessProfile.create({
        data: {
          ...testBusinessProfile,
          userId: testUser.id,
          status: BusinessStatus.ACTIVE,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/business-profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('businessName');
      expect(response.body[0]).not.toHaveProperty('userId'); // Should be sanitized
    });

    it('should return empty array when user has no profiles', async () => {
      const response = await request(app.getHttpServer())
        .get('/business-profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/business-profiles')
        .expect(401);
    });
  });

  describe('GET /business-profiles/:id', () => {
    it('should return a specific business profile', async () => {
      const profile = await prisma.businessProfile.create({
        data: {
          ...testBusinessProfile,
          userId: testUser.id,
          status: BusinessStatus.ACTIVE,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/business-profiles/${profile.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('businessName');
      expect(response.body.businessName).toBe(testBusinessProfile.businessName);
    });

    it('should throw 404 for non-existent profile', async () => {
      await request(app.getHttpServer())
        .get('/business-profiles/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should throw 403 when accessing another user profile', async () => {
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
        .get(`/business-profiles/${otherProfile.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('PATCH /business-profiles/:id', () => {
    it('should update a business profile', async () => {
      const profile = await prisma.businessProfile.create({
        data: {
          ...testBusinessProfile,
          userId: testUser.id,
          status: BusinessStatus.ACTIVE,
        },
      });

      const updateData = {
        businessName: 'Updated Beach Bar',
        description: 'An updated description for the beach bar.',
      };

      const response = await request(app.getHttpServer())
        .patch(`/business-profiles/${profile.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('updated successfully');
      expect(response.body.profile.businessName).toBe(updateData.businessName);
    });

    it('should throw 404 when updating non-existent profile', async () => {
      await request(app.getHttpServer())
        .patch('/business-profiles/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ businessName: 'New Name' })
        .expect(404);
    });

    it('should throw 403 when updating another user profile', async () => {
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
        .patch(`/business-profiles/${otherProfile.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ businessName: 'New Name' })
        .expect(403);
    });

    it('should track audit log for changed fields', async () => {
      const profile = await prisma.businessProfile.create({
        data: {
          ...testBusinessProfile,
          userId: testUser.id,
          status: BusinessStatus.ACTIVE,
        },
      });

      await request(app.getHttpServer())
        .patch(`/business-profiles/${profile.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessName: 'Updated Name',
          contactEmail: 'updated@example.com',
        })
        .expect(200);

      // Verify audit log entries were created
      const auditLogs = await prisma.businessProfileChange.findMany({
        where: { businessProfileId: profile.id },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /business-profiles/:id', () => {
    it('should delete a business profile', async () => {
      const profile = await prisma.businessProfile.create({
        data: {
          ...testBusinessProfile,
          userId: testUser.id,
          status: BusinessStatus.ACTIVE,
        },
      });

      const response = await request(app.getHttpServer())
        .delete(`/business-profiles/${profile.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted successfully');

      // Verify profile is deleted
      const deletedProfile = await prisma.businessProfile.findUnique({
        where: { id: profile.id },
      });

      expect(deletedProfile).toBeNull();
    });

    it('should throw 400 when profile has active job postings', async () => {
      const profile = await prisma.businessProfile.create({
        data: {
          ...testBusinessProfile,
          userId: testUser.id,
          status: BusinessStatus.ACTIVE,
        },
      });

      // Create active job posting
      await prisma.jobPosting.create({
        data: {
          businessId: profile.id,
          title: 'Test Job',
          description: 'Test description',
          status: 'ACTIVE',
        },
      });

      await request(app.getHttpServer())
        .delete(`/business-profiles/${profile.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should throw 403 when deleting another user profile', async () => {
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
        .delete(`/business-profiles/${otherProfile.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('POST /business-profiles/:id/prestige', () => {
    it('should update prestige metrics', async () => {
      const profile = await prisma.businessProfile.create({
        data: {
          ...testBusinessProfile,
          userId: testUser.id,
          status: BusinessStatus.ACTIVE,
          totalReviews: 10,
          averageRating: 4.5,
          prestigeLevel: PrestigeLevel.GOLD,
          hasGoodEmployerBadge: true,
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/business-profiles/${profile.id}/prestige`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('prestigeLevel');
      expect(response.body).toHaveProperty('hasGoodEmployerBadge');
      expect(response.body).toHaveProperty('totalReviews');
      expect(response.body).toHaveProperty('averageRating');
    });
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 for unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get('/business-profiles')
        .expect(401);
    });

    it('should return 401 for invalid token', async () => {
      await request(app.getHttpServer())
        .get('/business-profiles')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should allow users to access their own profiles', async () => {
      const profile = await prisma.businessProfile.create({
        data: {
          ...testBusinessProfile,
          userId: testUser.id,
          status: BusinessStatus.ACTIVE,
        },
      });

      await request(app.getHttpServer())
        .get(`/business-profiles/${profile.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Data Validation', () => {
    it('should validate business name length', async () => {
      const invalidProfile = {
        ...testBusinessProfile,
        businessName: 'A', // Too short
      };

      await request(app.getHttpServer())
        .post('/business-profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProfile)
        .expect(400);
    });

    it('should validate coordinates', async () => {
      const invalidProfile = {
        ...testBusinessProfile,
        locationLatitude: 200, // Invalid latitude
      };

      await request(app.getHttpServer())
        .post('/business-profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProfile)
        .expect(400);
    });

    it('should validate phone number format', async () => {
      const invalidProfile = {
        ...testBusinessProfile,
        contactPhone: 'invalid-phone',
      };

      // Note: This depends on your phone validation implementation
      await request(app.getHttpServer())
        .post('/business-profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProfile)
        .expect(400);
    });
  });
});
