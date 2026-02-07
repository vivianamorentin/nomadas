import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';
import { NotificationType } from '@prisma/client';
import { TemplateContext, RenderedTemplate } from '../interfaces/template-context.interface';
import * as Handlebars from 'handlebars';

/**
 * Template Engine Service
 * Handles template loading, rendering, and variable interpolation
 * SPEC-NOT-001 Phase 2
 */
@Injectable()
export class TemplateEngineService {
  private readonly logger = new Logger(TemplateEngineService.name);
  private readonly templateCache = new Map<string, HandlebarsTemplateDelegate>();

  constructor(private readonly prisma: PrismaService) {
    this.registerHelpers();
  }

  /**
   * Render notification template for all channels
   */
  async renderTemplate(
    type: NotificationType,
    language: string,
    context: TemplateContext,
  ): Promise<RenderedTemplate> {
    try {
      this.logger.debug(`Rendering template for type=${type}, language=${language}`);

      // Get active template for type and language
      const template = await this.getActiveTemplate(type, language);

      if (!template) {
        this.logger.warn(`No active template found for type=${type}, language=${language}`);
        return this.getFallbackTemplate(type, context);
      }

      // Render each channel template
      const rendered: RenderedTemplate = {};

      if (template.subject) {
        rendered.subject = this.compileAndRender(template.subject, context);
      }

      if (template.htmlBody) {
        rendered.htmlBody = this.compileAndRender(template.htmlBody, context);
      }

      if (template.textBody) {
        rendered.textBody = this.compileAndRender(template.textBody, context);
      }

      if (template.pushTitle) {
        rendered.pushTitle = this.compileAndRender(template.pushTitle, context);
      }

      if (template.pushBody) {
        rendered.pushBody = this.compileAndRender(template.pushBody, context);
      }

      if (template.smsTemplate) {
        rendered.smsTemplate = this.compileAndRender(template.smsTemplate, context);
      }

      if (template.inAppTemplate) {
        rendered.inAppTemplate = this.compileAndRender(template.inAppTemplate, context);
      }

      return rendered;
    } catch (error) {
      this.logger.error(`Error rendering template for type=${type}`, error);
      return this.getFallbackTemplate(type, context);
    }
  }

  /**
   * Get active template for notification type and language
   */
  async getActiveTemplate(type: NotificationType, language: string) {
    const cacheKey = `${type}_${language}`;

    // Check cache first
    if (this.templateCache.has(cacheKey)) {
      return this.getTemplateFromCache(type, language);
    }

    // Fetch from database
    const template = await this.prisma.notificationTemplate.findFirst({
      where: {
        type,
        language,
        isActive: true,
      },
      orderBy: {
        version: 'desc',
      },
    });

    if (template) {
      this.cacheTemplate(template);
    }

    return template;
  }

  /**
   * Create or update notification template
   */
  async upsertTemplate(data: {
    type: NotificationType;
    language: string;
    subject?: string;
    htmlBody?: string;
    textBody?: string;
    pushTitle?: string;
    pushBody?: string;
    smsTemplate?: string;
    inAppTemplate?: string;
    variables?: any;
  }) {
    const { type, language, ...templateData } = data;

    // Check if template exists
    const existing = await this.prisma.notificationTemplate.findFirst({
      where: {
        type,
        language,
        isActive: true,
      },
      orderBy: {
        version: 'desc',
      },
    });

    if (existing) {
      // Create new version
      const newVersion = existing.version + 1;

      // Deactivate old version
      await this.prisma.notificationTemplate.update({
        where: { id: existing.id },
        data: { isActive: false },
      });

      // Create new version
      return this.prisma.notificationTemplate.create({
        data: {
          type,
          language,
          ...templateData,
          version: newVersion,
          key: `${type}_${language}_v${newVersion}`,
        },
      });
    } else {
      // Create first version
      return this.prisma.notificationTemplate.create({
        data: {
          type,
          language,
          ...templateData,
          version: 1,
          key: `${type}_${language}_v1`,
        },
      });
    }
  }

