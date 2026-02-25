import { useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { trpc } from '../../trpc.js';
import { useAuthStore } from '../../store/auth.store.js';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.js';
import { Input } from '../../components/ui/input.js';
import { Button } from '../../components/ui/button.js';
import { cn } from '../../lib/utils.js';

export const Route = createFileRoute('/auth/login-otp')({
  component: LoginOTPPage,
});

function LoginOTPPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [step, setStep] = useState<'mobile' | 'code'>('mobile');
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [error, setError] = useState('');

  const sendOTP = trpc.auth.sendOTP.useMutation({
    onSuccess: (data) => {
      setExpiresAt(new Date(data.expiresAt));
      setStep('code');
      setError('');
    },
    onError: (e) => setError(e.message),
  });

  const verifyOTP = trpc.auth.verifyOTP.useMutation({
    onSuccess: (data) => {
      setAuth({
        id: data.user.id,
        userCode: data.user.userCode,
        role: 'TRADER', // فرض
        status: 'ACTIVE', // فرض
        mobile: data.user.mobile,
        email: null,
        isAdmin: false,
      }, ''); // accessToken از cookie
      void navigate({ to: '/dashboard' });
    },
    onError: (e) => setError(e.message),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand)] text-white text-2xl font-black mb-3">و</div>
          <h1 className="text-2xl font-bold text-foreground">وهدی</h1>
          <p className="text-muted-foreground text-sm mt-1">رمز یکبار مصرف</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ورود با رمز یکبار مصرف</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center mb-6">
              {step === 'mobile' ? 'شماره موبایل خود را وارد کنید' : `کد ۶ رقمی ارسال‌شده به ${mobile} را وارد کنید`}
            </p>

            {error && <div className="bg-destructive/20 border border-destructive rounded-lg p-3 text-destructive text-sm mb-4">{error}</div>}

            {step === 'mobile' ? (
              <form onSubmit={(e) => { e.preventDefault(); sendOTP.mutate({ mobile }); }} className="space-y-4">
                <Input
                  type="tel"
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="text-center text-lg tracking-widest"
                  maxLength={11}
                  dir="ltr"
                />
                <Button type="submit" className="w-full" loading={sendOTP.isPending}>
                  ارسال کد تأیید
                </Button>
              </form>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); verifyOTP.mutate({ mobile, code }); }} className="space-y-4">
                <Input
                  type="text"
                  placeholder="_ _ _ _ _ _"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-[0.5em]"
                  maxLength={6}
                  dir="ltr"
                />
                {expiresAt && (
                  <p className="text-xs text-muted-foreground text-center mb-4">
                    کد تا ۵ دقیقه معتبر است
                  </p>
                )}
                <Button type="submit" className="w-full" loading={verifyOTP.isPending} disabled={code.length !== 6}>
                  تأیید و ورود
                </Button>
                <Button variant="secondary" size="sm" className="w-full" onClick={() => { setStep('mobile'); setCode(''); setError(''); }}>
                  ویرایش شماره
                </Button>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <Link to="/auth/login" className="text-[var(--brand)] hover:underline">ورود با رمز عبور</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}