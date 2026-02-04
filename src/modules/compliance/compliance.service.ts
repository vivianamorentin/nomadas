import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';

/**
 * Compliance Service
 * Handles GDPR compliance and legal agreements
 */
@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async getAgreements() {
    return this.prisma.legalAgreement.findMany({
      where: { active: true },
    });
  }

  async acceptAgreement(userId: number, agreementId: string) {
    return this.prisma.legalAcceptance.create({
      data: {
        userId,
        agreementId,
        ipAddress: '', // Would be extracted from request
        acceptedAt: new Date(),
      },
    });
  }

  async exportUserData(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        workerProfile: true,
        businessProfile: true,
        applications: true,
        reviewsAsReviewer: true,
        reviewsAsReviewee: true,
        notificationPreferences: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Return data in JSON format for GDPR export
    return {
      personalData: {
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
      workerProfile: user.workerProfile,
      businessProfile: user.businessProfile,
      applications: user.applications,
      reviews: {
        given: user.reviewsAsReviewer,
        received: user.reviewsAsReviewee,
      },
      notifications: user.notificationPreferences,
      legalAcceptances: await this.prisma.legalAcceptance.findMany({
        where: { userId },
      }),
    };
  }

  async requestAccountDeletion(userId: number) {
    // Schedule deletion for 30 days from now (GDPR requirement)
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    // In production, this would trigger an async job
    // to anonymize data and delete from S3 after 30 days
    return {
      message: 'Account deletion scheduled',
      deletionDate,
      userId,
    };
  }

  async auditLog(action: string, userId: number, details: any) {
    // Log to audit logs (7-year retention)
    return this.prisma.auditLog.create({
      data: {
        action,
        userId,
        details: JSON.stringify(details),
        timestamp: new Date(),
      },
    });
  }
}
