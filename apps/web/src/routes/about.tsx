import { createFileRoute, Link } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import { BadgeCheck, Leaf, Network, ShieldCheck, Sprout } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher.js';
import { Button } from '../components/ui/button.js';
import { Card, CardContent } from '../components/ui/card.js';

export const Route = createFileRoute('/about')({
  component: AboutPage,
});

type Language = 'fa' | 'en' | 'ar';
type PillarIconKey = 'network' | 'shield' | 'leaf' | 'sprout';

type PillarItem = {
  title: string;
  desc: string;
  metric: string;
  icon: PillarIconKey;
};

type RoadmapItem = {
  phase: string;
  title: string;
  desc: string;
};

type AboutCopy = {
  nav: {
    home: string;
    about: string;
    contact: string;
    login: string;
  };
  heroKicker: string;
  heroTitle: string;
  heroDesc: string;
  primaryCta: string;
  secondaryCta: string;
  missionTitle: string;
  missionParagraphs: string[];
  quickFactsTitle: string;
  quickFacts: string[];
  pillarsTitle: string;
  pillars: PillarItem[];
  audienceTitle: string;
  audiences: string[];
  roadmapTitle: string;
  roadmap: RoadmapItem[];
  ctaTitle: string;
  ctaDesc: string;
  ctaButton: string;
  footerTitle: string;
  footerDesc: string;
};

const pillarIcons: Record<PillarIconKey, LucideIcon> = {
  network: Network,
  shield: ShieldCheck,
  leaf: Leaf,
  sprout: Sprout,
};

