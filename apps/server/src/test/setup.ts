import { beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';

declare global {
  var prisma: PrismaClient;
}

let prisma: PrismaClient;

beforeAll(async () => {
  // provide default for local Docker test database if absent
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5434/vaahedi_test';
    console.log('DATABASE_URL defaulted to', process.env.DATABASE_URL);
  }
  // default JWT secrets so auth code can sign tokens during tests
  if (!process.env.JWT_ACCESS_SECRET) {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  }

  // ensure the schema is pushed/migrated before tests run
  try {
    const schemaPath = path.resolve(__dirname, '../../../../packages/db/prisma/schema.prisma');
    console.log('pushing prisma schema from', schemaPath);
    execSync(`npx prisma db push --schema=${schemaPath}`, {
      stdio: 'inherit',
    });
  } catch (err) {
    console.warn('failed to push prisma schema, tests may error', err);
  }

  // Initialize Prisma client for tests using main database
  prisma = new PrismaClient();

  try {
    // Test connection
    await prisma.$connect();
  } catch (err) {
    console.warn('Could not connect to test database, some tests will be skipped', err);
    prisma = undefined as any;
    return;
  }

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
