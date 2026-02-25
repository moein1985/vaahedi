import { z } from 'zod';
import { router, protectedProcedure } from '../trpc.js';

export const notificationRouter = router({
  // ── لیست اعلان‌ها ──────────────────────────────────────────────────────────
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
        unreadOnly: z.boolean().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;
      const where: Record<string, unknown> = { userId: ctx.user.id };
      if (input.unreadOnly) where['isRead'] = false;

      const [notifications, total] = await Promise.all([
        ctx.db.notification.findMany({
          where,
          skip,
          take: input.limit,
          orderBy: { createdAt: 'desc' },
        }),
        ctx.db.notification.count({ where }),
      ]);

      return {
        notifications,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
        },
      };
    }),

  // ── تعداد اعلان‌های خوانده نشده ─────────────────────────────────────────────
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.notification.count({
      where: { userId: ctx.user.id, isRead: false },
    });
  }),

  // ── علامت‌گذاری به عنوان خوانده شده ────────────────────────────────────────
  markAsRead: protectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.notification.updateMany({
        where: {
          id: { in: input.ids },
          userId: ctx.user.id,
        },
        data: { isRead: true, readAt: new Date() },
      });
      return { success: true };
    }),

  // ── علامت‌گذاری همه به عنوان خوانده شده ────────────────────────────────────
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.notification.updateMany({
      where: { userId: ctx.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }),

  // ── ایجاد اعلان (برای استفاده داخلی) ──────────────────────────────────────
  create: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        type: z.enum([
          'TRADE_REQUEST_MATCH',
          'PRODUCT_APPROVED',
          'DOCUMENT_VERIFIED',
          'NEW_MESSAGE',
          'SYSTEM_ANNOUNCEMENT',
        ]),
        title: z.string(),
        message: z.string(),
        data: z.record(z.any()).optional(),
        link: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // فقط ادمین‌ها می‌توانند اعلان ایجاد کنند
      if (!ctx.user.isAdmin) {
        throw new Error('Unauthorized');
      }

      return ctx.db.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          message: input.message,
          data: input.data,
          link: input.link,
        },
      });
    }),
});
