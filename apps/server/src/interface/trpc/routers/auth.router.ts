import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type {} from '@fastify/cookie'; // augments FastifyRequest/Reply with cookie types
import { z } from 'zod';
import {
  loginSchema,
  loginWithEmailSchema,
  registerSchema,
  sendOtpSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  mobileSchema,
} from '@repo/shared';
import { router, publicProcedure, protectedProcedure } from '../trpc.js';
import { RegisterUseCase } from '../../../application/auth/register.usecase.js';
import { PrismaUserRepository } from '../../../infrastructure/repositories/prisma-user.repository.js';
import { MockSmsProvider } from '../../../infrastructure/sms/sms.service.js';
import { MockSMSService } from '../../../infrastructure/sms/mock-sms.service.js';

// ─── OTP helpers ─────────────────────────────────────────────────────────────

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const smsService = new MockSMSService();

// ─── Auth Router ─────────────────────────────────────────────────────────────

export const authRouter = router({
  // ── Register ──────────────────────────────────────────────────────────────
  register: publicProcedure.input(registerSchema).mutation(async ({ input, ctx }) => {
    const userRepo = new PrismaUserRepository(ctx.db);
    const smsService = new MockSmsProvider(); // TODO: از DI container استفاده کن
    const registerUseCase = new RegisterUseCase(
      userRepo,
      smsService,
      ctx.cache,
    );

    const result = await registerUseCase.execute(input);

    // تولید توکن مشابه login
    const accessToken = jwt.sign({ userId: result.id }, process.env['JWT_ACCESS_SECRET']!, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: result.id }, process.env['JWT_REFRESH_SECRET']!, { expiresIn: '7d' });
    
    ctx.res.setCookie('accessToken', accessToken, { httpOnly: true, secure: process.env['NODE_ENV'] === 'production', sameSite: 'strict', maxAge: 900 });
    ctx.res.setCookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env['NODE_ENV'] === 'production', sameSite: 'strict', maxAge: 604800 });

    return { user: result, accessToken };
  }),

  sendOTP: publicProcedure
    .input(z.object({ mobile: z.string().regex(/^09\d{9}$/, 'شماره موبایل نامعتبر است') }))
    .mutation(async ({ input }) => {
      const result = await smsService.sendOTP(input.mobile);
      return { ok: result.ok, expiresAt: result.expiresAt };
    }),

  verifyOTP: publicProcedure
    .input(z.object({
      mobile: z.string().regex(/^09\d{9}$/),
      code: z.string().length(6),
    }))
    .mutation(async ({ ctx, input }) => {
      const isValid = await smsService.verifyOTP(input.mobile, input.code);
      if (!isValid) throw new TRPCError({ code: 'BAD_REQUEST', message: 'کد وارد شده اشتباه یا منقضی شده است' });

      // کاربر را پیدا یا ایجاد کن
      let user = await ctx.db.user.findUnique({ where: { mobile: input.mobile } });
      if (!user) {
        user = await ctx.db.user.create({
          data: {
            mobile: input.mobile,
            email: `otp_${input.mobile}@vaahedi.temp`, // موقت - کاربر می‌تواند بعداً تغییر دهد
            userCode: `USR${Date.now()}`, // موقت - بعداً با فرمول واقعی جایگزین می‌شود
            membershipType: 'INDIVIDUAL',
            role: 'TRADER',
            passwordHash: '', // برای OTP register - بعداً تنظیم می‌شود
          },
        });
      }

      // صدور توکن (مشابه login)
      const accessToken = jwt.sign({ userId: user.id }, process.env['JWT_ACCESS_SECRET']!, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ userId: user.id }, process.env['JWT_REFRESH_SECRET']!, { expiresIn: '7d' });
      
      ctx.res.setCookie('accessToken', accessToken, { httpOnly: true, secure: process.env['NODE_ENV'] === 'production', sameSite: 'strict', maxAge: 900 });
      ctx.res.setCookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env['NODE_ENV'] === 'production', sameSite: 'strict', maxAge: 604800 });

      return { ok: true, user: { id: user.id, mobile: user.mobile, userCode: user.userCode } };
    }),

  // ── Login ─────────────────────────────────────────────────────────────────
  login: publicProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { userCode: input.userCode },
    });

    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'کد کاربری یا رمز عبور اشتباه است',
      });
    }

    // بررسی قفل بودن حساب
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `حساب شما تا ${user.lockedUntil.toLocaleString('fa-IR')} قفل است`,
      });
    }

    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      // افزایش loginAttempts
      const attempts = user.loginAttempts + 1;
      await ctx.db.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: attempts,
          // قفل بعد از ۵ تلاش ناموفق
          lockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      });

      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'کد کاربری یا رمز عبور اشتباه است',
      });
    }

    // ریست attempts
    await ctx.db.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lastLoginAt: new Date() },
    });

    // تولید توکن‌ها
    const accessSecret = process.env['JWT_ACCESS_SECRET']!;
    const refreshSecret = process.env['JWT_REFRESH_SECRET']!;

    const accessToken = jwt.sign(
      { sub: user.id, userCode: user.userCode, role: user.role },
      accessSecret,
      { expiresIn: (process.env['JWT_ACCESS_EXPIRY'] ?? '15m') as never },
    );

    const refreshToken = jwt.sign({ sub: user.id }, refreshSecret, {
      expiresIn: (process.env['JWT_REFRESH_EXPIRY'] ?? '7d') as never,
    });

    // ذخیره refresh token در DB
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    await ctx.db.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userAgent: ctx.req.headers['user-agent'],
        ipAddress: ctx.req.ip,
      },
    });

    // Set cookie
    ctx.res.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return {
      accessToken,
      user: {
        id: user.id,
        userCode: user.userCode,
        role: user.role,
        status: user.status,
        mobile: user.mobile,
        email: user.email,
      },
    };
  }),

  // ── Login with Email ──────────────────────────────────────────────────────
  loginWithEmail: publicProcedure.input(loginWithEmailSchema).mutation(async ({ input, ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'ایمیل یا رمز عبور اشتباه است',
      });
    }

    // بررسی قفل بودن حساب
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `حساب شما تا ${user.lockedUntil.toLocaleString('fa-IR')} قفل است`,
      });
    }

    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      // افزایش loginAttempts
      const attempts = user.loginAttempts + 1;
      await ctx.db.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: attempts,
          // قفل بعد از ۵ تلاش ناموفق
          lockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      });

      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'ایمیل یا رمز عبور اشتباه است',
      });
    }

    // ریست attempts
    await ctx.db.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lastLoginAt: new Date() },
    });

    // تولید توکن‌ها
    const accessSecret = process.env['JWT_ACCESS_SECRET']!;
    const refreshSecret = process.env['JWT_REFRESH_SECRET']!;

    const accessToken = jwt.sign(
      { sub: user.id, userCode: user.userCode, role: user.role },
      accessSecret,
      { expiresIn: (process.env['JWT_ACCESS_EXPIRY'] ?? '15m') as never },
    );

    const refreshToken = jwt.sign({ sub: user.id }, refreshSecret, {
      expiresIn: (process.env['JWT_REFRESH_EXPIRY'] ?? '7d') as never,
    });

    // ذخیره refresh token در DB
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    await ctx.db.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userAgent: ctx.req.headers['user-agent'],
        ipAddress: ctx.req.ip,
      },
    });

    // Set cookie
    ctx.res.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return {
      accessToken,
      user: {
        id: user.id,
        userCode: user.userCode,
        role: user.role,
        status: user.status,
        mobile: user.mobile,
        email: user.email,
      },
    };
  }),

  // ── Refresh Token ─────────────────────────────────────────────────────────
  refreshToken: publicProcedure.mutation(async ({ ctx }) => {
    const refreshTokenValue = ctx.req.cookies['refreshToken'];
    if (!refreshTokenValue) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'توکن بازیابی یافت نشد' });
    }

    const refreshSecret = process.env['JWT_REFRESH_SECRET']!;
    let payload: { sub: string };
    try {
      payload = jwt.verify(refreshTokenValue, refreshSecret) as { sub: string };
    } catch {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'توکن بازیابی نامعتبر یا منقضی شده' });
    }

    // بررسی در دیتابیس
    const storedTokens = await ctx.db.refreshToken.findMany({
      where: { userId: payload.sub, revokedAt: null, expiresAt: { gt: new Date() } },
    });

    let valid = false;
    for (const t of storedTokens) {
      if (await bcrypt.compare(refreshTokenValue, t.tokenHash)) {
        valid = true;
        break;
      }
    }

    if (!valid) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'توکن بازیابی نامعتبر است' });
    }

    const user = await ctx.db.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, userCode: true, role: true, status: true, mobile: true, email: true, adminProfile: true },
    });

    if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'کاربر یافت نشد' });

    const accessSecret = process.env['JWT_ACCESS_SECRET']!;
    const accessToken = jwt.sign(
      { sub: user.id, userCode: user.userCode, role: user.role },
      accessSecret,
      { expiresIn: (process.env['JWT_ACCESS_EXPIRY'] ?? '15m') as never },
    );

    return {
      accessToken,
      user: {
        id: user.id,
        userCode: user.userCode,
        role: user.role,
        status: user.status,
        mobile: user.mobile,
        email: user.email,
        isAdmin: !!user.adminProfile,
      },
    };
  }),

  // ── Logout ────────────────────────────────────────────────────────────────
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    const refreshToken = ctx.req.cookies['refreshToken'];
    if (refreshToken) {
      // revoke all tokens for user (یا فقط این token)
      await ctx.db.refreshToken.updateMany({
        where: { userId: ctx.user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    ctx.res.clearCookie('refreshToken');
    return { success: true };
  }),

  // ── Get Me ────────────────────────────────────────────────────────────────
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      include: { profile: true },
    });

    if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'کاربر یافت نشد' });

    return {
      id: user.id,
      userCode: user.userCode,
      role: user.role,
      status: user.status,
      membershipType: user.membershipType,
      mobile: user.mobile,
      email: user.email,
      hasProfile: !!user.profile,
      profileStatus: user.profile?.verificationStatus ?? null,
    };
  }),

  // ── Login with OTP ───────────────────────────────────────────────────────
  loginWithOtp: publicProcedure.input(z.object({
    mobile: mobileSchema,
    otp: z.string().length(6, 'کد OTP باید ۶ رقم باشد').regex(/^\d{6}$/),
  })).mutation(async ({ input, ctx }) => {
    // ابتدا OTP را تأیید کن
    const cacheKey = `otp:LOGIN:${input.mobile}`;
    const storedOtp = await ctx.cache.get<string>(cacheKey);

    if (!storedOtp || storedOtp !== input.otp) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'کد وارد شده اشتباه یا منقضی شده است',
      });
    }

    await ctx.cache.del(cacheKey);

    // کاربر را پیدا کن
    const user = await ctx.db.user.findUnique({
      where: { mobile: input.mobile },
    });

    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'شماره همراه یافت نشد',
      });
    }

    // بررسی وضعیت کاربر
    if (user.status !== 'ACTIVE') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'حساب کاربری شما فعال نیست',
      });
    }

    // ریست attempts و بروزرسانی lastLogin
    await ctx.db.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lastLoginAt: new Date() },
    });

    // تولید توکن‌ها
    const accessSecret = process.env['JWT_ACCESS_SECRET']!;
    const refreshSecret = process.env['JWT_REFRESH_SECRET']!;

    const accessToken = jwt.sign(
      { sub: user.id, userCode: user.userCode, role: user.role },
      accessSecret,
      { expiresIn: (process.env['JWT_ACCESS_EXPIRY'] ?? '15m') as never },
    );

    const refreshToken = jwt.sign({ sub: user.id }, refreshSecret, {
      expiresIn: (process.env['JWT_REFRESH_EXPIRY'] ?? '7d') as never,
    });

    // ذخیره refresh token در DB
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    await ctx.db.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userAgent: ctx.req.headers['user-agent'],
        ipAddress: ctx.req.ip,
      },
    });

    // Set cookie
    ctx.res.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return {
      accessToken,
      user: {
        id: user.id,
        userCode: user.userCode,
        role: user.role,
        status: user.status,
        mobile: user.mobile,
        email: user.email,
      },
    };
  }),

  // ── Send OTP ──────────────────────────────────────────────────────────────
  sendOtp: publicProcedure.input(sendOtpSchema).mutation(async ({ input, ctx }) => {
    const rateLimitKey = `otp:rate:${input.mobile}`;
    const attempts = await ctx.cache.increment(rateLimitKey, 60);
    if (attempts > 3) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'درخواست بیش از حد مجاز. لطفاً ۱ دقیقه صبر کنید',
      });
    }

    const otp = generateOtp();
    await ctx.cache.set(`otp:${input.purpose}:${input.mobile}`, otp, 120);

    // ارسال SMS
    const smsService = new MockSmsProvider(); // TODO: از DI container استفاده کن
    await smsService.sendOtp(input.mobile, otp, input.purpose);

    return { success: true, message: 'کد تأیید ارسال شد' };
  }),

  // ── Verify OTP ────────────────────────────────────────────────────────────
  verifyOtp: publicProcedure.input(verifyOtpSchema).mutation(async ({ input, ctx }) => {
    const cacheKey = `otp:${input.purpose}:${input.mobile}`;
    const storedOtp = await ctx.cache.get<string>(cacheKey);

    if (!storedOtp || storedOtp !== input.otp) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'کد وارد شده اشتباه یا منقضی شده است',
      });
    }

    await ctx.cache.del(cacheKey);
    return { success: true, verified: true };
  }),
});
