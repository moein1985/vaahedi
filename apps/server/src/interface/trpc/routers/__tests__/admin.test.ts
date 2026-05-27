import { describe, it, expect, beforeEach } from 'vitest';
import { createAuthenticatedContext } from '../../../../test/test-context.js';
import { adminRouter } from '../admin.router.js';
import { createTestUser, createTestProduct } from '@repo/db/test-utils';
import { prisma } from '@repo/db';
import { DocumentType } from '@repo/db';

const caller = adminRouter.createCaller;

type AuditRow = {
  action: string;
  entityType: string;
  entityId: string;
  actorUserId: string;
};

describe('Admin Router', () => {
  let ctx: any;
  let adminUser: any;

  beforeEach(async () => {
    const user = await createTestUser(prisma);
    adminUser = await prisma.adminProfile.create({
      data: {
        userId: user.id,
        adminRole: 'SUPER_ADMIN',
      },
      include: {
        user: true,
      },
    }).then(profile => profile.user);
    ctx = {
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
  });

  describe('dashboard', () => {
    beforeEach(async () => {
      // Create some test data
      await createTestUser(prisma, { status: 'PENDING' });
      await createTestUser(prisma, { status: 'ACTIVE' });
      await createTestProduct(prisma, adminUser.id, { isApproved: false });
    });

    it('should get dashboard stats', async () => {
      const result = await caller(ctx).dashboard();

      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('products');
      expect(result).toHaveProperty('tradeRequests');
      expect(result).toHaveProperty('tickets');

      expect(result.users.total).toBeGreaterThan(0);
      expect(result.products.pending).toBeGreaterThan(0);
    });
  });

  describe('userList', () => {
    beforeEach(async () => {
      await createTestUser(prisma, { mobile: '09111111111' });
      await createTestUser(prisma, { mobile: '09222222222' });
    });

    it('should list users', async () => {
      const result = await caller(ctx).userList({ page: 1, limit: 10 });

      expect(result.items.length).toBeGreaterThan(0);
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
    });

    it('should filter users by status', async () => {
      const result = await caller(ctx).userList({
        page: 1,
        limit: 10,
        status: 'ACTIVE'
      });

      expect(result.items.every(item => item.status === 'ACTIVE')).toBe(true);
    });
  });

  describe('pendingProducts', () => {
    beforeEach(async () => {
      await createTestProduct(prisma, adminUser.id, { isApproved: false });
    });

    it('should list pending products', async () => {
      const result = await caller(ctx).pendingProducts({ page: 1, limit: 10 });

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items[0]).toHaveProperty('isApproved', false);
    });
  });

  describe('reviewProduct', () => {
    let product: any;

    beforeEach(async () => {
      product = await createTestProduct(prisma, adminUser.id, { isApproved: false });
    });

    it('should approve product', async () => {
      const result = await caller(ctx).reviewProduct({
        productId: product.id,
        approved: true,
      });

      expect(result).toHaveProperty('ok', true);

      const updatedProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(updatedProduct?.isApproved).toBe(true);
    });

    it('should reject product', async () => {
      const result = await caller(ctx).reviewProduct({
        productId: product.id,
        approved: false,
        rejectionReason: 'دلیل رد',
      });

      expect(result).toHaveProperty('ok', true);

      const updatedProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(updatedProduct?.isApproved).toBe(false);
      expect(updatedProduct?.rejectionReason).toBe('دلیل رد');
    });
  });

  describe('verifyDocument', () => {
    let documentId: string;

    beforeEach(async () => {
      const member = await createTestUser(prisma, { status: 'PENDING' });
      const profile = await prisma.userProfile.create({
        data: {
          userId: member.id,
          verificationStatus: 'PENDING',
        },
      });

      const document = await prisma.document.create({
        data: {
          profileId: profile.id,
          type: DocumentType.BUSINESS_CARD,
          fileName: 'business-card.pdf',
          fileKey: 'documents/test/business-card.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          status: 'PENDING',
        },
      });

      documentId = document.id;
    });

    it('should write audit log when document is reviewed', async () => {
      const result = await caller(ctx).verifyDocument({
        documentId,
        status: 'APPROVED',
      });

      expect(result.ok).toBe(true);

      const rows = await prisma.$queryRaw<AuditRow[]>`
        SELECT "action", "entityType", "entityId", "actorUserId"
        FROM "audit_logs"
        WHERE "action" = ${'ADMIN_DOCUMENT_REVIEWED'}
          AND "entityId" = ${documentId}
        ORDER BY "createdAt" DESC
        LIMIT 1
      `;

      expect(rows[0]?.entityType).toBe('Document');
      expect(rows[0]?.entityId).toBe(documentId);
      expect(rows[0]?.actorUserId).toBe(adminUser.id);
    });
  });
});