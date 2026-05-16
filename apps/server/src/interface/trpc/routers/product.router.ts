import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  createProductSchema,
  updateProductSchema,
  productSearchSchema,
} from '@repo/shared';
import { compressImage, createThumbnail } from '../../../infrastructure/storage/image-processor.js';
import { router, activeProcedure, publicProcedure, adminProcedure } from '../trpc.js';

const PRODUCT_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;
const PRODUCT_UPLOAD_ALLOWED_PREFIXES = ['image/', 'video/'] as const;
const PRODUCT_UPLOAD_ALLOWED_EXACT = ['application/pdf'] as const;

function isAllowedProductMediaMimeType(mimeType: string): boolean {
  return (
    PRODUCT_UPLOAD_ALLOWED_PREFIXES.some((prefix) => mimeType.startsWith(prefix))
    || PRODUCT_UPLOAD_ALLOWED_EXACT.includes(mimeType as (typeof PRODUCT_UPLOAD_ALLOWED_EXACT)[number])
  );
}

export const productRouter = router({
  // ── List / Search ─────────────────────────────────────────────────────────
  list: publicProcedure.input(productSearchSchema).query(async ({ input, ctx }) => {
    const where: Record<string, unknown> = { isApproved: true };
    if (input.q) {
      where['OR'] = [
        { nameFa: { contains: input.q, mode: 'insensitive' } },
        { nameEn: { contains: input.q, mode: 'insensitive' } },
        { hsCode: { contains: input.q } },
      ];
    }
    if (input.hsCode) where['hsCode'] = { startsWith: input.hsCode };
    if (input.origin) where['origin'] = input.origin;
    if (input.commodityGroup) where['commodityGroup'] = input.commodityGroup;
    if (input.deliveryTerms) where['deliveryTerms'] = input.deliveryTerms;
    if (input.paymentMethod) where['paymentMethod'] = input.paymentMethod;

    const skip = (input.page - 1) * input.limit;
    const [total, products] = await Promise.all([
      ctx.db.product.count({ where }),
      ctx.db.product.findMany({
        where,
        skip,
        take: input.limit,
        orderBy: { [input.sortBy]: input.sortOrder },
        include: {
          media: { where: { isMain: true }, take: 1 },
          user: { select: { userCode: true } },
        },
      }),
    ]);

    return {
      data: products,
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.ceil(total / input.limit),
      },
    };
  }),

  // ── Get by ID (Public) ────────────────────────────────────────────────────
  getById: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      const product = await ctx.db.product.findFirst({
        where: { id: input.id, isApproved: true },
        include: {
          media: { orderBy: { sortOrder: 'asc' } },
          user: {
            select: {
              userCode: true,
              profile: { select: { companyName: true } },
            },
          },
        },
      });

      if (!product) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'محصول یافت نشد' });
      }

      return {
        id: product.id,
        nameFa: product.nameFa,
        nameEn: product.nameEn,
        grade: product.grade,
        serviceCode: product.serviceCode,
        hsCode: product.hsCode,
        isicCode: product.isicCode,
        commodityGroup: product.commodityGroup,
        technicalSpecs: product.technicalSpecs,
        standardNumber: product.standardNumber,
        origin: product.origin,
        countryOfOrigin: product.countryOfOrigin,
        packagingType: product.packagingType,
        deliveryTerms: product.deliveryTerms,
        deliveryLocation: product.deliveryLocation,
        quantity: product.minOrderQuantity,
        minOrder: product.minOrderQuantity,
        description: product.description,
        media: product.media,
        user: product.user,
        createdAt: product.createdAt,
      };
    }),

  // ── My Products ───────────────────────────────────────────────────────────
  myProducts: activeProcedure
    .input(z.object({ page: z.number().int().min(1).default(1), limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ input, ctx }) => {
      const skip = (input.page - 1) * input.limit;
      const [total, products] = await Promise.all([
        ctx.db.product.count({ where: { userId: ctx.user.id } }),
        ctx.db.product.findMany({
          where: { userId: ctx.user.id },
          skip,
          take: input.limit,
          include: { media: { where: { isMain: true }, take: 1 } },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return {
        data: products,
        pagination: { page: input.page, total, totalPages: Math.ceil(total / input.limit) },
      };
    }),

  // ── آمار محصولات کاربر ────────────────────────────────────────────────────
  myStats: activeProcedure.query(async ({ ctx }) => {
    const [total, approved, pending] = await Promise.all([
      ctx.db.product.count({ where: { userId: ctx.user.id } }),
      ctx.db.product.count({ where: { userId: ctx.user.id, isApproved: true } }),
      ctx.db.product.count({ where: { userId: ctx.user.id, isApproved: false } }),
    ]);
    return { total, approved, pending };
  }),

  // ── Create ────────────────────────────────────────────────────────────────
  create: activeProcedure.input(createProductSchema).mutation(async ({ input, ctx }) => {
    const product = await ctx.db.product.create({
      data: {
        userId: ctx.user.id,
        nameFa: input.nameFa,
        nameEn: input.nameEn,
        grade: input.grade,
        serviceCode: input.serviceCode,
        hsCode: input.hsCode,
        isicCode: input.isicCode,
        commodityGroup: input.commodityGroup,
        technicalSpecs: input.technicalSpecs,
        standardNumber: input.standardNumber,
        origin: input.origin,
        countryOfOrigin: input.countryOfOrigin,
        packagingType: Array.isArray(input.packagingType) ? input.packagingType.join(',') : (input.packagingType ?? null),
        deliveryTerms: Array.isArray(input.deliveryTerms) ? input.deliveryTerms.join(',') : String(input.deliveryTerms ?? ''),
        deliveryLocation: input.deliveryLocation,
        minOrderQuantity: input.minOrderQuantity,
        preparationTimeDays: input.preparationTimeDays,
        paymentMethod: input.paymentMethod,
        advancePercent: input.saleConditions?.advancePercent ?? null,
        onDeliveryPercent: input.saleConditions?.onDeliveryPercent ?? null,
        productionDate: input.productionDate ? new Date(input.productionDate) : null,
        expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
        description: input.description,
        isAvailableInStock: input.isAvailableInStock,
        weightKg: input.dimensions?.weight ?? null,
        lengthCm: input.dimensions?.length ?? null,
        widthCm: input.dimensions?.width ?? null,
        heightCm: input.dimensions?.height ?? null,
        weightUnit: input.dimensions?.unit ?? 'kg',
      },
    });

    return { id: product.id, message: 'محصول با موفقیت ثبت شد و در انتظار تأیید کارشناس است' };
  }),

  // ── Update ────────────────────────────────────────────────────────────────
  update: activeProcedure
    .input(z.object({ id: z.string().cuid(), data: updateProductSchema }))
    .mutation(async ({ input, ctx }) => {
      const product = await ctx.db.product.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });
      if (!product) throw new TRPCError({ code: 'NOT_FOUND', message: 'محصول یافت نشد' });

      const { packagingType, deliveryTerms, ...restData } = input.data;
      await ctx.db.product.update({
        where: { id: input.id },
        data: {
          ...restData,
          isApproved: false, // re-review after edit
          ...(packagingType !== undefined && {
            packagingType: Array.isArray(packagingType) ? packagingType.join(',') : (packagingType ?? null),
          }),
          ...(deliveryTerms !== undefined && {
            deliveryTerms: Array.isArray(deliveryTerms) ? deliveryTerms.join(',') : String(deliveryTerms ?? ''),
          }),
        },
      });

      return { message: 'محصول با موفقیت بروزرسانی شد' };
    }),

  // ── Delete ────────────────────────────────────────────────────────────────
  delete: activeProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      const product = await ctx.db.product.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });
      if (!product) throw new TRPCError({ code: 'NOT_FOUND', message: 'محصول یافت نشد' });

      await ctx.db.product.delete({ where: { id: input.id } });
      return { message: 'محصول با موفقیت حذف شد' };
    }),

  // ── Media: Upload and Compress ──────────────────────────────────────────
  uploadMedia: activeProcedure
    .input(
      z.object({
        productId: z.string().cuid(),
        fileName: z.string(),
        mimeType: z.string(),
        base64Data: z.string(),
        isMain: z.boolean().default(false),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const product = await ctx.db.product.findFirst({
        where: { id: input.productId, userId: ctx.user.id },
      });
      if (!product) throw new TRPCError({ code: 'FORBIDDEN', message: 'دسترسی ندارید' });

      // Decode base64
      const buffer = Buffer.from(input.base64Data, 'base64');
      const fileSize = buffer.length;

      if (!isAllowedProductMediaMimeType(input.mimeType)) {
        console.error('[upload.product.invalid_mime]', {
          userId: ctx.user.id,
          productId: input.productId,
          fileName: input.fileName,
          mimeType: input.mimeType,
        });
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'فرمت فایل مجاز نیست. فقط تصویر، ویدیو یا PDF قابل آپلود است',
        });
      }

      if (fileSize > PRODUCT_UPLOAD_MAX_BYTES) {
        console.error('[upload.product.file_too_large]', {
          userId: ctx.user.id,
          productId: input.productId,
          fileName: input.fileName,
          fileSize,
          maxBytes: PRODUCT_UPLOAD_MAX_BYTES,
        });
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'حجم فایل بیشتر از حد مجاز است (حداکثر ۲۵ مگابایت)',
        });
      }

      // Compress image if it's an image
      let processedBuffer: Buffer = buffer;
      let thumbnailBuffer: Buffer | null = null;

      if (input.mimeType.startsWith('image/')) {
        processedBuffer = await compressImage(buffer);
        thumbnailBuffer = await createThumbnail(buffer);
      }

      // Generate keys
      const timestamp = Date.now();
      const key = `products/${input.productId}/${timestamp}-${input.fileName}`;
      const thumbnailKey = thumbnailBuffer ? `products/${input.productId}/${timestamp}-thumb-${input.fileName}` : null;

      // Upload to storage
      try {
        await ctx.storage.uploadFile({
          key,
          buffer: processedBuffer,
          mimeType: input.mimeType.startsWith('image/') ? 'image/webp' : input.mimeType,
          size: processedBuffer.length,
        });
      } catch (error) {
        console.error('[upload.product.storage_failed]', {
          userId: ctx.user.id,
          productId: input.productId,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSize,
          error: error instanceof Error ? error.message : String(error),
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'آپلود فایل با خطا مواجه شد. لطفاً دوباره تلاش کنید',
        });
      }
      if (thumbnailBuffer && thumbnailKey) {
        await ctx.storage.uploadFile({
          key: thumbnailKey,
          buffer: thumbnailBuffer,
          mimeType: 'image/webp',
          size: thumbnailBuffer.length,
        });
      }

      // Save to database
      const count = await ctx.db.productMedia.count({ where: { productId: input.productId } });
      const sortOrder = count + 1;

      return ctx.db.productMedia.create({
        data: {
          productId: input.productId,
          fileKey: key,
          thumbnailKey,
          fileName: input.fileName,
          fileSize: processedBuffer.length,
          mimeType: input.mimeType.startsWith('image/') ? 'image/webp' : input.mimeType,
          type: input.mimeType.startsWith('video/') ? 'video' : 'image',
          isMain: input.isMain,
          sortOrder,
        },
      });
    }),

  // ── Media: Get Upload URL ─────────────────────────────────────────────────
  getMediaUploadUrl: activeProcedure
    .input(z.object({ productId: z.string().cuid(), fileName: z.string(), mimeType: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const product = await ctx.db.product.findFirst({
        where: { id: input.productId, userId: ctx.user.id },
      });
      if (!product) throw new TRPCError({ code: 'FORBIDDEN', message: 'دسترسی ندارید' });
      const key = `products/${input.productId}/${Date.now()}-${input.fileName}`;
      const url = await ctx.storage.getPresignedUploadUrl(key, input.mimeType, 600);
      return { url, key };
    }),

  // ── Media: Save after upload ──────────────────────────────────────────────
  addMedia: activeProcedure
    .input(
      z.object({
        productId: z.string().cuid(),
        fileKey: z.string(),
        fileName: z.string(),
        fileSize: z.number().int(),
        mimeType: z.string(),
        isMain: z.boolean().default(false),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const product = await ctx.db.product.findFirst({
        where: { id: input.productId, userId: ctx.user.id },
      });
      if (!product) throw new TRPCError({ code: 'FORBIDDEN', message: 'دسترسی ندارید' });

      // if isMain, unset other main flags
      if (input.isMain) {
        await ctx.db.productMedia.updateMany({
          where: { productId: input.productId },
          data: { isMain: false },
        });
      }

      const count = await ctx.db.productMedia.count({ where: { productId: input.productId } });

      return ctx.db.productMedia.create({
        data: {
          productId: input.productId,
          type: input.mimeType.startsWith('video/') ? 'video' : 'image',
          fileKey: input.fileKey,
          fileName: input.fileName,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          sortOrder: count,
          isMain: input.isMain || count === 0,
        },
      });
    }),

  // ── Media: Delete ─────────────────────────────────────────────────────────
  deleteMedia: activeProcedure
    .input(z.object({ mediaId: z.string().cuid(), productId: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      const media = await ctx.db.productMedia.findFirst({
        where: { id: input.mediaId, product: { userId: ctx.user.id } },
      });
      if (!media) throw new TRPCError({ code: 'NOT_FOUND', message: 'فایل پیدا نشد' });
      await ctx.db.productMedia.delete({ where: { id: input.mediaId } });
      return { ok: true };
    }),

  // ── Admin: Approve ────────────────────────────────────────────────────────
  approve: adminProcedure
    .input(z.object({
      id: z.string().cuid(),
      approve: z.boolean(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.product.update({
        where: { id: input.id },
        data: {
          isApproved: input.approve,
          approvedAt: input.approve ? new Date() : null,
          approvedById: input.approve ? ctx.user.id : null,
          rejectionReason: !input.approve ? input.reason : null,
        },
      });

      return { message: input.approve ? 'محصول تأیید شد' : 'محصول رد شد' };
    }),
});
