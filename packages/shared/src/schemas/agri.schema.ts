import { z } from 'zod';

// ─── Occupation Category (Taxonomy) ─────────────────────────────────────────

export const createOccupationCategorySchema = z.object({
  code: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[A-Z0-9_.]+$/, 'کد باید فقط شامل حروف بزرگ انگلیسی، اعداد، نقطه و زیرخط باشد'),
  nameFa: z.string().min(1).max(200),
  nameEn: z.string().max(200).optional(),
  parentId: z.string().cuid().optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const updateOccupationCategorySchema = createOccupationCategorySchema.partial();

export const occupationCategoryListSchema = z.object({
  parentId: z.string().cuid().optional().nullable(),
  onlyActive: z.boolean().optional().default(true),
});

// ─── Harvest Calendar ────────────────────────────────────────────────────────

export const createHarvestCalendarSchema = z.object({
  cropNameFa: z.string().min(1).max(200),
  cropNameEn: z.string().max(200).optional(),
  harvestStartMonth: z.number().int().min(1).max(12),
  harvestEndMonth: z.number().int().min(1).max(12),
  province: z.string().max(100).optional(),
  variety: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateHarvestCalendarSchema = createHarvestCalendarSchema.partial();

export const harvestCalendarListSchema = z.object({
  month: z.number().int().min(1).max(12).optional(),
  province: z.string().max(100).optional(),
  onlyActive: z.boolean().optional().default(true),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// ─── Market Insight ──────────────────────────────────────────────────────────

export const createMarketInsightSchema = z.object({
  title: z.string().min(2).max(300),
  commodityFa: z.string().min(1).max(200),
  commodityEn: z.string().max(200).optional(),
  insightType: z.enum(['price', 'demand', 'supply', 'trend', 'regulation']),
  content: z.string().min(10).max(10000),
  dataDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sourceUrl: z.string().url('لینک منبع معتبر نیست').optional(),
  imageKey: z.string().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  isPublished: z.boolean().optional().default(false),
});

export const updateMarketInsightSchema = createMarketInsightSchema.partial();

export const marketInsightListSchema = z.object({
  insightType: z.enum(['price', 'demand', 'supply', 'trend', 'regulation']).optional(),
  commodity: z.string().max(100).optional(),
  onlyPublished: z.boolean().optional().default(true),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(12),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type CreateOccupationCategoryInput = z.infer<typeof createOccupationCategorySchema>;
export type UpdateOccupationCategoryInput = z.infer<typeof updateOccupationCategorySchema>;
export type OccupationCategoryListInput = z.infer<typeof occupationCategoryListSchema>;

export type CreateHarvestCalendarInput = z.infer<typeof createHarvestCalendarSchema>;
export type UpdateHarvestCalendarInput = z.infer<typeof updateHarvestCalendarSchema>;
export type HarvestCalendarListInput = z.infer<typeof harvestCalendarListSchema>;

export type CreateMarketInsightInput = z.infer<typeof createMarketInsightSchema>;
export type UpdateMarketInsightInput = z.infer<typeof updateMarketInsightSchema>;
export type MarketInsightListInput = z.infer<typeof marketInsightListSchema>;
