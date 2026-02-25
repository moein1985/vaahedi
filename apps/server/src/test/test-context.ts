import { prisma } from '@repo/db';
import { createTestUser } from '@repo/db/test-utils';

// Mock request/response objects for testing
const mockReq = {
  headers: {
    'user-agent': 'test-agent',
  },
  ip: '127.0.0.1',
  cookies: {},
};

const mockRes = {
  setCookie: () => {},
  clearCookie: () => {},
};

export async function createTestContext() {
  return {
    db: prisma,
    req: mockReq,
    res: mockRes,
    cache: null, // Mock cache service
    storage: null, // Mock storage service
    ai: null, // Mock AI service
    user: null, // Will be set by auth middleware in tests
  };
}

export async function createAuthenticatedContext(prisma: typeof import('@repo/db').prisma) {
  const user = await createTestUser(prisma);

  return {
    db: prisma,
    req: mockReq,
    res: mockRes,
    cache: null,
    storage: null,
    ai: null,
    user,
  };
}