  /**
   * Get all templates for a type (admin view)
   */
  async getTemplatesByType(type: NotificationType) {
    return this.prisma.notificationTemplate.findMany({
      where: { type },
      orderBy: [
        { language: 'asc' },
        { version: 'desc' },
      ],
    });
  }

  /**
   * Rollback template to previous version
   */
  async rollbackTemplate(templateId: string) {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    if (template.version === 1) {
      throw new Error('Cannot rollback version 1');
    }

    // Deactivate current version
    await this.prisma.notificationTemplate.updateMany({
      where: {
        type: template.type,
        language: template.language,
        isActive: true,
      },
      data: { isActive: false },
    });

    // Activate previous version
    await this.prisma.notificationTemplate.updateMany({
      where: {
        type: template.type,
        language: template.language,
        version: template.version - 1,
      },
      data: { isActive: true },
    });

    return this.prisma.notificationTemplate.findFirst({
      where: {
        type: template.type,
        language: template.language,
        version: template.version - 1,
      },
    });
  }

  /**
   * Compile and render template string
   */
  private compileAndRender(templateString: string, context: TemplateContext): string {
    try {
      const template = Handlebars.compile(templateString);
      return template(context);
    } catch (error) {
      this.logger.error(`Error compiling template: ${error.message}`);
      return templateString; // Return original on error
    }
  }

  /**
   * Register Handlebars helpers
   */
  private registerHelpers() {
    // Date formatting helper
    Handlebars.registerHelper('formatDate', (date: string, format: string) => {
      const d = new Date(date);
      // Simple formatting - in production, use a library like date-fns
      return d.toLocaleDateString();
    });

    // Default value helper
    Handlebars.registerHelper('default', (value: any, defaultValue: any) => {
      return value !== undefined && value !== null ? value : defaultValue;
    });

    // Equals helper for conditionals
    Handlebars.registerHelper('eq', (a: any, b: any) => {
      return a === b;
    });

    // JSON stringify helper
    Handlebars.registerHelper('json', (obj: any) => {
      return JSON.stringify(obj);
    });

    // Truncate helper
    Handlebars.registerHelper('truncate', (str: string, length: number) => {
      if (str && str.length > length) {
        return str.substring(0, length) + '...';
      }
      return str;
    });
  }

  /**
   * Cache template for performance
   */
  private cacheTemplate(template: any) {
    const cacheKey = `${template.type}_${template.language}`;
    this.templateCache.set(cacheKey, template);
  }

  /**
   * Get template from cache
   */
  private getTemplateFromCache(type: NotificationType, language: string) {
    const cacheKey = `${type}_${language}`;
    return this.templateCache.get(cacheKey);
  }

