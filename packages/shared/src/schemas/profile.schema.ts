import { z } from 'zod';
import { CommodityGroup, DocumentType, UserRole } from '../enums/index.js';

// ─── Address ─────────────────────────────────────────────────────────────────

export const addressSchema = z.object({
  province: z.string().min(1, 'استان الزامی است'),
  city: z.string().min(1, 'شهر الزامی است'),
  addressLine: z.string().min(10, 'آدرس کامل الزامی است').max(300),
  postalCode: z.string().length(10, 'کد پستی باید ۱۰ رقم باشد').regex(/^\d{10}$/),
});

// ─── Profile Create/Update ───────────────────────────────────────────────────

export const createProfileSchema = z.object({
  role: z.nativeEnum(UserRole),
  companyName: z.string().min(2).max(150).optional(),
  unitName: z.string().min(2).max(150).optional(),
  unitType: z.enum(['TYPE_1', 'TYPE_2', 'TYPE_3']).optional(), // ⚠️ باید از کارفرما مشخص شود
  guildCode: z.string().max(20).optional(),
  businessId: z.string().max(30).optional(),
  phone: z
    .string()
    .regex(/^0\d{10}$/, 'شماره تلفن ثابت معتبر نیست')
    .optional(),
  fax: z
    .string()
    .regex(/^0\d{10}$/, 'شماره فکس معتبر نیست')
    .optional(),
  address: addressSchema,
  activityType: z.string().max(100).optional(),         // نوع فعالیت
  commodityGroup: z.nativeEnum(CommodityGroup).optional(),
  position: z.string().max(100).optional(),             // سمت / مسئولیت
  experienceYears: z.number().int().min(0).max(99).optional(),
  licenseTypes: z
    .array(z.nativeEnum(DocumentType))
    .min(1, 'حداقل یک نوع مجوز باید مشخص شود'),
  website: z.string().url('آدرس سایت معتبر نیست').optional(),
  description: z.string().max(1000).optional(),
});

export const updateProfileSchema = createProfileSchema.partial();

// ─── Document Upload ─────────────────────────────────────────────────────────

export const uploadDocumentSchema = z.object({
  type: z.nativeEnum(DocumentType),
  fileKey: z.string().min(1), // key در MinIO
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive().max(10 * 1024 * 1024), // max 10MB
  mimeType: z.enum([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ]),
});

// ─── Profile Search (Admin) ──────────────────────────────────────────────────

export const profileSearchSchema = z.object({
  search: z.string().max(100).optional(),
  role: z.nativeEnum(UserRole).optional(),
  verificationStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVISION']).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type AddressInput = z.infer<typeof addressSchema>;
export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type ProfileSearchInput = z.infer<typeof profileSearchSchema>;
