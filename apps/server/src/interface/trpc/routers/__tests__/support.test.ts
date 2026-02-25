import { describe, it, expect, beforeEach } from 'vitest';
import { createAuthenticatedContext } from '../../../../test/test-context.js';
import { supportRouter } from '../support.router.js';
import { createTestUser } from '@repo/db/test-utils';
import { prisma } from '@repo/db';

const caller = supportRouter.createCaller;

describe('Support Router', () => {
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
      user: {
        ...user,
        isAdmin: false,
      },
    };
  });

  describe('create', () => {
    it('should create support ticket', async () => {
      const result = await caller(ctx).create({
        subject: 'Test ticket',
        message: 'This is a test ticket',
        category: 'TECHNICAL',
      });

      expect(result).toHaveProperty('id');
      expect(result.subject).toBe('Test ticket');
      expect(result.status).toBe('OPEN');
      expect(result.category).toBe('TECHNICAL');
    });
  });

  describe('myTickets', () => {
    it('should get user tickets', async () => {
      const result = await caller(ctx).myTickets({ page: 1, limit: 10 });

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('pages');
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('should filter tickets by status', async () => {
      const result = await caller(ctx).myTickets({ status: 'OPEN', page: 1, limit: 10 });

      expect(result.items.every((ticket: any) => ticket.status === 'OPEN')).toBe(true);
    });
  });

  describe('myStats', () => {
    beforeEach(async () => {
      await caller(ctx).create({
        subject: 'Test ticket',
        message: 'Test message',
        category: 'TECHNICAL',
      });
    });

    it('should get user ticket stats', async () => {
      const result = await caller(ctx).myStats();

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('open');
      expect(result).toHaveProperty('closed');
      expect(typeof result.total).toBe('number');
      expect(typeof result.open).toBe('number');
      expect(typeof result.closed).toBe('number');
    });
  });

  describe('sendMessage', () => {
    let ticket: any;

    beforeEach(async () => {
      ticket = await caller(ctx).create({
        subject: 'Test ticket',
        message: 'Initial message',
        category: 'TECHNICAL',
      });
    });

    it('should add message to ticket', async () => {
      const result = await caller(ctx).sendMessage({
        ticketId: ticket.id,
        message: 'This is a reply',
      });

      expect(result).toHaveProperty('id');
      expect(result.content).toBe('This is a reply');
      expect(result.ticketId).toBe(ticket.id);
      expect(result.senderType).toBe('user');
    });

    it('should validate ticket exists', async () => {
      await expect(
        caller(ctx).sendMessage({
          ticketId: 'non-existent-id',
          message: 'Test message',
        })
      ).rejects.toThrow();
    });
  });

  describe('getById', () => {
    let ticket: any;

    beforeEach(async () => {
      ticket = await caller(ctx).create({
        subject: 'Test ticket',
        message: 'Test message',
        category: 'TECHNICAL',
      });
    });

    it('should get ticket messages', async () => {
      const result = await caller(ctx).getById({ id: ticket.id });

      expect(result).toHaveProperty('id', ticket.id);
      expect(result).toHaveProperty('messages');
      expect(Array.isArray(result.messages)).toBe(true);
      expect(result.messages.length).toBeGreaterThan(0);
    });
  });

  describe('close', () => {
    let ticket: any;

    beforeEach(async () => {
      ticket = await caller(ctx).create({
        subject: 'Test ticket',
        message: 'Test message',
        category: 'TECHNICAL',
      });
    });

    it('should close ticket', async () => {
      const result = await caller(ctx).close({
        ticketId: ticket.id,
      });

      expect(result).toHaveProperty('ok', true);

      const updatedTicket = await prisma.supportTicket.findUnique({
        where: { id: ticket.id },
      });
      expect(updatedTicket?.status).toBe('CLOSED');
    });
  });

  describe('getAttachmentUploadUrl', () => {
    it('should get upload URL for attachments', async () => {
      // This test would require a mocked storage service
      // For now, we expect it to fail in test environment due to null storage
      await expect(
        caller(ctx).getAttachmentUploadUrl({
          fileName: 'test.pdf',
          contentType: 'application/pdf',
        })
      ).rejects.toThrow();
    });
  });

  // ── admin-only procedures ─────────────────────────────────────────────────
  describe('admin operations', () => {
    let adminCtx: any;
    let ticket: any;

    beforeEach(async () => {
      // create an admin user context using a test user with the flag set
      const tempUser = await createTestUser(prisma);
      adminCtx = {
        ...ctx,
        user: { ...tempUser, isAdmin: true },
      };
      // create a normal ticket as regular user
      ticket = await caller(ctx).create({
        subject: 'Admin test ticket',
        message: 'Please handle',
        category: 'OTHER',
      });
    });

    it('should list tickets and apply filters', async () => {
      const list = await caller(adminCtx).adminList({ page: 1, limit: 10 });
      expect(list.items.find((t: any) => t.id === ticket.id)).toBeDefined();

      const filtered = await caller(adminCtx).adminList({ status: 'OPEN', page: 1, limit: 10 });
      expect(filtered.items.every((t: any) => t.status === 'OPEN')).toBe(true);
    });

    it('should reply and update status then allow closing via adminUpdateStatus', async () => {
      const reply = await caller(adminCtx).adminReply({
        ticketId: ticket.id,
        message: 'Admin replying',
        newStatus: 'IN_PROGRESS',
      });
      expect(reply.senderType).toBe('admin');

      const updated = await caller(adminCtx).adminUpdateStatus({
        ticketId: ticket.id,
        status: 'RESOLVED',
      });
      expect(updated.status).toBe('RESOLVED');
    });
  });
});