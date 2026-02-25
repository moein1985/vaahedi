import { router } from './trpc.js';
import { authRouter } from './routers/auth.router.js';
import { productRouter } from './routers/product.router.js';
import { tradeRouter } from './routers/trade.router.js';
import { chatRouter } from './routers/chat.router.js';
import { userChatRouter } from './routers/userChat.router.js';
import { profileRouter } from './routers/profile.router.js';
import { servicesRouter } from './routers/services.router.js';
import { adminRouter } from './routers/admin.router.js';
import { supportRouter } from './routers/support.router.js';
import { notificationRouter } from './routers/notification.router.js';

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  auth: authRouter,
  product: productRouter,
  trade: tradeRouter,
  chat: chatRouter,
  userChat: userChatRouter,
  profile: profileRouter,
  services: servicesRouter,
  admin: adminRouter,
  support: supportRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;
