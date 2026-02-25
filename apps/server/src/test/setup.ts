import { beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient;
}

let prisma: PrismaClient;

beforeAll(async () => {
  // Initialize Prisma client for tests using main database
  prisma = new PrismaClient();

  // Test connection
  await prisma.$connect();

  // Make prisma available globally for tests
  (globalThis as any).prisma = prisma;
});

afterAll(async () => {
  await prisma?.$disconnect();
});

beforeEach(async () => {
  // Clean up database before each test
  if (prisma) {
    const tables = [
      'users',
      'messages',
      'conversation_participants',
      'conversations',
      'notifications',
      'documents',
      'products',
      'trade_requests',
      'analysis_requests',
      'advertisements',
      'support_tickets',
      'service_requests',
    ];

    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${table} CASCADE;`);
      } catch (error) {
        // Table might not exist, continue
      }
    }
  }
});
