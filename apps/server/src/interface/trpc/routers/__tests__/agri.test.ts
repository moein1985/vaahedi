import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@repo/db';
import { agriRouter } from '../agri.router.js';
import { createTestUser } from '@repo/db/test-utils';

// ─── helpers ─────────────────────────────────────────────────────────────────

function makePublicCtx() {
  return { db: prisma, user: null, req: { headers: {}, ip: '127.0.0.1' }, res: {}, cache: null, storage: null, ai: null, emailQueue: null };
}

async function makeAdminCtx() {
  const dbUser = await createTestUser(prisma, { role: 'TRADER', status: 'ACTIVE' });
  const user = { id: dbUser.id, userCode: dbUser.userCode, role: dbUser.role, status: dbUser.status, isAdmin: true, adminRole: 'SUPER_ADMIN' };
  return { db: prisma, user, req: { headers: {}, ip: '127.0.0.1' }, res: {}, cache: null, storage: null, ai: null, emailQueue: null };
}

const caller = agriRouter.createCaller;

type AuditRow = {
  action: string;
  entityType: string;
  entityId: string;
  actorUserId: string;
};

async function getLatestAudit(action: string): Promise<AuditRow | null> {
  const rows = await prisma.$queryRaw<AuditRow[]>`
    SELECT "action", "entityType", "entityId", "actorUserId"
    FROM "audit_logs"
    WHERE "action" = ${action}
    ORDER BY "createdAt" DESC
    LIMIT 1
  `;
  return rows[0] ?? null;
}

// ─── Taxonomy ─────────────────────────────────────────────────────────────────

describe('agri.taxonomy', () => {
  it('listFlat — عمومی: لیست دسته‌بندی‌های فعال برمی‌گرداند', async () => {
    const result = await caller(makePublicCtx()).taxonomy.listFlat({ onlyActive: true });
    expect(Array.isArray(result)).toBe(true);
  });

  it('list — عمومی: درخت دسته‌بندی برمی‌گرداند', async () => {
    const result = await caller(makePublicCtx()).taxonomy.list({ onlyActive: true });
    expect(Array.isArray(result)).toBe(true);
  });

  it('create — ادمین: ایجاد دسته جدید', async () => {
    const adminCtx = await makeAdminCtx();
    const unique = `TEST.AGRI.${Date.now()}`;
    const result = await caller(adminCtx).taxonomy.create({
      code: unique,
      nameFa: 'دسته تست',
      nameEn: 'Test Category',
      isActive: true,
      sortOrder: 99,
    });
    expect(result).toHaveProperty('id');
    expect(result.code).toBe(unique);

    const audit = await getLatestAudit('AGRI_TAXONOMY_CREATED');
    expect(audit?.entityType).toBe('OccupationCategory');
    expect(audit?.entityId).toBe(result.id);
    expect(audit?.actorUserId).toBe(adminCtx.user.id);

    // cleanup
    await caller(adminCtx).taxonomy.delete({ id: result.id });
  });

  it('create — ادمین: کد تکراری خطا می‌دهد', async () => {
    const adminCtx = await makeAdminCtx();
    // از کد موجود seed استفاده می‌کنیم
    const existing = await prisma.occupationCategory.findFirst();
    if (!existing) return; // seed نشده — skip ضمنی
    await expect(
      caller(adminCtx).taxonomy.create({
        code: existing.code,
        nameFa: 'تکراری',
        isActive: true,
        sortOrder: 0,
      })
    ).rejects.toThrow();
  });

  it('delete — ادمین: حذف دسته‌ای که فرزند دارد خطا می‌دهد', async () => {
    const adminCtx = await makeAdminCtx();
    const parent = await prisma.occupationCategory.findFirst({ where: { children: { some: {} } } });
    if (!parent) return; // داده کافی نیست
    await expect(
      caller(adminCtx).taxonomy.delete({ id: parent.id })
    ).rejects.toThrow(/فرزند/);
  });
});

// ─── Harvest Calendar ─────────────────────────────────────────────────────────

