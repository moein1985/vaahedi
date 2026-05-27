import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, activeProcedure } from '../trpc.js';
import { createProfileSchema, updateProfileSchema } from '@repo/shared';

const DOC_LABELS: Record<string, string> = {
  ESTABLISHMENT_NOTICE: 'آگهی تأسیس',
  BOARD_CHANGES: 'تغییرات هیئت مدیره',
  OPERATION_LICENSE: 'پروانه بهره‌برداری',
  PRODUCTION_LICENSE: 'مجوز تولید',
  GUILD_LICENSE: 'مجوز صنفی',
  KNOWLEDGE_BASED_LICENSE: 'مجوز دانش‌بنیان',
  OTHER_LICENSES: 'سایر مجوزها',
  ISO_CERTIFICATE: 'گواهی ایزو',
  BUSINESS_CARD: 'کارت بازرگانی',
  ID_DOCUMENT: 'مدرک هویتی (کارت ملی/پاسپورت)',
};

const PROFILE_DOC_MAX_BYTES = 20 * 1024 * 1024;
const PROFILE_DOC_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

function isAllowedProfileDocMimeType(mimeType: string): boolean {
  return PROFILE_DOC_ALLOWED_MIME_TYPES.includes(mimeType as (typeof PROFILE_DOC_ALLOWED_MIME_TYPES)[number]);
}

type OccupationMappingRow = {
  occupationCategoryId: string;
  categoryId: string;
  categoryCode: string;
  categoryNameFa: string;
  categoryNameEn: string | null;
  categoryParentId: string | null;
};

function normalizeOccupationCategoryIds(input: {
  occupationCategoryId?: string;
  occupationCategoryIds?: string[];
}): string[] {
  const rawIds =
    input.occupationCategoryIds && input.occupationCategoryIds.length > 0
      ? input.occupationCategoryIds
      : input.occupationCategoryId
        ? [input.occupationCategoryId]
        : [];

  return Array.from(new Set(rawIds.filter((id): id is string => Boolean(id))));
}

async function ensureOccupationCategoriesExist(db: any, occupationCategoryIds: string[]): Promise<void> {
  if (occupationCategoryIds.length === 0) return;

  const existing = await db.occupationCategory.findMany({
    where: { id: { in: occupationCategoryIds } },
    select: { id: true },
  });

  if (existing.length !== occupationCategoryIds.length) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'حداقل یکی از دسته‌بندی‌های شغلی انتخاب‌شده معتبر نیست',
    });
  }
}

async function syncOccupationMappings(db: any, profileId: string, occupationCategoryIds: string[]): Promise<void> {
  await db.$executeRaw`
    DELETE FROM "occupation_mappings"
    WHERE "profileId" = ${profileId}
  `;

  for (const occupationCategoryId of occupationCategoryIds) {
    await db.$executeRaw`
      INSERT INTO "occupation_mappings" (
        "id",
        "profileId",
        "occupationCategoryId",
        "createdAt"
      )
      VALUES (
        ${randomUUID()},
        ${profileId},
        ${occupationCategoryId},
        NOW()
      )
      ON CONFLICT ("profileId", "occupationCategoryId") DO NOTHING
    `;
  }
}

async function loadOccupationMappings(db: any, profileId: string): Promise<OccupationMappingRow[]> {
  return db.$queryRaw<OccupationMappingRow[]>`
    SELECT
      om."occupationCategoryId" AS "occupationCategoryId",
      oc."id" AS "categoryId",
      oc."code" AS "categoryCode",
      oc."nameFa" AS "categoryNameFa",
      oc."nameEn" AS "categoryNameEn",
      oc."parentId" AS "categoryParentId"
    FROM "occupation_mappings" om
    JOIN "occupation_categories" oc ON oc."id" = om."occupationCategoryId"
    WHERE om."profileId" = ${profileId}
    ORDER BY oc."sortOrder" ASC, oc."nameFa" ASC
  `;
}

