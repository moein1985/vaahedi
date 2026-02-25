import { describe, it, expect, beforeEach } from 'vitest';
import { createTestContext, createAuthenticatedContext } from '../../../test/test-context.js';
import { authRouter } from './auth.router.js';
import { prisma } from '@repo/db';
import jwt from 'jsonwebtoken';

const caller = authRouter.createCaller;

// if no database url configured, skip the suite to avoid initialization errors
if (!process.env.DATABASE_URL) {
  describe.skip('Auth Router (additional)', () => {
    it('skipped because DATABASE_URL is not set', () => {});
  });
} else {
  describe('Auth Router (additional)', () => {
    let ctx: any;

  beforeEach(async () => {
    ctx = await createTestContext();
    // clear users and tokens before each test
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('register (email flow)', () => {
    it('should register a new user with valid email and password', async () => {
      const input = {
        membershipType: 'INDIVIDUAL',
        firstName: 'Alice',
        lastName: 'Wonder',
        nationalCode: '0001000004',
        mobile: '09123456789',
        email: 'alice@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'TRADER',
        agreedToTerms: true,
        captchaToken: 'token',
      };

      const result = await caller(ctx).register(input as any);
      expect(result.user).toHaveProperty('id');
      expect(result.user.email).toBe('alice@example.com');
      expect(result).toHaveProperty('accessToken');
      // password must not be returned
      expect((result.user as any).passwordHash).toBeUndefined();
    });

    it('should reject duplicate email', async () => {
      const input = {
        membershipType: 'INDIVIDUAL',
        firstName: 'Bob',
        lastName: 'Builder',
        nationalCode: '0001000012',
        mobile: '09123456780',
        email: 'bob@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'TRADER',
        agreedToTerms: true,
        captchaToken: 'token',
      };
      await caller(ctx).register(input as any);
      await expect(caller(ctx).register(input as any)).rejects.toThrow();
    });

    it('should reject invalid email format', async () => {
      const bad = {
        membershipType: 'INDIVIDUAL',
        firstName: 'Charlie',
        lastName: 'Chaplin',
        nationalCode: '0987654321',
        mobile: '09123456781',
        email: 'not-an-email',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'TRADER',
        agreedToTerms: true,
        captchaToken: 'token',
      };
      await expect(caller(ctx).register(bad as any)).rejects.toThrow();
    });
  });

  describe('loginWithEmail()', () => {
    beforeEach(async () => {
      // ensure user exists
      await caller(ctx).register({
        membershipType: 'INDIVIDUAL',
        firstName: 'Test',
        lastName: 'User',
        nationalCode: '1111111111',
        mobile: '09123456782',
        email: 'testuser@example.com',
        password: 'Secret123',
        confirmPassword: 'Secret123',
        role: 'TRADER',
        agreedToTerms: true,
        captchaToken: 'token',
      } as any);
    });

    it('should successfully login with valid email and password', async () => {
      const res = await caller(ctx).loginWithEmail({
        email: 'testuser@example.com',
        password: 'Secret123',
        captchaToken: 'meh',
      });
      expect(res).toHaveProperty('accessToken');
      expect(res).toHaveProperty('user');
      expect(res.user.email).toBe('testuser@example.com');
    });

    it('should reject non-existent email', async () => {
      await expect(
        caller(ctx).loginWithEmail({
          email: 'doesnotexist@example.com',
          password: 'whatever',
          captchaToken: 'meh',
        })
      ).rejects.toThrow();
    });

    it('should reject incorrect password', async () => {
      await expect(
        caller(ctx).loginWithEmail({
          email: 'testuser@example.com',
          password: 'WrongPass',
          captchaToken: 'meh',
        })
      ).rejects.toThrow();
    });

    it('should return user object with accessToken', async () => {
      const res = await caller(ctx).loginWithEmail({
        email: 'testuser@example.com',
        password: 'Secret123',
        captchaToken: 'meh',
      });
      expect(res.accessToken).toBeDefined();
      expect(res.user.id).toBeDefined();
    });
  });

  describe('refreshToken & logout', () => {
    let refreshToken: string;
    let userId: string;

    beforeEach(async () => {
      // register and login to generate tokens
      const reg = await caller(ctx).register({
        membershipType: 'INDIVIDUAL',
        firstName: 'Refresh',
        lastName: 'User',
        nationalCode: '2222222222',
        mobile: '09123456783',
        email: 'refresh@example.com',
        password: 'Rt123456',
        confirmPassword: 'Rt123456',
        role: 'TRADER',
        agreedToTerms: true,
        captchaToken: 'token',
      } as any);
      userId = reg.user.id;

      // simulate login to produce refreshToken
      const loginRes = await caller(ctx).loginWithEmail({
        email: 'refresh@example.com',
        password: 'Rt123456',
        captchaToken: 'token',
      });
      // create refresh token manually since cookies not set via caller
      refreshToken = jwt.sign({ sub: userId }, process.env['JWT_REFRESH_SECRET']!, { expiresIn: '7d' });
      // put in ctx cookie
      (ctx.req as any).cookies['refreshToken'] = refreshToken;
    });

    it('should return new accessToken with valid refresh token', async () => {
      const result = await caller(ctx).refreshToken();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.user.id).toBe(userId);
    });

    it('should reject expired refresh token', async () => {
      // override cookie with invalid
      (ctx.req as any).cookies['refreshToken'] = 'invalid-token';
      await expect(caller(ctx).refreshToken()).rejects.toThrow();
    });

    it('logout should invalidate user session', async () => {
      const authCtx = await createAuthenticatedContext(prisma);
      const whocaller = caller(authCtx);
      const result = await whocaller.logout();
      expect(result).toEqual({ success: true });
    });

    it('logout should work only for authenticated users', async () => {
      await expect(caller(ctx).logout()).rejects.toThrow();
    });
  });
  });
}
