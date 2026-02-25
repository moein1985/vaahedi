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

// ─── Init Sentry ──────────────────────────────────────────────────────────────

if (process.env['SENTRY_DSN']) {
  Sentry.init({
    dsn: process.env['SENTRY_DSN'],
    environment: process.env['NODE_ENV'] ?? 'development',
    tracesSampleRate: process.env['NODE_ENV'] === 'production' ? 0.1 : 1.0,
  });
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env['APP_PORT'] ?? '4000', 10);
const HOST = '0.0.0.0';

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
      baseUrl: process.env['AVALAI_BASE_URL'] ?? 'https://api.avalai.ir/v1',
      model: process.env['AVALAI_MODEL'] ?? 'google/gemini-2.0-flash-exp',
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
  logger: process.env['NODE_ENV'] === 'production'
    ? {
        level: 'info',
        // لاگ ساختاریافته برای سیستم‌های لاگ مانند Datadog/Loki
        serializers: {
          req: (req) => ({
            method: req.method,
            url: req.url,
            ip: req.ip,
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
        },
      }
    : {
        level: 'debug',
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

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', timestamp: new Date().toISOString() };
  } catch {
    return { status: 'degraded', db: 'error' };
  }
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

app.get('/api/media/:key', async (req: FastifyRequest<{ Params: { key: string } }>, reply) => {
  try {
    const { key } = req.params;
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
    console.log(`💊 Health: http://${HOST}:${PORT}/health`);
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
  if (process.env['SENTRY_DSN']) {
    Sentry.captureException(error);
  }

  app.log.error(error);
  reply.status(500).send({ error: 'Internal Server Error' });
});

await start();