describe('agri.harvest', () => {
  let createdId: string | null = null;

  it('list — عمومی: فهرست پایه برمی‌گرداند', async () => {
    const result = await caller(makePublicCtx()).harvest.list({ onlyActive: true, page: 1, limit: 10 });
    expect(result).toHaveProperty('items');
    expect(Array.isArray(result.items)).toBe(true);
    expect(result).toHaveProperty('total');
  });

  it('list — فیلتر ماه کار می‌کند', async () => {
    const result = await caller(makePublicCtx()).harvest.list({ onlyActive: true, month: 3, page: 1, limit: 20 });
    for (const item of result.items) {
      expect(item.harvestStartMonth <= 3 && item.harvestEndMonth >= 3).toBe(true);
    }
  });

  it('create — ادمین: ایجاد ورودی جدید', async () => {
    const adminCtx = await makeAdminCtx();
    const result = await caller(adminCtx).harvest.create({
      cropNameFa: 'کلزا تستی',
      cropNameEn: 'Test Canola',
      harvestStartMonth: 4,
      harvestEndMonth: 5,
      commodityGroup: 'AGRICULTURAL',
      province: 'اصفهان',
      isActive: true,
    });
    expect(result).toHaveProperty('id');
    expect(result.cropNameFa).toBe('کلزا تستی');

    const audit = await getLatestAudit('AGRI_HARVEST_CREATED');
    expect(audit?.entityType).toBe('HarvestCalendar');
    expect(audit?.entityId).toBe(result.id);
    expect(audit?.actorUserId).toBe(adminCtx.user.id);

    createdId = result.id;
  });

  it('update — ادمین: به‌روزرسانی موجودی موجود', async () => {
    if (!createdId) return;
    const adminCtx = await makeAdminCtx();
    const result = await caller(adminCtx).harvest.update({
      id: createdId,
      data: { variety: 'هایولا ۳۰۸' },
    });
    expect(result.variety).toBe('هایولا ۳۰۸');
  });

  it('delete — ادمین: حذف موجودی ایجادشده', async () => {
    if (!createdId) return;
    const adminCtx = await makeAdminCtx();
    const result = await caller(adminCtx).harvest.delete({ id: createdId });
    expect(result).toHaveProperty('success', true);
    createdId = null;
  });
});

// ─── Market Insights ─────────────────────────────────────────────────────────

describe('agri.market', () => {
  let createdId: string | null = null;
  let adminUserId: string | null = null;

  beforeEach(async () => {
    // adminUserId tracked to verify authorId on created insights (optional)
    if (!adminUserId) {
      const dbUser = await createTestUser(prisma, { role: 'TRADER', status: 'ACTIVE' });
      adminUserId = dbUser.id;
    }
  });

  it('list — عمومی: فقط منتشرشده‌ها برمی‌گرداند', async () => {
    const result = await caller(makePublicCtx()).market.list({ onlyPublished: true, page: 1, limit: 10 });
    expect(result).toHaveProperty('items');
    for (const item of result.items) {
      expect(item.isPublished).toBe(true);
    }
  });

  it('list — فیلتر نوع تحلیل کار می‌کند', async () => {
    const result = await caller(makePublicCtx()).market.list({
      onlyPublished: true,
      insightType: 'price',
      page: 1,
      limit: 10,
    });
    for (const item of result.items) {
      expect(item.insightType).toBe('price');
    }
  });

  it('create — ادمین: ایجاد بینش جدید', async () => {
    const adminCtx = await makeAdminCtx();
    const result = await caller(adminCtx).market.create({
      title: 'تحلیل تستی قیمت ذرت',
      commodityFa: 'ذرت',
      insightType: 'price',
      content: 'محتوای آزمایشی برای تست واحد agri market router',
      tags: ['ذرت', 'قیمت'],
    });
    expect(result).toHaveProperty('id');
    expect(result.isPublished).toBe(false); // پیش‌فرض: منتشرنشده

    const audit = await getLatestAudit('AGRI_MARKET_INSIGHT_CREATED');
    expect(audit?.entityType).toBe('MarketInsight');
    expect(audit?.entityId).toBe(result.id);
    expect(audit?.actorUserId).toBe(adminCtx.user.id);

    createdId = result.id;
  });

  it('publish — ادمین: انتشار و لغو انتشار', async () => {
    if (!createdId) return;
    const adminCtx = await makeAdminCtx();
    const published = await caller(adminCtx).market.publish({ id: createdId, isPublished: true });
    expect(published.isPublished).toBe(true);
    expect(published.publishedAt).not.toBeNull();

    const publishAudit = await getLatestAudit('AGRI_MARKET_INSIGHT_PUBLISH_TOGGLED');
    expect(publishAudit?.entityType).toBe('MarketInsight');
    expect(publishAudit?.entityId).toBe(createdId);
    expect(publishAudit?.actorUserId).toBe(adminCtx.user.id);

    const unpublished = await caller(adminCtx).market.publish({ id: createdId, isPublished: false });
    expect(unpublished.isPublished).toBe(false);
  });

  it('delete — ادمین: حذف بینش ایجادشده', async () => {
    if (!createdId) return;
    const adminCtx = await makeAdminCtx();
    const result = await caller(adminCtx).market.delete({ id: createdId });
    expect(result).toHaveProperty('success', true);
    createdId = null;
  });
});
