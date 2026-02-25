import { z } from 'zod';
import { router, activeProcedure, adminProcedure } from '../trpc.js';
import {
  createTradeRequestSchema,
  createAnalysisRequestSchema,
  listTradeRequestsSchema,
} from '@repo/shared';
import { TRPCError } from '@trpc/server';

export const tradeRouter = router({
  // ── Create Request ────────────────────────────────────────────────────────
  createRequest: activeProcedure
    .input(createTradeRequestSchema)
    .mutation(async ({ input, ctx }) => {
      // Validate product if provided
      if (input.productId) {
        const product = await ctx.db.product.findUnique({
          where: { id: input.productId },
        });
        if (!product) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'محصول یافت نشد',
          });
        }
        if (!product.isApproved) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'محصول تأیید نشده است',
          });
        }
      }

      const request = await ctx.db.tradeRequest.create({
        data: {
          requesterId: ctx.user.id,
          type: input.type,
          productId: input.productId,
          productNameFa: input.productNameFa,
          productNameEn: input.productNameEn,
          hsCode: input.hsCode,
          commodityGroup: input.commodityGroup,
          quantity: input.quantity,
          targetPrice: input.targetPrice,
          currency: input.currency,
          deliveryLocation: input.deliveryLocation,
          notes: input.notes,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        },
      });

      return request;
    }),

  // ── List My Requests ──────────────────────────────────────────────────────
  myRequests: activeProcedure
    .input(listTradeRequestsSchema)
    .query(async ({ input, ctx }) => {
      const where: Record<string, unknown> = { requesterId: ctx.user.id };
      if (input.type) where['type'] = input.type;
      if (input.status) where['status'] = input.status;
      if (input.commodityGroup) where['commodityGroup'] = input.commodityGroup;

      const skip = (input.page - 1) * input.limit;
      const [total, requests] = await Promise.all([
        ctx.db.tradeRequest.count({ where }),
        ctx.db.tradeRequest.findMany({
          where, skip, take: input.limit,
          include: { product: { select: { nameFa: true, hsCode: true } } },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return { items: requests, pagination: { page: input.page, total, limit: input.limit } };
    }),

  // ── Get Request by ID ─────────────────────────────────────────────────────
  getById: activeProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      const request = await ctx.db.tradeRequest.findFirst({
        where: {
          id: input.id,
          requesterId: ctx.user.id, // Only allow access to own requests
        },
        include: {
          product: { select: { nameFa: true, nameEn: true, hsCode: true } },
        },
      });

      if (!request) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'درخواست یافت نشد' });
      }

      return {
        id: request.id,
        type: request.type,
        status: request.status,
        productNameFa: request.productNameFa,
        productNameEn: request.productNameEn,
        hsCode: request.hsCode,
        commodityGroup: request.commodityGroup,
        quantity: request.quantity,
        targetPrice: request.targetPrice,
        currency: request.currency,
        deliveryLocation: request.deliveryLocation,
        notes: request.notes,
        expiresAt: request.expiresAt,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        matchedAt: request.matchedAt,
        product: {
          nameFa: request.product?.nameFa,
          nameEn: request.product?.nameEn,
          hsCode: request.product?.hsCode,
        },
        matchedWith: null, // TODO: implement matching logic
        matchedBy: request.matchedBy ? { userCode: request.matchedBy } : null,
      };
    }),

  // ── آمار درخواست‌های تجاری کاربر ──────────────────────────────────────────
  myStats: activeProcedure.query(async ({ ctx }) => {
    const [total, pending, matched, inNegotiation] = await Promise.all([
      ctx.db.tradeRequest.count({ where: { requesterId: ctx.user.id } }),
      ctx.db.tradeRequest.count({ where: { requesterId: ctx.user.id, status: 'PENDING' } }),
      ctx.db.tradeRequest.count({ where: { requesterId: ctx.user.id, status: 'MATCHED' } }),
      ctx.db.tradeRequest.count({ where: { requesterId: ctx.user.id, status: 'IN_NEGOTIATION' } }),
    ]);
    return { total, pending, matched, inNegotiation };
  }),

  // ── Admin: List All & Match ───────────────────────────────────────────────
  adminList: adminProcedure
    .input(listTradeRequestsSchema)
    .query(async ({ input, ctx }) => {
      const where: Record<string, unknown> = {};
      if (input.type) where['type'] = input.type;
      if (input.status) where['status'] = input.status;

      const skip = (input.page - 1) * input.limit;
      const [total, requests] = await Promise.all([
        ctx.db.tradeRequest.count({ where }),
        ctx.db.tradeRequest.findMany({
          where, skip, take: input.limit,
          include: {
            requester: { select: { userCode: true, mobile: true } },
            product: { select: { nameFa: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return { data: requests, pagination: { page: input.page, total, limit: input.limit } };
    }),

  // ── Admin: Match buyer ↔ seller ───────────────────────────────────────────
  // ⚠️ این بخش منتظر تأیید workflow از کارفرماست
  matchRequests: adminProcedure
    .input(z.object({
      buyRequestId: z.string().cuid(),
      sellRequestId: z.string().cuid(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [buyRequest, sellRequest] = await Promise.all([
        ctx.db.tradeRequest.findUnique({ where: { id: input.buyRequestId }, include: { requester: true } }),
        ctx.db.tradeRequest.findUnique({ where: { id: input.sellRequestId }, include: { requester: true } }),
      ]);

      if (!buyRequest || !sellRequest) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'درخواست یافت نشد' });
      }

      await Promise.all([
        ctx.db.tradeRequest.update({
          where: { id: input.buyRequestId },
          data: { status: 'MATCHED', matchedWithId: input.sellRequestId, matchedAt: new Date(), matchedBy: ctx.user.id },
        }),
        ctx.db.tradeRequest.update({
          where: { id: input.sellRequestId },
          data: { status: 'MATCHED', matchedWithId: input.buyRequestId, matchedAt: new Date(), matchedBy: ctx.user.id },
        }),
      ]);

      // ایجاد اعلان برای خریدار
      await ctx.db.notification.create({
        data: {
          userId: buyRequest.requesterId,
          type: 'TRADE_REQUEST_MATCH',
          title: 'درخواست شما تطبیق یافت',
          message: `درخواست خرید شما با درخواست فروش تطبیق یافت. لطفاً با فروشنده تماس بگیرید.`,
          data: { matchedRequestId: input.sellRequestId },
        },
      });

      // ایجاد اعلان برای فروشنده
      await ctx.db.notification.create({
        data: {
          userId: sellRequest.requesterId,
          type: 'TRADE_REQUEST_MATCH',
          title: 'درخواست شما تطبیق یافت',
          message: `درخواست فروش شما با درخواست خرید تطبیق یافت. لطفاً با خریدار تماس بگیرید.`,
          data: { matchedRequestId: input.buyRequestId },
        },
      });

      return { message: 'درخواست‌ها با موفقیت تطبیق یافتند' };
    }),

  // ── Request Analysis ──────────────────────────────────────────────────────
  requestAnalysis: activeProcedure
    .input(createAnalysisRequestSchema)
    .mutation(async ({ input, ctx }) => {
      const request = await ctx.db.analysisRequest.create({
        data: {
          requesterId: ctx.user.id,
          subject: input.subject,
          commodityGroup: input.commodityGroup,
          targetMarket: input.targetMarket,
          description: input.description,
        },
      });

      return { id: request.id, message: 'درخواست تحلیل بازرگانی ثبت شد' };
    }),
});
