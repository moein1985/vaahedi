import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '../components/ui/button.js';
import { Card, CardContent } from '../components/ui/card.js';

export const Route = createFileRoute('/about')({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-muted/50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[var(--brand)] text-white flex items-center justify-center font-black text-sm">ت</div>
            <span className="font-black text-foreground">تجارت هوشمند</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild><Link to="/contact">ارتباط با ما</Link></Button>
            <Button variant="ghost" asChild><Link to="/auth/login">ورود</Link></Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        {/* عنوان */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-3">درباره ما</h1>
          <p className="text-lg text-muted-foreground">مرکز توسعه مطالعات و مدیریت بازرگانی متمرکز ایرانیان</p>
        </div>

        {/* معرفی انجمن */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-foreground">معرفی انجمن</h2>
            <p className="text-muted-foreground leading-relaxed">
              این سامانه با هدف ایجاد بستری هوشمند و متمرکز برای تجارت الکترونیک B2B ایران، توسط
              <strong> شرکت آماد گستر </strong>
              و تحت نظارت
              <strong> انجمن صنفی واردکنندگان و صادرکنندگان کالا و خدمات خراسان رضوی </strong>
              طراحی و راه‌اندازی شده است.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              هدف اصلی این مرکز، اتصال تولیدکنندگان، بازرگانان، سرمایه‌گذاران و خریداران در یک پلتفرم یکپارچه
              با ارائه خدمات تحلیل بازار، مشاوره تخصصی، اخبار تجاری و تسهیل فرآیند خرید و فروش کالا است.
            </p>
          </CardContent>
        </Card>

        {/* نقش انجمن */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-foreground">نقش انجمن صنفی</h2>
            <p className="text-muted-foreground leading-relaxed">
              انجمن صنفی به عنوان نهاد ناظر و حکم مرضی‌الطرفین، نقش‌های زیر را در این سامانه ایفا می‌کند:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mr-4">
              <li><strong>حکم مرضی‌الطرفین:</strong> نمایندگی قانونی طرفین در معاملات تجاری</li>
              <li><strong>ناظر:</strong> نظارت بر شفافیت و سلامت فرآیندهای تجاری</li>
              <li><strong>مشاور:</strong> ارائه مشاوره تخصصی در امور گمرکی، ارزی، حقوقی و بازرگانی</li>
            </ul>
          </CardContent>
        </Card>

        {/* خدمات */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4 text-center">خدمات قابل ارائه</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: '📋', title: 'عضویت و پروفایل', desc: 'ثبت‌نام حقیقی، حقوقی و صنفی با تفکیک نقش' },
              { icon: '📊', title: 'تحلیل بازرگانی', desc: 'درخواست تحلیل بازار، صادرات، واردات و تولیدات' },
              { icon: '📰', title: 'اخبار تجاری', desc: 'آخرین اخبار و اطلاعات بازرگانی برای تجار' },
              { icon: '📦', title: 'کاتالوگ محصولات', desc: 'معرفی و عرضه محصولات با مشخصات فنی کامل' },
              { icon: '📜', title: 'بخشنامه‌ها و کدهای گمرکی', desc: 'دسترسی به کدهای HS، آیسیک و بخشنامه‌های روز' },
              { icon: '💬', title: 'پشتیبانی آنلاین', desc: 'چت آنلاین و تیکت پشتیبانی با کارشناسان' },
              { icon: '🤝', title: 'مشاوره تخصصی', desc: 'مشاوره گمرکی، ارزی، خرید کالایی، رفع تعهدات و لجستیک' },
              { icon: '📢', title: 'تبلیغات و رسانه', desc: 'درخواست خدمات تبلیغاتی درون سایت' },
            ].map((s) => (
              <Card key={s.title}>
                <CardContent className="p-4 flex gap-3 items-start">
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{s.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* مخاطبین */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-foreground">مخاطبین هدف</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                'شرکت‌های بازرگانی (واردکننده و صادرکننده)',
                'شرکت‌های دانش‌بنیان',
                'کارخانجات و کارگاه‌های تولیدی',
                'شرکت‌های واسط (بدون کارت بازرگانی)',
                'عمده‌فروشان و کارگزاران',
                'کشاورزان و تولیدکنندگان',
                'سرمایه‌گذاران',
              ].map((a) => (
                <div key={a} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-[var(--brand)] shrink-0" />
                  {a}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center pt-4">
          <Button size="lg" asChild>
            <Link to="/auth/register">عضویت در سامانه</Link>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-8 mt-10">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-2">
          <p className="text-sm font-semibold text-foreground">مرکز توسعه مطالعات و مدیریت بازرگانی متمرکز ایرانیان</p>
          <p className="text-xs text-muted-foreground">شرکت آماد گستر و انجمن صنفی واردکنندگان و صادرکنندگان کالا و خدمات خراسان رضوی</p>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} تمامی حقوق محفوظ است</p>
        </div>
      </footer>
    </div>
  );
}