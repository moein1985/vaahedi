import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, adminProcedure } from '../trpc.js';
import {
  createOccupationCategorySchema,
  updateOccupationCategorySchema,
  occupationCategoryListSchema,
  createHarvestCalendarSchema,
  updateHarvestCalendarSchema,
  harvestCalendarListSchema,
  createMarketInsightSchema,
  updateMarketInsightSchema,
  marketInsightListSchema,
} from '@repo/shared';

// ─── Occupation Taxonomy Sub-router ──────────────────────────────────────────

const taxonomyRouter = router({
  // عمومی: فهرست دسته‌بندی‌های شغلی (درختی)
  list: publicProcedure
    .input(occupationCategoryListSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input.onlyActive) where.isActive = true;
      if (input.parentId !== undefined) {
        where.parentId = input.parentId ?? null;
      }
      return ctx.db.occupationCategory.findMany({
        where,
        include: { children: { where: input.onlyActive ? { isActive: true } : {} } },
        orderBy: [{ sortOrder: 'asc' }, { nameFa: 'asc' }],
      });
    }),

  // عمومی: همه دسته‌ها به صورت flat (برای select box)
  listFlat: publicProcedure
    .input(z.object({ onlyActive: z.boolean().optional().default(true) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.occupationCategory.findMany({
        where: input.onlyActive ? { isActive: true } : {},
        orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }, { nameFa: 'asc' }],
      });
    }),

  // ادمین: ایجاد دسته
  create: adminProcedure
    .input(createOccupationCategorySchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.occupationCategory.findUnique({
        where: { code: input.code },
      });
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: `کد "${input.code}" قبلاً ثبت شده است` });
      }
      return ctx.db.occupationCategory.create({ data: input });
    }),

  // ادمین: ویرایش دسته
  update: adminProcedure
    .input(z.object({ id: z.string().cuid(), data: updateOccupationCategorySchema }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.occupationCategory.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  // ادمین: حذف دسته (فقط اگر فرزند یا کاربر نداشته باشد)
  delete: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const [childCount, profileCount] = await Promise.all([
        ctx.db.occupationCategory.count({ where: { parentId: input.id } }),
        ctx.db.userProfile.count({ where: { occupationCategoryId: input.id } }),
      ]);
      if (childCount > 0) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'ابتدا دسته‌های فرزند را حذف کنید' });
      }
      if (profileCount > 0) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: `این دسته در ${profileCount} پروفایل استفاده شده است` });
      }
      await ctx.db.occupationCategory.delete({ where: { id: input.id } });
      return { success: true };
    }),
});

// ─── Harvest Calendar Sub-router ─────────────────────────────────────────────

const harvestRouter = router({
  // عمومی: فهرست تقویم برداشت
  list: publicProcedure
    .input(harvestCalendarListSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input.onlyActive) where.isActive = true;
      if (input.province) where.province = { in: [input.province, null] };
      if (input.month) {
        where.harvestStartMonth = { lte: input.month };
        where.harvestEndMonth = { gte: input.month };
      }
      const [items, total] = await Promise.all([
        ctx.db.harvestCalendar.findMany({
          where,
          orderBy: [{ harvestStartMonth: 'asc' }, { cropNameFa: 'asc' }],
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.db.harvestCalendar.count({ where }),
      ]);
      return { items, total, page: input.page, limit: input.limit };
    }),

  // ادمین: ایجاد
  create: adminProcedure
    .input(createHarvestCalendarSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.harvestCalendar.create({ data: input });
    }),

  // ادمین: ویرایش
  update: adminProcedure
    .input(z.object({ id: z.string().cuid(), data: updateHarvestCalendarSchema }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.harvestCalendar.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  // ادمین: حذف
  delete: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.harvestCalendar.delete({ where: { id: input.id } });
      return { success: true };
    }),
});

// ─── Market Insight Sub-router ────────────────────────────────────────────────

const marketRouter = router({
  // عمومی: فهرست تحلیل‌های بازار
  list: publicProcedure
    .input(marketInsightListSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input.onlyPublished) where.isPublished = true;
      if (input.insightType) where.insightType = input.insightType;
      if (input.commodity) {
        where.OR = [
          { commodityFa: { contains: input.commodity } },
          { commodityEn: { contains: input.commodity, mode: 'insensitive' } },
        ];
      }
      const [items, total] = await Promise.all([
        ctx.db.marketInsight.findMany({
          where,
          orderBy: { publishedAt: 'desc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          select: {
            id: true,
            title: true,
            commodityFa: true,
            commodityEn: true,
            insightType: true,
            content: true,
            dataDate: true,
            sourceUrl: true,
            imageKey: true,
            tags: true,
            isPublished: true,
            publishedAt: true,
            createdAt: true,
          },
        }),
        ctx.db.marketInsight.count({ where }),
      ]);
      return { items, total, page: input.page, limit: input.limit };
    }),

  // ادمین: همه (شامل unpublished)
  listAdmin: adminProcedure
    .input(marketInsightListSchema.omit({ onlyPublished: true }))
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input.insightType) where.insightType = input.insightType;
      if (input.commodity) {
        where.OR = [
          { commodityFa: { contains: input.commodity } },
          { commodityEn: { contains: input.commodity, mode: 'insensitive' } },
        ];
      }
      const [items, total] = await Promise.all([
        ctx.db.marketInsight.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.db.marketInsight.count({ where }),
      ]);
      return { items, total, page: input.page, limit: input.limit };
    }),

  // ادمین: ایجاد
  create: adminProcedure
    .input(createMarketInsightSchema)
    .mutation(async ({ ctx, input }) => {
      const { dataDate, ...rest } = input;
      return ctx.db.marketInsight.create({
        data: {
          ...rest,
          dataDate: dataDate ? new Date(`${dataDate}T00:00:00.000Z`) : null,
          publishedAt: rest.isPublished ? new Date() : null,
          authorId: ctx.user.id,
        },
      });
    }),

  // ادمین: ویرایش
  update: adminProcedure
    .input(z.object({ id: z.string().cuid(), data: updateMarketInsightSchema }))
    .mutation(async ({ ctx, input }) => {
      const { dataDate, isPublished, ...rest } = input.data;
      const existing = await ctx.db.marketInsight.findUniqueOrThrow({ where: { id: input.id } });
      return ctx.db.marketInsight.update({
        where: { id: input.id },
        data: {
          ...rest,
          ...(dataDate !== undefined ? { dataDate: new Date(`${dataDate}T00:00:00.000Z`) } : {}),
          ...(isPublished !== undefined
            ? {
                isPublished,
                publishedAt: isPublished && !existing.isPublished ? new Date() : existing.publishedAt,
              }
            : {}),
        },
      });
    }),

  // ادمین: حذف
  delete: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.marketInsight.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // ادمین: انتشار/پیش‌نویس سریع
  publish: adminProcedure
    .input(z.object({ id: z.string().cuid(), isPublished: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.marketInsight.update({
        where: { id: input.id },
        data: {
          isPublished: input.isPublished,
          publishedAt: input.isPublished ? new Date() : null,
        },
      });
    }),
});

// ─── Combined Agri Router ─────────────────────────────────────────────────────

export const agriRouter = router({
  taxonomy: taxonomyRouter,
  harvest: harvestRouter,
  market: marketRouter,
});
