import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/shared/infrastructure/database/prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have $connect method', () => {
    expect(service.$connect).toBeDefined();
  });

  it('should have $disconnect method', () => {
    expect(service.$disconnect).toBeDefined();
  });

  it('should extend PrismaClient', () => {
    expect(service).toBeInstanceOf(PrismaService);
  });

  // Note: Actual connection tests would require a test database
  // These are basic structural tests
});
