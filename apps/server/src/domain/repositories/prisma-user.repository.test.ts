import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaUserRepository } from '../../infrastructure/repositories/prisma-user.repository.js';
import { prisma } from '@repo/db';

let repo: PrismaUserRepository;

if (!process.env.DATABASE_URL) {
  describe.skip('PrismaUserRepository', () => {
    it('skipped because DATABASE_URL is not set', () => {});
  });
} else {
  describe('PrismaUserRepository', () => {
  beforeEach(async () => {
    repo = new PrismaUserRepository(prisma as any);
    // clean users and tokens before each test
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('findByEmail returns user when found', async () => {
    const created = await prisma.user.create({
      data: {
        userCode: 'U001',
        membershipType: 'INDIVIDUAL',
        role: 'TRADER',
        mobile: '09123456789',
        email: 'foo@bar.com',
        passwordHash: 'hash',
        agreedToTerms: true,
      },
    });
    const result = await repo.findByEmail('foo@bar.com');
    expect(result).not.toBeNull();
    expect(result?.email).toBe('foo@bar.com');
  });

  it('findByEmail returns null when not found', async () => {
    const result = await repo.findByEmail('nope@nowhere.com');
    expect(result).toBeNull();
  });

  it('create user with required fields', async () => {
    const user = await repo.create({
      userCode: 'U002',
      membershipType: 'INDIVIDUAL',
      role: 'TRADER',
      mobile: '09123450000',
      email: 'new@domain.com',
      passwordHash: 'pwd',
      agreedToTerms: true,
    } as any);
    expect(user.id).toBeDefined();
    expect(user.email).toBe('new@domain.com');
  });

  it('create rejects duplicate email', async () => {
    await repo.create({
      userCode: 'U003',
      membershipType: 'INDIVIDUAL',
      role: 'TRADER',
      mobile: '09123450001',
      email: 'dup@domain.com',
      passwordHash: 'pwd',
      agreedToTerms: true,
    } as any);
    await expect(
      repo.create({
        userCode: 'U004',
        membershipType: 'INDIVIDUAL',
        role: 'TRADER',
        mobile: '09123450002',
        email: 'dup@domain.com',
        passwordHash: 'pwd',
        agreedToTerms: true,
      } as any)
    ).rejects.toThrow();
  });

  it('updateStatus updates user status', async () => {
    const created = await repo.create({
      userCode: 'U005',
      membershipType: 'INDIVIDUAL',
      role: 'TRADER',
      mobile: '09123450003',
      email: 'status@domain.com',
      passwordHash: 'pwd',
      agreedToTerms: true,
    } as any);
    await repo.updateStatus(created.id, 'ACTIVE');
    const updated = await repo.findByEmail('status@domain.com');
    expect(updated?.status).toBe('ACTIVE');
  });

  it('countByPrefix counts correctly', async () => {
    await repo.create({
      userCode: 'PRE1',
      membershipType: 'INDIVIDUAL',
      role: 'TRADER',
      mobile: '09123450004',
      email: 'pre1@domain.com',
      passwordHash: 'pwd',
      agreedToTerms: true,
    } as any);
    await repo.create({
      userCode: 'PRE2',
      membershipType: 'INDIVIDUAL',
      role: 'TRADER',
      mobile: '09123450005',
      email: 'pre2@domain.com',
      passwordHash: 'pwd',
      agreedToTerms: true,
    } as any);
    await repo.create({
      userCode: 'OTHER',
      membershipType: 'INDIVIDUAL',
      role: 'TRADER',
      mobile: '09123450006',
      email: 'other@domain.com',
      passwordHash: 'pwd',
      agreedToTerms: true,
    } as any);

    const count = await repo.countByPrefix('PRE');
    expect(count).toBe(2);
  });

  it('findByMobile supports case insensitive lookup', async () => {
    await repo.create({
      userCode: 'U006',
      membershipType: 'INDIVIDUAL',
      role: 'TRADER',
      mobile: '09123451234',
      email: null,
      passwordHash: 'pwd',
      agreedToTerms: true,
    } as any);
    const v = await repo.findByMobile('09123451234');
    expect(v).not.toBeNull();
  });

  it('findByUserCode returns correct user', async () => {
    await repo.create({
      userCode: 'UNIQCODE',
      membershipType: 'INDIVIDUAL',
      role: 'TRADER',
      mobile: '09123450123',
      email: null,
      passwordHash: 'pwd',
      agreedToTerms: true,
    } as any);
    const v = await repo.findByUserCode('UNIQCODE');
    expect(v).not.toBeNull();
    expect(v?.userCode).toBe('UNIQCODE');
  });
});
}
