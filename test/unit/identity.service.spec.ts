import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IdentityService } from '../../src/modules/identity/identity.service';
import { PrismaService } from '../../src/shared/infrastructure/database/prisma.service';
import { RedisService } from '../../src/shared/infrastructure/cache/redis.service';
import { RegisterDto } from '../../src/modules/identity/dto/register.dto';
import { LoginDto } from '../../src/modules/identity/dto/login.dto';

describe('IdentityService', () => {
  let service: IdentityService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let redis: RedisService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentityService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: RedisService,
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<IdentityService>(IdentityService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    redis = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'Password123!',
        role: 'WORKER',
      };

      const hashedPassword = await bcrypt.hash(registerDto.password, 12);

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 1,
        email: registerDto.email,
        role: registerDto.role,
        emailVerified: false,
        createdAt: new Date(),
      });
      mockJwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      mockRedis.set.mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw ConflictException if user already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'Password123!',
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: registerDto.email,
      });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const hashedPassword = await bcrypt.hash(loginDto.password, 12);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: loginDto.email,
        passwordHash: hashedPassword,
        role: 'WORKER',
        emailVerified: true,
      });
      mockJwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      mockRedis.set.mockResolvedValue(undefined);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException with invalid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      const hashedPassword = await bcrypt.hash('Password123!', 12);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: loginDto.email,
        passwordHash: hashedPassword,
      });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const refreshToken = 'valid-refresh-token';

      mockJwtService.verify.mockReturnValue({
        sub: 1,
        email: 'test@example.com',
        role: 'WORKER',
      });
      mockRedis.get.mockResolvedValue(refreshToken);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        role: 'WORKER',
      });
      mockJwtService.sign.mockReturnValueOnce('new-access-token').mockReturnValueOnce('new-refresh-token');
      mockRedis.set.mockResolvedValue(undefined);

      const result = await service.refreshToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException with invalid refresh token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('findById', () => {
    it('should return user by ID', async () => {
      const userId = 1;

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        role: 'WORKER',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.findById(userId);

      expect(result).toHaveProperty('id', userId);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: expect.any(Object),
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      const userId = 1;
      mockRedis.del.mockResolvedValue(1);

      const result = await service.logout(userId);

      expect(result).toHaveProperty('message', 'Logged out successfully');
      expect(mockRedis.del).toHaveBeenCalledWith(`refresh_token:${userId}`);
    });
  });

  describe('verifyEmail', () => {
    it('should verify user email', async () => {
      const userId = 1;

      mockPrisma.user.update.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        emailVerified: true,
      });

      const result = await service.verifyEmail(userId);

      expect(result).toHaveProperty('message', 'Email verified successfully');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { emailVerified: true },
      });
    });
  });
});
