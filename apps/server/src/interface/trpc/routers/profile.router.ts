import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, activeProcedure } from '../trpc.js';
import { createProfileSchema, updateProfileSchema } from '@repo/shared';

// ─── Profile Router ───────────────────────────────────────────────────────────

export const profileRouter = router({
  // دریافت پروفایل کاربر جاری
  me: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.db.userProfile.findUnique({
      where: { userId: ctx.user.id },
      include: { documents: true },
    });
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
    return { user, profile };
  }),

  // ایجاد یا آپدیت پروفایل
  upsert: protectedProcedure
    .input(createProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.db.userProfile.upsert({
        where: { userId: ctx.user.id },
        create: {
          userId: ctx.user.id,
          companyName: input.companyName,
          unitName: input.unitName,
          unitType: input.unitType,
          guildCode: input.guildCode,
          businessId: input.businessId,
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
          description: input.description,
        },
        update: {
          companyName: input.companyName,
          unitName: input.unitName,
          unitType: input.unitType,
          guildCode: input.guildCode,
          businessId: input.businessId,
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
          description: input.description,
        },
      });
      return profile;
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
      return ctx.db.userProfile.update({
        where: { userId: ctx.user.id },
        data: {
          ...(input.companyName !== undefined && { companyName: input.companyName }),
          ...(input.unitName !== undefined && { unitName: input.unitName }),
          ...(input.phone !== undefined && { phone: input.phone }),
          ...(input.fax !== undefined && { fax: input.fax }),
          ...(input.website !== undefined && { website: input.website }),
          ...(input.activityType !== undefined && { activityType: input.activityType }),
          ...(input.position !== undefined && { position: input.position }),
          ...(input.commodityGroup !== undefined && { commodityGroup: input.commodityGroup }),
          ...(input.address !== undefined && {
            province: input.address.province,
            city: input.address.city,
            addressLine: input.address.addressLine,
            postalCode: input.address.postalCode,
          }),
        },
      });
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
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
          fileSize: 0,
          mimeType: 'application/octet-stream',
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
