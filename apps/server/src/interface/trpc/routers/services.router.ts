import { z } from 'zod';
import { router, publicProcedure, activeProcedure, adminProcedure } from '../trpc.js';

// ─── Services Router ──────────────────────────────────────────────────────────

export const servicesRouter = router({
  // ── کدهای تعرفه گمرکی (HS Code) ──────────────────────────────────────────
  hsCodes: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const cacheKey = `hs-codes:${input.page}:${input.limit}:${input.search ?? ''}`;
      
      // ابتدا cache را بررسی کن
      const cached = await ctx.cache?.get<string>(cacheKey);
      if (cached) return JSON.parse(cached);
      
      const skip = (input.page - 1) * input.limit;
      const where = input.search
        ? {
            OR: [
              { code: { contains: input.search } },
              { descriptionFa: { contains: input.search } },
              { descriptionEn: { contains: input.search, mode: 'insensitive' as const } },
            ],
          }
        : {};
      const [items, total] = await Promise.all([
        ctx.db.hsCode.findMany({ where, skip, take: input.limit, orderBy: { code: 'asc' } }),
        ctx.db.hsCode.count({ where }),
      ]);
      const result = { items, total, page: input.page, pages: Math.ceil(total / input.limit) };
      
      // ذخیره در cache برای ۱ ساعت
      await ctx.cache?.set(cacheKey, JSON.stringify(result), 3600);
      
      return result;
    }),

  hsCodeByCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.hsCode.findUnique({ where: { code: input.code } });
    }),

  // ── لیست بخشنامه‌ها ─────────────────────────────────────────────────────
  listCirculars: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const cacheKey = `circulars:${input.page}:${input.limit}:${input.search ?? ''}`;
      
      // ابتدا cache را بررسی کن
      const cached = await ctx.cache?.get<string>(cacheKey);
      if (cached) return JSON.parse(cached);
      
      const skip = (input.page - 1) * input.limit;
      const where: Record<string, unknown> = { isPublished: true };
      if (input.search) {
        where['OR'] = [
          { title: { contains: input.search } },
          { summary: { contains: input.search } },
          { content: { contains: input.search } },
        ];
      }
      const [items, total] = await Promise.all([
        ctx.db.circular.findMany({
          where,
          skip,
          take: input.limit,
          orderBy: { publishedAt: 'desc' },
          select: {
            id: true,
            title: true,
            summary: true,
            publishedAt: true,
            tags: true,
          },
        }),
        ctx.db.circular.count({ where }),
      ]);
      const result = { items, total, page: input.page, pages: Math.ceil(total / input.limit) };
      
      // ذخیره در cache برای ۱ ساعت
      await ctx.cache?.set(cacheKey, JSON.stringify(result), 3600);
      
      return result;
    }),

  // ── کدهای آیسیک (ISIC) ──────────────────────────────────────────────────
  isicCodes: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const cacheKey = `isic-codes:${input.page}:${input.limit}:${input.search ?? ''}`;
      
      // ابتدا cache را بررسی کن
      const cached = await ctx.cache?.get<string>(cacheKey);
      if (cached) return JSON.parse(cached);
      
      const skip = (input.page - 1) * input.limit;
      const where = input.search
        ? {
            OR: [
              { code: { contains: input.search } },
              { descriptionFa: { contains: input.search } },
              { descriptionEn: { contains: input.search, mode: 'insensitive' as const } },
            ],
          }
        : {};
      const [items, total] = await Promise.all([
        ctx.db.isicCode.findMany({ where, skip, take: input.limit, orderBy: { code: 'asc' } }),
        ctx.db.isicCode.count({ where }),
      ]);
      const result = { items, total, page: input.page, pages: Math.ceil(total / input.limit) };
      
      // ذخیره در cache برای ۱ ساعت
      await ctx.cache?.set(cacheKey, JSON.stringify(result), 3600);
      
      return result;
    }),

  // ── بخشنامه‌ها ────────────────────────────────────────────────────────────
  circulars: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;
      const where: Record<string, unknown> = { isPublished: true };
      if (input.search) where['title'] = { contains: input.search };

      const [items, total] = await Promise.all([
        ctx.db.circular.findMany({
          where,
          skip,
          take: input.limit,
          orderBy: { publishedAt: 'desc' },
          select: { id: true, title: true, summary: true, publishedAt: true, fileKey: true, tags: true },
        }),
        ctx.db.circular.count({ where }),
      ]);
      return { items, total, page: input.page, pages: Math.ceil(total / input.limit) };
    }),

  circularById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.circular.findFirst({
        where: { id: input.id, isPublished: true },
      });
    }),

  // ── دانلودها ──────────────────────────────────────────────────────────────
  downloads: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(12),
      }),
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;
      const where: Record<string, unknown> = { isActive: true };
      if (input.category) where['category'] = input.category;
      const [items, total] = await Promise.all([
        ctx.db.downloadItem.findMany({
          where,
          skip,
          take: input.limit,
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        }),
        ctx.db.downloadItem.count({ where }),
      ]);
      return { items, total, page: input.page, pages: Math.ceil(total / input.limit) };
    }),

  // ترک دانلود
  trackDownload: activeProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.downloadItem.update({
        where: { id: input.id },
        data: { downloadCount: { increment: 1 } },
      });
      return { ok: true };
    }),

  // ── تبلیغات فعال ─────────────────────────────────────────────────────────
  activeAds: publicProcedure
    .input(z.object({ adType: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.advertisement.findMany({
        where: {
          status: 'ACTIVE',
          ...(input.adType && { adType: input.adType }),
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, fileKey: true, targetUrl: true, adType: true },
      });
    }),

  // ── ادمین: ایجاد بخشنامه ─────────────────────────────────────────────────
  adminCreateCircular: adminProcedure
    .input(
      z.object({
        title: z.string().min(3),
        content: z.string().min(10),
        summary: z.string().optional(),
        fileKey: z.string().optional(),
        tags: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.circular.create({
        data: {
          title: input.title,
          content: input.content,
          summary: input.summary,
          fileKey: input.fileKey,
          tags: input.tags,
          isPublished: true,
          publishedAt: new Date(),
          authorId: ctx.user!.id,
        },
      });
    }),

  // ── ادمین: ایجاد آیتم دانلود ─────────────────────────────────────────────
  adminCreateDownload: adminProcedure
    .input(
      z.object({
        title: z.string().min(3),
        description: z.string().optional(),
        category: z.string(),
        fileKey: z.string(),
        fileName: z.string(),
        fileSize: z.number().int(),
        mimeType: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.downloadItem.create({
        data: {
          title: input.title,
          description: input.description,
          category: input.category,
          fileKey: input.fileKey,
          fileName: input.fileName,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          downloadCount: 0,
        },
      });
    }),

  // ── ادمین: URL آپلود ──────────────────────────────────────────────────────
  adminGetUploadUrl: adminProcedure
    .input(z.object({ fileName: z.string(), contentType: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const key = `services/${Date.now()}-${input.fileName}`;
      const url = await ctx.storage.getPresignedUploadUrl(key, 'application/octet-stream', 600);
      return { url, key };
    }),
});
