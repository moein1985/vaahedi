import { initTRPC, TRPCError } from '@trpc/server';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { PrismaClient } from '@repo/db';
import type { ICacheService, IStorageService, IAIChatService, IEmailQueueService } from '../../application/ports/index.js';
import superjson from 'superjson';

// ─── Context ──────────────────────────────────────────────────────────────────

export interface AppContext {
  req: FastifyRequest;
  res: FastifyReply;
  db: PrismaClient;
  cache: ICacheService;
  storage: IStorageService;
  ai: IAIChatService | null;
  emailQueue: IEmailQueueService;
  user: {
    id: string;
    userCode: string;
    role: string;
    status: string;
    isAdmin: boolean;
    adminRole?: string;
  } | null;
}

export type { AppContext as Context };

// ─── tRPC Init ────────────────────────────────────────────────────────────────

const t = initTRPC.context<AppContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Zod validation errors
        zodError:
          error.cause instanceof Error && 'issues' in error.cause
            ? (error.cause as { issues: unknown[] }).issues
            : null,
      },
    };
  },
});

// ─── Base Procedures ──────────────────────────────────────────────────────────

export const router = t.router;
export const publicProcedure = t.procedure;
export const mergeRouters = t.mergeRouters;

// ─── Middleware: Auth ─────────────────────────────────────────────────────────

const isAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'برای دسترسی به این بخش باید وارد شوید',
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

const isActiveUser = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'ابتدا وارد شوید' });
  }
  if (ctx.user.status !== 'ACTIVE') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'حساب شما هنوز تأیید نشده است. لطفاً منتظر بررسی مدارک باشید',
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user || !ctx.user.isAdmin) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'دسترسی فقط برای مدیران مجاز است',
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// ─── Middleware: Logging ──────────────────────────────────────────────────────

const withLogging = t.middleware(async ({ path, type, next, ctx }) => {
  const start = Date.now();
  const result = await next();
  const ms = Date.now() - start;

  const status = result.ok ? 'OK' : 'ERR';
  const userId = ctx.user?.id ?? 'guest';
  console.log(`[tRPC] ${type} ${path} [${status}] ${ms}ms | user=${userId}`);

  return result;
});

// ─── Protected Procedures ─────────────────────────────────────────────────────

export const protectedProcedure = t.procedure
  .use(withLogging)
  .use(isAuthenticated);

export const activeProcedure = t.procedure
  .use(withLogging)
  .use(isAuthenticated)
  .use(isActiveUser);

export const adminProcedure = t.procedure
  .use(withLogging)
  .use(isAuthenticated)
  .use(isAdmin);
