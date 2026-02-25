import { z } from 'zod';
import { router, adminProcedure } from '../trpc.js';
import { UserStatus, VerificationStatus, TradeRequestStatus } from '@repo/shared';

// ─── Admin Router ─────────────────────────────────────────────────────────────

export const adminRouter = router({
  // ── داشبورد آمار ─────────────────────────────────────────────────────────
  dashboard: adminProcedure.query(async ({ ctx }) => {
    const [
      totalUsers,
      pendingUsers,
      activeUsers,
      totalProducts,
      pendingProducts,
      totalTradeRequests,
      openTradeRequests,
      totalTickets,
      openTickets,
    ] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.user.count({ where: { status: UserStatus.PENDING } }),
      ctx.db.user.count({ where: { status: UserStatus.ACTIVE } }),
      ctx.db.product.count(),
      ctx.db.product.count({ where: { isApproved: false } }),
      ctx.db.tradeRequest.count(),
      ctx.db.tradeRequest.count({ where: { status: TradeRequestStatus.PENDING } }),
      ctx.db.supportTicket.count(),
      ctx.db.supportTicket.count({ where: { status: 'OPEN' } }),
    ]);

    return {
      users: { total: totalUsers, pending: pendingUsers, active: activeUsers },
      products: { total: totalProducts, pending: pendingProducts },
      tradeRequests: { total: totalTradeRequests, open: openTradeRequests },
      tickets: { total: totalTickets, open: openTickets },
    };
  }),

  // ── مدیریت کاربران ────────────────────────────────────────────────────────
  userList: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.nativeEnum(UserStatus).optional(),
        role: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;
      const where: Record<string, unknown> = {};
      if (input.status) where['status'] = input.status;
      if (input.role) where['role'] = input.role;
      if (input.search) {
        where['OR'] = [
          { mobile: { contains: input.search } },
          { email: { contains: input.search } },
          { profile: { companyName: { contains: input.search } } },
        ];
      }
      const [items, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          skip,
          take: input.limit,
          orderBy: { createdAt: 'desc' },
          include: { profile: { select: { companyName: true, unitName: true } } },
        }),
        ctx.db.user.count({ where }),
      ]);
      return { items, total, page: input.page, pages: Math.ceil(total / input.limit) };
    }),

  userById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.user.findUnique({
        where: { id: input.id },
        include: {
          profile: { include: { documents: { orderBy: { createdAt: 'desc' } } } },
          products: { take: 10, orderBy: { createdAt: 'desc' } },
          tradeRequests: { take: 10, orderBy: { createdAt: 'desc' } },
        },
      });
    }),

  updateUserStatus: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        status: z.nativeEnum(UserStatus),
        note: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: input.userId },
        data: { status: input.status },
      });
      return { ok: true, user };
    }),

  // ── مدیریت مدارک ─────────────────────────────────────────────────────────
  pendingDocuments: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;
      const [items, total] = await Promise.all([
        ctx.db.document.findMany({
          where: { status: VerificationStatus.PENDING },
          skip,
          take: input.limit,
          orderBy: { createdAt: 'asc' },
          include: {
            profile: {
              select: {
                companyName: true,
                user: { select: { id: true, mobile: true } },
              },
            },
          },
        }),
        ctx.db.document.count({ where: { status: VerificationStatus.PENDING } }),
      ]);
      return { items, total, page: input.page, pages: Math.ceil(total / input.limit) };
    }),

  verifyDocument: adminProcedure
    .input(
      z.object({
        documentId: z.string(),
        status: z.enum(['APPROVED', 'REJECTED']),
        rejectionReason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.db.document.update({
        where: { id: input.documentId },
        data: {
          status: input.status as VerificationStatus,
          rejectionReason: input.rejectionReason,
          verifiedAt: new Date(),
          verifiedById: ctx.user!.id,
        },
        include: { profile: { select: { userId: true } } },
      });

      // ایجاد اعلان برای کاربر
      await ctx.db.notification.create({
        data: {
          userId: doc.profile.userId,
          type: input.status === 'APPROVED' ? 'DOCUMENT_VERIFIED' : 'SYSTEM_ANNOUNCEMENT',
          title: input.status === 'APPROVED' ? 'مدارک شما تأیید شد' : 'مدارک شما رد شد',
          message: input.status === 'APPROVED'
            ? 'مدارک شما توسط ادمین تأیید شد. اکنون می‌توانید از تمام امکانات پلتفرم استفاده کنید.'
            : `مدارک شما رد شد. دلیل: ${input.rejectionReason || 'نامشخص'}`,
        },
      });

      return { ok: true, document: doc };
    }),

  // ── مدیریت محصولات ────────────────────────────────────────────────────────
  pendingProducts: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;
      const [items, total] = await Promise.all([
        ctx.db.product.findMany({
          where: { isApproved: false },
          skip,
          take: input.limit,
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: { id: true, mobile: true, profile: { select: { companyName: true } } },
            },
          },
        }),
        ctx.db.product.count({ where: { isApproved: false } }),
      ]);
      return { items, total, page: input.page, pages: Math.ceil(total / input.limit) };
    }),

  reviewProduct: adminProcedure
    .input(
      z.object({
        productId: z.string(),
        approved: z.boolean(),
        rejectionReason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.product.update({
        where: { id: input.productId },
        data: {
          isApproved: input.approved,
          approvedAt: input.approved ? new Date() : null,
          approvedById: input.approved ? ctx.user!.id : null,
          rejectionReason: input.rejectionReason,
        },
      });

      // ایجاد اعلان برای کاربر
      await ctx.db.notification.create({
        data: {
          userId: product.userId,
          type: input.approved ? 'PRODUCT_APPROVED' : 'SYSTEM_ANNOUNCEMENT',
          title: input.approved ? 'محصول شما تأیید شد' : 'محصول شما رد شد',
          message: input.approved
            ? 'محصول شما توسط ادمین تأیید شد و اکنون در کاتالوگ نمایش داده می‌شود.'
            : `محصول شما رد شد. دلیل: ${input.rejectionReason || 'نامشخص'}`,
        },
      });

      return { ok: true, product };
    }),

  // ── مدیریت درخواست‌های تجاری ─────────────────────────────────────────────
  tradeRequests: adminProcedure
    .input(
      z.object({
        status: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;
      const where = input.status
        ? { status: input.status as TradeRequestStatus }
        : {};
      const [items, total] = await Promise.all([
        ctx.db.tradeRequest.findMany({
          where,
          skip,
          take: input.limit,
          orderBy: { createdAt: 'desc' },
          include: {
            requester: { select: { id: true, mobile: true, profile: { select: { companyName: true } } } },
          },
        }),
        ctx.db.tradeRequest.count({ where }),
      ]);
      return { items, total, page: input.page, pages: Math.ceil(total / input.limit) };
    }),

  // ── مدیریت تبلیغات ────────────────────────────────────────────────────────
  listAds: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;
      const [items, total] = await Promise.all([
        ctx.db.advertisement.findMany({
          skip,
          take: input.limit,
          orderBy: { createdAt: 'desc' },
        }),
        ctx.db.advertisement.count(),
      ]);
      return { items, total, page: input.page, pages: Math.ceil(total / input.limit) };
    }),

  createAd: adminProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        fileKey: z.string().optional(),
        targetUrl: z.string().url().optional(),
        adType: z.enum(['banner', 'sponsored', 'newsletter']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.advertisement.create({
        data: {
          title: input.title,
          description: input.description,
          fileKey: input.fileKey,
          targetUrl: input.targetUrl,
          adType: input.adType,
          status: 'ACTIVE',
          requesterId: ctx.user!.id,
        },
      });
    }),

  updateAd: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['ACTIVE', 'PAUSED', 'REJECTED', 'EXPIRED']).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.advertisement.update({
        where: { id: input.id },
        data: {
          ...(input.status && { status: input.status }),
        },
      });
    }),

  // ── آپلود URL برای ادمین ─────────────────────────────────────────────────
  getUploadUrl: adminProcedure
    .input(z.object({ fileName: z.string(), contentType: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const key = `admin/${Date.now()}-${input.fileName}`;
      const url = await ctx.storage.getPresignedUploadUrl(key, 'application/octet-stream', 600);
      return { url, key };
    }),
});
