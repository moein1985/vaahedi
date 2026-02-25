import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, activeProcedure } from '../trpc.js';

export const userChatRouter = router({
  // ── لیست مکالمات کاربر ───────────────────────────────────────────────────
  listConversations: activeProcedure.query(async ({ ctx }) => {
    const conversations = await ctx.db.conversation.findMany({
      where: {
        participants: {
          some: { userId: ctx.user.id },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                userCode: true,
                profile: { select: { companyName: true } },
              },
            },
          },
        },
        lastMessage: {
          include: {
            sender: { select: { userCode: true } },
          },
        },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map((conv) => ({
      id: conv.id,
      participants: conv.participants.map((p) => ({
        id: p.user.id,
        userCode: p.user.userCode,
        companyName: p.user.profile?.companyName,
      })),
      lastMessage: conv.lastMessage ? {
        content: conv.lastMessage.content,
        senderUserCode: conv.lastMessage.sender.userCode,
        createdAt: conv.lastMessage.createdAt,
      } : null,
      messageCount: conv._count.messages,
      updatedAt: conv.updatedAt,
    }));
  }),

  // ── ایجاد مکالمه جدید ────────────────────────────────────────────────────
  newConversation: activeProcedure
    .input(z.object({ participantUserCode: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // پیدا کردن کاربر دیگر
      const otherUser = await ctx.db.user.findUnique({
        where: { userCode: input.participantUserCode },
        select: { id: true, userCode: true },
      });

      if (!otherUser) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'کاربر یافت نشد' });
      }

      if (otherUser.id === ctx.user.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'نمی‌توانید با خود چت کنید' });
      }

      // چک کردن آیا مکالمه موجود است
      const existingConversation = await ctx.db.conversation.findFirst({
        where: {
          AND: [
            { participants: { some: { userId: ctx.user.id } } },
            { participants: { some: { userId: otherUser.id } } },
          ],
        },
        include: { participants: true },
      });

      if (existingConversation && existingConversation.participants.length === 2) {
        return { id: existingConversation.id, isNew: false };
      }

      // ایجاد مکالمه جدید
      const conversation = await ctx.db.conversation.create({
        data: {
          participants: {
            create: [
              { userId: ctx.user.id },
              { userId: otherUser.id },
            ],
          },
        },
      });

      return { id: conversation.id, isNew: true };
    }),

  // ── دریافت پیام‌های یک مکالمه ───────────────────────────────────────────
  getMessages: activeProcedure
    .input(z.object({ conversationId: z.string(), limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ input, ctx }) => {
      // چک کردن دسترسی
      const participant = await ctx.db.conversationParticipant.findFirst({
        where: {
          conversationId: input.conversationId,
          userId: ctx.user.id,
        },
      });

      if (!participant) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'دسترسی ندارید' });
      }

      const messages = await ctx.db.message.findMany({
        where: { conversationId: input.conversationId },
        include: {
          sender: { select: { userCode: true, profile: { select: { companyName: true } } } },
        },
        orderBy: { createdAt: 'asc' },
        take: input.limit,
      });

      return messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        sender: {
          userCode: msg.sender.userCode,
          companyName: msg.sender.profile?.companyName,
        },
        isRead: msg.isRead,
        createdAt: msg.createdAt,
      }));
    }),

  // ── ارسال پیام ───────────────────────────────────────────────────────────
  sendMessage: activeProcedure
    .input(z.object({ conversationId: z.string(), content: z.string().min(1).max(1000) }))
    .mutation(async ({ input, ctx }) => {
      // چک کردن دسترسی
      const participant = await ctx.db.conversationParticipant.findFirst({
        where: {
          conversationId: input.conversationId,
          userId: ctx.user.id,
        },
      });

      if (!participant) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'دسترسی ندارید' });
      }

      // ایجاد پیام
      const message = await ctx.db.message.create({
        data: {
          conversationId: input.conversationId,
          senderId: ctx.user.id,
          content: input.content,
        },
        include: {
          sender: { select: { userCode: true } },
        },
      });

      // بروزرسانی آخرین پیام مکالمه
      await ctx.db.conversation.update({
        where: { id: input.conversationId },
        data: { lastMessageId: message.id, updatedAt: new Date() },
      });

      // پیدا کردن گیرنده و ایجاد اعلان
      const otherParticipant = await ctx.db.conversationParticipant.findFirst({
        where: {
          conversationId: input.conversationId,
          userId: { not: ctx.user.id },
        },
        include: { user: { select: { id: true } } },
      });

      if (otherParticipant) {
        await ctx.db.notification.create({
          data: {
            userId: otherParticipant.userId,
            type: 'NEW_MESSAGE',
            title: 'پیام جدید',
            message: `شما پیام جدیدی از ${message.sender.userCode} دریافت کرده‌اید.`,
            data: { conversationId: input.conversationId },
          },
        });
      }

      return {
        id: message.id,
        content: message.content,
        sender: {
          userCode: message.sender.userCode,
        },
        createdAt: message.createdAt,
      };
    }),

  // ── حذف مکالمه ──────────────────────────────────────────────────────────
  deleteConversation: activeProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // چک کردن دسترسی
      const participant = await ctx.db.conversationParticipant.findFirst({
        where: {
          conversationId: input.conversationId,
          userId: ctx.user.id,
        },
      });

      if (!participant) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'دسترسی ندارید' });
      }

      // حذف مکالمه (cascade حذف پیام‌ها و شرکت‌کنندگان)
      await ctx.db.conversation.delete({
        where: { id: input.conversationId },
      });

      return { success: true };
    }),
});
