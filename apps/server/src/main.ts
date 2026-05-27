import Fastify from 'fastify';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyCookie from '@fastify/cookie';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyWebsocket from '@fastify/websocket';
import jwt from 'jsonwebtoken';
import * as Sentry from '@sentry/node';
import { prisma } from '@repo/db';
import { appRouter } from './interface/trpc/root.router.js';
import type { AppContext } from './interface/trpc/trpc.js';
import { RedisCacheService } from './infrastructure/cache/redis-cache.service.js';
import { MinioStorageService } from './infrastructure/storage/minio-storage.service.js';
import { AvalaiChatService } from './infrastructure/ai/avalai-chat.service.js';

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const APP_ENV = process.env['APP_ENV'] ?? process.env['NODE_ENV'] ?? 'development';
const PORT = parseInt(process.env['APP_PORT'] ?? '4000', 10);
const HOST = '0.0.0.0';
const LOG_LEVEL = process.env['LOG_LEVEL'] ?? (APP_ENV === 'production' ? 'info' : 'debug');
const READINESS_TIMEOUT_MS = parseInt(process.env['READINESS_TIMEOUT_MS'] ?? '3000', 10);

const SENTRY_DSN = process.env['SENTRY_DSN'] ?? '';
const SENTRY_ENVIRONMENT = process.env['SENTRY_ENVIRONMENT'] ?? APP_ENV;
const SENTRY_RELEASE = process.env['SENTRY_RELEASE'];
const sentryTraceRateRaw = process.env['SENTRY_TRACES_SAMPLE_RATE']
  ?? (APP_ENV === 'production' ? '0.1' : '1.0');
const SENTRY_TRACES_SAMPLE_RATE = Number.parseFloat(sentryTraceRateRaw);

// ─── Init Sentry ──────────────────────────────────────────────────────────────

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    release: SENTRY_RELEASE,
    tracesSampleRate: Number.isFinite(SENTRY_TRACES_SAMPLE_RATE)
      ? SENTRY_TRACES_SAMPLE_RATE
      : 0.1,
  });
}

// ─── Infrastructure Setup ─────────────────────────────────────────────────────

const cache = new RedisCacheService(process.env['REDIS_URL'] ?? 'redis://localhost:6379');

const s3EndpointUrl = new URL(process.env['S3_ENDPOINT'] ?? 'http://localhost:9000');
const storage = new MinioStorageService({
  endpoint: s3EndpointUrl.hostname,
  port: parseInt(s3EndpointUrl.port || '9000', 10),
  useSSL: (process.env['S3_USE_SSL'] ?? 'false') === 'true',
  accessKey: process.env['S3_ACCESS_KEY'] ?? '',
  secretKey: process.env['S3_SECRET_KEY'] ?? '',
  bucket: process.env['S3_BUCKET'] ?? 'vaahedi-uploads',
});

// AI Chat (اگر کانفیگ شده باشد)
const ai = process.env['AVALAI_API_KEY']
  ? new AvalaiChatService({
      apiKey: process.env['AVALAI_API_KEY'],
      baseUrl: process.env['AVALAI_BASE_URL'] ?? 'https://api.avalapis.ir/v1',
      model: process.env['AVALAI_MODEL'] ?? 'gemini-3.1-flash-lite-preview',
    })
  : null;

// ─── Email Worker ─────────────────────────────────────────────────────────────

// Import email worker to start it
import './infrastructure/queue/email-worker.js';

// Email Queue Service
import { EmailQueueService } from './infrastructure/queue/email-queue.service.js';
const emailQueue = new EmailQueueService();

// ─── Fastify Instance ─────────────────────────────────────────────────────────

const app = Fastify({
  logger: APP_ENV === 'production'
    ? {
        level: LOG_LEVEL,
        // لاگ ساختاریافته برای سیستم‌های لاگ مانند Datadog/Loki
        serializers: {
          req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
        },
      }
    : {
        level: LOG_LEVEL,
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
        },
      },
  maxParamLength: 5000,
});

// ─── Plugins ──────────────────────────────────────────────────────────────────

await app.register(fastifyCookie, {
  secret: process.env['JWT_ACCESS_SECRET'] ?? 'cookie-secret',
});

await app.register(fastifyCors, {
  origin: process.env['FRONTEND_URL'] ?? 'http://localhost:3000',
  credentials: true,
});

await app.register(fastifyHelmet, {
  contentSecurityPolicy: process.env['NODE_ENV'] === 'production',
});

await app.register(fastifyRateLimit, {
  max: parseInt(process.env['RATE_LIMIT_MAX'] ?? '100', 10),
  timeWindow: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] ?? '60000', 10),
  keyGenerator: (req) => req.ip,
});

