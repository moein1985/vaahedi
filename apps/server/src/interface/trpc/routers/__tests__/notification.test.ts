import { describe, it, expect, beforeEach } from 'vitest';
import { createTestContext, createAuthenticatedContext } from '../../../../test/test-context.js';
import { notificationRouter } from '../notification.router.js';

const caller = notificationRouter.createCaller;
import { prisma } from '@repo/db';

// skip if DATABASE_URL missing
if (!process.env.DATABASE_URL) {
  describe.skip('Notification Router', () => {
    it('skipped because DATABASE_URL not set', () => {});
  });
} else {
  describe('Notification Router', () => {
    let ctx: any;

    beforeEach(async () => {
      ctx = await createAuthenticatedContext(prisma);
      // make current user admin for create
      ctx.user.isAdmin = true;
      // clear notifications
      await prisma.notification.deleteMany({});
    });

    it('should create a notification as admin', async () => {
      const input = {
        userId: ctx.user.id,
        type: 'NEW_MESSAGE' as const,
        title: 'hello',
        message: 'world',
      };
      const result = await caller(ctx).create(input);
      expect(result).toHaveProperty('id');
      expect(result.title).toBe('hello');
    });

    it('should list notifications with pagination', async () => {
      // create a couple
      await prisma.notification.createMany({ data: [
        { userId: ctx.user.id, type: 'NEW_MESSAGE', title: 'a', message: 'a' },
        { userId: ctx.user.id, type: 'NEW_MESSAGE', title: 'b', message: 'b' },
      ]});
      const res = await caller(ctx).list({ page: 1, limit: 10, unreadOnly: false });
      expect(res.notifications.length).toBeGreaterThanOrEqual(2);
      expect(res.pagination.total).toBeGreaterThanOrEqual(2);
    });

    it('should count unread notifications', async () => {
      await prisma.notification.create({ data: { userId: ctx.user.id, type: 'NEW_MESSAGE', title: 'c', message: 'c', isRead: false } });
      const count = await caller(ctx).unreadCount();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    it('should mark specific notifications as read', async () => {
      const note = await prisma.notification.create({ data: { userId: ctx.user.id, type: 'NEW_MESSAGE', title: 'd', message: 'd', isRead: false } });
      const r = await caller(ctx).markAsRead({ ids: [note.id] });
      expect(r.success).toBe(true);
      const fresh = await prisma.notification.findUnique({ where: { id: note.id } });
      expect(fresh?.isRead).toBe(true);
    });

    it('should mark all as read', async () => {
      await prisma.notification.createMany({ data: [
        { userId: ctx.user.id, type: 'NEW_MESSAGE', title: 'e', message: 'e', isRead: false },
        { userId: ctx.user.id, type: 'NEW_MESSAGE', title: 'f', message: 'f', isRead: false },
      ]});
      const r = await caller(ctx).markAllAsRead();
      expect(r.success).toBe(true);
      const unread = await prisma.notification.count({ where: { userId: ctx.user.id, isRead: false } });
      expect(unread).toBe(0);
    });
  });
}
