import { Test, TestingModule } from '@nestjs/testing';
import { TemplateEngineService } from './template-engine.service';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';
import { NotificationType } from '@prisma/client';

describe('TemplateEngineService', () => {
  let service: TemplateEngineService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    notificationTemplate: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateEngineService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TemplateEngineService>(TemplateEngineService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('renderTemplate', () => {
    it('should render template with context variables', async () => {
      const template = {
        id: 'template1',
        key: 'job_application_received_en_v1',
        type: NotificationType.JOB_APPLICATION_RECEIVED,
        language: 'en',
        subject: 'New Application from {{userName}}',
        htmlBody: '<p>Hello {{userName}}</p>',
        textBody: 'Hello {{userName}}',
        pushTitle: 'Application',
        pushBody: '{{userName}} applied',
        isActive: true,
      };

      const context = {
        userName: 'John Doe',
        jobTitle: 'Bartender',
      };

      mockPrismaService.notificationTemplate.findFirst.mockResolvedValue(template);

      const result = await service.renderTemplate(
        NotificationType.JOB_APPLICATION_RECEIVED,
        'en',
        context,
      );

      expect(result.subject).toBe('New Application from John Doe');
      expect(result.htmlBody).toContain('<p>Hello John Doe</p>');
      expect(result.textBody).toBe('Hello John Doe');
      expect(result.pushTitle).toBe('Application');
      expect(result.pushBody).toBe('John Doe applied');
    });

    it('should use fallback template when database template not found', async () => {
      mockPrismaService.notificationTemplate.findFirst.mockResolvedValue(null);

      const context = { userName: 'Jane' };

      const result = await service.renderTemplate(
        NotificationType.JOB_APPLICATION_RECEIVED,
        'en',
        context,
      );

      expect(result).toHaveProperty('subject');
      expect(result).toHaveProperty('htmlBody');
      expect(result.subject).toContain('Jane');
    });

    it('should handle missing context variables gracefully', async () => {
      const template = {
        id: 'template1',
        type: NotificationType.JOB_ALERT,
        language: 'en',
        subject: 'Job Alert',
        pushBody: '{{jobCount}} new jobs',
        isActive: true,
      };

      mockPrismaService.notificationTemplate.findFirst.mockResolvedValue(template);

      const result = await service.renderTemplate(
        NotificationType.JOB_ALERT,
        'en',
        {},
      );

      expect(result.pushBody).toBeDefined();
    });
  });

  describe('upsertTemplate', () => {
    it('should create new version when updating existing template', async () => {
      const data = {
        type: NotificationType.JOB_APPLICATION_RECEIVED,
        language: 'en',
        subject: 'Updated Subject',
        htmlBody: '<p>Updated HTML</p>',
      };

      const existingTemplate = {
        id: 'template1',
        version: 1,
        isActive: true,
      };

      mockPrismaService.notificationTemplate.findFirst.mockResolvedValue(existingTemplate);
      mockPrismaService.notificationTemplate.update.mockResolvedValue({});
      mockPrismaService.notificationTemplate.create.mockResolvedValue({
        id: 'template2',
        version: 2,
        ...data,
      });

      await service.upsertTemplate(data);

      expect(mockPrismaService.notificationTemplate.update).toHaveBeenCalledWith({
        where: { id: existingTemplate.id },
        data: { isActive: false },
      });
      expect(mockPrismaService.notificationTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          version: 2,
          isActive: true,
          ...data,
        }),
      });
    });

    it('should create first version when template does not exist', async () => {
      const data = {
        type: NotificationType.REVIEW_RECEIVED,
        language: 'en',
        subject: 'New Review',
      };

      mockPrismaService.notificationTemplate.findFirst.mockResolvedValue(null);
      mockPrismaService.notificationTemplate.create.mockResolvedValue({
        id: 'template1',
        version: 1,
        ...data,
      });

      const result = await service.upsertTemplate(data);

      expect(mockPrismaService.notificationTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          version: 1,
          isActive: true,
          ...data,
        }),
      });
    });
  });

  describe('rollbackTemplate', () => {
    it('should rollback to previous version', async () => {
      const template = {
        id: 'template2',
        type: NotificationType.JOB_APPLICATION_RECEIVED,
        language: 'en',
        version: 2,
      };

      mockPrismaService.notificationTemplate.update.mockResolvedValue({});

      await service.rollbackTemplate(template.id);

      expect(mockPrismaService.notificationTemplate.update).toHaveBeenCalledWith({
        where: { id: template.id },
        data: { isActive: false },
      });
      expect(mockPrismaService.notificationTemplate.updateMany).toHaveBeenCalledWith({
        where: {
          type: template.type,
          language: template.language,
          version: template.version - 1,
        },
        data: { isActive: true },
      });
    });

    it('should throw error when rolling back version 1', async () => {
      const template = {
        id: 'template1',
        version: 1,
      };

      await expect(service.rollbackTemplate(template.id)).rejects.toThrow(
        'Cannot rollback version 1',
      );
    });
  });

  describe('Handlebars helpers', () => {
    it('should formatDate correctly', async () => {
      const template = {
        id: 'template1',
        type: NotificationType.JOB_EXPIRING_SOON,
        language: 'en',
        inAppTemplate: 'Expires on {{formatDate expiryDate "MMMM D, YYYY"}}',
        isActive: true,
      };

      const context = {
        expiryDate: '2026-02-15',
      };

      mockPrismaService.notificationTemplate.findFirst.mockResolvedValue(template);

      const result = await service.renderTemplate(
        NotificationType.JOB_EXPIRING_SOON,
        'en',
        context,
      );

      expect(result.inAppTemplate).toBeDefined();
      expect(result.inAppTemplate).toContain('2026');
    });

    it('should use default value helper', async () => {
      const template = {
        id: 'template1',
        type: NotificationType.NEW_MESSAGE,
        language: 'en',
        pushBody: 'Hello {{default userName "User"}}',
        isActive: true,
      };

      mockPrismaService.notificationTemplate.findFirst.mockResolvedValue(template);

      const result = await service.renderTemplate(
        NotificationType.NEW_MESSAGE,
        'en',
        {},
      );

      expect(result.pushBody).toBe('Hello User');
    });
  });
});
