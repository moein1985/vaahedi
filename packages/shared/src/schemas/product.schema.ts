import { z } from 'zod';
import { CommodityGroup, DeliveryTerms, PaymentMethod, ProductOrigin } from '../enums/index.js';

const emptyToUndefined = (value: unknown) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  return value;
};

const dateTimeInputSchema = z
  .string()
  .refine(
    (value) => {
      if (!value) return false;
      const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?$/.test(value);
      const local = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value);
      return iso || local;
    },
    'فرمت تاریخ معتبر نیست',
  );

const optionalDateTimeInputSchema = z.preprocess(
  emptyToUndefined,
  dateTimeInputSchema.optional(),
);

const optionalPackagingTypeSchema = z.preprocess(
  emptyToUndefined,
  z.enum(['BULK', 'JUMBO_BAG', 'SACK', 'TANK', 'PALLET', 'CARTON', 'DRUM', 'OTHER']).optional(),
);

// ─── Dimensions ──────────────────────────────────────────────────────────────

export const dimensionsSchema = z.object({
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  unit: z.enum(['kg', 'ton', 'liter', 'piece', 'meter', 'sqm']).default('kg'),
});

// ─── Sale Conditions ─────────────────────────────────────────────────────────

export const saleConditionsSchema = z.object({
  advancePercent: z.number().int().min(0).max(100),
  onDeliveryPercent: z.number().int().min(0).max(100),
}).refine(
  (d) => d.advancePercent + d.onDeliveryPercent === 100,
  { message: 'جمع درصد پیش‌نقد و تحویل باید ۱۰۰ باشد' },
);

// ─── Create Product ──────────────────────────────────────────────────────────

const createProductObjectSchema = z.object({
  nameFa: z.string().min(2, 'نام فارسی محصول الزامی است').max(200),
  nameEn: z.string().min(2, 'نام انگلیسی محصول الزامی است').max(200),
  grade: z.string().max(50).optional(),
  serviceCode: z.string().max(30).optional(),       // شناسه کالا/خدمات
  hsCode: z
    .string()
    .regex(/^\d{6,10}$/, 'کد تعرفه گمرکی باید ۶ تا ۱۰ رقم باشد'),
  isicCode: z.string().max(10).optional(),
  commodityGroup: z.nativeEnum(CommodityGroup),
  technicalSpecs: z.string().min(10, 'مشخصات فنی الزامی است').max(5000),
  standardNumber: z.string().max(50).optional(),
  origin: z.nativeEnum(ProductOrigin),
  countryOfOrigin: z.string().max(100).optional(),
  packagingType: optionalPackagingTypeSchema,
  dimensions: dimensionsSchema.optional(),
  deliveryTerms: z.nativeEnum(DeliveryTerms),
  deliveryLocation: z.string().max(200),
  minOrderQuantity: z.string().max(50),             // تعداد/تناژ حداقل سفارش
  preparationTimeDays: z.number().int().min(1).max(365),
  saleConditions: saleConditionsSchema.optional(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  productionDate: optionalDateTimeInputSchema,
  expiryDate: optionalDateTimeInputSchema,
  isAvailableInStock: z.boolean().default(false),
  description: z.string().max(3000).optional(),
});

export const createProductSchema = createProductObjectSchema.refine(
  (data) => {
    // If both dates are provided, expiry must be after production
    if (data.productionDate && data.expiryDate) {
      const prodDate = new Date(data.productionDate).getTime();
      const expDate = new Date(data.expiryDate).getTime();
      return expDate > prodDate;
    }
    return true;
  },
  {
    message: 'تاریخ انقضا باید بعد از تاریخ تولید باشد',
    path: ['expiryDate'], // Show error on expiryDate field
  },
);

export const updateProductSchema = createProductObjectSchema.partial();

// ─── Product Search / List ───────────────────────────────────────────────────

export const productSearchSchema = z.object({
  q: z.string().max(200).optional(),
  hsCode: z.string().optional(),
  origin: z.nativeEnum(ProductOrigin).optional(),
  commodityGroup: z.nativeEnum(CommodityGroup).optional(),
  deliveryTerms: z.nativeEnum(DeliveryTerms).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  minOrder: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(12),
  sortBy: z.enum(['createdAt', 'nameFa', 'hsCode']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type DimensionsInput = z.infer<typeof dimensionsSchema>;
export type SaleConditionsInput = z.infer<typeof saleConditionsSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductSearchInput = z.infer<typeof productSearchSchema>;
