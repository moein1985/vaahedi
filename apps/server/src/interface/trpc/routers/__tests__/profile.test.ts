import { describe, it, expect, beforeEach } from 'vitest';
import { createAuthenticatedContext } from '../../../../test/test-context.js';
import { profileRouter } from '../profile.router.js';
import { createTestUser } from '@repo/db/test-utils';
import { prisma } from '@repo/db';

const caller = profileRouter.createCaller;

describe('Profile Router', () => {
  let ctx: any;
  let user: any;

  beforeEach(async () => {
    user = await createTestUser(prisma);
    ctx = {
      db: prisma,
      req: { headers: {}, ip: '127.0.0.1', cookies: {} },
      res: { setCookie: () => {}, clearCookie: () => {} },
      cache: null,
      storage: null,
      ai: null,
      user,
    };
  });

  describe('me', () => {
    it('should get user profile', async () => {
      const result = await caller(ctx).me();

      expect(result).toHaveProperty('user');
      expect(result.user.id).toBe(user.id);
      expect(result).toHaveProperty('profile');
    });
  });

  describe('upsert', () => {
    it('should create profile', async () => {
      const profileData = {
        role: 'TRADER' as const,
        address: {
          province: 'تهران',
          city: 'تهران',
          addressLine: 'خیابان اصلی، پلاک ۱',
          postalCode: '1234567890',
        },
        licenseTypes: ['ESTABLISHMENT_NOTICE'],
        companyName: 'Test Company',
        phone: '02112345678',
        website: 'https://test.com',
        description: 'Test description',
      };

      const result = await caller(ctx).upsert(profileData as any);

      expect(result).toHaveProperty('id');
      expect(result.companyName).toBe('Test Company');
    });
  });

  describe('completionStatus', () => {
    it('should get completion status', async () => {
      const result = await caller(ctx).completionStatus();

      expect(result).toHaveProperty('percent');
      expect(result).toHaveProperty('steps');
      expect(result).toHaveProperty('isComplete');
      expect(typeof result.percent).toBe('number');
    });
  });
});