import bcrypt from 'bcryptjs';
import { TRPCError } from '@trpc/server';
import {
  buildUserCodePrefix,
  isValidNationalCode,
  MembershipType,
  type RegisterInput,
} from '@repo/shared';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface.js';
import type { ISmsService, ICacheService } from '../ports/index.js';

// ─── Register Use Case ────────────────────────────────────────────────────────

export class RegisterUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly smsService: ISmsService,
    private readonly cacheService: ICacheService,
  ) {}

  async execute(input: RegisterInput) {
    // ۱. اعتبارسنجی کد ملی
    if (input.membershipType === MembershipType.INDIVIDUAL && input.nationalCode) {
      if (!isValidNationalCode(input.nationalCode)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'کد ملی وارد شده معتبر نیست',
        });
      }
    }

    // ۲. بررسی تکراری نبودن موبایل
    const existing = await this.userRepository.findByMobile(input.mobile);
    if (existing) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'این شماره همراه قبلاً ثبت شده است',
      });
    }

    // ۳. تولید کد کاربری
    // ⚠️ نگاشت activityCode و commodityCode از کارفرما دریافت می‌شود
    // فعلاً با مقادیر پیش‌فرض
    const activityCode = this.getActivityCode(input.role);
    const commodityCode = '00'; // ⚠️ باید از پروفایل گرفته شود
    const prefix = buildUserCodePrefix(activityCode, commodityCode);
    const count = await this.userRepository.countByPrefix(prefix);
    const userCode = `${prefix}${String(count + 1).padStart(4, '0')}`;

    // ۴. رمزنگاری رمز عبور
    const passwordHash = await bcrypt.hash(input.password, 12);

    // ۵. ایجاد کاربر
    const user = await this.userRepository.create({
      userCode,
      membershipType: input.membershipType,
      role: input.role,
      mobile: input.mobile,
      email: 'email' in input ? input.email : undefined,
      nationalCode:
        input.membershipType === MembershipType.INDIVIDUAL ? input.nationalCode : undefined,
      nationalId:
        input.membershipType === MembershipType.LEGAL ? input.nationalId : undefined,
      passwordHash,
      agreedToTerms: input.agreedToTerms,
    });

    // ۶. ارسال خوشامدگویی
    await this.smsService.sendTemplate(input.mobile, 'welcome', {
      userCode: user.userCode,
    });

    return {
      id: user.id,
      userCode: user.userCode,
      mobile: user.mobile,
      status: user.status,
      role: user.role,
      email: user.email,
    };
  }

  private getActivityCode(role: string): string {
    // ⚠️ این جدول باید از کارفرما تکمیل شود
    const map: Record<string, string> = {
      TRADER: '01',
      PRODUCER: '02',
      KNOWLEDGE_BASED: '03',
      WHOLESALER: '04',
      BROKER: '05',
      INTERMEDIARY: '06',
      GUILD: '07',
    };
    return map[role] ?? '00';
  }
}
