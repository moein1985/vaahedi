import { createFileRoute, Link } from '@tanstack/react-router';
import { Badge } from '../components/ui/badge.js';
import { Button } from '../components/ui/button.js';
import { Card, CardContent } from '../components/ui/card.js';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <div dir="rtl">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[var(--brand)] text-white flex items-center justify-center font-black text-sm">و</div>
            <span className="font-black text-foreground">وهدی</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild><Link to="/auth/login">ورود</Link></Button>
            <Button asChild><Link to="/auth/register">ثبت‌نام رایگان</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <Badge className="mb-4">پلتفرم جدید تجارت هوشمند ایران</Badge>
        <h1 className="text-4xl lg:text-6xl font-black text-foreground mb-6 leading-tight">
          تجارت هوشمند<br />
          <span className="text-[var(--brand)]">با وهدی</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          اتصال تولیدکنندگان، بازرگانان و خریداران در یک پلتفرم یکپارچه
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button size="lg" asChild><Link to="/auth/register">شروع رایگان</Link></Button>
          <Button size="lg" variant="outline" asChild><Link to="/catalog">مشاهده کاتالوگ</Link></Button>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'کاتالوگ محصولات', desc: 'معرفی و فروش محصولات به هزاران بازرگان', icon: '📦' },
              { title: 'تجارت امن', desc: 'درخواست‌های تجاری با پشتیبانی کارشناس', icon: '🔒' },
              { title: 'خدمات گمرکی', desc: 'کدهای HS، بخشنامه‌ها و مستندات جامع', icon: '📊' },
            ].map((f) => (
              <Card key={f.title}>
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
    </div>
  );
}