function AboutPage() {
  const { i18n } = useTranslation();
  const normalizedLanguage = (i18n.resolvedLanguage ?? i18n.language ?? 'fa').split('-')[0];
  const language = (normalizedLanguage === 'en' || normalizedLanguage === 'ar' ? normalizedLanguage : 'fa') as Language;
  const isRtl = language !== 'en';

  const copyByLanguage: Record<Language, AboutCopy> = {
    fa: {
      nav: {
        home: 'خانه',
        about: 'درباره',
        contact: 'ارتباط',
        login: 'ورود',
      },
      heroKicker: 'AGRICULTURE STAKEHOLDERS PLATFORM',
      heroTitle: 'ماموریت ما: تبدیل داده و تعامل به تصمیم عملیاتی در کشاورزی',
      heroDesc:
        'سامانه ذینفعان کشاورزی برای یکپارچه سازی پروفایل حرفه ای، مجوزها، معرفی محصولات و مدیریت فرصت های همکاری ساخته شده است تا تصمیم گیری روزانه سریع تر، شفاف تر و قابل اتکاتر باشد.',
      primaryCta: 'شروع عضویت',
      secondaryCta: 'ارتباط با تیم',
      missionTitle: 'چرا این سامانه ایجاد شد؟',
      missionParagraphs: [
        'در زنجیره کشاورزی، اطلاعات پراکنده، فرآیندهای غیرشفاف و نبود زبان مشترک عملیاتی باعث تاخیر در تصمیم گیری و کاهش کیفیت همکاری می شود.',
        'ما این بستر را طراحی کردیم تا ذینفعان بتوانند از مرحله معرفی ظرفیت تا ثبت درخواست و پیگیری مجوزها، در یک چارچوب استاندارد و قابل پیگیری حرکت کنند.',
      ],
      quickFactsTitle: 'تمرکز اجرایی سامانه',
      quickFacts: [
        'یکپارچه سازی مسیر پروفایل، مدارک، محصولات و درخواست ها',
        'تقویت اعتماد با جریان بازبینی اولیه و وضعیت های شفاف',
        'افزایش آمادگی تصمیم با تقویم برداشت و تحلیل بازار نمایشی',
      ],
      pillarsTitle: 'چهار ستون اجرایی سامانه',
      pillars: [
        {
          title: 'شبکه ذینفعان',
          desc: 'اتصال تولیدکننده، تامین کننده، ارائه دهنده خدمت و متقاضی همکاری در یک مسیر یکپارچه.',
          metric: '4 گروه اصلی',
          icon: 'network',
        },
        {
          title: 'اعتبار اولیه',
          desc: 'پروفایل و مدارک با وضعیت های مشخص مدیریت می شود تا تعاملات حرفه ای قابل اطمینان تر باشد.',
          metric: 'گردش کار قابل ردیابی',
          icon: 'shield',
        },
        {
          title: 'بازار محصولات',
          desc: 'معرفی ظرفیت های محصول و خدمت تخصصی با ساختار دسته بندی و جست وجوی شفاف.',
          metric: 'دسته بندی تخصصی',
          icon: 'leaf',
        },
        {
          title: 'آگاهی داده محور',
          desc: 'تقویم برداشت و تحلیل بازار به عنوان ابزار تصمیم در کنار جریان عملیاتی قرار می گیرد.',
          metric: 'تحلیل نمایشی کنترل شده',
          icon: 'sprout',
        },
      ],
      audienceTitle: 'مخاطبان هدف',
      audiences: [
        'کشاورزان، باغداران و تولیدکنندگان',
        'شرکت های خدمات فنی و تخصصی کشاورزی',
        'تامین کنندگان، بازرگانان و توزیع کنندگان زنجیره',
        'شرکت های دانش بنیان و تیم های نوآور',
        'مدیران عملیات، ارزیابان و نهادهای پشتیبان',
      ],
      roadmapTitle: 'چارچوب اجرایی کوتاه',
      roadmap: [
        {
          phase: 'فاز 1',
          title: 'هویت حرفه ای و اعتبار اولیه',
          desc: 'تکمیل پروفایل، بارگذاری مدارک و آماده سازی برای ورود به جریان های عملیاتی.',
        },
        {
          phase: 'فاز 2',
          title: 'بازار و فرصت',
          desc: 'ثبت محصول/خدمت، مشاهده فرصت ها و مدیریت درخواست ها در یک داشبورد منسجم.',
        },
        {
          phase: 'فاز 3',
          title: 'تصمیم داده محور',
          desc: 'استفاده از تقویم برداشت و تحلیل بازار نمایشی برای برنامه ریزی بهتر عملیات.',
        },
      ],
      ctaTitle: 'برای شروع همکاری آماده اید؟',
      ctaDesc: 'اکانت خود را بسازید و مسیر حرفه ای خود را در شبکه ذینفعان کشاورزی فعال کنید.',
      ctaButton: 'ایجاد حساب کاربری',
      footerTitle: 'سامانه یکپارچه ذینفعان حوزه کشاورزی',
      footerDesc: 'بستر تخصصی برای پروفایل، مجوزها، بازار محصولات و فرصت های همکاری',
    },
    en: {
      nav: {
        home: 'Home',
        about: 'About',
        contact: 'Contact',
        login: 'Login',
      },
      heroKicker: 'AGRICULTURE STAKEHOLDERS PLATFORM',
      heroTitle: 'Our Mission: Turning Data and Collaboration into Operational Decisions',
      heroDesc:
        'The platform is built to unify professional profiles, permits, product showcases, and collaboration opportunities so daily agricultural operations become faster, clearer, and more reliable.',
      primaryCta: 'Get Started',
      secondaryCta: 'Contact Team',
      missionTitle: 'Why this platform exists',
      missionParagraphs: [
        'In agriculture, fragmented information and unclear workflows delay decision-making and reduce partnership quality.',
        'We built this platform to provide one structured path from profile setup to request management and permit tracking.',
      ],
      quickFactsTitle: 'Execution Focus',
      quickFacts: [
        'Unified flow for profile, documents, products, and requests',
        'Trust-ready interactions with transparent review statuses',
        'Data-assisted planning through harvest calendar and market insights',
      ],
      pillarsTitle: 'Four operational pillars',
      pillars: [
        {
          title: 'Stakeholder Network',
          desc: 'Connect producers, suppliers, service providers, and applicants in one operational flow.',
          metric: '4 primary groups',
          icon: 'network',
        },
        {
          title: 'Initial Verification',
          desc: 'Profiles and documents are managed with clear statuses for more reliable interactions.',
          metric: 'Traceable workflow',
          icon: 'shield',
        },
        {
          title: 'Product Market',
          desc: 'Showcase products and specialized services through clear categorization and discovery.',
          metric: 'Specialized taxonomy',
          icon: 'leaf',
        },
        {
          title: 'Data-Guided Awareness',
          desc: 'Harvest calendar and market insights sit beside operational workflows to support planning.',
          metric: 'Curated insights',
          icon: 'sprout',
        },
      ],
      audienceTitle: 'Target Stakeholders',
      audiences: [
        'Farmers, growers, and producers',
        'Agriculture technical service companies',
        'Suppliers, traders, and distributors',
        'Knowledge-based and innovation teams',
        'Operational managers, reviewers, and support entities',
      ],
      roadmapTitle: 'Short execution framework',
      roadmap: [
        {
          phase: 'Phase 1',
          title: 'Identity and Initial Verification',
          desc: 'Complete profile and documents to become ready for operational workflows.',
        },
        {
          phase: 'Phase 2',
          title: 'Market and Opportunities',
          desc: 'Publish products/services and manage requests and opportunities from one dashboard.',
        },
        {
          phase: 'Phase 3',
          title: 'Data-Guided Decisions',
          desc: 'Use harvest and market signals to plan more effectively.',
        },
      ],
      ctaTitle: 'Ready to collaborate?',
      ctaDesc: 'Create your account and activate your professional path in the agriculture stakeholder network.',
      ctaButton: 'Create Account',
      footerTitle: 'Integrated Agriculture Stakeholders Platform',
      footerDesc: 'A focused ecosystem for profiles, permits, products, and collaboration opportunities.',
    },
    ar: {
      nav: {
        home: 'الرئيسية',
        about: 'من نحن',
        contact: 'تواصل',
        login: 'دخول',
      },
      heroKicker: 'AGRICULTURE STAKEHOLDERS PLATFORM',
      heroTitle: 'مهمتنا: تحويل البيانات والتعاون إلى قرارات تشغيلية',
      heroDesc:
        'تم تصميم المنصة لتوحيد الهوية المهنية، التراخيص، عرض المنتجات، وفرص التعاون بحيث تصبح العمليات الزراعية اليومية أسرع وأكثر وضوحا واعتمادية.',
      primaryCta: 'ابدأ الآن',
      secondaryCta: 'تواصل مع الفريق',
      missionTitle: 'لماذا أُنشئت هذه المنصة؟',
      missionParagraphs: [
        'في القطاع الزراعي، تؤدي المعلومات المتفرقة والإجراءات غير الواضحة إلى بطء القرار وضعف جودة الشراكات.',
        'أنشأنا هذه المنصة لتوفير مسار موحّد من إعداد الملف المهني إلى إدارة الطلبات ومتابعة التراخيص.',
      ],
      quickFactsTitle: 'تركيز التنفيذ',
      quickFacts: [
        'مسار موحّد للملف، المستندات، المنتجات، والطلبات',
        'تفاعل أكثر موثوقية عبر حالات مراجعة واضحة',
        'دعم القرار عبر تقويم الحصاد وتحليلات السوق',
      ],
      pillarsTitle: 'أربعة محاور تشغيلية',
      pillars: [
        {
          title: 'شبكة أصحاب المصلحة',
          desc: 'ربط المنتجين والموردين ومقدمي الخدمات والجهات المستفيدة ضمن مسار تشغيلي واحد.',
          metric: '4 فئات رئيسية',
          icon: 'network',
        },
        {
          title: 'التحقق الأولي',
          desc: 'إدارة الملفات والمستندات بحالات واضحة لرفع موثوقية التعاون.',
          metric: 'تدفق قابل للتتبع',
          icon: 'shield',
        },
        {
          title: 'سوق المنتجات',
          desc: 'عرض المنتجات والخدمات المتخصصة عبر تصنيف واضح ومسار اكتشاف أفضل.',
          metric: 'تصنيف تخصصي',
          icon: 'leaf',
        },
        {
          title: 'وعي قائم على البيانات',
          desc: 'تقويم الحصاد وتحليلات السوق كأدوات داعمة للتخطيط التشغيلي.',
          metric: 'تحليلات موجّهة',
          icon: 'sprout',
        },
      ],
      audienceTitle: 'الفئات المستهدفة',
      audiences: [
        'المزارعون والمنتجون',
        'شركات الخدمات الفنية الزراعية',
        'الموردون والتجار والموزعون',
        'الشركات المعرفية والفرق الابتكارية',
        'مديرو العمليات وجهات المراجعة والدعم',
      ],
      roadmapTitle: 'إطار التنفيذ المختصر',
      roadmap: [
        {
          phase: 'المرحلة 1',
          title: 'الهوية والتحقق الأولي',
          desc: 'استكمال الملف والمستندات للاستعداد للتدفقات التشغيلية.',
        },
        {
          phase: 'المرحلة 2',
          title: 'السوق والفرص',
          desc: 'نشر المنتجات/الخدمات وإدارة الطلبات والفرص من لوحة واحدة.',
        },
        {
          phase: 'المرحلة 3',
          title: 'قرار موجّه بالبيانات',
          desc: 'استخدام مؤشرات الحصاد والسوق لتحسين التخطيط.',
        },
      ],
      ctaTitle: 'جاهز لبدء التعاون؟',
      ctaDesc: 'أنشئ حسابك وفعل مسارك المهني ضمن شبكة أصحاب المصلحة الزراعيين.',
      ctaButton: 'إنشاء حساب',
      footerTitle: 'منصة أصحاب المصلحة في القطاع الزراعي',
      footerDesc: 'منظومة عملية للملفات المهنية، التراخيص، المنتجات، وفرص التعاون.',
    },
  };

  const copy = copyByLanguage[language];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-[linear-gradient(180deg,var(--field-mist)_0%,#ffffff_42%)] text-foreground">
      <header className="sticky top-0 z-50 border-b border-[hsl(90_14%_88%_/_0.65)] bg-[hsl(0_0%_100%_/_0.9)] backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(150deg,var(--agri-primary),var(--agri-leaf))] text-sm font-black text-white shadow-[0_10px_24px_hsl(148_62%_24%_/_0.35)]">
              ز
            </div>
            <span className="text-sm font-black text-foreground sm:text-base">{copy.footerTitle}</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-[var(--soil-neutral)] md:flex">
            <Link to="/" className="transition-colors hover:text-[var(--agri-primary)]">{copy.nav.home}</Link>
            <Link to="/about" className="text-[var(--agri-primary)]">{copy.nav.about}</Link>
            <Link to="/contact" className="transition-colors hover:text-[var(--agri-primary)]">{copy.nav.contact}</Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link to="/auth/login">{copy.nav.login}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-10 px-4 pb-16 pt-10 sm:space-y-12 sm:pt-14">
        <section className="relative overflow-hidden rounded-3xl border border-[hsl(148_34%_78%_/_0.44)] bg-[linear-gradient(135deg,hsl(153_41%_12%),hsl(148_62%_24%))] px-6 py-8 text-white shadow-[0_20px_45px_hsl(153_41%_12%_/_0.28)] sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute -left-24 -top-20 h-56 w-56 rounded-full bg-[hsl(40_62%_57%_/_0.2)] blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-56 w-56 rounded-full bg-[hsl(139_52%_52%_/_0.25)] blur-2xl" />

          <div className="relative z-10 max-w-3xl space-y-5">
            <p className="text-xs font-semibold tracking-[0.24em] text-[hsl(90_22%_88%_/_0.9)]">{copy.heroKicker}</p>
            <h1 className="text-3xl font-black leading-tight sm:text-4xl">{copy.heroTitle}</h1>
            <p className="text-sm leading-7 text-[hsl(90_22%_94%_/_0.9)] sm:text-base">{copy.heroDesc}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-[hsl(153_41%_14%)] hover:bg-[hsl(90_33%_95%)]">
                <Link to="/auth/register">{copy.primaryCta}</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/45 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <Link to="/contact">{copy.secondaryCta}</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-12">
          <Card className="border-[hsl(148_28%_82%_/_0.58)] bg-white/92 lg:col-span-8">
            <CardContent className="space-y-5 p-6 sm:p-7">
              <h2 className="text-2xl font-black text-foreground">{copy.missionTitle}</h2>
              {copy.missionParagraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-7 text-[var(--soil-neutral)] sm:text-base">
                  {paragraph}
                </p>
              ))}
            </CardContent>
          </Card>

          <Card className="border-[hsl(148_28%_82%_/_0.58)] bg-[linear-gradient(165deg,hsl(148_62%_24%_/_0.1),hsl(90_32%_97%))] lg:col-span-4">
            <CardContent className="space-y-4 p-6">
              <h2 className="text-lg font-black text-foreground">{copy.quickFactsTitle}</h2>
              <div className="space-y-3">
                {copy.quickFacts.map((fact) => (
                  <div key={fact} className="flex items-start gap-2 text-sm text-[var(--soil-neutral)]">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--agri-primary)]" />
                    <span>{fact}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-black text-foreground">{copy.pillarsTitle}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {copy.pillars.map((pillar) => {
              const Icon = pillarIcons[pillar.icon];
              return (
                <Card key={pillar.title} className="border-[hsl(148_28%_82%_/_0.62)] bg-white/92">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(148_62%_24%_/_0.12)] text-[var(--agri-primary)]">
                          <Icon className="h-5 w-5" />
                        </span>
                        <h3 className="text-base font-black text-foreground">{pillar.title}</h3>
                      </div>
                      <span className="rounded-full bg-[hsl(90_33%_93%)] px-3 py-1 text-xs font-bold text-[var(--agri-primary)]">
                        {pillar.metric}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-[var(--soil-neutral)]">{pillar.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-12">
          <Card className="border-[hsl(148_28%_82%_/_0.62)] bg-white/92 lg:col-span-7">
            <CardContent className="space-y-4 p-6">
              <h2 className="text-xl font-black text-foreground">{copy.audienceTitle}</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {copy.audiences.map((audience) => (
                  <div
                    key={audience}
                    className="rounded-xl border border-[hsl(148_26%_82%)] bg-[hsl(90_33%_97%)] px-3 py-2 text-sm text-[var(--soil-neutral)]"
                  >
                    {audience}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[hsl(148_28%_82%_/_0.62)] bg-white/92 lg:col-span-5">
            <CardContent className="space-y-4 p-6">
              <h2 className="text-xl font-black text-foreground">{copy.roadmapTitle}</h2>
              <div className="space-y-3">
                {copy.roadmap.map((item) => (
                  <div key={item.phase} className="rounded-2xl border border-[hsl(148_26%_84%)] bg-[hsl(90_30%_97%)] p-3">
                    <p className="text-xs font-black tracking-[0.18em] text-[var(--agri-primary)]">{item.phase}</p>
                    <h3 className="mt-1 text-sm font-black text-foreground">{item.title}</h3>
                    <p className="mt-1 text-xs leading-6 text-[var(--soil-neutral)]">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-3xl border border-[hsl(40_62%_57%_/_0.4)] bg-[linear-gradient(135deg,hsl(40_62%_57%_/_0.22),hsl(90_33%_95%))] px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-foreground">{copy.ctaTitle}</h2>
              <p className="max-w-2xl text-sm leading-7 text-[var(--soil-neutral)]">{copy.ctaDesc}</p>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link to="/auth/register">{copy.ctaButton}</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-[hsl(90_14%_88%_/_0.72)] bg-[hsl(90_26%_96%_/_0.72)] py-7">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 px-4 text-center">
          <p className="text-sm font-black text-foreground">{copy.footerTitle}</p>
          <p className="text-xs text-muted-foreground">{copy.footerDesc}</p>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}