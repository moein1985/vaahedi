import { PrismaClient } from '@prisma/client';

export type { PrismaClient } from '@prisma/client';

// provide default DATABASE_URL for local testing (matches setup and test-utils)
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5434/vaahedi_test';
  console.log('db/index defaulted DATABASE_URL to', process.env.DATABASE_URL);
}

// ─── Singleton برای جلوگیری از connection leak در dev ────────────────────────

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env['NODE_ENV'] === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}

export * from '@prisma/client';
export default prisma;
