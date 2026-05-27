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
import { writeAuditLog } from '../audit-log.js';

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
      const created = await ctx.db.occupationCategory.create({ data: input });
      await writeAuditLog(ctx.db, {
        actorUserId: ctx.user!.id,
        actorRole: ctx.user?.adminRole ?? null,
        action: 'AGRI_TAXONOMY_CREATED',
        entityType: 'OccupationCategory',
        entityId: created.id,
        payload: {
          code: created.code,
          nameFa: created.nameFa,
          parentId: created.parentId,
          isActive: created.isActive,
          sortOrder: created.sortOrder,
        },
      });
      return created;
    }),

  // ادمین: ویرایش دسته
  update: adminProcedure
    .input(z.object({ id: z.string().cuid(), data: updateOccupationCategorySchema }))
    .mutation(async ({ ctx, input }) => {
      const before = await ctx.db.occupationCategory.findUniqueOrThrow({
        where: { id: input.id },
        select: {
          id: true,
          code: true,
          nameFa: true,
          nameEn: true,
          parentId: true,
          description: true,
          isActive: true,
          sortOrder: true,
        },
      });

      const updated = await ctx.db.occupationCategory.update({
        where: { id: input.id },
        data: input.data,
      });

      await writeAuditLog(ctx.db, {
        actorUserId: ctx.user!.id,
        actorRole: ctx.user?.adminRole ?? null,
        action: 'AGRI_TAXONOMY_UPDATED',
        entityType: 'OccupationCategory',
        entityId: updated.id,
        payload: { before, after: updated },
      });

      return updated;
    }),

  // ادمین: حذف دسته (فقط اگر فرزند یا کاربر نداشته باشد)
  delete: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const [childCount, profileCount, mappingCountRows] = await Promise.all([
        ctx.db.occupationCategory.count({ where: { parentId: input.id } }),
        ctx.db.userProfile.count({ where: { occupationCategoryId: input.id } }),
        ctx.db.$queryRaw<{ count: bigint | number | string }[]>`
          SELECT COUNT(*)::bigint AS "count"
          FROM "occupation_mappings"
          WHERE "occupationCategoryId" = ${input.id}
        `,
      ]);
      const mappingCount = Number(mappingCountRows[0]?.count ?? 0);
      if (childCount > 0) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'ابتدا دسته‌های فرزند را حذف کنید' });
      }
      if (profileCount + mappingCount > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `این دسته در ${profileCount + mappingCount} پروفایل استفاده شده است`,
        });
      }

      const target = await ctx.db.occupationCategory.findUniqueOrThrow({
        where: { id: input.id },
        select: {
          id: true,
          code: true,
          nameFa: true,
          parentId: true,
          isActive: true,
          sortOrder: true,
        },
      });

      await ctx.db.occupationCategory.delete({ where: { id: input.id } });

      await writeAuditLog(ctx.db, {
        actorUserId: ctx.user!.id,
        actorRole: ctx.user?.adminRole ?? null,
        action: 'AGRI_TAXONOMY_DELETED',
        entityType: 'OccupationCategory',
        entityId: target.id,
        payload: target,
      });

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
      const created = await ctx.db.harvestCalendar.create({ data: input });
      await writeAuditLog(ctx.db, {
        actorUserId: ctx.user!.id,
        actorRole: ctx.user?.adminRole ?? null,
        action: 'AGRI_HARVEST_CREATED',
        entityType: 'HarvestCalendar',
        entityId: created.id,
        payload: {
          cropNameFa: created.cropNameFa,
          harvestStartMonth: created.harvestStartMonth,
          harvestEndMonth: created.harvestEndMonth,
          province: created.province,
          isActive: created.isActive,
        },
      });
      return created;
    }),

  // ادمین: ویرایش
  update: adminProcedure
    .input(z.object({ id: z.string().cuid(), data: updateHarvestCalendarSchema }))
    .mutation(async ({ ctx, input }) => {
      const before = await ctx.db.harvestCalendar.findUniqueOrThrow({
        where: { id: input.id },
      });

      const updated = await ctx.db.harvestCalendar.update({
        where: { id: input.id },
        data: input.data,
      });

      await writeAuditLog(ctx.db, {
        actorUserId: ctx.user!.id,
        actorRole: ctx.user?.adminRole ?? null,
        action: 'AGRI_HARVEST_UPDATED',
        entityType: 'HarvestCalendar',
        entityId: updated.id,
        payload: { before, after: updated },
      });

      return updated;
    }),

  // ادمین: حذف
  delete: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const target = await ctx.db.harvestCalendar.findUniqueOrThrow({
        where: { id: input.id },
      });
      await ctx.db.harvestCalendar.delete({ where: { id: input.id } });

      await writeAuditLog(ctx.db, {
        actorUserId: ctx.user!.id,
        actorRole: ctx.user?.adminRole ?? null,
        action: 'AGRI_HARVEST_DELETED',
        entityType: 'HarvestCalendar',
        entityId: target.id,
        payload: {
          cropNameFa: target.cropNameFa,
          harvestStartMonth: target.harvestStartMonth,
          harvestEndMonth: target.harvestEndMonth,
          province: target.province,
        },
      });

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
      const created = await ctx.db.marketInsight.create({
        data: {
          ...rest,
          dataDate: dataDate ? new Date(`${dataDate}T00:00:00.000Z`) : null,
          publishedAt: rest.isPublished ? new Date() : null,
          authorId: ctx.user.id,
        },
      });

      await writeAuditLog(ctx.db, {
        actorUserId: ctx.user!.id,
        actorRole: ctx.user?.adminRole ?? null,
        action: 'AGRI_MARKET_INSIGHT_CREATED',
        entityType: 'MarketInsight',
        entityId: created.id,
        payload: {
          title: created.title,
          commodityFa: created.commodityFa,
          insightType: created.insightType,
          isPublished: created.isPublished,
        },
      });

      return created;
    }),

  // ادمین: ویرایش
  update: adminProcedure
    .input(z.object({ id: z.string().cuid(), data: updateMarketInsightSchema }))
    .mutation(async ({ ctx, input }) => {
      const { dataDate, isPublished, ...rest } = input.data;
      const before = await ctx.db.marketInsight.findUniqueOrThrow({ where: { id: input.id } });
      const updated = await ctx.db.marketInsight.update({
        where: { id: input.id },
        data: {
          ...rest,
          ...(dataDate !== undefined ? { dataDate: new Date(`${dataDate}T00:00:00.000Z`) } : {}),
          ...(isPublished !== undefined
            ? {
                isPublished,
                publishedAt: isPublished && !before.isPublished ? new Date() : before.publishedAt,
              }
            : {}),
        },
      });

      await writeAuditLog(ctx.db, {
        actorUserId: ctx.user!.id,
        actorRole: ctx.user?.adminRole ?? null,
        action: 'AGRI_MARKET_INSIGHT_UPDATED',
        entityType: 'MarketInsight',
        entityId: updated.id,
        payload: { before, after: updated },
      });

      return updated;
    }),

  // ادمین: حذف
  delete: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const target = await ctx.db.marketInsight.findUniqueOrThrow({
        where: { id: input.id },
      });
      await ctx.db.marketInsight.delete({ where: { id: input.id } });

      await writeAuditLog(ctx.db, {
        actorUserId: ctx.user!.id,
        actorRole: ctx.user?.adminRole ?? null,
        action: 'AGRI_MARKET_INSIGHT_DELETED',
        entityType: 'MarketInsight',
        entityId: target.id,
        payload: {
          title: target.title,
          commodityFa: target.commodityFa,
          insightType: target.insightType,
        },
      });

      return { success: true };
    }),

  // ادمین: انتشار/پیش‌نویس سریع
  publish: adminProcedure
    .input(z.object({ id: z.string().cuid(), isPublished: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const before = await ctx.db.marketInsight.findUniqueOrThrow({
        where: { id: input.id },
      });

      const updated = await ctx.db.marketInsight.update({
        where: { id: input.id },
        data: {
          isPublished: input.isPublished,
          publishedAt: input.isPublished ? new Date() : null,
        },
      });

      await writeAuditLog(ctx.db, {
        actorUserId: ctx.user!.id,
        actorRole: ctx.user?.adminRole ?? null,
        action: 'AGRI_MARKET_INSIGHT_PUBLISH_TOGGLED',
        entityType: 'MarketInsight',
        entityId: updated.id,
        payload: {
          before: { isPublished: before.isPublished, publishedAt: before.publishedAt },
          after: { isPublished: updated.isPublished, publishedAt: updated.publishedAt },
        },
      });

      return updated;
    }),
});

// ─── Combined Agri Router ─────────────────────────────────────────────────────

export const agriRouter = router({
  taxonomy: taxonomyRouter,
  harvest: harvestRouter,
  market: marketRouter,
});
