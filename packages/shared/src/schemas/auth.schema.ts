import { z } from 'zod';
import { MembershipType, UserRole } from '../enums/index.js';

// ─── Base Validators ─────────────────────────────────────────────────────────

export const nationalCodeSchema = z
  .string()
  .length(10, 'کد ملی باید ۱۰ رقم باشد')
  .regex(/^\d{10}$/, 'کد ملی باید فقط شامل عدد باشد');

export const nationalIdSchema = z
  .string()
  .length(11, 'شناسه ملی شرکت باید ۱۱ رقم باشد')
  .regex(/^\d{11}$/, 'شناسه ملی باید فقط شامل عدد باشد');

export const mobileSchema = z
  .string()
  .regex(/^09[0-9]{9}$/, 'شماره همراه معتبر نیست (مثال: 09123456789)');

export const passwordSchema = z
  .string()
  .min(8, 'رمز عبور حداقل ۸ کاراکتر باشد')
  .max(64, 'رمز عبور حداکثر ۶۴ کاراکتر باشد')
  .regex(/[A-Za-z]/, 'رمز عبور باید شامل حرف باشد')
  .regex(/[0-9]/, 'رمز عبور باید شامل عدد باشد');

// ─── Register ────────────────────────────────────────────────────────────────

export const registerIndividualSchema = z.object({
  membershipType: z.literal(MembershipType.INDIVIDUAL),
  firstName: z.string().min(2, 'نام حداقل ۲ کاراکتر').max(50),
  lastName: z.string().min(2, 'نام خانوادگی حداقل ۲ کاراکتر').max(50),
  nationalCode: nationalCodeSchema,
  mobile: mobileSchema,
  email: z.string().email('ایمیل معتبر نیست'),
  password: passwordSchema,
  confirmPassword: passwordSchema,
  role: z.nativeEnum(UserRole),
  agreedToTerms: z.literal(true, { errorMap: () => ({ message: 'تأیید قوانین الزامی است' }) }),
  captchaToken: z.string().min(1, 'کد امنیتی الزامی است'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'رمز عبور و تکرار آن یکسان نیست',
  path: ['confirmPassword'],
});

export const registerLegalSchema = z.object({
  membershipType: z.literal(MembershipType.LEGAL),
  companyName: z.string().min(3, 'نام شرکت حداقل ۳ کاراکتر').max(100),
  nationalId: nationalIdSchema,
  registrationNumber: z.string().min(3).max(20),
  ceoFirstName: z.string().min(2).max(50),
  ceoLastName: z.string().min(2).max(50),
  ceoNationalCode: nationalCodeSchema,
  mobile: mobileSchema,
  email: z.string().email('ایمیل معتبر نیست'),
  password: passwordSchema,
  confirmPassword: passwordSchema,
  role: z.nativeEnum(UserRole),
  agreedToTerms: z.literal(true, { errorMap: () => ({ message: 'تأیید قوانین الزامی است' }) }),
  captchaToken: z.string().min(1, 'کد امنیتی الزامی است'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'رمز عبور با تکرار آن مطابقت ندارد',
  path: ['confirmPassword'],
});

export const registerSchema = z.union([
  registerIndividualSchema,
  registerLegalSchema,
]);

// ─── Login ───────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  userCode: z.string().min(4, 'کد کاربری معتبر نیست'),
  password: z.string().min(1, 'رمز عبور الزامی است'),
  captchaToken: z.string().min(1, 'کد امنیتی الزامی است'),
});

export const loginWithEmailSchema = z.object({
  email: z.string().email('ایمیل معتبر نیست'),
  password: z.string().min(1, 'رمز عبور الزامی است'),
  captchaToken: z.string().min(1, 'کد امنیتی الزامی است'),
});

// ─── OTP ─────────────────────────────────────────────────────────────────────

export const sendOtpSchema = z.object({
  mobile: mobileSchema,
  purpose: z.enum(['LOGIN', 'REGISTER', 'RESET_PASSWORD']),
});

export const verifyOtpSchema = z.object({
  mobile: mobileSchema,
  otp: z.string().length(6, 'کد OTP باید ۶ رقم باشد').regex(/^\d{6}$/),
  purpose: z.enum(['LOGIN', 'REGISTER', 'RESET_PASSWORD']),
});

// ─── Password ────────────────────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  mobile: mobileSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'رمز عبور با تکرار آن مطابقت ندارد',
    path: ['confirmPassword'],
  });

// ─── Types ───────────────────────────────────────────────────────────────────

export type RegisterIndividualInput = z.infer<typeof registerIndividualSchema>;
export type RegisterLegalInput = z.infer<typeof registerLegalSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type LoginWithEmailInput = z.infer<typeof loginWithEmailSchema>;
export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
