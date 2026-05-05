import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useRef, useEffect } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { trpc } from '../../trpc.js';
import { useAuthStore } from '../../store/auth.store.js';
import { registerSchema, type RegisterInput, MembershipType, UserRole } from '@repo/shared';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.js';
import { Input } from '../../components/ui/input.js';
import { Button } from '../../components/ui/button.js';
import { cn } from '../../lib/utils.js';
import { toast } from 'sonner';

export const Route = createFileRoute('/auth/register')({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const { t } = useTranslation();
  const captchaSiteKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY;
  const requiresCaptcha = !import.meta.env.DEV && !!captchaSiteKey;

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      setAuth(
        {
          id: data.user.id,
          userCode: data.user.userCode,
          role: data.user.role,
          status: data.user.status,
          mobile: data.user.mobile,
          email: data.user.email,
          isAdmin: false,
          adminRole: null,
        },
        data.accessToken,
      );
      void navigate({ to: '/dashboard' });
    },
    onError: (error) => {
      toast.error(`خطا: ${error.message}`);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      membershipType: MembershipType.INDIVIDUAL,
      role: UserRole.TRADER,
    },
  });

  const membershipType = watch('membershipType') ?? MembershipType.INDIVIDUAL;
  const agreedToTerms = watch('agreedToTerms');

  const selectedRole = watch('role') ?? UserRole.TRADER;

  useEffect(() => {
    if (requiresCaptcha) {
      setValue('captchaToken', captchaToken ?? '');
      return;
    }
    setValue('captchaToken', 'test-token');
  }, [requiresCaptcha, captchaToken, setValue]);

  const onSubmit = (data: RegisterInput) => {
    if (requiresCaptcha && !captchaToken) {
      toast.warning('لطفاً captcha را تأیید کنید');
      return;
    }
    registerMutation.mutate(data);
  };

  const onInvalid = (formErrors: typeof errors) => {
    const firstError = Object.values(formErrors).find(Boolean);
    const message = firstError && typeof firstError === 'object' && 'message' in firstError
      ? String(firstError.message)
      : 'لطفاً فیلدهای فرم را کامل و صحیح وارد کنید';
    toast.error(`خطای فرم: ${message}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4" dir="rtl">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand)] text-white text-2xl font-black mb-3">ت</div>
          <h1 className="text-2xl font-bold text-foreground">تجارت هوشمند</h1>
          <p className="text-muted-foreground text-sm mt-1">مرکز تجارت متمرکز هوشمند ایرانیان</p>
        </div>

        <Card>
          <CardHeader><CardTitle>{t('auth.register')}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
              <input type="hidden" {...register('captchaToken')} />

              {/* Role Selection */}
              <div>
                <p className="label-text">نقش</p>
                <select
                  {...register('role')}
                  className={cn(
                    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-ring',
                  )}
                >
                  <option value={UserRole.TRADER}>{t('role.TRADER')}</option>
                  <option value={UserRole.PRODUCER}>{t('role.PRODUCER')}</option>
                  <option value={UserRole.KNOWLEDGE_BASED}>{t('role.KNOWLEDGE_BASED')}</option>
                  <option value={UserRole.WHOLESALER}>{t('role.WHOLESALER')}</option>
                  <option value={UserRole.BROKER}>{t('role.BROKER')}</option>
                  <option value={UserRole.INTERMEDIARY}>{t('role.INTERMEDIARY')}</option>
                  <option value={UserRole.GUILD}>{t('role.GUILD')}</option>
                  <option value={UserRole.FARMER}>{t('role.FARMER')}</option>
                  <option value={UserRole.INVESTOR}>{t('role.INVESTOR')}</option>
                </select>
              </div>

              {/* Membership Type */}
              <div>
                <p className="label-text">نوع عضویت</p>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value={MembershipType.INDIVIDUAL}
                      {...register('membershipType')}
                      className="ml-2"
                    />
                    حقیقی
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value={MembershipType.LEGAL}
                      {...register('membershipType')}
                      className="ml-2"
                    />
                    حقوقی
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value={MembershipType.GUILD_MEMBER}
                      {...register('membershipType')}
                      className="ml-2"
                    />
                    صنفی
                  </label>
                </div>
              </div>

              {/* Individual Fields */}
              {membershipType === MembershipType.INDIVIDUAL && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="label-text">نام</p>
                      <Input {...register('firstName')} />
                      {'firstName' in errors && errors.firstName && <p className="field-error">{errors.firstName.message}</p>}
                    </div>
                    <div>
                      <p className="label-text">نام خانوادگی</p>
                      <Input {...register('lastName')} />
                      {(errors as any).lastName && <p className="field-error">{(errors as any).lastName.message}</p>}
                    </div>
                  </div>
                  <div>
                    <p className="label-text">کد ملی</p>
                    <Input {...register('nationalCode')} dir="ltr" />
                    {(errors as any).nationalCode && <p className="field-error">{(errors as any).nationalCode.message}</p>}
                  </div>
                </>
              )}

              {/* Legal Fields */}
              {membershipType === MembershipType.LEGAL && (
                <>
                  <div>
                    <p className="label-text">نام شرکت</p>
                    <Input {...register('companyName')} />
                    {(errors as any).companyName && <p className="field-error">{(errors as any).companyName.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="label-text">شناسه ملی</p>
                      <Input {...register('nationalId')} dir="ltr" />
                      {(errors as any).nationalId && <p className="field-error">{(errors as any).nationalId.message}</p>}
                    </div>
                    <div>
                      <p className="label-text">شماره ثبت</p>
                      <Input {...register('registrationNumber')} dir="ltr" />
                      {(errors as any).registrationNumber && <p className="field-error">{(errors as any).registrationNumber.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="label-text">نام مدیرعامل</p>
                      <Input {...register('ceoFirstName')} />
                      {(errors as any).ceoFirstName && <p className="field-error">{(errors as any).ceoFirstName.message}</p>}
                    </div>
                    <div>
                      <p className="label-text">نام خانوادگی مدیرعامل</p>
                      <Input {...register('ceoLastName')} />
                      {(errors as any).ceoLastName && <p className="field-error">{(errors as any).ceoLastName.message}</p>}
                    </div>
                  </div>
                  <div>
                    <p className="label-text">کد ملی مدیرعامل</p>
                    <Input {...register('ceoNationalCode')} dir="ltr" />
                    {(errors as any).ceoNationalCode && <p className="field-error">{(errors as any).ceoNationalCode.message}</p>}
                  </div>
                </>
              )}

              {/* Guild Member Fields */}
              {membershipType === MembershipType.GUILD_MEMBER && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="label-text">نام</p>
                      <Input {...register('firstName')} />
                      {'firstName' in errors && errors.firstName && <p className="field-error">{errors.firstName.message}</p>}
                    </div>
                    <div>
                      <p className="label-text">نام خانوادگی</p>
                      <Input {...register('lastName')} />
                      {(errors as any).lastName && <p className="field-error">{(errors as any).lastName.message}</p>}
                    </div>
                  </div>
                  <div>
                    <p className="label-text">کد ملی</p>
                    <Input {...register('nationalCode')} dir="ltr" />
                    {(errors as any).nationalCode && <p className="field-error">{(errors as any).nationalCode.message}</p>}
                  </div>
                  <div>
                    <p className="label-text">نام صنف</p>
                    <Input {...register('guildName' as any)} />
                    {(errors as any).guildName && <p className="field-error">{(errors as any).guildName.message}</p>}
                  </div>
                </>
              )}

              {/* Common Fields */}
          <div>
            <p className="label-text">شماره موبایل</p>
            <Input {...register('mobile')} dir="ltr" />
            {errors.mobile && <p className="field-error">{errors.mobile.message}</p>}
          </div>

          <div>
            <p className="label-text">ایمیل</p>
            <Input {...register('email')} dir="ltr" />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>

          <div>
            <p className="label-text">رمز عبور</p>
            <Input type="password" {...register('password')} dir="ltr" />
            <p className="text-[11px] text-muted-foreground mt-1">
              رمز عبور باید حداقل ۸ کاراکتر و شامل حرف بزرگ، حرف کوچک، عدد و نماد باشد.
            </p>
            {errors.password && <p className="field-error">{errors.password.message}</p>}
          </div>

          <div>
            <p className="label-text">تکرار رمز عبور</p>
            <Input type="password" {...register('confirmPassword')} dir="ltr" />
            {(errors as any).confirmPassword && <p className="field-error">{(errors as any).confirmPassword.message}</p>}
          </div>

          {/* captcha + submit */}
          <div>
            {!requiresCaptcha ? (
              <div className="text-center text-sm text-muted-foreground">Captcha در محیط توسعه غیرفعال است</div>
            ) : (
              <div className="flex justify-center">
                <HCaptcha
                  sitekey={captchaSiteKey}
                  onVerify={(token) => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken(null)}
                  ref={captchaRef}
                  size="normal"
                  languageOverride="fa"
                />
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" {...register('agreedToTerms')} className="mt-0.5" />
              قوانین را می‌پذیرم
            </label>
            <div className="mt-2 rounded-md border border-border bg-muted/40 p-3 text-xs leading-6">
              <p>
                با ثبت‌نام در سامانه، متقاضی اقرار می‌کند انجمن صنفی را به‌عنوان
                حکم مرضی‌الطرفین، ناظر و مشاور قانونی در فرآیندهای خرید، فروش و
                مشاوره تخصصی می‌پذیرد.
              </p>
              <p className="mt-2">
                همچنین مسئولیت قانونی صحت اطلاعات، مجوزها، استانداردها و محتوای
                ثبت‌شده کالا/خدمت بر عهده متقاضی است و پذیرش این بندها به‌منزله
                اقرار الکترونیکی معتبر تلقی می‌شود.
              </p>
            </div>
            {errors.agreedToTerms && <p className="field-error">{errors.agreedToTerms.message}</p>}
          </div>

          <Button type="submit" className="w-full" loading={registerMutation.isPending} disabled={!agreedToTerms}>
            {t('auth.register')}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</div>
  );
}
