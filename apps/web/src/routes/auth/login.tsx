import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { KeyRound, Mail, Phone, ShieldCheck } from 'lucide-react';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { trpc } from '../../trpc.js';
import { useAuthStore } from '../../store/auth.store.js';
import { loginSchema, loginWithEmailSchema, type LoginInput } from '@repo/shared';
import { LanguageSwitcher } from '../../components/LanguageSwitcher.js';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.js';
import { Input } from '../../components/ui/input.js';
import { Button } from '../../components/ui/button.js';
import { cn } from '../../lib/utils.js';
import { getFriendlyTrpcError } from '../../lib/trpc-error.js';
import { toast } from 'sonner';

const otpLoginSchema = z.object({
  mobile: z.string().regex(/^09[0-9]{9}$/, 'شماره همراه معتبر نیست'),
  otp: z.string().length(6, 'کد OTP باید ۶ رقم باشد').regex(/^\d{6}$/),
});

type OtpLoginInput = z.infer<typeof otpLoginSchema>;
type LoginWithEmailInput = z.infer<typeof loginWithEmailSchema>;
type LoginMethod = 'userCode' | 'email' | 'otp';

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('userCode');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const { t } = useTranslation();

  const captchaSiteKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY;
  const requiresCaptcha = !import.meta.env.DEV && !!captchaSiteKey;

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      setAuth(
        {
          id: data.user.id,
          userCode: data.user.userCode,
          role: data.user.role,
          status: data.user.status,
          mobile: data.user.mobile,
          email: data.user.email,
          isAdmin: data.user.isAdmin,
          adminRole: data.user.adminRole,
        },
        data.accessToken,
      );
      void navigate({ to: data.user.isAdmin ? '/admin' : '/dashboard' });
    },
    onError: (error) => {
      console.error('Login error:', getFriendlyTrpcError(error));
    },
  });

  const loginWithEmailMutation = trpc.auth.loginWithEmail.useMutation({
    onSuccess: (data) => {
      setAuth(
        {
          id: data.user.id,
          userCode: data.user.userCode,
          role: data.user.role,
          status: data.user.status,
          mobile: data.user.mobile,
          email: data.user.email,
          isAdmin: data.user.isAdmin,
          adminRole: data.user.adminRole,
        },
        data.accessToken,
      );
      void navigate({ to: data.user.isAdmin ? '/admin' : '/dashboard' });
    },
    onError: (error) => {
      console.error('Email login error:', getFriendlyTrpcError(error));
    },
  });

  const otpLoginMutation = trpc.auth.loginWithOtp.useMutation({
    onSuccess: (data) => {
      setAuth(
        {
          id: data.user.id,
          userCode: data.user.userCode,
          role: data.user.role,
          status: data.user.status,
          mobile: data.user.mobile,
          email: data.user.email,
          isAdmin: data.user.isAdmin,
          adminRole: data.user.adminRole,
        },
        data.accessToken,
      );
      void navigate({ to: data.user.isAdmin ? '/admin' : '/dashboard' });
    },
    onError: (error) => {
      console.error('OTP login error:', getFriendlyTrpcError(error));
    },
  });

  const sendOtpMutation = trpc.auth.sendOtp.useMutation({
    onSuccess: () => {
      toast.success('کد OTP به شماره موبایل شما ارسال شد');
    },
    onError: (error) => {
      toast.error(getFriendlyTrpcError(error, 'ارسال کد تایید انجام نشد'));
    },
  });

  const {
    register: registerUserCode,
    handleSubmit: handleSubmitUserCode,
    formState: { errors: errorsUserCode },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: errorsEmail },
  } = useForm<LoginWithEmailInput>({
    resolver: zodResolver(loginWithEmailSchema),
  });

  const {
    register: registerOtp,
    handleSubmit: handleSubmitOtp,
    formState: { errors: errorsOtp },
    watch: watchOtp,
  } = useForm<OtpLoginInput>({
    resolver: zodResolver(otpLoginSchema),
  });

  const mobileForOtp = watchOtp('mobile');

  useEffect(() => {
    if (requiresCaptcha) return;
    setCaptchaToken('test-token');
  }, [requiresCaptcha]);

  useEffect(() => {
    if (!requiresCaptcha) {
      setCaptchaToken('test-token');
      return;
    }
    setCaptchaToken(null);
  }, [loginMethod, requiresCaptcha]);

  const onSubmitUserCode = (data: LoginInput) => {
    if (requiresCaptcha && !captchaToken) {
      toast.warning('لطفا captcha را تایید کنید');
      return;
    }
    loginMutation.mutate({ ...data, captchaToken: captchaToken || 'test-token' });
  };

  const onSubmitEmail = (data: LoginWithEmailInput) => {
    if (requiresCaptcha && !captchaToken) {
      toast.warning('لطفا captcha را تایید کنید');
      return;
    }
    loginWithEmailMutation.mutate({ ...data, captchaToken: captchaToken || 'test-token' });
  };

  const onSubmitOtp = (data: OtpLoginInput) => {
    otpLoginMutation.mutate(data);
  };

  const handleSendOtp = () => {
    if (mobileForOtp && /^09[0-9]{9}$/.test(mobileForOtp)) {
      sendOtpMutation.mutate({ mobile: mobileForOtp, purpose: 'LOGIN' });
    }
  };

  const renderCaptcha = () => {
    if (!requiresCaptcha) {
      return (
        <div className="rounded-lg border border-[hsl(90_14%_88%)] bg-[hsl(90_33%_97%)] p-2 text-center text-xs text-muted-foreground">
          ✓ captcha در محیط توسعه غیرفعال است
        </div>
      );
    }

    return (
      <div className="flex justify-center rounded-lg border border-[hsl(90_14%_88%)] bg-[hsl(90_33%_97%)] p-3">
        <HCaptcha
          sitekey={captchaSiteKey ?? '10000000-ffff-ffff-ffff-000000000001'}
          onVerify={(token) => setCaptchaToken(token)}
          onExpire={() => setCaptchaToken(null)}
          ref={captchaRef}
          size="normal"
          languageOverride="fa"
        />
      </div>
    );
  };

  const tabLabel: Record<LoginMethod, string> = {
    userCode: 'ورود با کد کاربری',
    email: 'ورود با ایمیل',
    otp: 'کد یکبارمصرف',
  };

  return (
    <div
      className="min-h-screen bg-[linear-gradient(130deg,hsl(153_41%_10%),hsl(148_62%_24%))] px-4 py-8 sm:py-12"
      dir="rtl"
    >
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-6 flex flex-col gap-3 rounded-2xl border border-[hsl(148_26%_72%_/_0.3)] bg-[hsl(153_35%_14%_/_0.55)] p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/brand/logo_without_persian_words.png"
              alt="سامانه ذینفعان کشاورزی"
              className="h-10 w-10 rounded-xl border border-white/20 bg-white/90 object-contain p-1 shadow-[0_10px_24px_hsl(148_62%_24%_/_0.35)]"
            />
            <div>
              <p className="text-sm font-black text-white">سامانه ذینفعان کشاورزی</p>
              <p className="text-xs text-[hsl(90_22%_88%_/_0.78)]">شبکه تخصصی عملیات کشاورزی</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button asChild variant="secondary" className="bg-white/12 text-white hover:bg-white/20">
              <Link to="/auth/register">ایجاد حساب</Link>
            </Button>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-12">
          <Card className="overflow-hidden border-[hsl(148_26%_72%_/_0.34)] bg-[linear-gradient(165deg,hsl(153_41%_12%),hsl(148_62%_24%_/_0.88))] text-white shadow-[0_25px_45px_hsl(153_41%_8%_/_0.35)] lg:col-span-5">
            <CardContent className="space-y-5 p-6 sm:p-7">
              <p className="text-xs font-semibold tracking-[0.24em] text-[hsl(90_22%_88%_/_0.85)]">ACCESS GATEWAY</p>
              <h1 className="text-3xl font-black leading-tight">ورود امن به محیط کاربری</h1>
              <p className="text-sm leading-7 text-[hsl(90_22%_94%_/_0.86)]">
                با ورود به حساب، به پروفایل، مجوزها، محصولات، درخواست ها و ابزارهای داده محور کشاورزی دسترسی خواهید داشت.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-[hsl(90_22%_94%_/_0.9)]">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(44_92%_80%)]" />
                  <span>احراز هویت مرحله ای با رمز ثابت یا OTP</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-[hsl(90_22%_94%_/_0.9)]">
                  <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(44_92%_80%)]" />
                  <span>دسترسی سریع به پنل کاربر یا پنل مدیریت مطابق سطح دسترسی</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-[hsl(90_22%_94%_/_0.9)]">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(44_92%_80%)]" />
                  <span>ارسال کد یکبارمصرف برای ورود امن از طریق موبایل</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[hsl(148_28%_82%_/_0.6)] bg-[hsl(0_0%_100%_/_0.97)] shadow-2xl lg:col-span-7">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl font-black text-foreground">ورود به حساب</CardTitle>
              <p className="text-sm text-muted-foreground">روش ورود خود را انتخاب کنید و وارد محیط کاربری شوید.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 rounded-xl border border-[hsl(90_14%_88%)] bg-[hsl(90_26%_96%)] p-1.5">
                  {(['userCode', 'email', 'otp'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setLoginMethod(method)}
                      className={cn(
                        'rounded-lg px-2 py-2 text-xs font-semibold transition-colors sm:text-sm',
                        loginMethod === method
                          ? 'bg-white text-[var(--agri-primary)] shadow-[0_8px_18px_hsl(148_62%_24%_/_0.12)]'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {tabLabel[method]}
                    </button>
                  ))}
                </div>

                {loginMethod === 'userCode' && (
                  <form onSubmit={handleSubmitUserCode(onSubmitUserCode)} className="space-y-4">
                    <div>
                      <label className="label-text">کد کاربری</label>
                      <Input {...registerUserCode('userCode')} dir="ltr" placeholder="مثال: 0100001" />
                      {errorsUserCode.userCode && <p className="field-error">{errorsUserCode.userCode.message}</p>}
                    </div>

                    <div>
                      <label className="label-text">رمز عبور</label>
                      <Input {...registerUserCode('password')} type="password" dir="ltr" />
                      {errorsUserCode.password && <p className="field-error">{errorsUserCode.password.message}</p>}
                    </div>

                    {renderCaptcha()}

                    {loginMutation.error && (
                      <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                        {getFriendlyTrpcError(loginMutation.error, 'ورود انجام نشد')}
                      </div>
                    )}

                    <Button type="submit" className="w-full" loading={loginMutation.isPending}>
                      ورود
                    </Button>
                  </form>
                )}

                {loginMethod === 'email' && (
                  <form onSubmit={handleSubmitEmail(onSubmitEmail)} className="space-y-4">
                    <div>
                      <label className="label-text">ایمیل</label>
                      <Input {...registerEmail('email')} type="email" dir="ltr" placeholder="example@domain.com" />
                      {errorsEmail.email && <p className="field-error">{errorsEmail.email.message}</p>}
                    </div>

                    <div>
                      <label className="label-text">رمز عبور</label>
                      <Input {...registerEmail('password')} type="password" dir="ltr" />
                      {errorsEmail.password && <p className="field-error">{errorsEmail.password.message}</p>}
                    </div>

                    {renderCaptcha()}

                    {loginWithEmailMutation.error && (
                      <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                        {getFriendlyTrpcError(loginWithEmailMutation.error, 'ورود انجام نشد')}
                      </div>
                    )}

                    <Button type="submit" className="w-full" loading={loginWithEmailMutation.isPending}>
                      ورود
                    </Button>
                  </form>
                )}

                {loginMethod === 'otp' && (
                  <form onSubmit={handleSubmitOtp(onSubmitOtp)} className="space-y-4">
                    <div>
                      <label className="label-text">{t('auth.mobile')}</label>
                      <Input {...registerOtp('mobile')} dir="ltr" placeholder="09xxxxxxxxx" />
                      {errorsOtp.mobile && <p className="field-error">{errorsOtp.mobile.message}</p>}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                      <div>
                        <label className="label-text">{t('auth.otp')}</label>
                        <Input {...registerOtp('otp')} dir="ltr" placeholder="------" />
                        {errorsOtp.otp && <p className="field-error">{errorsOtp.otp.message}</p>}
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-10"
                        onClick={handleSendOtp}
                        disabled={sendOtpMutation.isPending || !/^09[0-9]{9}$/.test(mobileForOtp)}
                      >
                        <Phone className="h-4 w-4" />
                        ارسال کد
                      </Button>
                    </div>

                    {otpLoginMutation.error && (
                      <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                        {getFriendlyTrpcError(otpLoginMutation.error, 'ورود با کد پیامکی انجام نشد')}
                      </div>
                    )}

                    <Button type="submit" className="w-full" loading={otpLoginMutation.isPending}>
                      {t('auth.loginWithOtp')}
                    </Button>
                  </form>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[hsl(90_14%_88%)] pt-3 text-xs sm:text-sm">
                  <Link to="/auth/register" className="inline-flex items-center gap-1 text-[var(--agri-primary)] hover:underline">
                    <Mail className="h-3.5 w-3.5" />
                    حساب ندارید؟ ثبت نام کنید
                  </Link>
                  <Link to="/" className="text-muted-foreground hover:text-foreground">
                    بازگشت به صفحه اصلی
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
