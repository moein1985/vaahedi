import { describe, it, expect, beforeEach } from 'vitest';
import { createTestContext } from '../../../../test/test-context.js';
import { authRouter } from '../auth.router.js';
import { prisma } from '@repo/db';
import jwt from 'jsonwebtoken';

const caller = authRouter.createCaller;

describe('Auth Router', () => {
  let ctx: any;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const result = await caller(ctx).register({
        membershipType: 'INDIVIDUAL',
        firstName: 'John',
        lastName: 'Doe',
        nationalCode: '0491570007',
        mobile: '09123456789',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'TRADER',
        agreedToTerms: true,
        captchaToken: 'test-token',
      });

      expect(result.user).toHaveProperty('userCode');
      expect(result.user).toHaveProperty('mobile');
      expect(result.user).toHaveProperty('status');
      expect(String(result.user.userCode)).toMatch(/^\d{8}$/);
    });

    it('should not register duplicate mobile', async () => {
      await caller(ctx).register({
        membershipType: 'INDIVIDUAL',
        firstName: 'John',
        lastName: 'Doe',
        nationalCode: '0491570007',
        mobile: '09123456789',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'TRADER',
        agreedToTerms: true,
        captchaToken: 'test-token',
      });

      await expect(
        caller(ctx).register({
          membershipType: 'INDIVIDUAL',
          firstName: 'Jane',
          lastName: 'Smith',
          nationalCode: '1111111111',
          mobile: '09123456789',
          email: 'jane@smith.com',
          password: 'password456',
          confirmPassword: 'password456',
          role: 'TRADER',
          agreedToTerms: true,
          captchaToken: 'test-token',
        })
      ).rejects.toThrow('این شماره همراه قبلاً ثبت شده است');
    });

    it('should validate mobile format', async () => {
      await expect(
        caller(ctx).register({
          mobile: '123456789',
          password: 'password123',
        } as any)
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    let userCode: string;

    beforeEach(async () => {
      const registerResult = await caller(ctx).register({
        membershipType: 'INDIVIDUAL',
        firstName: 'John',
        lastName: 'Doe',
        nationalCode: '0491570007',
        mobile: '09123456789',        email: 'john@example.com',        password: 'password123',
        confirmPassword: 'password123',
        role: 'TRADER',
        agreedToTerms: true,
        captchaToken: 'test-token',
      });
      userCode = String(registerResult.user.userCode);
    });

    it('should login with correct credentials', async () => {
      const result = await caller(ctx).login({
        userCode,
        password: 'password123',
        captchaToken: 'test-captcha',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      // Note: refreshToken is set as httpOnly cookie, not returned in response
      expect(String(result.user.userCode)).toBe(userCode);
    });

    it('should not login with wrong password', async () => {
      await expect(
        caller(ctx).login({
          userCode,
          password: 'wrongpassword',
          captchaToken: 'test-captcha',
        })
      ).rejects.toThrow('کد کاربری یا رمز عبور اشتباه است');
    });

    it('should not login with non-existent user', async () => {
      await expect(
        caller(ctx).login({
          userCode: 'NONEXISTENT',
          password: 'password123',
          captchaToken: 'test-captcha',
        })
      ).rejects.toThrow('کد کاربری یا رمز عبور اشتباه است');
    });
  });

  describe('refreshToken', () => {
    let userCode: string;
    let refreshToken: string;

    beforeEach(async () => {
      const registerResult = await caller(ctx).register({
        membershipType: 'INDIVIDUAL',
        firstName: 'John',
        lastName: 'Doe',
        nationalCode: '0491570007',
        mobile: '09123456789',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'TRADER',
        agreedToTerms: true,
        captchaToken: 'test-token',
      });
      userCode = String(registerResult.user.userCode);

      const loginResult = await caller(ctx).login({
        userCode,
        password: 'password123',
        captchaToken: 'test-captcha',
      });

      // Generate a valid refresh token for testing
      const user = await prisma.user.findUnique({ where: { userCode: userCode as any } });
      const refreshSecret = process.env['JWT_REFRESH_SECRET']!;
      refreshToken = jwt.sign({ sub: user!.id }, refreshSecret, {
        expiresIn: '7d',
      });

      // Set refreshToken in cookie for refresh test
      (ctx.req as any).cookies['refreshToken'] = refreshToken;
    });

    it('should refresh access token', async () => {
      const result = await caller(ctx).refreshToken();

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(String(result.user.userCode)).toBe(userCode);
    });

    it('should not refresh with invalid token', async () => {
      // Set invalid token in cookie
      (ctx.req as any).cookies['refreshToken'] = 'invalid-token';

      await expect(
        caller(ctx).refreshToken()
      ).rejects.toThrow('توکن بازیابی نامعتبر یا منقضی شده');
    });
  });
});