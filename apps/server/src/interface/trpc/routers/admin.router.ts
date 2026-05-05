import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { TRPCError } from '@trpc/server';
import { router, adminProcedure } from '../trpc.js';
import { UserStatus, VerificationStatus, TradeRequestStatus } from '@repo/shared';

const MANAGEABLE_ADMIN_ROLES = ['EXPERT', 'MEDIA_SUPERVISOR', 'ANALYST'] as const;
const ALL_ADMIN_ROLES = ['SUPER_ADMIN', ...MANAGEABLE_ADMIN_ROLES] as const;

type AdminRoleName = (typeof ALL_ADMIN_ROLES)[number];

function assertSuperAdmin(user: { adminRole?: string } | null): void {
  if (!user || user.adminRole !== 'SUPER_ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'فقط ادمین کل اجازه مدیریت ادمین‌ها را دارد',
    });
  }
}

function assertAdminRole(
  user: { adminRole?: string } | null,
  allowedRoles: readonly AdminRoleName[],
  message = 'شما اجازه دسترسی به این بخش را ندارید',
): void {
  if (!user?.adminRole || (user.adminRole !== 'SUPER_ADMIN' && !allowedRoles.includes(user.adminRole as AdminRoleName))) {
    throw new TRPCError({ code: 'FORBIDDEN', message });
  }
}

// ─── Admin Router ─────────────────────────────────────────────────────────────

