// Test setup configuration
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load test environment variables
config({ path: '.env.test' });

const prisma = new PrismaClient();

beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
});

afterAll(async () => {
  // Cleanup test database
  await prisma.emailToken.deleteMany();
  await prisma.emailLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean database before each test
  await prisma.emailToken.deleteMany();
  await prisma.emailLog.deleteMany();
  await prisma.user.deleteMany();
});

// Global test helpers
declare global {
  var testHelpers: {
    prisma: PrismaClient;
  };
}

global.testHelpers = {
  prisma,
};
