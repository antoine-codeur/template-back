import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
  var testHelpers: {
    prisma: PrismaClient;
  };
}

if (process.env.NODE_ENV === 'test' && global.testHelpers) {
  // Use the test helper's Prisma instance in test environment
  prisma = global.testHelpers.prisma;
} else if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  prisma = global.__prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  console.log('Database connection closed');
});

export { prisma };
