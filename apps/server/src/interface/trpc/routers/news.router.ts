import { z } from 'zod';
import { router, publicProcedure, adminProcedure } from '../trpc.js';

// ─── News & Newsletter Router ─────────────────────────────────────────────────

export const newsRouter = router({
  // ── لیست اخبار (عمومی) ──────────────────────────────────────────────────
  list: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().max(200).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const cacheKey = `news:${input.page}:${input.limit}:${input.category ?? ''}:${input.search ?? ''}`;
      const cached = await ctx.cache?.get<string>(cacheKey);
      if (cached) return JSON.parse(cached);

      const skip = (input.page - 1) * input.limit;
      const where: Record<string, unknown> = { isPublished: true };
      if (input.category) where['category'] = input.category;
      if (input.search) {
        where['OR'] = [
          { title: { contains: input.search } },
          { summary: { contains: input.search } },
          { content: { contains: input.search } },
        ];
      }

      const [items, total] = await Promise.all([
        ctx.db.news.findMany({
          where,
          skip,
          take: input.limit,
          orderBy: { publishedAt: 'desc' },
          select: {
            id: true,
            title: true,
            summary: true,
            imageKey: true,
            sourceName: true,
            sourceUrl: true,
            category: true,
            tags: true,
            publishedAt: true,
          },
        }),
        ctx.db.news.count({ where }),
      ]);
      const result = { items, total, page: input.page, pages: Math.ceil(total / input.limit) };

      await ctx.cache?.set(cacheKey, JSON.stringify(result), 1800); // 30 دقیقه
      return result;
    }),

  // ── جزئیات خبر ────────────────────────────────────────────────────────────
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.news.findFirst({
        where: { id: input.id, isPublished: true },
      });
    }),

  // ── آخرین اخبار (برای نوار خبرنامه) ──────────────────────────────────────
  latest: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(5) }))
    .query(async ({ ctx, input }) => {
      const cacheKey = `news:latest:${input.limit}`;
      const cached = await ctx.cache?.get<string>(cacheKey);
      if (cached) return JSON.parse(cached);

      const items = await ctx.db.news.findMany({
        where: { isPublished: true },
        take: input.limit,
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true,
          title: true,
          summary: true,
          category: true,
          publishedAt: true,
        },
      });

      await ctx.cache?.set(cacheKey, JSON.stringify(items), 900); // 15 دقیقه
      return items;
    }),

  // ── عضویت خبرنامه ─────────────────────────────────────────────────────────
  subscribe: publicProcedure
    .input(
      z.object({
        email: z.string().email('ایمیل معتبر نیست'),
        name: z.string().max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.newsletterSubscription.findUnique({
        where: { email: input.email },
      });
      if (existing) {
        if (existing.isActive) return { ok: true, message: 'قبلاً عضو شده‌اید' };
        // دوباره فعال‌سازی
        await ctx.db.newsletterSubscription.update({
          where: { id: existing.id },
          data: { isActive: true, unsubscribedAt: null },
        });
        return { ok: true, message: 'عضویت دوباره فعال شد' };
      }
      await ctx.db.newsletterSubscription.create({
        data: { email: input.email, name: input.name },
      });
      return { ok: true, message: 'عضویت شما ثبت شد' };
    }),

  // ── لغو عضویت خبرنامه ─────────────────────────────────────────────────────
  unsubscribe: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.newsletterSubscription.updateMany({
        where: { email: input.email, isActive: true },
        data: { isActive: false, unsubscribedAt: new Date() },
      });
      return { ok: true };
    }),

  // ── ادمین: ایجاد خبر ──────────────────────────────────────────────────────
  adminCreate: adminProcedure
    .input(
      z.object({
        title: z.string().min(3).max(300),
        summary: z.string().max(500).optional(),
        content: z.string().min(10),
        imageKey: z.string().optional(),
        sourceUrl: z.string().url().optional(),
        sourceName: z.string().max(100).optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).default([]),
        isPublished: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.news.create({
        data: {
          title: input.title,
          summary: input.summary,
          content: input.content,
          imageKey: input.imageKey,
          sourceUrl: input.sourceUrl,
          sourceName: input.sourceName,
          category: input.category,
          tags: input.tags,
          isPublished: input.isPublished,
          publishedAt: input.isPublished ? new Date() : null,
          authorId: ctx.user!.id,
        },
      });
    }),

  // ── ادمین: ویرایش خبر ─────────────────────────────────────────────────────
  adminUpdate: adminProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(3).max(300).optional(),
        summary: z.string().max(500).optional(),
        content: z.string().min(10).optional(),
        imageKey: z.string().optional(),
        sourceUrl: z.string().url().optional(),
        sourceName: z.string().max(100).optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        isPublished: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = { ...data };
      if (data.isPublished === true) {
        updateData['publishedAt'] = new Date();
      }
      return ctx.db.news.update({ where: { id }, data: updateData });
    }),

  // ── ادمین: حذف خبر ────────────────────────────────────────────────────────
  adminDelete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.news.delete({ where: { id: input.id } });
      return { ok: true };
    }),

  // ── ادمین: لیست اخبار (همه) ───────────────────────────────────────────────
  adminList: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;
      const [items, total] = await Promise.all([
        ctx.db.news.findMany({
          skip,
          take: input.limit,
          orderBy: { createdAt: 'desc' },
        }),
        ctx.db.news.count(),
      ]);
      return { items, total, page: input.page, pages: Math.ceil(total / input.limit) };
    }),

  // ── ادمین: URL آپلود تصویر خبر ────────────────────────────────────────────
  adminGetUploadUrl: adminProcedure
    .input(z.object({ fileName: z.string(), contentType: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const key = `news/${Date.now()}-${input.fileName}`;
      const url = await ctx.storage.getPresignedUploadUrl(key, input.contentType, 600);
      return { url, key };
    }),
});
