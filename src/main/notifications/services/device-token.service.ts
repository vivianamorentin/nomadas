import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';
import { DevicePlatform } from '@prisma/client';

/**
 * Device Token Service
 * Manages push notification device tokens
 * SPEC-NOT-001 Phase 5
 */
@Injectable()
export class DeviceTokenService {
  private readonly logger = new Logger(DeviceTokenService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register or update device token for user
   */
  async registerToken(data: {
    userId: string;
    platform: DevicePlatform;
    token: string;
    deviceModel?: string;
    osVersion?: string;
    appVersion?: string;
  }) {
    this.logger.log(`Registering device token for user ${data.userId}, platform: ${data.platform}`);

    // Check if token already exists for this user
    const existing = await this.prisma.deviceToken.findUnique({
      where: {
        userId_token: {
          userId: data.userId,
          token: data.token,
        },
      },
    });

    if (existing) {
      // Update existing token
      return this.prisma.deviceToken.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          lastUsedAt: new Date(),
          deviceModel: data.deviceModel,
          osVersion: data.osVersion,
          appVersion: data.appVersion,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new token
      return this.prisma.deviceToken.create({
        data: {
          userId: data.userId,
          platform: data.platform,
          token: data.token,
          deviceModel: data.deviceModel,
          osVersion: data.osVersion,
          appVersion: data.appVersion,
          isActive: true,
          lastUsedAt: new Date(),
        },
      });
    }
  }

  /**
   * Get all active tokens for user
   */
  async getActiveTokens(userId: string) {
    return this.prisma.deviceToken.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        lastUsedAt: 'desc',
      },
    });
  }

  /**
   * Get all active tokens for user by platform
   */
  async getActiveTokensByPlatform(userId: string, platform: DevicePlatform) {
    return this.prisma.deviceToken.findMany({
      where: {
        userId,
        platform,
        isActive: true,
      },
      orderBy: {
        lastUsedAt: 'desc',
      },
    });
  }

  /**
   * Update token's last used timestamp
   */
  async updateLastUsed(tokenId: string) {
    return this.prisma.deviceToken.update({
      where: { id: tokenId },
      data: {
        lastUsedAt: new Date(),
      },
    });
  }

  /**
   * Deactivate token (user logged out or uninstalled app)
   */
  async deactivateToken(tokenId: string) {
    this.logger.log(`Deactivating token ${tokenId}`);

    return this.prisma.deviceToken.update({
      where: { id: tokenId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Deactivate all tokens for user
   */
  async deactivateAllTokens(userId: string) {
    this.logger.log(`Deactivating all tokens for user ${userId}`);

    return this.prisma.deviceToken.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete token completely
   */
  async deleteToken(tokenId: string) {
    this.logger.log(`Deleting token ${tokenId}`);

    return this.prisma.deviceToken.delete({
      where: { id: tokenId },
    });
  }

  /**
   * Remove invalid tokens
   * Called after push notification failures
   */
  async removeInvalidTokens(tokenIds: string[]) {
    this.logger.log(`Removing ${tokenIds.length} invalid tokens`);

    return this.prisma.deviceToken.updateMany({
      where: {
        id: { in: tokenIds },
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Cleanup old inactive tokens
   * Run periodically to remove stale tokens
   */
  async cleanupOldTokens(daysOld = 90) {
    this.logger.log(`Cleaning up tokens older than ${daysOld} days`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.deviceToken.deleteMany({
      where: {
        isActive: false,
        updatedAt: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(`Cleaned up ${result.count} old tokens`);

    return result;
  }

  /**
   * Get token statistics for user
   */
  async getTokenStats(userId: string) {
    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId },
    });

    const active = tokens.filter(t => t.isActive).length;
    const inactive = tokens.filter(t => !t.isActive).length;
    const ios = tokens.filter(t => t.platform === DevicePlatform.IOS).length;
    const android = tokens.filter(t => t.platform === DevicePlatform.ANDROID).length;

    return {
      total: tokens.length,
      active,
      inactive,
      platforms: {
        ios,
        android,
      },
    };
  }
}
