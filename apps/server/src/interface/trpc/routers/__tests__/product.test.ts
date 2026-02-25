import { describe, it, expect, beforeEach } from 'vitest';
import { createAuthenticatedContext } from '../../../../test/test-context.js';
import { productRouter } from '../product.router.js';
import { createTestProduct, createTestUser } from '@repo/db/test-utils';
import { prisma } from '@repo/db';

const caller = productRouter.createCaller;

describe('Product Router', () => {
  let ctx: any;
  let user: any;

  beforeEach(async () => {
    user = await createTestUser(prisma);
    ctx = {
      db: prisma,
      user,
    };
  });

  describe('create', () => {
    it('should create a product', async () => {
      const result = await caller(ctx).create({
        nameFa: 'محصول تست',
        nameEn: 'Test Product',
        hsCode: '123456789',
        commodityGroup: 'INDUSTRIAL',
        technicalSpecs: 'مشخصات فنی تست',
        origin: 'DOMESTIC_FACTORY',
        deliveryTerms: 'FOB',
        deliveryLocation: 'تهران',
        minOrderQuantity: '100',
        preparationTimeDays: 7,
        paymentMethod: 'LC',
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('message');
    });

    it('should validate required fields', async () => {
      await expect(
        caller(ctx).create({
          nameFa: '',
          nameEn: 'Test Product',
          hsCode: '123456789',
          commodityGroup: 'INDUSTRIAL',
          technicalSpecs: 'مشخصات فنی تست',
          origin: 'DOMESTIC_FACTORY',
          deliveryTerms: 'FOB',
          deliveryLocation: 'تهران',
          minOrderQuantity: '100',
          preparationTimeDays: 7,
          paymentMethod: 'LC',
        })
      ).rejects.toThrow();
    });
  });

  describe('getById', () => {
    it('should get product by id', async () => {
      const product = await createTestProduct(prisma, user.id);

      const result = await caller(ctx).getById({ id: product.id });

      expect(result).toHaveProperty('id', product.id);
      expect(result).toHaveProperty('nameFa', product.nameFa);
    });

    it('should not get non-existent product', async () => {
      await expect(
        caller(ctx).getById({ id: 'cmlwb9b9m0000uje0rbf18n4f' })
      ).rejects.toThrow('محصول یافت نشد');
    });
  });

  describe('myProducts', () => {
    beforeEach(async () => {
      await createTestProduct(prisma, user.id);
      await createTestProduct(prisma, user.id);
    });

    it('should get user products', async () => {
      const result = await caller(ctx).myProducts({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result).toHaveProperty('pagination');
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      await createTestProduct(prisma, user.id, { isApproved: true });
    });

    it('should list approved products', async () => {
      const result = await caller(ctx).list({ page: 1, limit: 10 });

      expect(result.data.length).toBeGreaterThan(0);
      expect(result).toHaveProperty('pagination');
    });

    it('should filter by search query', async () => {
      const result = await caller(ctx).list({
        page: 1,
        limit: 10,
        q: 'محصول تست'
      });

      expect(result.data.length).toBeGreaterThan(0);
    });
  });
});