// ─── tRPC ─────────────────────────────────────────────────────────────────────

await app.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: {
    router: appRouter,
    createContext: async ({ req, res }: { req: FastifyRequest; res: FastifyReply }): Promise<AppContext> => {
      // JWT auth از Authorization header یا cookie
      let user: AppContext['user'] = null;

      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

      if (token) {
        try {
          const secret = process.env['JWT_ACCESS_SECRET']!;
          const payload = jwt.verify(token, secret) as {
            sub: string;
            userCode: string;
            role: string;
          };

          // بررسی admin بودن
          const adminProfile = await prisma.adminProfile.findUnique({
            where: { userId: payload.sub },
          });

          const dbUser = await prisma.user.findUnique({
            where: { id: payload.sub },
            select: { status: true },
          });

          user = {
            id: payload.sub,
            userCode: payload.userCode,
            role: payload.role,
            status: dbUser?.status ?? 'PENDING',
            isAdmin: !!adminProfile,
            adminRole: adminProfile?.adminRole ?? undefined,
          };
        } catch {
          // توکن نامعتبر — user = null
        }
      }

      return {
        req,
        res,
        db: prisma,
        cache,
        storage,
        ai,
        emailQueue,
        user,
      };
    },
  },
});

// ─── WebSocket ────────────────────────────────────────────────────────────────

await app.register(fastifyWebsocket);

// Map برای نگه‌داشتن connection های فعال
const activeConnections = new Map<string, Set<WebSocket>>();

// ─── Health / Readiness / Liveness ───────────────────────────────────────────

