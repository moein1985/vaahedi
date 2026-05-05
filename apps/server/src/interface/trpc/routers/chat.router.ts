import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, activeProcedure } from '../trpc.js';

const PLATFORM_SERVICES = [
  'درخواست ها (RFQ)',
  'بازار (Marketplace)',
  'پیام ها',
  'AI مشاور',
  'اسناد',
  'مالی',
  'پشتیبانی',
  'کدهای گمرکی (HS Codes)',
  'بخشنامه ها',
];

export const chatRouter = router({
  // ── New Conversation ──────────────────────────────────────────────────────
  newConversation: activeProcedure
    .input(z.object({ title: z.string().max(200).optional() }))
    .mutation(async ({ input, ctx }) => {
      const conversation = await ctx.db.aiConversation.create({
        data: {
          userId: ctx.user.id,
          title: input.title ?? 'مکالمه جدید',
        },
      });

      return { id: conversation.id };
    }),

  // ── List Conversations ─────────────────────────────────────────────────────
  listConversations: activeProcedure.query(async ({ ctx }) => {
    return ctx.db.aiConversation.findMany({
      where: { userId: ctx.user.id, isActive: true },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: { id: true, title: true, updatedAt: true },
    });
  }),

  // ── Get Messages ──────────────────────────────────────────────────────────
  getMessages: activeProcedure
    .input(z.object({ conversationId: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      const conversation = await ctx.db.aiConversation.findFirst({
        where: { id: input.conversationId, userId: ctx.user.id },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });

      if (!conversation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'مکالمه یافت نشد' });
      }

      return conversation.messages;
    }),

  // ── Send Message (Non-streaming for now — Streaming via SSE endpoint)  ───
  // ⚠️ فاز آینده: این endpoint با avalai.ir یکپارچه می‌شود
  // فعلاً پاسخ ساده بدون streaming
  sendMessage: activeProcedure
    .input(z.object({
      conversationId: z.string().cuid(),
      message: z.string().min(1).max(4000),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.ai) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'سرویس چت هوشمند هنوز فعال نشده است',
        });
      }

      const conversation = await ctx.db.aiConversation.findFirst({
        where: { id: input.conversationId, userId: ctx.user.id },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 20, // فقط ۲۰ پیام آخر برای context
          },
        },
      });

      if (!conversation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'مکالمه یافت نشد' });
      }

      // ذخیره پیام کاربر
      await ctx.db.aiMessage.create({
        data: {
          conversationId: input.conversationId,
          role: 'USER',
          content: input.message,
        },
      });

      // دریافت context کاربر (Orchestrator Context)
      const [user, profile, productCount, activeTradeCount, unreadNotifications, productServices, tradeServices] = await Promise.all([
        ctx.db.user.findUnique({
          where: { id: ctx.user.id },
          include: {
            profile: {
              select: {
                companyName: true,
                unitName: true,
                activityType: true,
                commodityGroup: true,
                phone: true,
                province: true,
                documents: { select: { id: true } },
              },
            },
          },
        }),
        ctx.db.userProfile.findUnique({
          where: { userId: ctx.user.id },
          select: {
            companyName: true,
            unitName: true,
            activityType: true,
            commodityGroup: true,
            phone: true,
            province: true,
            documents: { select: { id: true } },
          },
        }),
        ctx.db.product.count({ where: { userId: ctx.user.id } }),
        ctx.db.tradeRequest.count({
          where: {
            requesterId: ctx.user.id,
            status: { in: ['PENDING', 'IN_NEGOTIATION'] },
          },
        }),
        ctx.db.notification.count({
          where: {
            userId: ctx.user.id,
            isRead: false,
          },
        }),
        ctx.db.product.findMany({
          where: { userId: ctx.user.id, serviceCode: { not: null } },
          select: { serviceCode: true },
          distinct: ['serviceCode'],
          take: 20,
        }),
        ctx.db.tradeRequest.findMany({
          where: { requesterId: ctx.user.id, serviceCode: { not: null } },
          select: { serviceCode: true },
          distinct: ['serviceCode'],
          take: 20,
        }),
      ]);

      const profileRef = profile ?? user?.profile;
      const completionSteps = {
        basicInfo: !!(profileRef?.companyName || profileRef?.unitName),
        contactInfo: !!(profileRef?.phone || profileRef?.province),
        businessInfo: !!(profileRef?.activityType || profileRef?.commodityGroup),
        documents: (profileRef?.documents?.length ?? 0) > 0,
      };
      const completionDone = Object.values(completionSteps).filter(Boolean).length;
      const completionPercent = Math.round((completionDone / Object.keys(completionSteps).length) * 100);

      const offeredServices = [
        ...productServices.map((p) => p.serviceCode).filter(Boolean),
        ...tradeServices.map((t) => t.serviceCode).filter(Boolean),
      ];
      const uniqueOfferedServices = Array.from(new Set(offeredServices)).filter(
        (code): code is string => typeof code === 'string' && code.trim().length > 0,
      );

      // جمع‌آوری پیام‌ها برای AI
      const messages = [
        ...conversation.messages.map((m) => ({
          role: m.role.toLowerCase() as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content: input.message },
      ];

      // دریافت پاسخ از AI
      let fullResponse = '';
      for await (const chunk of ctx.ai.sendMessage({
        conversationId: input.conversationId,
        messages,
        userContext: {
          role: ctx.user.role,
          commodityGroup: profileRef?.commodityGroup ?? undefined,
          activityType: profileRef?.activityType ?? undefined,
          companyName: profileRef?.companyName ?? profileRef?.unitName ?? undefined,
          profileCompletionPercent: completionPercent,
          activeProductsCount: productCount,
          activeTradesCount: activeTradeCount,
          unreadNotificationsCount: unreadNotifications,
          offeredServices: uniqueOfferedServices,
          platformServices: PLATFORM_SERVICES,
        },
      })) {
        fullResponse += chunk;
      }

      // ذخیره پاسخ AI
      const aiMessage = await ctx.db.aiMessage.create({
        data: {
          conversationId: input.conversationId,
          role: 'ASSISTANT',
          content: fullResponse,
        },
      });

      // آپدیت زمان آخرین مکالمه
      await ctx.db.aiConversation.update({
        where: { id: input.conversationId },
        data: { updatedAt: new Date() },
      });

      return { id: aiMessage.id, content: fullResponse };
    }),

  // ── Delete Conversation ────────────────────────────────────────────────────
  deleteConversation: activeProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.aiConversation.updateMany({
        where: { id: input.id, userId: ctx.user.id },
        data: { isActive: false },
      });
      return { success: true };
    }),
});
