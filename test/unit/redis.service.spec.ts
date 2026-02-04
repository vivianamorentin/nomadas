import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../src/shared/infrastructure/cache/redis.service';

describe('RedisService', () => {
  let service: RedisService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Note: Actual Redis tests would require a running Redis instance
  // These tests verify the service structure

  describe('cache methods', () => {
    it('should have get method', () => {
      expect(service.get).toBeDefined();
    });

    it('should have set method', () => {
      expect(service.set).toBeDefined();
    });

    it('should have del method', () => {
      expect(service.del).toBeDefined();
    });

    it('should have exists method', () => {
      expect(service.exists).toBeDefined();
    });
  });

  describe('rate limiting methods', () => {
    it('should have incr method', () => {
      expect(service.incr).toBeDefined();
    });

    it('should have expire method', () => {
      expect(service.expire).toBeDefined();
    });

    it('should have ttl method', () => {
      expect(service.ttl).toBeDefined();
    });
  });

  describe('pub/sub methods', () => {
    it('should have publish method', () => {
      expect(service.publish).toBeDefined();
    });

    it('should have subscribe method', () => {
      expect(service.subscribe).toBeDefined();
    });
  });
});