type DependencyStatus = {
  status: 'ok' | 'error';
  latencyMs: number;
  error?: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(`${label} check timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

async function runDependencyCheck(label: string, checker: () => Promise<void>): Promise<DependencyStatus> {
  const startedAt = Date.now();
  try {
    await checker();
    return { status: 'ok', latencyMs: Date.now() - startedAt };
  } catch (error) {
    return {
      status: 'error',
      latencyMs: Date.now() - startedAt,
      error: getErrorMessage(error),
    };
  }
}

app.get('/live', async () => {
  return {
    status: 'alive',
    environment: APP_ENV,
    timestamp: new Date().toISOString(),
    uptimeSec: Math.round(process.uptime()),
  };
});

app.get('/health', async (_req, reply) => {
  const database = await runDependencyCheck('database', async () => {
    await withTimeout(prisma.$queryRaw`SELECT 1`, READINESS_TIMEOUT_MS, 'database');
  });

  const status = database.status === 'ok' ? 'ok' : 'degraded';
  reply.code(status === 'ok' ? 200 : 503);
  return {
    status,
    environment: APP_ENV,
    timestamp: new Date().toISOString(),
    uptimeSec: Math.round(process.uptime()),
    checks: {
      database,
    },
  };
});

app.get('/ready', async (_req, reply) => {
  const [database, cacheCheck, storageCheck] = await Promise.all([
    runDependencyCheck('database', async () => {
      await withTimeout(prisma.$queryRaw`SELECT 1`, READINESS_TIMEOUT_MS, 'database');
    }),
    runDependencyCheck('cache', async () => {
      const result = await withTimeout(cache.getClient().ping(), READINESS_TIMEOUT_MS, 'cache');
      if (result !== 'PONG') {
        throw new Error(`unexpected redis ping response: ${result}`);
      }
    }),
    runDependencyCheck('storage', async () => {
      await withTimeout(storage.ensureBucketExists(), READINESS_TIMEOUT_MS, 'storage');
    }),
  ]);

  const status = (database.status === 'ok' && cacheCheck.status === 'ok' && storageCheck.status === 'ok')
    ? 'ready'
    : 'degraded';

  reply.code(status === 'ready' ? 200 : 503);
  return {
    status,
    environment: APP_ENV,
    timestamp: new Date().toISOString(),
    uptimeSec: Math.round(process.uptime()),
    checks: {
      database,
      cache: cacheCheck,
      storage: storageCheck,
      ai: {
        configured: !!ai,
        available: ai?.isAvailable() ?? false,
      },
    },
  };
});

// ─── Sitemap ──────────────────────────────────────────────────────────────────

app.get('/sitemap.xml', async (req, reply) => {
  const products = await prisma.product.findMany({
    where: { isApproved: true },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 1000,
  });

  const appUrl = process.env['APP_URL'] ?? 'https://your-domain.ir';
  const urls = [
    `<url><loc>${appUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    `<url><loc>${appUrl}/catalog</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>`,
    ...products.map(p =>
      `<url><loc>${appUrl}/catalog/${p.id}</loc><lastmod>${p.updatedAt.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`
    ),
  ];

  reply
    .header('Content-Type', 'application/xml')
    .send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`);
});

// ─── Media Proxy ──────────────────────────────────────────────────────────────

app.get('/api/media/*', async (req: FastifyRequest, reply) => {
  try {
    const key = (req.params as Record<string, string>)['*'] ?? '';
    if (!key) { reply.status(400).send({ error: 'Missing media key' }); return; }
    const url = await storage.getPresignedUrl(key, 3600); // 1 hour expiry
    reply.redirect(url);
  } catch (error) {
    reply.status(404).send({ error: 'Media not found' });
  }
});

// ─── WebSocket Chat ───────────────────────────────────────────────────────────

app.get('/ws/chat/:conversationId', { websocket: true }, async (connection, req) => {
  const { conversationId } = req.params as { conversationId: string };

  // احراز هویت از cookie
  const token = req.cookies['accessToken'];
  if (!token) {
    connection.socket.close(4001, 'Unauthorized');
    return;
  }

  let userId: string;
  try {
    const secret = process.env['JWT_ACCESS_SECRET']!;
    const payload = jwt.verify(token, secret) as { sub: string; userCode: string; role: string };
    userId = payload.sub;
  } catch {
    connection.socket.close(4001, 'Invalid token');
    return;
  }

  console.log(`🔗 WebSocket connection established for conversation ${conversationId} by user ${userId}`);

  // اضافه کردن به connections
  if (!activeConnections.has(conversationId)) {
    activeConnections.set(conversationId, new Set());
  }
  activeConnections.get(conversationId)!.add(connection.socket);

  connection.socket.on('message', async (rawMessage: Buffer) => {
    try {
      const data = JSON.parse(rawMessage.toString());
      if (data.type === 'message') {
        // ذخیره در DB
        const newMessage = await prisma.message.create({
          data: {
            conversationId,
            senderId: userId,
            content: data.content,
          },
          include: {
            sender: {
              select: {
                id: true,
                userCode: true,
                profile: { select: { companyName: true } },
              },
            },
          },
        });

        // broadcast به همه ی connections این conversation
        const conns = activeConnections.get(conversationId);
        if (conns) {
          const payload = JSON.stringify({
            type: 'message',
            message: {
              id: newMessage.id,
              content: newMessage.content,
              sender: {
                userCode: newMessage.sender.userCode,
                companyName: newMessage.sender.profile?.companyName,
              },
              isRead: false,
              createdAt: newMessage.createdAt,
            },
          });
          conns.forEach((conn) => {
            if (conn.readyState === WebSocket.OPEN) {
              conn.send(payload);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  });

  connection.socket.on('close', () => {
    console.log(`🔌 WebSocket connection closed for conversation ${conversationId}`);
    activeConnections.get(conversationId)?.delete(connection.socket);
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

async function start() {
  try {
    // اتصال به Redis
    await cache.connect();

    // راه‌اندازی سرور
    await app.listen({ port: PORT, host: HOST });
    console.log(`🚀 Server running at http://${HOST}:${PORT}`);
    console.log(`📡 tRPC API: http://${HOST}:${PORT}/trpc`);
    console.log(`💚 Live: http://${HOST}:${PORT}/live`);
    console.log(`💊 Health: http://${HOST}:${PORT}/health`);
    console.log(`🧪 Ready: http://${HOST}:${PORT}/ready`);
    console.log(`🛰️ Monitoring: ${SENTRY_DSN ? 'Sentry enabled' : 'Sentry disabled'}`);
    console.log(`🤖 AI Chat: ${ai ? 'Enabled' : 'Disabled (AVALAI_API_KEY not set)'}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

const shutdown = async () => {
  console.log('\n🛑 Shutting down...');
  await app.close();
  await prisma.$disconnect();
  await cache.disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// ─── Global Error Handler ────────────────────────────────────────────────────

app.setErrorHandler((error, request, reply) => {
  // گزارش خطاها به Sentry
  let sentryEventId: string | undefined;
  if (SENTRY_DSN) {
    sentryEventId = Sentry.captureException(error, {
      tags: {
        appEnv: APP_ENV,
        method: request.method,
      },
      extra: {
        path: request.url,
        reqId: request.id,
      },
    });
  }

  app.log.error({ err: error, reqId: request.id, path: request.url, sentryEventId }, 'Unhandled request error');

  reply.status(500).send({
    error: 'Internal Server Error',
    ...(sentryEventId ? { errorId: sentryEventId } : {}),
  });
});

await start();
