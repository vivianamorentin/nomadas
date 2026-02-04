import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';

/**
 * Notifications Service
 * Handles push and email notification logic
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: number) {
    return this.prisma.notificationPreference.findUnique({
      where: { userId },
    });
  }

  async updatePreferences(userId: number, preferences: any) {
    return this.prisma.notificationPreference.update({
      where: { userId },
      data: preferences,
    });
  }

  async sendPushNotification(userId: number, title: string, message: string) {
    // FCM/APNs integration would go here
    // For now, just log the notification
    console.log(`Push notification to user ${userId}: ${title} - ${message}`);
  }

  async sendEmailNotification(userId: number, type: string, data: any) {
    // AWS SES integration would go here
    // For now, just log the email
    console.log(`Email to user ${userId}: ${type}`, data);
  }

  async notifyNewApplication(businessUserId: number, applicantName: string) {
    await this.sendPushNotification(
      businessUserId,
      'Nueva Solicitud',
      `${applicantName} ha solicitado tu puesto de trabajo.`,
    );
    await this.sendEmailNotification(businessUserId, 'NEW_APPLICATION', {
      applicantName,
    });
  }

  async notifyApplicationStatusChanged(workerUserId: number, status: string) {
    await this.sendPushNotification(
      workerUserId,
      'Estado de Solicitud Actualizado',
      `Tu solicitud ahora está: ${status}`,
    );
  }

  async notifyNewMessage(userId: number, senderName: string) {
    await this.sendPushNotification(
      userId,
      'Nuevo Mensaje',
      `${senderName} te ha enviado un mensaje.`,
    );
  }

  async notifyNewReview(userId: number, reviewerName: string) {
    await this.sendPushNotification(
      userId,
      'Nueva Reseña',
      `${reviewerName} te ha dejado una reseña.`,
    );
  }
}
