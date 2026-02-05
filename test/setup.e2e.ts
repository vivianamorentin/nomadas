import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Setup test database connection
  // In production, you might want to use a separate test database
  console.log('Setting up test environment...');
});

afterAll(async () => {
  // Cleanup test database
  await prisma.$disconnect();
  console.log('Test environment cleaned up');
});

beforeEach(async () => {
  // Clean up test data before each test
  // Uncomment the following if you want to clean tables between tests
  // await prisma.businessPhoto.deleteMany({});
  // await prisma.businessVerificationDocument.deleteMany({});
  // await prisma.businessProfileChange.deleteMany({});
  // await prisma.businessProfile.deleteMany({});
  // await prisma.user.deleteMany({});
});
