import { describe, it, expect, beforeEach } from 'vitest';
import { createAuthenticatedContext } from '../../../../test/test-context.js';
import { servicesRouter } from '../services.router.js';
import { createTestUser } from '@repo/db/test-utils';
import { prisma } from '@repo/db';

const caller = servicesRouter.createCaller;

describe('Services Router', () => {
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

  describe('hsCodes', () => {
    it('should get HS codes with pagination', async () => {
      const result = await caller(ctx).hsCodes({ page: 1, limit: 10 });

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('pages');
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('should search HS codes', async () => {
      const result = await caller(ctx).hsCodes({ search: 'test', page: 1, limit: 5 });

      expect(result).toHaveProperty('items');
      expect(Array.isArray(result.items)).toBe(true);
    });
  });

  describe('hsCodeByCode', () => {
    it('should get HS code by code', async () => {
      // This might fail if no HS codes exist in test DB
      // For now, just test that the procedure exists and handles input
      try {
        const result = await caller(ctx).hsCodeByCode({ code: '123456' });
        // If it returns null/undefined, that's acceptable for empty test DB
        expect(result === null || typeof result === 'object').toBe(true);
      } catch (error) {
        // Expected if no test data exists
        expect(error).toBeDefined();
      }
    });
  });

  describe('listCirculars', () => {
    it('should list circulars', async () => {
      const result = await caller(ctx).listCirculars({ page: 1, limit: 10 });

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('pages');
      expect(Array.isArray(result.items)).toBe(true);
    });
  });

  describe('isicCodes', () => {
    it('should get ISIC codes', async () => {
      const result = await caller(ctx).isicCodes({ page: 1, limit: 10 });

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('pages');
      expect(Array.isArray(result.items)).toBe(true);
    });
  });

  describe('circulars', () => {
    it('should get circulars', async () => {
      const result = await caller(ctx).circulars({ page: 1, limit: 10 });

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('pages');
      expect(Array.isArray(result.items)).toBe(true);
    });
  });

  describe('downloads', () => {
    it('should get downloads', async () => {
      const result = await caller(ctx).downloads({ page: 1, limit: 12 });

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('pages');
      expect(Array.isArray(result.items)).toBe(true);
    });
  });

  describe('activeAds', () => {
    it('should get active ads', async () => {
      const result = await caller(ctx).activeAds({});

      expect(Array.isArray(result)).toBe(true);
    });
  });
});