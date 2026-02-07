import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

/**
 * Email Service
 * Sends transactional emails via SendGrid
 * SPEC-NOT-001 Phase 4
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly unsubscribeUrl: string;

  constructor(private readonly configService: ConfigService) {
    // Configure SendGrid API key
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.logger.log('SendGrid configured successfully');
    } else {
      this.logger.warn('SENDGRID_API_KEY not configured');
    }

    this.fromEmail = this.configService.get<string>('EMAIL_FROM') || 'noreply@nomadshift.com';
    this.fromName = this.configService.get<string>('EMAIL_FROM_NAME') || 'NomadShift';
    this.unsubscribeUrl = this.configService.get<string>('APP_BASE_URL') || 'https://nomadshift.com';
  }

  /**
   * Send email with HTML and text versions
   */
  async sendEmail(data: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    unsubscribeToken?: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!data.to) {
        throw new Error('Recipient email is required');
      }

      // Build unsubscribe URL
      const unsubscribeUrl = data.unsubscribeToken
        ? `${this.unsubscribeUrl}/notifications/unsubscribe/email/${data.unsubscribeToken}`
        : undefined;

      // Build SendGrid message
      const msg: sgMail.MailDataRequired = {
        to: data.to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: data.subject,
        content: [],
      };

      // Add HTML content
      if (data.html) {
        msg.content.push({
          type: 'text/html',
          value: data.html,
        });
      }

      // Add plain text content
      if (data.text) {
        msg.content.push({
          type: 'text/plain',
          value: data.text,
        });
      }

      // Add unsubscribe link (GDPR compliance)
      if (unsubscribeUrl) {
        msg.customArgs = {
          unsubscribe_url: unsubscribeUrl,
        };

        // Add List-Unsubscribe header
        msg.headers = {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        };
      }

      // Add metadata for tracking
      if (data.metadata) {
        msg.customArgs = {
          ...msg.customArgs,
          ...data.metadata,
        };
      }

      this.logger.debug(`Sending email to ${data.to} with subject: ${data.subject}`);

      // Send email via SendGrid
      const response = await sgMail.send(msg);

      const messageId = response[0]?.headers?.['x-message-id'];

      this.logger.log(`Email sent successfully to ${data.to}, messageId: ${messageId}`);

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      this.logger.error(`Error sending email to ${data.to}`, error);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Validate email address format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if email service is configured
   */
  isConfigured(): boolean {
    return !!this.configService.get<string>('SENDGRID_API_KEY');
  }

  /**
   * Get email delivery status (placeholder for SendGrid webhook integration)
   * In production, this would query SendGrid API or webhook database
   */
  async getDeliveryStatus(messageId: string): Promise<{
    status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'deferred';
    timestamp?: Date;
  }> {
    // TODO: Implement SendGrid webhook or API integration
    // For now, return sent status
    return {
      status: 'sent',
    };
  }
}
