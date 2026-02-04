import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';

/**
 * Reviews Service
 * Handles review and rating logic
 */
@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, createDto: any) {
    return this.prisma.review.create({
      data: {
        reviewerId: userId,
        ...createDto,
      },
    });
  }

  async findByProfileId(profileId: number) {
    return this.prisma.review.findMany({
      where: { revieweeId: profileId },
      include: {
        reviewer: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async updateVisibility(reviewId: number, visible: boolean) {
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { visible },
    });
  }

  async calculateAverageRating(profileId: number) {
    const reviews = await this.prisma.review.findMany({
      where: { revieweeId: profileId, visible: true },
      select: { overallRating: true },
    });

    if (reviews.length === 0) return 0;

    const sum = reviews.reduce((acc, review) => acc + review.overallRating, 0);
    return sum / reviews.length;
  }

  async updatePrestigeLevel(profileId: number) {
    const avgRating = await this.calculateAverageRating(profileId);
    const reviewCount = await this.prisma.review.count({
      where: { revieweeId: profileId, visible: true },
    });

    let prestigeLevel = 'BRONZE';

    if (reviewCount >= 20 && avgRating >= 4.7) {
      prestigeLevel = 'PLATINUM';
    } else if (reviewCount >= 10 && avgRating >= 4.5) {
      prestigeLevel = 'GOLD';
    } else if (reviewCount >= 5 && avgRating >= 4.0) {
      prestigeLevel = 'SILVER';
    }

    // Update profile prestige level
    // This would be implemented based on whether it's a worker or business profile
    return { profileId, prestigeLevel, reviewCount, avgRating };
  }
}
