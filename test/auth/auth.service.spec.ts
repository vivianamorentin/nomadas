import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/main/identity/auth.service';
import { PrismaService } from '../../src/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    passwordHash: 'hashedpassword',
    firstName: 'John',
    lastName: 'Doe',
    verifiedAt: new Date(),
    preferredLanguage: 'en',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useFactory: () => ({
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              deleteMany: jest.fn(),
            },
            tosAcceptance: {
              create: jest.fn(),
            },
            session: {
              create: jest.fn(),
            },
            userRoles: {
              create: jest.fn(),
            },
          }),
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      const password = 'Password123!';
      const hashedPassword = await bcrypt.hash(password, 12);

      prismaService.user.findUnique = jest.fn().mockResolvedValue({
        ...mockUser,
        passwordHash: hashedPassword,
        verifiedAt: new Date(),
        userRoles: [{ role: 'BUSINESS_OWNER' }],
      });

      const result = await authService.validateUser('test@example.com', password);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        roles: ['BUSINESS_OWNER'],
      });
    });

    it('should throw error for invalid password', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue({
        ...mockUser,
        passwordHash: await bcrypt.hash('correctPassword', 12),
        verifiedAt: new Date(),
        userRoles: [],
      });

      await expect(
        authService.validateUser('test@example.com', 'wrongPassword')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for unverified user', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue({
        ...mockUser,
        verifiedAt: null,
        userRoles: [],
      });

      await expect(
        authService.validateUser('test@example.com', 'Password123!')
      ).rejects.toThrow('Please verify your email address before logging in');
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        preferredLanguage: 'en',
        acceptTos: true,
      };

      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);
      prismaService.$transaction = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          user: {
            create: jest.fn().mockResolvedValue({
              id: uuidv4(),
              ...registerDto,
              passwordHash: 'hashedpassword',
              verificationToken: uuidv4(),
              verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            }),
          },
          tosAcceptance: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      const result = await authService.register(registerDto);

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('email');
      expect(result.email).toBe(registerDto.email);
    });

    it('should throw error if email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        preferredLanguage: 'en',
        acceptTos: true,
      };

      prismaService.user.findUnique = jest.fn().mockResolvedValue({
        id: 'existing-id',
        email: registerDto.email,
      });

      await expect(authService.register(registerDto)).rejects.toThrow(
        'This email is already registered'
      );
    });

    it('should throw error for weak password', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
        preferredLanguage: 'en',
        acceptTos: true,
      };

      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(authService.register(registerDto)).rejects.toThrow(
        'Password does not meet requirements'
      );
    });
  });

  describe('login', () => {
    it('should login user with correct credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const userWithRoles = {
        ...mockUser,
        userRoles: [{ role: 'BUSINESS_OWNER' }],
      };

      prismaService.user.findUnique = jest.fn().mockResolvedValue(userWithRoles);
      prismaService.session.create = jest.fn().mockResolvedValue({
        id: uuidv4(),
      });
      jwtService.sign = jest.fn().mockReturnValue('test-token');

      const result = await authService.login(loginDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('expiresIn');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(loginDto.email);
      expect(result.user.roles).toContain('BUSINESS_OWNER');
    });

    it('should throw error for unverified user', async () => {
      const loginDto = {
        email: 'unverified@example.com',
        password: 'Password123!',
      };

      prismaService.user.findUnique = jest.fn().mockResolvedValue({
        ...mockUser,
        verifiedAt: null,
        userRoles: [],
      });

      await expect(authService.login(loginDto)).rejects.toThrow(
        'Please verify your email address'
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      const verifyEmailDto = {
        token: uuidv4(),
      };

      const userWithToken = {
        ...mockUser,
        verificationToken: verifyEmailDto.token,
        verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        verifiedAt: null,
      };

      prismaService.user.findFirst = jest.fn().mockResolvedValue(userWithToken);
      prismaService.user.update = jest.fn().mockResolvedValue({
        ...userWithToken,
        verifiedAt: new Date(),
        verificationToken: null,
      });

      const result = await authService.verifyEmail(verifyEmailDto);

      expect(result).toHaveProperty('message');
      expect(result.message).toContain('Email verified successfully');
    });

    it('should throw error for expired token', async () => {
      const verifyEmailDto = {
        token: uuidv4(),
      };

      const userWithExpiredToken = {
        ...mockUser,
        verificationToken: verifyEmailDto.token,
        verificationTokenExpiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // expired
        verifiedAt: null,
      };

      prismaService.user.findFirst = jest.fn().mockResolvedValue(null);
      prismaService.user.findFirst = jest.fn().mockImplementation((query) => {
        if (query.where.verificationToken === verifyEmailDto.token) {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      });

      await expect(authService.verifyEmail(verifyEmailDto)).rejects.toThrow(
        'This verification link has expired'
      );
    });
  });

  describe('resendVerification', () => {
    it('should resend verification email for unverified user', async () => {
      const resendVerificationDto = {
        email: 'unverified@example.com',
      };

      const unverifiedUser = {
        ...mockUser,
        verifiedAt: null,
      };

      prismaService.user.findUnique = jest.fn().mockResolvedValue(unverifiedUser);
      prismaService.user.update = jest.fn().mockResolvedValue({
        ...unverifiedUser,
        verificationToken: uuidv4(),
        verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const result = await authService.resendVerification(resendVerificationDto);

      expect(result).toHaveProperty('message');
      expect(result.message).toContain('A new verification email has been sent');
    });

    it('should throw error for already verified user', async () => {
      const resendVerificationDto = {
        email: 'verified@example.com',
      };

      prismaService.user.findUnique = jest.fn().mockResolvedValue({
        ...mockUser,
        verifiedAt: new Date(),
      });

      await expect(
        authService.resendVerification(resendVerificationDto)
      ).rejects.toThrow('This email has already been verified');
    });
  });
});