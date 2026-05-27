import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@repo/db';
import { newsRouter } from '../news.router.js';
import { createTestUser } from '@repo/db/test-utils';

// ─── helpers ─────────────────────────────────────────────────────────────────

function makePublicCtx() {
  return {
    db: prisma,
    user: null,
    req: { headers: {}, ip: '127.0.0.1' },
    res: {},
    cache: null,
    storage: null,
    ai: null,
    emailQueue: null,
  };
}

async function makeAdminCtx() {
  const dbUser = await createTestUser(prisma, { role: 'TRADER', status: 'ACTIVE' });
  const user = {
    id: dbUser.id,
    userCode: dbUser.userCode,
    role: dbUser.role,
    status: dbUser.status,
    isAdmin: true,
    adminRole: 'SUPER_ADMIN',
  };
  return {
    db: prisma,
    user,
    req: { headers: {}, ip: '127.0.0.1' },
    res: {},
    cache: null,
    storage: {
      getPresignedUploadUrl: async (key: string, _ct: string, _exp: number) =>
        `https://storage.example.com/${key}?signature=mock`,
    },
    ai: null,
    emailQueue: null,
  };
}

const caller = newsRouter.createCaller;

// ─── Public endpoints ─────────────────────────────────────────────────────────

describe('news.list', () => {
  it('عمومی: لیست اخبار منتشرشده را برمی‌گرداند', async () => {
    const result = await caller(makePublicCtx()).list({ page: 1, limit: 10 });
    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('total');
    expect(Array.isArray(result.items)).toBe(true);
  });

  it('عمومی: فیلتر category کار می‌کند', async () => {
    const result = await caller(makePublicCtx()).list({ page: 1, limit: 10, category: 'NON_EXISTENT_CAT' });
    expect(result.items).toHaveLength(0);
  });

  it('عمومی: فیلتر search کار می‌کند', async () => {
    const result = await caller(makePublicCtx()).list({ page: 1, limit: 10, search: 'xyz_no_match_42' });
    expect(Array.isArray(result.items)).toBe(true);
  });
});

describe('news.latest', () => {
  it('عمومی: آخرین اخبار منتشرشده را برمی‌گرداند', async () => {
    const result = await caller(makePublicCtx()).latest({ limit: 5 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeLessThanOrEqual(5);
  });
});

describe('news.byId', () => {
  it('عمومی: خبر ناموجود null برمی‌گرداند', async () => {
    const result = await caller(makePublicCtx()).byId({ id: 'non-existent-id-000' });
    expect(result).toBeNull();
  });
});

// ─── Newsletter subscription ──────────────────────────────────────────────────

describe('news.subscribe / unsubscribe', () => {
  const testEmail = `test.news.sub.${Date.now()}@example.com`;

  it('subscribe — عضویت جدید را ثبت می‌کند', async () => {
    const result = await caller(makePublicCtx()).subscribe({ email: testEmail, name: 'Test User' });
    expect(result).toHaveProperty('ok', true);
  });

  it('subscribe — عضویت تکراری پیام مناسب می‌دهد', async () => {
    const result = await caller(makePublicCtx()).subscribe({ email: testEmail });
    expect(result).toHaveProperty('ok', true);
    expect(result.message).toContain('عضو');
  });

  it('unsubscribe — لغو عضویت موفق است', async () => {
    const result = await caller(makePublicCtx()).unsubscribe({ email: testEmail });
    expect(result).toHaveProperty('ok', true);
  });

  it('subscribe — بعد از unsubscribe دوباره فعال می‌شود', async () => {
    const result = await caller(makePublicCtx()).subscribe({ email: testEmail });
    expect(result).toHaveProperty('ok', true);
    expect(result.message).toContain('فعال');
  });
});

// ─── Admin endpoints ──────────────────────────────────────────────────────────

describe('news admin CRUD', () => {
  let newsId: string;

  it('adminCreate — ادمین می‌تواند خبر جدید ایجاد کند', async () => {
    const adminCtx = await makeAdminCtx();
    const result = await caller(adminCtx).adminCreate({
      title: 'خبر تست یونیت',
      content: 'این یک محتوای کافی برای تست است که بیش از ده کاراکتر دارد.',
      summary: 'خلاصه خبر تست',
      category: 'GENERAL',
      tags: ['test', 'unit'],
      isPublished: true,
    });
    expect(result).toHaveProperty('id');
    expect(result.title).toBe('خبر تست یونیت');
    newsId = result.id;
  });

  it('adminList — ادمین لیست همه اخبار را می‌بیند', async () => {
    const adminCtx = await makeAdminCtx();
    const result = await caller(adminCtx).adminList({ page: 1, limit: 20 });
    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('total');
    expect(result.total).toBeGreaterThan(0);
  });

  it('adminUpdate — ادمین می‌تواند خبر را ویرایش کند', async () => {
    if (!newsId) return;
    const adminCtx = await makeAdminCtx();
    const result = await caller(adminCtx).adminUpdate({
      id: newsId,
      title: 'خبر تست یونیت ویرایش‌شده',
    });
    expect(result.title).toBe('خبر تست یونیت ویرایش‌شده');
  });

  it('adminDelete — ادمین می‌تواند خبر را حذف کند', async () => {
    if (!newsId) return;
    const adminCtx = await makeAdminCtx();
    const result = await caller(adminCtx).adminDelete({ id: newsId });
    expect(result).toHaveProperty('ok', true);
  });

  it('adminGetUploadUrl — آدرس آپلود تصویر برمی‌گردانداد', async () => {
    const adminCtx = await makeAdminCtx();
    const result = await caller(adminCtx).adminGetUploadUrl({
      fileName: 'test-image.jpg',
      contentType: 'image/jpeg',
    });
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('key');
    expect(result.key).toMatch(/^news\//);
  });
});
