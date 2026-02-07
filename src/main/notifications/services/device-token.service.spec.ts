import { Test, TestingModule } from '@nestjs/testing';
import { DeviceTokenService } from './device-token.service';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';
import { DevicePlatform } from '@prisma/client';

describe('DeviceTokenService', () => {
  let service: DeviceTokenService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    deviceToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceTokenService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DeviceTokenService>(DeviceTokenService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerToken', () => {
    it('should create new token when it does not exist', async () => {
      const data = {
        userId: 'user123',
        platform: DevicePlatform.IOS,
        token: 'a'.repeat(64),
        deviceModel: 'iPhone14,2',
        osVersion: 'iOS 16.0',
        appVersion: '1.0.0',
      };

      mockPrismaService.deviceToken.findUnique.mockResolvedValue(null);
      mockPrismaService.deviceToken.create.mockResolvedValue({ id: 'token1', ...data });

      const result = await service.registerToken(data);

      expect(mockPrismaService.deviceToken.findUnique).toHaveBeenCalledWith({
        where: {
          userId_token: {
            userId: data.userId,
            token: data.token,
          },
        },
      });
      expect(mockPrismaService.deviceToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: data.userId,
          platform: data.platform,
          token: data.token,
        }),
      });
      expect(result).toHaveProperty('id');
    });

    it('should update existing token', async () => {
      const data = {
        userId: 'user123',
        platform: DevicePlatform.ANDROID,
        token: 'b'.repeat(100),
      };

      const existingToken = {
        id: 'token1',
        userId: data.userId,
        token: data.token,
        platform: data.platform,
        isActive: false,
      };

      mockPrismaService.deviceToken.findUnique.mockResolvedValue(existingToken);
      mockPrismaService.deviceToken.update.mockResolvedValue({
        ...existingToken,
        isActive: true,
      });

      const result = await service.registerToken(data);

      expect(mockPrismaService.deviceToken.update).toHaveBeenCalledWith({
        where: { id: existingToken.id },
        data: expect.objectContaining({
          isActive: true,
        }),
      });
    });
  });

  describe('getActiveTokens', () => {
    it('should return active tokens for user', async () => {
      const userId = 'user123';
      const tokens = [
        { id: 'token1', userId, isActive: true, platform: DevicePlatform.IOS },
        { id: 'token2', userId, isActive: true, platform: DevicePlatform.ANDROID },
      ];

      mockPrismaService.deviceToken.findMany.mockResolvedValue(tokens);

      const result = await service.getActiveTokens(userId);

      expect(mockPrismaService.deviceToken.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          isActive: true,
        },
        orderBy: {
          lastUsedAt: 'desc',
        },
      });
      expect(result).toEqual(tokens);
    });
  });

  describe('deactivateToken', () => {
    it('should deactivate token', async () => {
      const tokenId = 'token1';
      const updatedToken = { id: tokenId, isActive: false };

      mockPrismaService.deviceToken.update.mockResolvedValue(updatedToken);

      await service.deactivateToken(tokenId);

      expect(mockPrismaService.deviceToken.update).toHaveBeenCalledWith({
        where: { id: tokenId },
        data: {
          isActive: false,
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('getTokenStats', () => {
    it('should return token statistics', async () => {
      const userId = 'user123';
      const tokens = [
        { id: 'token1', userId, isActive: true, platform: DevicePlatform.IOS },
        { id: 'token2', userId, isActive: true, platform: DevicePlatform.IOS },
        { id: 'token3', userId, isActive: false, platform: DevicePlatform.ANDROID },
      ];

      mockPrismaService.deviceToken.findMany.mockResolvedValue(tokens);

      const stats = await service.getTokenStats(userId);

      expect(stats).toEqual({
        total: 3,
        active: 2,
        inactive: 1,
        platforms: {
          ios: 2,
          android: 1,
        },
      });
    });
  });
});