export const adminRouter = router({
  // ── مدیریت ادمین‌ها (فقط SUPER_ADMIN) ───────────────────────────────────
  listAdmins: adminProcedure.query(async ({ ctx }) => {
    assertSuperAdmin(ctx.user);

    return ctx.db.adminProfile.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            userCode: true,
            mobile: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });
  }),

  createAdmin: adminProcedure
    .input(
      z.object({
        userCode: z.string().min(4).max(32),
        password: z.string().min(8).max(64),
        mobile: z.string().regex(/^09\d{9}$/, 'شماره همراه نامعتبر است'),
        email: z.string().email().optional(),
        adminRole: z.enum(MANAGEABLE_ADMIN_ROLES),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertSuperAdmin(ctx.user);

      const existingByUserCode = await ctx.db.user.findUnique({ where: { userCode: input.userCode } });
      if (existingByUserCode) {
        throw new TRPCError({ code: 'CONFLICT', message: 'این نام کاربری قبلا ثبت شده است' });
      }

      const existingByMobile = await ctx.db.user.findUnique({ where: { mobile: input.mobile } });
      if (existingByMobile) {
        throw new TRPCError({ code: 'CONFLICT', message: 'این شماره همراه قبلا ثبت شده است' });
      }

      if (input.email) {
        const existingByEmail = await ctx.db.user.findUnique({ where: { email: input.email } });
        if (existingByEmail) {
          throw new TRPCError({ code: 'CONFLICT', message: 'این ایمیل قبلا ثبت شده است' });
        }
      }

      const passwordHash = await bcrypt.hash(input.password, 12);

      const admin = await ctx.db.user.create({
        data: {
          userCode: input.userCode,
          membershipType: 'INDIVIDUAL',
          role: 'TRADER',
          status: 'ACTIVE',
          mobile: input.mobile,
          email: input.email,
          passwordHash,
          agreedToTerms: true,
          agreedToTermsAt: new Date(),
          adminProfile: {
            create: {
              adminRole: input.adminRole,
            },
          },
        },
        include: {
          adminProfile: true,
        },
      });

      return {
        ok: true,
        admin: {
          id: admin.id,
          userCode: admin.userCode,
          mobile: admin.mobile,
          email: admin.email,
          status: admin.status,
          adminRole: admin.adminProfile?.adminRole,
        },
      };
    }),

  updateAdminRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        adminRole: z.enum(MANAGEABLE_ADMIN_ROLES),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertSuperAdmin(ctx.user);

      const current = await ctx.db.adminProfile.findUnique({
        where: { userId: input.userId },
      });

      if (!current) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'پروفایل ادمین یافت نشد' });
      }

      if (current.adminRole === 'SUPER_ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'نقش ادمین کل قابل تغییر نیست' });
      }

      const updated = await ctx.db.adminProfile.update({
        where: { userId: input.userId },
        data: { adminRole: input.adminRole },
      });

      return { ok: true, adminProfile: updated };
    }),

  removeAdmin: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      assertSuperAdmin(ctx.user);

      if (ctx.user?.id === input.userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'امکان حذف دسترسی ادمین برای خودتان وجود ندارد' });
      }

      const target = await ctx.db.adminProfile.findUnique({ where: { userId: input.userId } });
      if (!target) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'پروفایل ادمین یافت نشد' });
      }

      if (target.adminRole === 'SUPER_ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'ادمین کل قابل حذف نیست' });
      }

      await ctx.db.adminProfile.delete({ where: { userId: input.userId } });
      return { ok: true };
    }),

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
      assertAdminRole(ctx.user, ['EXPERT']);

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
      assertAdminRole(ctx.user, ['EXPERT']);

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
      assertAdminRole(ctx.user, ['EXPERT']);

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
      assertAdminRole(ctx.user, ['EXPERT']);

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
      assertAdminRole(ctx.user, ['EXPERT']);

      const result = await ctx.db.$transaction(async (tx) => {
        const doc = await tx.document.update({
          where: { id: input.documentId },
          data: {
            status: input.status as VerificationStatus,
            rejectionReason: input.rejectionReason,
            verifiedAt: new Date(),
            verifiedById: ctx.user!.id,
          },
          include: { profile: { select: { id: true, userId: true } } },
        });

        if (input.status === 'REJECTED') {
          await tx.userProfile.update({
            where: { id: doc.profile.id },
            data: {
              verificationStatus: VerificationStatus.NEEDS_REVISION,
              rejectionReason: input.rejectionReason,
            },
          });

          return { doc, activated: false };
        }

        const profileDocuments = await tx.document.findMany({
          where: { profileId: doc.profile.id },
          select: { status: true },
        });

        const allDocumentsApproved =
          profileDocuments.length > 0 &&
          profileDocuments.every((profileDoc) => profileDoc.status === VerificationStatus.APPROVED);

        if (!allDocumentsApproved) {
          return { doc, activated: false };
        }

        await tx.userProfile.update({
          where: { id: doc.profile.id },
          data: {
            verificationStatus: VerificationStatus.APPROVED,
            verifiedAt: new Date(),
            verifiedById: ctx.user!.id,
            rejectionReason: null,
          },
        });

        await tx.user.update({
          where: { id: doc.profile.userId },
          data: { status: UserStatus.ACTIVE },
        });

        return { doc, activated: true };
      });

      // ایجاد اعلان برای کاربر
      await ctx.db.notification.create({
        data: {
          userId: result.doc.profile.userId,
          type: input.status === 'APPROVED' ? 'DOCUMENT_VERIFIED' : 'SYSTEM_ANNOUNCEMENT',
          title: result.activated
            ? 'حساب شما فعال شد'
            : input.status === 'APPROVED'
              ? 'مدرک شما تأیید شد'
              : 'مدرک شما نیاز به اصلاح دارد',
          message: result.activated
            ? 'مدارک شما توسط ادمین تأیید شد و حساب شما فعال شد. اکنون می‌توانید از تمام امکانات پلتفرم استفاده کنید.'
            : input.status === 'APPROVED'
              ? 'یکی از مدارک شما تأیید شد. پس از تأیید همه مدارک، حساب شما فعال می‌شود.'
              : `مدرک شما رد شد. دلیل: ${input.rejectionReason || 'نامشخص'}`,
        },
      });

      return { ok: true, document: result.doc, activated: result.activated };
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
      assertAdminRole(ctx.user, ['MEDIA_SUPERVISOR']);

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
      assertAdminRole(ctx.user, ['MEDIA_SUPERVISOR']);

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
      assertAdminRole(ctx.user, ['ANALYST']);

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
      assertAdminRole(ctx.user, ['MEDIA_SUPERVISOR']);

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
      assertAdminRole(ctx.user, ['MEDIA_SUPERVISOR']);

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
      assertAdminRole(ctx.user, ['MEDIA_SUPERVISOR']);

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
      assertAdminRole(ctx.user, ['MEDIA_SUPERVISOR']);

      const key = `admin/${Date.now()}-${input.fileName}`;
      const url = await ctx.storage.getPresignedUploadUrl(key, 'application/octet-stream', 600);
      return { url, key };
    }),
});
