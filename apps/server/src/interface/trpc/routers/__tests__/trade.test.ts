import { describe, it, expect, beforeEach } from 'vitest';
import { createAuthenticatedContext } from '../../../../test/test-context.js';
import { tradeRouter } from '../trade.router.js';
import { createTestUser, createTestProduct } from '@repo/db/test-utils';
import { prisma } from '@repo/db';

const caller = tradeRouter.createCaller;

describe('Trade Router', () => {
  let ctx: any;
  let user: any;
  let product: any;

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
    product = await createTestProduct(prisma, user.id, { isApproved: true });
  });

  describe('createRequest', () => {
    it('should create trade request', async () => {
      const result = await caller(ctx).createRequest({
        productId: product.id,
        type: 'BUY',
        quantity: '10',
        targetPrice: '100',
      });

      expect(result).toHaveProperty('id');
      expect(result.type).toBe('BUY');
      expect(result.quantity).toBe('10');
      expect(result.targetPrice).toBe('100');
      expect(result.status).toBe('PENDING');
    });

    it('should validate product exists and is approved', async () => {
      const unapprovedProduct = await createTestProduct(prisma, user.id, { isApproved: false });

      await expect(
        caller(ctx).createRequest({
          productId: unapprovedProduct.id,
          type: 'BUY',
          quantity: '10',
          targetPrice: '100',
        })
      ).rejects.toThrow();
    });
  });

  describe('myRequests', () => {
    beforeEach(async () => {
      await caller(ctx).createRequest({
        productId: product.id,
        type: 'BUY',
        quantity: '5',
        targetPrice: '100',
      });
    });

    it('should list user trade requests', async () => {
      const result = await caller(ctx).myRequests({ page: 1, limit: 10 });

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items[0]).toHaveProperty('requesterId', user.id);
    });
  });

  describe('matchRequests', () => {
    let buyRequest: any;
    let sellRequest: any;

    beforeEach(async () => {
      buyRequest = await caller(ctx).createRequest({
        productId: product.id,
        type: 'BUY',
        quantity: '10',
        targetPrice: '100',
      });

      const sellContext = await createAuthenticatedContext(prisma);
      sellRequest = await tradeRouter.createCaller(sellContext as any).createRequest({
        productId: product.id,
        type: 'SELL',
        quantity: '10',
        targetPrice: '100',
      });
    });

    it('should match trade requests', async () => {
      // Create admin context for this admin-only operation
      const adminUser = await createTestUser(prisma);
      await prisma.adminProfile.create({
        data: {
          userId: adminUser.id,
          adminRole: 'SUPER_ADMIN',
        },
      });
      const adminCtx = {
        db: prisma,
        req: { headers: {}, ip: '127.0.0.1', cookies: {} },
        res: { setCookie: () => {}, clearCookie: () => {} },
        cache: null,
        storage: null,
        ai: null,
        user: {
          ...adminUser,
          isAdmin: true,
          adminRole: 'SUPER_ADMIN',
        },
      };
      const adminCaller = tradeRouter.createCaller(adminCtx as any);

      const result = await adminCaller.matchRequests({
        buyRequestId: buyRequest.id,
        sellRequestId: sellRequest.id,
      });

      expect(result).toHaveProperty('message');
      expect(result.message).toBe('درخواست‌ها با موفقیت تطبیق یافتند');
    });
  });

  // describe('executeTrade', () => {
  //   let buyRequest: any;
  //   let sellRequest: any;

  //   beforeEach(async () => {
  //     buyRequest = await caller(ctx).createRequest({
  //       productId: product.id,
  //       type: 'BUY',
  //       quantity: '10',
  //       targetPrice: '100',
  //     });

  //     const sellContext = await createAuthenticatedContext(prisma);
  //     sellRequest = await tradeRouter.createCaller(sellContext).createRequest({
  //       productId: product.id,
  //       type: 'SELL',
  //       quantity: '10',
  //       targetPrice: '100',
  //     });
  //   });

  //   it('should execute trade', async () => {
  //     const result = await caller(ctx).executeTrade({
  //       buyRequestId: buyRequest.id,
  //       sellRequestId: sellRequest.id,
  //     });

  //     expect(result).toHaveProperty('id');
  //     expect(result).toHaveProperty('status', 'COMPLETED');

  //     // Check if requests are updated
  //     const updatedBuyRequest = await prisma.tradeRequest.findUnique({
  //       where: { id: buyRequest.id },
  //     });
  //     expect(updatedBuyRequest?.status).toBe('COMPLETED');
  //   });
  // });
});
