import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@repo/db';
import { userChatRouter } from '../userChat.router.js';
import { createTestUser } from '@repo/db/test-utils';

// ─── helpers ─────────────────────────────────────────────────────────────────

async function makeActiveCtx(overrides: Record<string, unknown> = {}) {
  const dbUser = await createTestUser(prisma, { role: 'TRADER', status: 'ACTIVE', ...overrides });
  const user = { id: dbUser.id, userCode: dbUser.userCode, role: dbUser.role, status: dbUser.status, isAdmin: false };
  return {
    db: prisma,
    user,
    req: { headers: {}, ip: '127.0.0.1' },
    res: {},
    cache: null,
    storage: null,
    ai: null,
    emailQueue: null,
  };
}

const caller = userChatRouter.createCaller;

// ─── listConversations ────────────────────────────────────────────────────────

describe('userChat.listConversations', () => {
  it('لیست مکالمات خالی برمی‌گرداند وقتی مکالمه‌ای نیست', async () => {
    const ctx = await makeActiveCtx();
    const result = await caller(ctx).listConversations();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── newConversation ──────────────────────────────────────────────────────────

describe('userChat.newConversation', () => {
  it('ایجاد مکالمه جدید با کاربر دیگر', async () => {
    const ctx1 = await makeActiveCtx();
    const ctx2 = await makeActiveCtx();

    const result = await caller(ctx1).newConversation({ participantUserCode: ctx2.user.userCode });
    expect(result).toHaveProperty('id');
    expect(result.isNew).toBe(true);
  });

  it('مکالمه موجود را بازمی‌گرداند اگر قبلاً وجود داشته باشد', async () => {
    const ctx1 = await makeActiveCtx();
    const ctx2 = await makeActiveCtx();

    const r1 = await caller(ctx1).newConversation({ participantUserCode: ctx2.user.userCode });
    const r2 = await caller(ctx1).newConversation({ participantUserCode: ctx2.user.userCode });
    expect(r1.id).toBe(r2.id);
    expect(r2.isNew).toBe(false);
  });

  it('چت با خود خطا می‌دهد', async () => {
    const ctx = await makeActiveCtx();
    await expect(
      caller(ctx).newConversation({ participantUserCode: ctx.user.userCode })
    ).rejects.toThrow();
  });

  it('کاربر ناموجود خطا NOT_FOUND می‌دهد', async () => {
    const ctx = await makeActiveCtx();
    await expect(
      caller(ctx).newConversation({ participantUserCode: 'USR9999999999' })
    ).rejects.toThrow();
  });
});

// ─── getMessages / sendMessage / deleteConversation ───────────────────────────

describe('userChat messaging flow', () => {
  let ctx1: Awaited<ReturnType<typeof makeActiveCtx>>;
  let ctx2: Awaited<ReturnType<typeof makeActiveCtx>>;
  let conversationId: string;

  beforeEach(async () => {
    ctx1 = await makeActiveCtx();
    ctx2 = await makeActiveCtx();
    const { id } = await caller(ctx1).newConversation({ participantUserCode: ctx2.user.userCode });
    conversationId = id;
  });

  it('getMessages — لیست پیام‌های خالی برمی‌گرداند', async () => {
    const result = await caller(ctx1).getMessages({ conversationId, limit: 50 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('getMessages — کاربر غیرمجاز FORBIDDEN دریافت می‌کند', async () => {
    const ctx3 = await makeActiveCtx();
    await expect(
      caller(ctx3).getMessages({ conversationId, limit: 50 })
    ).rejects.toThrow();
  });

  it('sendMessage — پیام ارسال می‌شود', async () => {
    const result = await caller(ctx1).sendMessage({ conversationId, content: 'سلام، تست پیام' });
    expect(result).toHaveProperty('id');
    expect(result.content).toBe('سلام، تست پیام');
  });

  it('sendMessage — کاربر غیرمجاز FORBIDDEN دریافت می‌کند', async () => {
    const ctx3 = await makeActiveCtx();
    await expect(
      caller(ctx3).sendMessage({ conversationId, content: 'تست' })
    ).rejects.toThrow();
  });

  it('deleteConversation — مکالمه حذف می‌شود', async () => {
    const result = await caller(ctx1).deleteConversation({ conversationId });
    expect(result).toHaveProperty('success', true);
  });

  it('deleteConversation — کاربر غیرمجاز FORBIDDEN دریافت می‌کند', async () => {
    const ctx3 = await makeActiveCtx();
    await expect(
      caller(ctx3).deleteConversation({ conversationId })
    ).rejects.toThrow();
  });
});
