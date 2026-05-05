import { z } from 'zod';
import { CommodityGroup, TradeType, TradeRequestStatus, ConsultationCategory } from '../enums/index.js';

// ─── Create Trade Request ─────────────────────────────────────────────────────

export const createTradeRequestSchema = z.object({
  type: z.nativeEnum(TradeType),
  productId: z.string().optional(),          // اگر نه، مشخصات دستی
  productNameFa: z.string().min(2).max(200).optional(),
  productNameEn: z.string().min(2).max(200).optional(),
  serviceCode: z.string().min(2).max(50).optional(),
  hsCode: z.string().regex(/^\d{6,10}$/).optional(),
  commodityGroup: z.nativeEnum(CommodityGroup).optional(),
  supplySourceType: z.enum(['COMPANY', 'FACTORY']).optional(),
  supplySourceName: z.string().min(2).max(150).optional(),
  quantity: z.string().min(1, 'مقدار مورد نیاز الزامی است').max(100),
  quantityUnit: z.enum(['KG', 'TON', 'PIECE', 'LITER', 'METER']).default('KG'),
  targetPrice: z.string().max(100).optional(),
  currency: z.enum(['IRR', 'USD', 'EUR', 'AED']).default('USD'),
  deliveryLocation: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  expiresAt: z.string().datetime().optional(),
}).superRefine((input, ctx) => {
  if ((input.supplySourceType && !input.supplySourceName) || (!input.supplySourceType && input.supplySourceName)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'نوع مبدا تامین و نام مبدا باید با هم تکمیل شوند',
      path: ['supplySourceName'],
    });
  }
});

// ─── Update Trade Status ──────────────────────────────────────────────────────

export const updateTradeStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.nativeEnum(TradeRequestStatus),
  notes: z.string().max(1000).optional(),
});

// ─── List Trade Requests ──────────────────────────────────────────────────────

export const listTradeRequestsSchema = z.object({
  type: z.nativeEnum(TradeType).optional(),
  status: z.nativeEnum(TradeRequestStatus).optional(),
  commodityGroup: z.nativeEnum(CommodityGroup).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

// ─── Analysis Request ─────────────────────────────────────────────────────────

export const createAnalysisRequestSchema = z.object({
  subject: z.string().min(5, 'موضوع تحلیل الزامی است').max(300),
  consultationCategory: z.nativeEnum(ConsultationCategory).optional(),
  commodityGroup: z.nativeEnum(CommodityGroup).optional(),
  targetMarket: z.string().max(200).optional(),
  description: z.string().min(20, 'شرح درخواست کافی نیست').max(3000),
  attachmentKeys: z.array(z.string()).max(5).default([]),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type CreateTradeRequestInput = z.infer<typeof createTradeRequestSchema>;
export type UpdateTradeStatusInput = z.infer<typeof updateTradeStatusSchema>;
export type ListTradeRequestsInput = z.infer<typeof listTradeRequestsSchema>;
export type CreateAnalysisRequestInput = z.infer<typeof createAnalysisRequestSchema>;