  /**
   * Get fallback template when database template is not found
   */
  private getFallbackTemplate(type: NotificationType, context: TemplateContext): RenderedTemplate {
    this.logger.warn(`Using fallback template for type=${type}`);

    const userName = context.userName || 'User';

    const fallbacks: Record<NotificationType, RenderedTemplate> = {
      JOB_APPLICATION_RECEIVED: {
        subject: 'New Job Application Received',
        htmlBody: `<p>Hello ${userName},</p><p>You have received a new job application.</p>`,
        textBody: `Hello ${userName},\n\nYou have received a new job application.`,
        pushTitle: 'New Application',
        pushBody: 'You have a new job application',
        inAppTemplate: 'New job application received',
      },
      APPLICATION_STATUS_CHANGED: {
        subject: 'Application Status Updated',
        htmlBody: `<p>Hello ${userName},</p><p>Your application status has been updated.</p>`,
        textBody: `Hello ${userName},\n\nYour application status has been updated.`,
        pushTitle: 'Application Updated',
        pushBody: 'Your application status has changed',
        inAppTemplate: 'Application status updated',
      },
      REVIEW_RECEIVED: {
        subject: 'New Review Received',
        htmlBody: `<p>Hello ${userName},</p><p>You have received a new review.</p>`,
        textBody: `Hello ${userName},\n\nYou have received a new review.`,
        pushTitle: 'New Review',
        pushBody: 'You have received a new review',
        inAppTemplate: 'New review received',
      },
      NEW_MESSAGE: {
        subject: 'New Message',
        htmlBody: `<p>Hello ${userName},</p><p>You have a new message.</p>`,
        textBody: `Hello ${userName},\n\nYou have a new message.`,
        pushTitle: 'New Message',
        pushBody: 'You have a new message',
        inAppTemplate: 'New message received',
      },
      JOB_ALERT: {
        subject: 'New Jobs Matching Your Search',
        htmlBody: `<p>Hello ${userName},</p><p>New jobs matching your search criteria are available.</p>`,
        textBody: `Hello ${userName},\n\nNew jobs matching your search criteria are available.`,
        pushTitle: 'New Job Alerts',
        pushBody: 'New jobs matching your search',
        inAppTemplate: 'New job matches available',
      },
      JOB_EXPIRING_SOON: {
        subject: 'Job Expiring Soon',
        htmlBody: `<p>Hello ${userName},</p><p>Your job posting is expiring soon.</p>`,
        textBody: `Hello ${userName},\n\nYour job posting is expiring soon.`,
        pushTitle: 'Job Expiring',
        pushBody: 'Your job posting is expiring soon',
        inAppTemplate: 'Job expiring soon',
      },
      SECURITY_ALERT: {
        subject: 'Security Alert',
        htmlBody: `<p>Hello ${userName},</p><p>A security event was detected on your account.</p>`,
        textBody: `Hello ${userName},\n\nA security event was detected on your account.`,
        pushTitle: 'Security Alert',
        pushBody: 'Security event detected',
        inAppTemplate: 'Security alert',
      },
      BADGE_EARNED: {
        subject: 'Congratulations! You Earned a Badge',
        htmlBody: `<p>Hello ${userName},</p><p>Congratulations! You have earned a new badge.</p>`,
        textBody: `Hello ${userName},\n\nCongratulations! You have earned a new badge.`,
        pushTitle: 'Badge Earned',
        pushBody: 'You earned a new badge!',
        inAppTemplate: 'Badge earned',
      },
      APPLICATION_WITHDRAWN: {
        subject: 'Application Withdrawn',
        htmlBody: `<p>Hello ${userName},</p><p>An application has been withdrawn.</p>`,
        textBody: `Hello ${userName},\n\nAn application has been withdrawn.`,
        pushTitle: 'Application Withdrawn',
        pushBody: 'An application was withdrawn',
        inAppTemplate: 'Application withdrawn',
      },
      REVIEW_RESPONSE_RECEIVED: {
        subject: 'Review Response Received',
        htmlBody: `<p>Hello ${userName},</p><p>Someone responded to your review.</p>`,
        textBody: `Hello ${userName},\n\nSomeone responded to your review.`,
        pushTitle: 'Review Response',
        pushBody: 'Response to your review',
        inAppTemplate: 'Review response received',
      },
      REVIEW_MODERATED: {
        subject: 'Review Moderated',
        htmlBody: `<p>Hello ${userName},</p><p>A review has been moderated.</p>`,
        textBody: `Hello ${userName},\n\nA review has been moderated.`,
        pushTitle: 'Review Moderated',
        pushBody: 'A review was moderated',
        inAppTemplate: 'Review moderated',
      },
      MESSAGE_DIGEST: {
        subject: 'Unread Messages Digest',
        htmlBody: `<p>Hello ${userName},</p><p>You have unread messages.</p>`,
        textBody: `Hello ${userName},\n\nYou have unread messages.`,
        pushTitle: '',
        pushBody: '',
        inAppTemplate: 'Message digest',
      },
      VERIFICATION_STATUS_CHANGED: {
        subject: 'Verification Status Updated',
        htmlBody: `<p>Hello ${userName},</p><p>Your verification status has been updated.</p>`,
        textBody: `Hello ${userName},\n\nYour verification status has been updated.`,
        pushTitle: 'Verification Updated',
        pushBody: 'Verification status changed',
        inAppTemplate: 'Verification status updated',
      },
    };

    return fallbacks[type] || fallbacks.JOB_APPLICATION_RECEIVED;
  }
}
