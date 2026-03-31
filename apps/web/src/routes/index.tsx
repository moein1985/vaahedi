import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Badge } from '../components/ui/badge.js';
import { Button } from '../components/ui/button.js';
import { Card, CardContent } from '../components/ui/card.js';
import { Input } from '../components/ui/input.js';
import { trpc } from '../trpc.js';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/')({
  component: HomePage,
});

export function HomePage() {
  const { t } = useTranslation();
  const [nlEmail, setNlEmail] = useState('');
  const [nlMsg, setNlMsg] = useState('');
  const subscribe = trpc.news.subscribe.useMutation({
    onSuccess: (data) => {
      setNlMsg(data.message);
      setNlEmail('');
    },
    onError: (err) => setNlMsg(err.message),
  });

  return (
    <div dir="rtl">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[var(--brand)] text-white flex items-center justify-center font-black text-sm">ت</div>
            <span className="font-black text-foreground">تجارت هوشمند</span>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild><Link to="/news">اخبار</Link></Button>
            <Button variant="ghost" asChild><Link to="/about">درباره ما</Link></Button>
            <Button variant="ghost" asChild><Link to="/contact">ارتباط با ما</Link></Button>
            <Button variant="ghost" asChild><Link to="/auth/login">ورود</Link></Button>
            <Button asChild><Link to="/auth/register">ثبت‌نام رایگان</Link></Button>
          </div>
          <div className="flex md:hidden items-center gap-2">
            <Button size="sm" variant="ghost" asChild><Link to="/auth/login">ورود</Link></Button>
            <Button size="sm" asChild><Link to="/auth/register">ثبت‌نام</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[var(--brand-light)] to-white">
        <div className="max-w-6xl mx-auto px-4 py-24 text-center relative z-10">
          <Badge className="mb-4">پلتفرم جامع تجارت هوشمند ایران</Badge>
          <h1 className="text-4xl lg:text-6xl font-black text-foreground mb-6 leading-tight">
            مرکز توسعه مطالعات<br />
            <span className="text-[var(--brand)]">و مدیریت بازرگانی متمرکز ایرانیان</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            اتصال تولیدکنندگان، بازرگانان و خریداران در یک پلتفرم یکپارچه با پشتیبانی کارشناسان حرفه‌ای
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button size="lg" asChild><Link to="/auth/register">شروع رایگان</Link></Button>
            <Button size="lg" variant="outline" asChild><Link to="/catalog">مشاهده کاتالوگ</Link></Button>
          </div>
        </div>
        {/* Stats */}
        <div className="max-w-4xl mx-auto px-4 pb-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { num: '۵۰۰+', label: 'بازرگان فعال' },
            { num: '۲,۰۰۰+', label: 'محصول ثبت شده' },
            { num: '۳۰+', label: 'گروه کالایی' },
            { num: '۲۴/۷', label: 'پشتیبانی آنلاین' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-border p-4 text-center shadow-sm">
              <div className="text-2xl font-black text-[var(--brand)]">{s.num}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-foreground mb-2">امکانات پلتفرم</h2>
          <p className="text-center text-muted-foreground text-sm mb-10">ابزارهایی که تجارت شما را متحول می‌کند</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'کاتالوگ محصولات', desc: 'معرفی و فروش محصولات به هزاران بازرگان', icon: '📦' },
              { title: 'تجارت امن', desc: 'درخواست‌های تجاری با پشتیبانی کارشناس', icon: '🔒' },
              { title: 'خدمات گمرکی', desc: 'کدهای HS، بخشنامه‌ها و مستندات جامع', icon: '📊' },
              { title: 'پیام‌رسان تجاری', desc: 'ارتباط مستقیم با تأمین‌کنندگان و خریداران', icon: '💬' },
              { title: 'مدیریت مدارک', desc: 'آپلود و تأیید مجوزها و گواهینامه‌ها', icon: '📋' },
              { title: 'اطلاع‌رسانی', desc: 'آخرین اخبار تجاری و بخشنامه‌های گمرکی', icon: '📰' },
            ].map((f) => (
              <Card key={f.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">{f.icon}</div>
                  <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">{t('newsletter.subscribe')}</h2>
          <p className="text-muted-foreground mb-6 text-sm">آخرین اخبار تجاری و بخشنامه‌ها را در ایمیل خود دریافت کنید</p>
          <div className="flex gap-2 max-w-md mx-auto">
            <Input
              type="email"
              value={nlEmail}
              onChange={(e) => setNlEmail(e.target.value)}
              placeholder={t('newsletter.email')}
              dir="ltr"
              className="flex-1"
            />
            <Button
              onClick={() => nlEmail && subscribe.mutate({ email: nlEmail })}
              disabled={subscribe.isPending || !nlEmail}
            >
              {subscribe.isPending ? '...' : 'عضویت'}
            </Button>
          </div>
          {nlMsg && (
            <p className="text-sm mt-3 text-green-600">{nlMsg}</p>
          )}
        </div>
      </section>

      {/* Trust */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground mb-4">مورد اعتماد</p>
          <div className="flex flex-wrap justify-center gap-8 text-muted-foreground text-sm font-medium">
            <span>🏛️ انجمن صنفی صادرکنندگان خراسان رضوی</span>
            <span>🏢 شرکت آماد گستر</span>
            <span>📜 دارای مجوز رسمی</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-10">
        <div className="max-w-6xl mx-auto px-4 text-center space-y-3">
          <p className="text-sm font-semibold text-foreground">مرکز توسعه مطالعات و مدیریت بازرگانی متمرکز ایرانیان</p>
          <p className="text-xs text-muted-foreground">شرکت آماد گستر و انجمن صنفی واردکنندگان و صادرکنندگان کالا و خدمات خراسان رضوی</p>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} تمامی حقوق محفوظ است</p>
        </div>
      </footer>
    </div>
  );
}
