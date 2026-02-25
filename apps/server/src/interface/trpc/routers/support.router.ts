import { z } from 'zod';
import { router, protectedProcedure, activeProcedure, adminProcedure } from '../trpc.js';

// ─── Support / Ticket Router ──────────────────────────────────────────────────

const TicketStatus = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);
const TicketCategory = z.enum(['TECHNICAL', 'BILLING', 'TRADE', 'DOCUMENT', 'OTHER']);

export const supportRouter = router({
  // ── ایجاد تیکت ───────────────────────────────────────────────────────────
  create: activeProcedure
    .input(
      z.object({
        subject: z.string().min(5).max(200),
        message: z.string().min(10).max(5000),
        category: TicketCategory.optional().default('OTHER'),
        attachmentKey: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ticket = await ctx.db.supportTicket.create({
        data: {
          subject: input.subject,
          category: input.category,
          status: 'OPEN',
          userId: ctx.user!.id,
          messages: {
            create: {
              content: input.message,
              senderId: ctx.user!.id,
              senderType: 'user',
              attachmentKey: input.attachmentKey,
            },
          },
        },
        include: { messages: true },
      });
      return ticket;
    }),

  // ── لیست تیکت‌های کاربر ──────────────────────────────────────────────────
  myTickets: protectedProcedure
    .input(
      z.object({
        status: TicketStatus.optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;
      const where: Record<string, unknown> = { userId: ctx.user!.id };
      if (input.status) where['status'] = input.status;
      const [items, total] = await Promise.all([
        ctx.db.supportTicket.findMany({
          where,
          skip,
          take: input.limit,
          orderBy: { updatedAt: 'desc' },
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            _count: { select: { messages: true } },
          },
        }),
        ctx.db.supportTicket.count({ where }),
      ]);
      return { items, total, page: input.page, pages: Math.ceil(total / input.limit) };
    }),

  // ── آمار تیکت‌های پشتیبانی کاربر ──────────────────────────────────────────
  myStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, open, closed] = await Promise.all([
      ctx.db.supportTicket.count({ where: { userId: ctx.user!.id } }),
      ctx.db.supportTicket.count({ where: { userId: ctx.user!.id, status: 'OPEN' } }),
      ctx.db.supportTicket.count({ where: { userId: ctx.user!.id, status: 'CLOSED' } }),
    ]);
    return { total, open, closed };
  }),

  // ── جزئیات تیکت ─────────────────────────────────────────────────────────
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const ticket = await ctx.db.supportTicket.findFirst({
        where: {
          id: input.id,
          // admins see all, users see only their own
          ...(ctx.user!.role !== 'ADMIN' && { userId: ctx.user!.id }),
        },
        include: {
          user: { select: { id: true, mobile: true, profile: { select: { companyName: true } } } },
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
      if (!ticket) throw new Error('Ticket not found');
      return ticket;
    }),

  // ── ارسال پیام در تیکت ───────────────────────────────────────────────────
  sendMessage: activeProcedure
    .input(
      z.object({
        ticketId: z.string(),
        message: z.string().min(1).max(5000),
        attachmentKey: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // بررسی دسترسی
      const ticket = await ctx.db.supportTicket.findFirst({
        where: { id: input.ticketId, userId: ctx.user!.id },
      });
      if (!ticket) throw new Error('Ticket not found');
      if (ticket.status === 'CLOSED' || ticket.status === 'RESOLVED') {
        throw new Error('Cannot reply to a closed ticket');
      }

      const [msg] = await ctx.db.$transaction([
        ctx.db.supportMessage.create({
          data: {
            ticketId: input.ticketId,
            content: input.message,
            senderId: ctx.user!.id,
            senderType: 'user',
            attachmentKey: input.attachmentKey,
          },
        }),
        ctx.db.supportTicket.update({
          where: { id: input.ticketId },
          data: { status: 'OPEN', updatedAt: new Date() },
        }),
      ]);
      return msg;
    }),

  // ── بستن تیکت توسط کاربر ─────────────────────────────────────────────────
  close: activeProcedure
    .input(z.object({ ticketId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await ctx.db.supportTicket.findFirst({
        where: { id: input.ticketId, userId: ctx.user!.id },
      });
      if (!ticket) throw new Error('Ticket not found');
      await ctx.db.supportTicket.update({
        where: { id: input.ticketId },
        data: { status: 'CLOSED', closedAt: new Date() },
      });
      return { ok: true };
    }),

  // ── ادمین: لیست همه تیکت‌ها ──────────────────────────────────────────────
  adminList: adminProcedure
    .input(
      z.object({
        status: TicketStatus.optional(),
        category: TicketCategory.optional(),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;
      const where: Record<string, unknown> = {};
      if (input.status) where['status'] = input.status;
      if (input.category) where['category'] = input.category;
      if (input.search) {
        where['OR'] = [
          { subject: { contains: input.search } },
          { user: { mobile: { contains: input.search } } },
        ];
      }
      const [items, total] = await Promise.all([
        ctx.db.supportTicket.findMany({
          where,
          skip,
          take: input.limit,
          orderBy: { updatedAt: 'desc' },
      include: {
            user: { select: { id: true, mobile: true, profile: { select: { companyName: true } } } },
            _count: { select: { messages: true } },
          },
        }),
        ctx.db.supportTicket.count({ where }),
      ]);
      return { items, total, page: input.page, pages: Math.ceil(total / input.limit) };
    }),

  // ── ادمین: پاسخ به تیکت ──────────────────────────────────────────────────
  adminReply: adminProcedure
    .input(
      z.object({
        ticketId: z.string(),
        message: z.string().min(1).max(5000),
        attachmentKey: z.string().optional(),
        newStatus: TicketStatus.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ticket = await ctx.db.supportTicket.findUnique({ where: { id: input.ticketId } });
      if (!ticket) throw new Error('Ticket not found');

      const [msg] = await ctx.db.$transaction([
        ctx.db.supportMessage.create({
          data: {
            ticketId: input.ticketId,
            content: input.message,
            senderId: ctx.user!.id,
            senderType: 'admin',
            attachmentKey: input.attachmentKey,
          },
        }),
        ctx.db.supportTicket.update({
          where: { id: input.ticketId },
          data: {
            status: input.newStatus ?? 'IN_PROGRESS',
            updatedAt: new Date(),
          },
        }),
      ]);
      return msg;
    }),

  // ── ادمین: تغییر وضعیت تیکت ──────────────────────────────────────────────
  adminUpdateStatus: adminProcedure
    .input(
      z.object({
        ticketId: z.string(),
        status: TicketStatus,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.supportTicket.update({
        where: { id: input.ticketId },
        data: {
          status: input.status,
          ...(input.status === 'CLOSED' || input.status === 'RESOLVED'
            ? { closedAt: new Date() }
            : {}),
          updatedAt: new Date(),
        },
      });
    }),

  getAttachmentUploadUrl: activeProcedure
    .input(z.object({ fileName: z.string(), contentType: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const key = `tickets/${ctx.user!.id}/${Date.now()}-${input.fileName}`;
      const url = await ctx.storage.getPresignedUploadUrl(key, 'application/octet-stream', 300);
      return { url, key };
    }),
});
