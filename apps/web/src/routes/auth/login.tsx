import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useRef, useEffect } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { trpc } from '../../trpc.js';
import { useAuthStore } from '../../store/auth.store.js';
import { loginSchema, loginWithEmailSchema, type LoginInput } from '@repo/shared';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.js';
import { Input } from '../../components/ui/input.js';
import { Button } from '../../components/ui/button.js';
import { cn } from '../../lib/utils.js';

const otpLoginSchema = z.object({
  mobile: z.string().regex(/^09[0-9]{9}$/, 'شماره همراه معتبر نیست'),
  otp: z.string().length(6, 'کد OTP باید ۶ رقم باشد').regex(/^\d{6}$/),
});

type OtpLoginInput = z.infer<typeof otpLoginSchema>;
type LoginWithEmailInput = z.infer<typeof loginWithEmailSchema>;

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loginMethod, setLoginMethod] = useState<'userCode' | 'email' | 'otp'>('userCode');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const { t } = useTranslation();
  
  // Captcha configuration
  const captchaSiteKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY;
  const requiresCaptcha = !import.meta.env.DEV && !!captchaSiteKey;

  // Debug: Component mounted
  useEffect(() => {
    console.log('✅ LoginPage component mounted', { requiresCaptcha, isDev: import.meta.env.DEV });
  }, []);

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
          isAdmin: false,
        },
        data.accessToken,
      );
      void navigate({ to: '/dashboard' });
    },
    onError: (error) => {
      // Error is automatically displayed in the form
      console.error('Login error:', error.message);
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
          isAdmin: false,
        },
        data.accessToken,
      );
      void navigate({ to: '/dashboard' });
    },
    onError: (error) => {
      console.error('Email login error:', error.message);
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
          isAdmin: false,
        },
        data.accessToken,
      );
      void navigate({ to: '/dashboard' });
    },
    onError: (error) => {
      console.error('OTP login error:', error.message);
    },
  });

  const sendOtpMutation = trpc.auth.sendOtp.useMutation({
    onSuccess: () => {
      alert('کد OTP به شماره موبایل شما ارسال شد');
    },
    onError: (error) => {
      alert(`خطا: ${error.message}`);
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

  // Auto-set captcha token for development
  useEffect(() => {
    if (requiresCaptcha) {
      // In production, wait for user to verify
      return;
    }
    // In development, auto-set test token
    setCaptchaToken('test-token');
  }, [requiresCaptcha]);

  // Reset captcha token when switching login methods
  useEffect(() => {
    console.log('🔄 Tab switched to:', loginMethod);
    if (!requiresCaptcha) {
      setCaptchaToken('test-token');
    } else {
      setCaptchaToken(null);
    }
  }, [loginMethod, requiresCaptcha]);

  const onSubmitUserCode = (data: LoginInput) => {
    alert('🔐 onSubmitUserCode called! Logging in with: ' + data.userCode);
    console.log('🔐 onSubmitUserCode called!', { data, captchaToken, requiresCaptcha });
    if (requiresCaptcha && !captchaToken) {
      console.warn('⚠️ CAPTCHA required but not verified');
      alert('لطفاً captcha را تأیید کنید');
      return;
    }
    console.log('📤 Sending userCode login mutation...');
    loginMutation.mutate({ ...data, captchaToken: captchaToken || 'test-token' });
  };

  const onSubmitEmail = (data: LoginWithEmailInput) => {
    alert('✉️ onSubmitEmail called! Logging in with: ' + data.email);
    console.log('✉️ onSubmitEmail called!', { data, captchaToken, requiresCaptcha });
    if (requiresCaptcha && !captchaToken) {
      console.warn('⚠️ CAPTCHA required but not verified');
      alert('لطفاً captcha را تأیید کنید');
      return;
    }
    console.log('📤 Sending email login mutation...');
    loginWithEmailMutation.mutate({ ...data, captchaToken: captchaToken || 'test-token' });
  };

  const onSubmitOtp = (data: OtpLoginInput) => {
    console.log('📱 onSubmitOtp called!', { data });
    otpLoginMutation.mutate(data);
  };

  const handleSendOtp = () => {
    if (mobileForOtp && /^09[0-9]{9}$/.test(mobileForOtp)) {
      sendOtpMutation.mutate({ mobile: mobileForOtp, purpose: 'LOGIN' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand)] text-white text-2xl font-black mb-3">و</div>
          <h1 className="text-2xl font-bold text-foreground">وهدی</h1>
          <p className="text-muted-foreground text-sm mt-1">مرکز تجارت متمرکز هوشمند</p>
        </div>

        <Card>
          <CardHeader><CardTitle>ورود به حساب</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Tab selector */}
              <div className="grid grid-cols-3 gap-2 mb-6 bg-muted rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setLoginMethod('userCode')}
                  className={cn(
                    'py-2 px-2 text-xs sm:text-sm font-medium rounded-md transition-colors',
                    loginMethod === 'userCode'
                      ? 'bg-background text-[var(--brand)] shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  ورود با کد کاربری
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('email')}
                  className={cn(
                    'py-2 px-2 text-xs sm:text-sm font-medium rounded-md transition-colors',
                    loginMethod === 'email'
                      ? 'bg-background text-[var(--brand)] shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  ورود با ایمیل
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('otp')}
                  className={cn(
                    'py-2 px-2 text-xs sm:text-sm font-medium rounded-md transition-colors',
                    loginMethod === 'otp'
                      ? 'bg-background text-[var(--brand)] shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  ارسال کد OTP
                </button>
              </div>

              {loginMethod === 'userCode' && (
                <form 
                  onSubmit={handleSubmitUserCode(onSubmitUserCode)} 
                  className="space-y-4"
                >
                  <div>
                    <label className="label-text">کد کاربری</label>
                    <Input
                      {...registerUserCode('userCode')}
                      dir="ltr"
                      placeholder="مثال: 0100001"
                    />
                    {errorsUserCode.userCode && (
                      <p className="field-error">{errorsUserCode.userCode.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label-text">رمز عبور</label>
                    <Input
                      {...registerUserCode('password')}
                      type="password"
                      dir="ltr"
                    />
                    {errorsUserCode.password && (
                      <p className="field-error">{errorsUserCode.password.message}</p>
                    )}
                  </div>

                  {/* Captcha */}
                  {requiresCaptcha ? (
                    <div className="flex justify-center">
                      <HCaptcha
                        sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY ?? '10000000-ffff-ffff-ffff-000000000001'}
                        onVerify={(token) => setCaptchaToken(token)}
                        onExpire={() => setCaptchaToken(null)}
                        ref={captchaRef}
                        size="normal"
                        languageOverride="fa"
                      />
                    </div>
                  ) : (
                    <div className="text-center text-xs text-muted-foreground bg-muted/50 rounded p-2">
                      ✓ کاپچا در حالت توسعه غیرفعال است
                    </div>
                  )}

                  {loginMutation.error && (
                    <div className="bg-destructive/20 border border-destructive rounded-lg p-3 text-destructive text-sm">
                      {loginMutation.error.message}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    loading={loginMutation.isPending}
                  >
                    ورود
                  </Button>
                </form>
              )}

              {loginMethod === 'email' && (
                <form 
                  onSubmit={handleSubmitEmail(onSubmitEmail)} 
                  className="space-y-4"
                >
                  <div>
                    <label className="label-text">ایمیل</label>
                    <Input
                      {...registerEmail('email')}
                      type="email"
                      dir="ltr"
                      placeholder="example@domain.com"
                    />
                    {errorsEmail.email && (
                      <p className="field-error">{errorsEmail.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label-text">رمز عبور</label>
                    <Input
                      {...registerEmail('password')}
                      type="password"
                      dir="ltr"
                    />
                    {errorsEmail.password && (
                      <p className="field-error">{errorsEmail.password.message}</p>
                    )}
                  </div>

                  {/* Captcha */}
                  {requiresCaptcha ? (
                    <div className="flex justify-center">
                      <HCaptcha
                        sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY ?? '10000000-ffff-ffff-ffff-000000000001'}
                        onVerify={(token) => setCaptchaToken(token)}
                        onExpire={() => setCaptchaToken(null)}
                        ref={captchaRef}
                        size="normal"
                        languageOverride="fa"
                      />
                    </div>
                  ) : (
                    <div className="text-center text-xs text-muted-foreground bg-muted/50 rounded p-2">
                      ✓ کاپچا در حالت توسعه غیرفعال است
                    </div>
                  )}

                  {loginWithEmailMutation.error && (
                    <div className="bg-destructive/20 border border-destructive rounded-lg p-3 text-destructive text-sm">
                      {loginWithEmailMutation.error.message}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    loading={loginWithEmailMutation.isPending}
                  >
                    ورود
                  </Button>
                </form>
              )}

              {loginMethod === 'otp' && (
                <form onSubmit={handleSubmitOtp(onSubmitOtp)} className="space-y-4">
                  <div>
                    <label className="label-text">{t('auth.mobile')}</label>
                    <Input
                      {...registerOtp('mobile')}
                      dir="ltr"
                      placeholder="09xxxxxxxxx"
                    />
                    {errorsOtp.mobile && (
                      <p className="field-error">{errorsOtp.mobile.message}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="label-text">{t('auth.otp')}</label>
                      <Input
                        {...registerOtp('otp')}
                        dir="ltr"
                        placeholder="------"
                      />
                      {errorsOtp.otp && (
                        <p className="field-error">{errorsOtp.otp.message}</p>
                      )}
                    </div>
                    <Button type="button" variant="secondary" size="sm" onClick={handleSendOtp} disabled={sendOtpMutation.isPending || !/^09[0-9]{9}$/.test(mobileForOtp)}>
                      ارسال کد
                    </Button>
                  </div>

                  {otpLoginMutation.error && (
                    <div className="bg-destructive/20 border border-destructive rounded-lg p-3 text-destructive text-sm">
                      {otpLoginMutation.error.message}
                    </div>
                  )}

                  <Button type="submit" className="w-full" loading={otpLoginMutation.isPending}>
                    {t('auth.loginWithOtp')}
                  </Button>
                </form>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