// ─── Profile Router ───────────────────────────────────────────────────────────

export const profileRouter = router({
  // دریافت پروفایل کاربر جاری
  me: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.db.userProfile.findUnique({
      where: { userId: ctx.user.id },
      include: { documents: true },
    });

    const occupationMappings = profile
      ? await loadOccupationMappings(ctx.db, profile.id)
      : [];

    const hydratedProfile = profile
      ? {
          ...profile,
          occupationCategoryIds: occupationMappings.map((mapping) => mapping.occupationCategoryId),
          occupationCategories: occupationMappings.map((mapping) => ({
            id: mapping.categoryId,
            code: mapping.categoryCode,
            nameFa: mapping.categoryNameFa,
            nameEn: mapping.categoryNameEn,
            parentId: mapping.categoryParentId,
          })),
        }
      : null;

    const user = await ctx.db.user.findUniqueOrThrow({
      where: { id: ctx.user.id },
      select: {
        id: true,
        userCode: true,
        mobile: true,
        email: true,
        role: true,
        membershipType: true,
        status: true,
        createdAt: true,
      },
    });
    return { user, profile: hydratedProfile };
  }),

  // ایجاد یا آپدیت پروفایل
  upsert: protectedProcedure
    .input(createProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const passportExpiryDate = input.passportExpiryDate
        ? new Date(`${input.passportExpiryDate}T00:00:00.000Z`)
        : null;

      const occupationCategoryIds = normalizeOccupationCategoryIds({
        occupationCategoryId: input.occupationCategoryId,
        occupationCategoryIds: input.occupationCategoryIds,
      });

      await ensureOccupationCategoriesExist(ctx.db, occupationCategoryIds);

      const primaryOccupationCategoryId = occupationCategoryIds[0] ?? null;

      // Enforce uploading selected mandatory documents before profile completion.
      const existingProfile = await ctx.db.userProfile.findUnique({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      const uploadedDocs = existingProfile
        ? await ctx.db.document.findMany({
            where: {
              profileId: existingProfile.id,
              type: { in: input.licenseTypes as never[] },
            },
            select: { type: true },
          })
        : [];

      const uploadedTypes = new Set(uploadedDocs.map((doc) => String(doc.type)));
      const missingDocTypes = input.licenseTypes.filter((type) => !uploadedTypes.has(String(type)));

      if (missingDocTypes.length > 0) {
        const firstMissingDoc = DOC_LABELS[String(missingDocTypes[0])] ?? 'مدرک انتخاب‌شده';
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `برای تکمیل پروفایل، ابتدا فایل مربوط به «${firstMissingDoc}» را آپلود کنید`,
        });
      }

      const profile = await ctx.db.$transaction(async (tx) => {
        const upserted = await tx.userProfile.upsert({
          where: { userId: ctx.user.id },
          create: {
            userId: ctx.user.id,
            companyName: input.companyName,
            unitName: input.unitName,
            unitType: input.unitType,
            guildCode: input.guildCode,
            businessId: input.businessId,
            producedGoods: input.producedGoods,
            productIdNumber: input.productIdNumber,
            singleProduct: input.singleProduct ?? false,
            phone: input.phone,
            fax: input.fax,
            website: input.website,
            province: input.address?.province,
            city: input.address?.city,
            addressLine: input.address?.addressLine,
            postalCode: input.address?.postalCode,
            activityType: input.activityType,
            commodityGroup: input.commodityGroup,
            position: input.position,
            experienceYears: input.experienceYears,
            passportNumber: input.passportNumber,
            passportExpiryDate,
            description: input.description,
            // فیلدهای کشاورزی
            occupationCategoryId: primaryOccupationCategoryId,
            farmingAreaHectares: input.farmingAreaHectares,
            irrigationType: input.irrigationType,
            mainCrops: input.mainCrops ?? [],
            tradeDirection: input.tradeDirection,
          },
          update: {
            companyName: input.companyName,
            unitName: input.unitName,
            unitType: input.unitType,
            guildCode: input.guildCode,
            businessId: input.businessId,
            producedGoods: input.producedGoods,
            productIdNumber: input.productIdNumber,
            singleProduct: input.singleProduct ?? false,
            phone: input.phone,
            fax: input.fax,
            website: input.website,
            province: input.address?.province,
            city: input.address?.city,
            addressLine: input.address?.addressLine,
            postalCode: input.address?.postalCode,
            activityType: input.activityType,
            commodityGroup: input.commodityGroup,
            position: input.position,
            experienceYears: input.experienceYears,
            passportNumber: input.passportNumber,
            passportExpiryDate,
            description: input.description,
            // فیلدهای کشاورزی
            occupationCategoryId: primaryOccupationCategoryId,
            farmingAreaHectares: input.farmingAreaHectares,
            irrigationType: input.irrigationType,
            mainCrops: input.mainCrops ?? [],
            tradeDirection: input.tradeDirection,
          },
        });

        await syncOccupationMappings(tx, upserted.id, occupationCategoryIds);
        return upserted;
      });

      const occupationMappings = await loadOccupationMappings(ctx.db, profile.id);
      return {
        ...profile,
        occupationCategoryIds: occupationMappings.map((mapping) => mapping.occupationCategoryId),
      };
    }),

  // به‌روزرسانی بخشی از پروفایل
  update: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.userProfile.findUnique({
        where: { userId: ctx.user.id },
      });
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'پروفایل یافت نشد' });
      }

      const occupationPayloadTouched =
        input.occupationCategoryId !== undefined || input.occupationCategoryIds !== undefined;

      const occupationCategoryIds = occupationPayloadTouched
        ? normalizeOccupationCategoryIds({
            occupationCategoryId: input.occupationCategoryId,
            occupationCategoryIds: input.occupationCategoryIds,
          })
        : [];

      if (occupationPayloadTouched) {
        await ensureOccupationCategoriesExist(ctx.db, occupationCategoryIds);
      }

      const updated = await ctx.db.$transaction(async (tx) => {
        const profile = await tx.userProfile.update({
          where: { userId: ctx.user.id },
          data: {
            ...(input.companyName !== undefined && { companyName: input.companyName }),
            ...(input.unitName !== undefined && { unitName: input.unitName }),
            ...(input.phone !== undefined && { phone: input.phone }),
            ...(input.fax !== undefined && { fax: input.fax }),
            ...(input.website !== undefined && { website: input.website }),
            ...(input.activityType !== undefined && { activityType: input.activityType }),
            ...(input.position !== undefined && { position: input.position }),
            ...(input.passportNumber !== undefined && { passportNumber: input.passportNumber }),
            ...(input.passportExpiryDate !== undefined && {
              passportExpiryDate: input.passportExpiryDate
                ? new Date(`${input.passportExpiryDate}T00:00:00.000Z`)
                : null,
            }),
            ...(input.commodityGroup !== undefined && { commodityGroup: input.commodityGroup }),
            ...(input.address !== undefined && {
              province: input.address.province,
              city: input.address.city,
              addressLine: input.address.addressLine,
              postalCode: input.address.postalCode,
            }),
            // فیلدهای کشاورزی
            ...(occupationPayloadTouched && { occupationCategoryId: occupationCategoryIds[0] ?? null }),
            ...(input.farmingAreaHectares !== undefined && { farmingAreaHectares: input.farmingAreaHectares }),
            ...(input.irrigationType !== undefined && { irrigationType: input.irrigationType }),
            ...(input.mainCrops !== undefined && { mainCrops: input.mainCrops }),
            ...(input.tradeDirection !== undefined && { tradeDirection: input.tradeDirection }),
          },
        });

        if (occupationPayloadTouched) {
          await syncOccupationMappings(tx, profile.id, occupationCategoryIds);
        }

        return profile;
      });

      const occupationMappings = await loadOccupationMappings(ctx.db, updated.id);
      return {
        ...updated,
        occupationCategoryIds: occupationMappings.map((mapping) => mapping.occupationCategoryId),
      };
    }),

  // وضعیت تکمیل پروفایل
  completionStatus: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.db.userProfile.findUnique({
      where: { userId: ctx.user.id },
      include: { documents: true },
    });
    const steps = {
      basicInfo: !!(profile?.companyName || profile?.unitName),
      contactInfo: !!(profile?.phone || profile?.province),
      businessInfo: !!(profile?.activityType || profile?.commodityGroup),
      documents: (profile?.documents?.length ?? 0) > 0,
    };
    const completedSteps = Object.values(steps).filter(Boolean).length;
    return {
      steps,
      percent: Math.round((completedSteps / Object.keys(steps).length) * 100),
      isComplete: completedSteps === Object.keys(steps).length,
    };
  }),

  // آپلود مدرک (presigned URL)
  getUploadUrl: protectedProcedure
    .input(
      z.object({
        documentType: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        fileSize: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!isAllowedProfileDocMimeType(input.mimeType)) {
        console.error('[upload.profile.invalid_mime]', {
          userId: ctx.user.id,
          documentType: input.documentType,
          fileName: input.fileName,
          mimeType: input.mimeType,
        });
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'فرمت فایل مجاز نیست. فرمت‌های قابل قبول: PDF, PNG, JPG, DOC, DOCX',
        });
      }

      if (input.fileSize > PROFILE_DOC_MAX_BYTES) {
        console.error('[upload.profile.file_too_large]', {
          userId: ctx.user.id,
          documentType: input.documentType,
          fileName: input.fileName,
          fileSize: input.fileSize,
          maxBytes: PROFILE_DOC_MAX_BYTES,
        });
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'حجم فایل بیشتر از حد مجاز است (حداکثر ۲۰ مگابایت)',
        });
      }

      const key = `documents/${ctx.user.id}/${input.documentType}/${Date.now()}-${input.fileName}`;
      const uploadUrl = await ctx.storage.getPresignedUploadUrl(key, input.mimeType, 600);
      return { uploadUrl, key };
    }),

  // ثبت مدرک بعد از آپلود
  saveDocument: protectedProcedure
    .input(
      z.object({
        documentType: z.string(),
        fileKey: z.string(),
        fileName: z.string(),
        fileSize: z.number().int().positive(),
        mimeType: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!isAllowedProfileDocMimeType(input.mimeType)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'نوع فایل ثبت شده معتبر نیست',
        });
      }

      // اطمینان از وجود پروفایل
      await ctx.db.userProfile.upsert({
        where: { userId: ctx.user.id },
        create: { userId: ctx.user.id },
        update: {},
      });

      return ctx.db.document.create({
        data: {
          profileId: (
            await ctx.db.userProfile.findUniqueOrThrow({
              where: { userId: ctx.user.id },
              select: { id: true },
            })
          ).id,
          type: input.documentType as never,
          fileKey: input.fileKey,
          fileName: input.fileName,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
        },
      });
    }),

  // مشاهده مدارک آپلود شده
  documents: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.db.userProfile.findUnique({
      where: { userId: ctx.user.id },
      select: { id: true },
    });
    if (!profile) return [];
    return ctx.db.document.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
  }),

  // پروفایل عمومی یک کاربر
  public: activeProcedure
    .input(z.object({ userCode: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { userCode: input.userCode },
        select: {
          userCode: true,
          role: true,
          membershipType: true,
          createdAt: true,
          profile: {
            select: {
              companyName: true,
              unitName: true,
              unitType: true,
              activityType: true,
              website: true,
            },
          },
          products: {
            where: { isApproved: true },
            select: {
              id: true,
              nameFa: true,
              nameEn: true,
              hsCode: true,
              commodityGroup: true,
              media: { take: 1, select: { fileKey: true } },
            },
            take: 12,
          },
        },
      });
      if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'کاربر یافت نشد' });
      return user;
    }),
});
