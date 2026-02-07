import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/main/app.module';
import { PrismaService } from '../../src/database/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prismaService.user.deleteMany();
    await prismaService.session.deleteMany();
    await prismaService.tosAcceptance.deleteMany();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        preferredLanguage: 'en',
        acceptTos: true,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Account created successfully');
      expect(response.body).toHaveProperty('email');
      expect(response.body.email).toBe(registerDto.email);
    });

    it('should return 409 for duplicate email', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        preferredLanguage: 'en',
        acceptTos: true,
      };

      // Create user first
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Try to create same user again
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);

      expect(response.body.message).toContain('already registered');
    });

    it('should return 400 for invalid password', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
        preferredLanguage: 'en',
        acceptTos: true,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Password does not meet requirements');
    });

    it('should return 400 when ToS is not accepted', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        preferredLanguage: 'en',
        acceptTos: false,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /auth/login', () => {
    it('should login user with valid credentials', async () => {
      // First register a user
      const registerDto = {
        email: 'login@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        preferredLanguage: 'en',
        acceptTos: true,
      };

      // Register user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Login user (skip verification for now)
      await prismaService.user.update({
        where: { email: registerDto.email },
        data: { verifiedAt: new Date() },
      });

      const loginDto = {
        email: registerDto.email,
        password: registerDto.password,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(registerDto.email);
    });

    it('should return 401 for invalid credentials', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 401 for unverified user', async () => {
      // Register but don't verify
      const registerDto = {
        email: 'unverified@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        preferredLanguage: 'en',
        acceptTos: true,
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      const loginDto = {
        email: registerDto.email,
        password: registerDto.password,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);

      expect(response.body.message).toContain('verify your email address');
    });
  });

  describe('POST /auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      // Register user to get token
      const registerDto = {
        email: 'verify@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        preferredLanguage: 'en',
        acceptTos: true,
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Get user to extract verification token
      const user = await prismaService.user.findUnique({
        where: { email: registerDto.email },
      });

      expect(user).toHaveProperty('verificationToken');

      const verifyEmailDto = {
        token: user.verificationToken,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send(verifyEmailDto)
        .expect(200);

      expect(response.body.message).toContain('Email verified successfully');

      // Verify user is actually verified
      const updatedUser = await prismaService.user.findUnique({
        where: { email: registerDto.email },
      });
      expect(updatedUser.verifiedAt).not.toBeNull();
    });

    it('should return 400 for invalid token', async () => {
      const verifyEmailDto = {
        token: 'invalid-token',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send(verifyEmailDto)
        .expect(400);

      expect(response.body.message).toContain('Invalid');
    });
  });

  describe('POST /auth/resend-verification', () => {
    it('should resend verification email', async () => {
      // Register unverified user
      const registerDto = {
        email: 'resend@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        preferredLanguage: 'en',
        acceptTos: true,
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      const resendDto = {
        email: registerDto.email,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/resend-verification')
        .send(resendDto)
        .expect(200);

      expect(response.body.message).toContain('A new verification email has been sent');
    });

    it('should return 400 for already verified user', async () => {
      // Register and verify user
      const registerDto = {
        email: 'verified@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        preferredLanguage: 'en',
        acceptTos: true,
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Mark as verified
      await prismaService.user.update({
        where: { email: registerDto.email },
        data: { verifiedAt: new Date() },
      });

      const resendDto = {
        email: registerDto.email,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/resend-verification')
        .send(resendDto)
        .expect(400);

      expect(response.body.message).toContain('already been verified');
    });
  });

  describe('GET /auth/profile', () => {
    it('should return user profile when authenticated', async () => {
      // Register and login user
      const registerDto = {
        email: 'profile@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        preferredLanguage: 'en',
        acceptTos: true,
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Verify and login
      await prismaService.user.update({
        where: { email: registerDto.email },
        data: { verifiedAt: new Date() },
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: registerDto.email,
          password: registerDto.password,
        })
        .expect(200);

      const token = loginResponse.body.access_token;

      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body.email).toBe(registerDto.email);
      expect(response.body).toHaveProperty('firstName');
      expect(response.body).toHaveProperty('lastName');
      expect(response.body).toHaveProperty('roles');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });
  });
});