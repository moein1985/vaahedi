import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { BadgeCheck, Building2, UserRound } from 'lucide-react';
import { trpc } from '../../trpc.js';
import { useAuthStore } from '../../store/auth.store.js';
import { registerSchema, type RegisterInput, MembershipType, UserRole } from '@repo/shared';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../../components/LanguageSwitcher.js';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.js';
import { Input } from '../../components/ui/input.js';
import { Button } from '../../components/ui/button.js';
import { cn } from '../../lib/utils.js';
import { toast } from 'sonner';

export const Route = createFileRoute('/auth/register')({
  component: RegisterPage,
});

const QUICK_ROLE_OPTIONS: ReadonlyArray<UserRole> = [
  UserRole.TRADER,
  UserRole.PRODUCER,
  UserRole.FARMER,
  UserRole.KNOWLEDGE_BASED,
];

const ALL_ROLE_OPTIONS: ReadonlyArray<UserRole> = [
  UserRole.TRADER,
  UserRole.PRODUCER,
  UserRole.KNOWLEDGE_BASED,
  UserRole.WHOLESALER,
  UserRole.BROKER,
  UserRole.INTERMEDIARY,
  UserRole.GUILD,
  UserRole.FARMER,
  UserRole.INVESTOR,
];

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
      toast.warning('لطفا captcha را تایید کنید');
      return;
    }
    registerMutation.mutate(data);
  };

  const onInvalid = (formErrors: typeof errors) => {
    const firstError = Object.values(formErrors).find(Boolean);
    const message = firstError && typeof firstError === 'object' && 'message' in firstError
      ? String(firstError.message)
      : 'لطفا فیلدهای فرم را کامل و صحیح وارد کنید';
    toast.error(`خطای فرم: ${message}`);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(130deg,hsl(153_41%_10%),hsl(148_62%_24%))] px-4 py-8 sm:py-12" dir="rtl">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex flex-col gap-3 rounded-2xl border border-[hsl(148_26%_72%_/_0.3)] bg-[hsl(153_35%_14%_/_0.55)] p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(150deg,var(--agri-primary),var(--agri-leaf))] text-base font-black text-white shadow-[0_10px_24px_hsl(148_62%_24%_/_0.35)]">
              ز
            </div>
            <div>
              <p className="text-sm font-black text-white">سامانه ذینفعان کشاورزی</p>
              <p className="text-xs text-[hsl(90_22%_88%_/_0.78)]">عضویت در شبکه تخصصی حوزه کشاورزی</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button asChild variant="secondary" className="bg-white/12 text-white hover:bg-white/20">
              <Link to="/auth/login">ورود</Link>
            </Button>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-12">
          <Card className="overflow-hidden border-[hsl(148_26%_72%_/_0.34)] bg-[linear-gradient(165deg,hsl(153_41%_12%),hsl(148_62%_24%_/_0.88))] text-white shadow-[0_25px_45px_hsl(153_41%_8%_/_0.35)] lg:col-span-4">
            <CardContent className="space-y-5 p-6 sm:p-7">
              <p className="text-xs font-semibold tracking-[0.24em] text-[hsl(90_22%_88%_/_0.85)]">ONBOARDING FLOW</p>
              <h1 className="text-3xl font-black leading-tight">ایجاد حساب حرفه ای</h1>
              <p className="text-sm leading-7 text-[hsl(90_22%_94%_/_0.86)]">
                اطلاعات پایه هویتی و حرفه ای را ثبت کنید تا مسیر پروفایل، مجوزها، محصولات و همکاری برای شما فعال شود.
              </p>

              <div className="space-y-3 text-sm text-[hsl(90_22%_94%_/_0.9)]">
                <div className="flex items-start gap-2">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(44_92%_80%)]" />
                  <span>انتخاب نوع عضویت حقیقی، حقوقی یا صنفی</span>
                </div>
                <div className="flex items-start gap-2">
                  <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(44_92%_80%)]" />
                  <span>ثبت نقش فعالیت بدون تغییر قرارداد داخلی نقش ها</span>
                </div>
                <div className="flex items-start gap-2">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(44_92%_80%)]" />
                  <span>آماده سازی حساب برای دسترسی به داشبورد عملیاتی</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[hsl(148_28%_82%_/_0.6)] bg-[hsl(0_0%_100%_/_0.97)] shadow-2xl lg:col-span-8">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl font-black text-foreground">{t('auth.register')}</CardTitle>
              <p className="text-sm text-muted-foreground">فرم ثبت نام را کامل کنید تا حساب شما ایجاد شود.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
                <input type="hidden" {...register('captchaToken')} />

                <section className="space-y-3 rounded-xl border border-[hsl(90_14%_88%)] bg-[hsl(90_33%_97%)] p-4">
                  <p className="text-sm font-bold text-foreground">نقش فعالیت</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {QUICK_ROLE_OPTIONS.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setValue('role', role, { shouldDirty: true })}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-sm font-medium transition-colors text-right',
                          selectedRole === role
                            ? 'border-[var(--agri-primary)] bg-[hsl(148_62%_24%_/_0.12)] text-[var(--agri-primary)]'
                            : 'border-[hsl(90_14%_88%)] bg-white text-[var(--soil-neutral)] hover:border-[var(--agri-primary)]'
                        )}
                      >
                        {t(`role.${role}`)}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="label-text">سایر نقش ها</label>
                    <select
                      {...register('role')}
                      className={cn(
                        'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      )}
                    >
                      {ALL_ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>{t(`role.${role}`)}</option>
                      ))}
                    </select>
                  </div>
                </section>

                <section className="space-y-3 rounded-xl border border-[hsl(90_14%_88%)] bg-[hsl(90_33%_97%)] p-4">
                  <p className="text-sm font-bold text-foreground">نوع عضویت</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <label
                      className={cn(
                        'flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm',
                        membershipType === MembershipType.INDIVIDUAL
                          ? 'border-[var(--agri-primary)] bg-[hsl(148_62%_24%_/_0.12)] text-[var(--agri-primary)]'
                          : 'border-[hsl(90_14%_88%)] bg-white text-[var(--soil-neutral)]'
                      )}
                    >
                      <span>حقیقی</span>
                      <input type="radio" value={MembershipType.INDIVIDUAL} {...register('membershipType')} className="h-4 w-4 accent-[var(--agri-primary)]" />
                    </label>

                    <label
                      className={cn(
                        'flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm',
                        membershipType === MembershipType.LEGAL
                          ? 'border-[var(--agri-primary)] bg-[hsl(148_62%_24%_/_0.12)] text-[var(--agri-primary)]'
                          : 'border-[hsl(90_14%_88%)] bg-white text-[var(--soil-neutral)]'
                      )}
                    >
                      <span>حقوقی</span>
                      <input type="radio" value={MembershipType.LEGAL} {...register('membershipType')} className="h-4 w-4 accent-[var(--agri-primary)]" />
                    </label>

                    <label
                      className={cn(
                        'flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm',
                        membershipType === MembershipType.GUILD_MEMBER
                          ? 'border-[var(--agri-primary)] bg-[hsl(148_62%_24%_/_0.12)] text-[var(--agri-primary)]'
                          : 'border-[hsl(90_14%_88%)] bg-white text-[var(--soil-neutral)]'
                      )}
                    >
                      <span>صنفی</span>
                      <input type="radio" value={MembershipType.GUILD_MEMBER} {...register('membershipType')} className="h-4 w-4 accent-[var(--agri-primary)]" />
                    </label>
                  </div>
                </section>

                {membershipType === MembershipType.INDIVIDUAL && (
                  <section className="space-y-4 rounded-xl border border-[hsl(90_14%_88%)] p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="label-text">نام</p>
                        <Input {...register('firstName')} />
                        {'firstName' in errors && errors.firstName && <p className="field-error">{errors.firstName.message}</p>}
                      </div>
                      <div>
                        <p className="label-text">نام خانوادگی</p>
                        <Input {...register('lastName')} />
                        {'lastName' in errors && errors.lastName && <p className="field-error">{errors.lastName.message}</p>}
                      </div>
                    </div>
                    <div>
                      <p className="label-text">کد ملی</p>
                      <Input {...register('nationalCode')} dir="ltr" />
                      {'nationalCode' in errors && errors.nationalCode && <p className="field-error">{errors.nationalCode.message}</p>}
                    </div>
                  </section>
                )}

                {membershipType === MembershipType.LEGAL && (
                  <section className="space-y-4 rounded-xl border border-[hsl(90_14%_88%)] p-4">
                    <div>
                      <p className="label-text">نام شرکت</p>
                      <Input {...register('companyName')} />
                      {'companyName' in errors && errors.companyName && <p className="field-error">{errors.companyName.message}</p>}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="label-text">شناسه ملی</p>
                        <Input {...register('nationalId')} dir="ltr" />
                        {'nationalId' in errors && errors.nationalId && <p className="field-error">{errors.nationalId.message}</p>}
                      </div>
                      <div>
                        <p className="label-text">شماره ثبت</p>
                        <Input {...register('registrationNumber')} dir="ltr" />
                        {'registrationNumber' in errors && errors.registrationNumber && <p className="field-error">{errors.registrationNumber.message}</p>}
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="label-text">نام مدیرعامل</p>
                        <Input {...register('ceoFirstName')} />
                        {'ceoFirstName' in errors && errors.ceoFirstName && <p className="field-error">{errors.ceoFirstName.message}</p>}
                      </div>
                      <div>
                        <p className="label-text">نام خانوادگی مدیرعامل</p>
                        <Input {...register('ceoLastName')} />
                        {'ceoLastName' in errors && errors.ceoLastName && <p className="field-error">{errors.ceoLastName.message}</p>}
                      </div>
                    </div>
                    <div>
                      <p className="label-text">کد ملی مدیرعامل</p>
                      <Input {...register('ceoNationalCode')} dir="ltr" />
                      {'ceoNationalCode' in errors && errors.ceoNationalCode && <p className="field-error">{errors.ceoNationalCode.message}</p>}
                    </div>
                  </section>
                )}

                {membershipType === MembershipType.GUILD_MEMBER && (
                  <section className="space-y-4 rounded-xl border border-[hsl(90_14%_88%)] p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="label-text">نام</p>
                        <Input {...register('firstName')} />
                        {'firstName' in errors && errors.firstName && <p className="field-error">{errors.firstName.message}</p>}
                      </div>
                      <div>
                        <p className="label-text">نام خانوادگی</p>
                        <Input {...register('lastName')} />
                        {'lastName' in errors && errors.lastName && <p className="field-error">{errors.lastName.message}</p>}
                      </div>
                    </div>
                    <div>
                      <p className="label-text">کد ملی</p>
                      <Input {...register('nationalCode')} dir="ltr" />
                      {'nationalCode' in errors && errors.nationalCode && <p className="field-error">{errors.nationalCode.message}</p>}
                    </div>
                    <div>
                      <p className="label-text">نام صنف</p>
                      <Input {...register('guildName' as never)} />
                      {'guildName' in errors && (errors as Record<string, { message?: string }>).guildName?.message && (
                        <p className="field-error">{(errors as Record<string, { message?: string }>).guildName?.message}</p>
                      )}
                    </div>
                  </section>
                )}

                <section className="space-y-4 rounded-xl border border-[hsl(90_14%_88%)] p-4">
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
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      رمز عبور باید حداقل ۸ کاراکتر و شامل حرف بزرگ، حرف کوچک، عدد و نماد باشد.
                    </p>
                    {errors.password && <p className="field-error">{errors.password.message}</p>}
                  </div>

                  <div>
                    <p className="label-text">تکرار رمز عبور</p>
                    <Input type="password" {...register('confirmPassword')} dir="ltr" />
                    {errors.confirmPassword && <p className="field-error">{errors.confirmPassword.message}</p>}
                  </div>
                </section>

                <section className="space-y-4 rounded-xl border border-[hsl(90_14%_88%)] p-4">
                  {!requiresCaptcha ? (
                    <div className="rounded-lg border border-[hsl(90_14%_88%)] bg-[hsl(90_33%_97%)] p-2 text-center text-xs text-muted-foreground">
                      ✓ captcha در محیط توسعه غیرفعال است
                    </div>
                  ) : (
                    <div className="flex justify-center rounded-lg border border-[hsl(90_14%_88%)] bg-[hsl(90_33%_97%)] p-3">
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

                  <div className="text-sm text-muted-foreground">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" {...register('agreedToTerms')} className="mt-0.5 h-4 w-4 accent-[var(--agri-primary)]" />
                      قوانین را می پذیرم
                    </label>
                    <div className="mt-2 rounded-md border border-border bg-muted/40 p-3 text-xs leading-6">
                      <p>
                        با ثبت نام در سامانه، متقاضی می پذیرد اطلاعات هویتی و حرفه ای خود را دقیق و قابل استناد ثبت کند تا
                        فرآیندهای اعتبارسنجی اولیه و ارائه خدمات تخصصی حوزه کشاورزی با کیفیت مناسب انجام شود.
                      </p>
                      <p className="mt-2">
                        همچنین مسئولیت قانونی صحت اطلاعات، مجوزها، استانداردها و محتوای ثبت شده محصول یا خدمت بر عهده متقاضی است
                        و پذیرش این بندها به منزله اقرار الکترونیکی معتبر تلقی می شود.
                      </p>
                    </div>
                    {errors.agreedToTerms && <p className="field-error">{errors.agreedToTerms.message}</p>}
                  </div>
                </section>

                <Button type="submit" className="w-full" loading={registerMutation.isPending} disabled={!agreedToTerms}>
                  {t('auth.register')}
                </Button>

                <p className="text-center text-xs text-muted-foreground sm:text-sm">
                  قبلا حساب دارید؟{' '}
                  <Link to="/auth/login" className="font-semibold text-[var(--agri-primary)] hover:underline">
                    ورود به حساب
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
