import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';

/**
 * Profile Management Service
 * Handles worker and business profile logic
 */
@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        workerProfile: true,
        businessProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateByUserId(userId: number, updateDto: any) {
    return this.prisma.user.update({
      where: { id: userId },
      data: updateDto,
      select: {
        id: true,
        email: true,
        role: true,
        workerProfile: true,
        businessProfile: true,
      },
    });
  }

  async createWorkerProfile(userId: number, createDto: any) {
    return this.prisma.workerProfile.create({
      data: {
        userId,
        ...createDto,
      },
    });
  }

  async createBusinessProfile(userId: number, createDto: any) {
    return this.prisma.businessProfile.create({
      data: {
        userId,
        ...createDto,
      },
    });
  }

  async findWorkerProfile(profileId: number) {
    return this.prisma.workerProfile.findUnique({
      where: { id: profileId },
    });
  }

  async findBusinessProfile(profileId: number) {
    return this.prisma.businessProfile.findUnique({
      where: { id: profileId },
    });
  }
}
