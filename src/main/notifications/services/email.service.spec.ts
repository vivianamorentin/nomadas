import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);

    // Mock environment variables
    mockConfigService.get.mockImplementation((key: string) => {
      const envVars: Record<string, string> = {
        SENDGRID_API_KEY: 'test-api-key',
        EMAIL_FROM: 'noreply@nomadshift.com',
        EMAIL_FROM_NAME: 'NomadShift',
        APP_BASE_URL: 'https://nomadshift.com',
      };
      return envVars[key];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should validate email address', async () => {
      const result = await service.sendEmail({
        to: 'invalid-email',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'first.last@example.co.uk',
        'user+tag@example.com',
      ];

      validEmails.forEach(email => {
        expect(service.validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user @example.com',
      ];

      invalidEmails.forEach(email => {
        expect(service.validateEmail(email)).toBe(false);
      });
    });

    it('should check if SendGrid is configured', () => {
      mockConfigService.get.mockReturnValue(null);
      const newService = new EmailService(configService);
      expect(newService.isConfigured()).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should use correct email regex pattern', () => {
      const validPatterns = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user123@test-domain.com',
      ];

      validPatterns.forEach(email => {
        expect(service.validateEmail(email)).toBe(true);
      });
    });
  });

  describe('isConfigured', () => {
    it('should return true when SENDGRID_API_KEY is set', () => {
      mockConfigService.get.mockReturnValue('test-key');
      const newService = new EmailService(configService);
      expect(newService.isConfigured()).toBe(true);
    });

    it('should return false when SENDGRID_API_KEY is not set', () => {
      mockConfigService.get.mockReturnValue(null);
      const newService = new EmailService(configService);
      expect(newService.isConfigured()).toBe(false);
    });
  });
});
