import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Badge } from '../components/ui/badge.js';
import { Button } from '../components/ui/button.js';
import { Card, CardContent } from '../components/ui/card.js';
import { Input } from '../components/ui/input.js';
import { trpc } from '../trpc.js';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher.js';

export const Route = createFileRoute('/')({
  component: HomePage,
});

export function HomePage() {
  const { t, i18n } = useTranslation();
  const normalizedLanguage = (i18n.resolvedLanguage ?? i18n.language ?? 'fa').split('-')[0];
  const language = (normalizedLanguage === 'en' || normalizedLanguage === 'ar' ? normalizedLanguage : 'fa') as 'fa' | 'en' | 'ar';
  const isRtl = language !== 'en';
  const [nlEmail, setNlEmail] = useState('');
  const [nlMsg, setNlMsg] = useState('');
  const [heroIndex, setHeroIndex] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);

  const products = trpc.product.list.useQuery({
    page: 1,
    limit: 4,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const news = trpc.news.latest.useQuery({ limit: 3 });

  const subscribe = trpc.news.subscribe.useMutation({
    onSuccess: (data) => {
      setNlMsg(data.message);
      setNlEmail('');
    },
    onError: (err) => setNlMsg(err.message),
  });

  const pageCopy = {
    fa: {
      topStripTitle: 'دروازه صادرات و واردات',
      topStripDesc: 'راهکار یکپارچه برای زنجیره تامین بین الملل',
      supportBadge: 'پشتیبانی 24/7',
      verifyBadge: 'شبکه معتبر B2B',
      ctaRequest: 'درخواست قیمت',
      nav: { home: 'خانه', about: 'درباره ما', products: 'کالاها', news: 'اخبار', contact: 'ارتباط' },
      heroSlides: [
        {
          title: 'انجمن صادرکنندگان و واردکنندگان',
          subtitle: 'شبکه تجارت صادرات و واردات',
          desc: 'به شبکه ای از تجار بین المللی متصل شوید و محصولات خود را در بازارهای جدید عرضه کنید.',
          ctaText: 'درخواست همکاری',
          ctaTo: '/contact',
          bg: 'from-slate-900 via-blue-900 to-slate-800',
        },
        {
          title: 'GLOBAL TRADE GATEWAY',
          subtitle: 'دروازه تجارت بین الملل',
          desc: 'فرآیند پیچیده تجارت خارجی را ساده کنید؛ از تامین تا فروش در یک پنل یکپارچه.',
          ctaText: 'مشاهده کاتالوگ',
          ctaTo: '/catalog',
          bg: 'from-zinc-900 via-slate-800 to-zinc-900',
        },
        {
          title: 'EXPORT & IMPORT TERMINAL',
          subtitle: 'ترمینال صادرات و واردات',
          desc: 'اطمینان در معامله، تحلیل بازار و دسترسی به فرصت های تجاری با پشتیبانی تخصصی.',
          ctaText: 'عضویت رایگان',
          ctaTo: '/auth/register',
          bg: 'from-slate-800 via-cyan-900 to-slate-700',
        },
      ] as const,
      heroProductsCta: 'مشاهده کالاها',
      introTitle: 'انجمن صنفی کارفرمایی صادرکنندگان و واردکنندگان',
      introText: 'ما یک پلتفرم یکپارچه برای تسهیل صادرات و واردات هستیم. با اتصال تامین کنندگان، تولیدکنندگان و خریداران، فرآیندهای پیچیده تجارت بین الملل را ساده و قابل مدیریت می کنیم.',
      introMore: 'بیشتر درباره ما',
      whyTitle: 'چرا ما را انتخاب کنید؟',
      whyItems: [
        { title: 'بینش لحظه ای بازار', desc: 'به داده های ارزشمند بازار دسترسی داشته باشید و دقیق تصمیم بگیرید.' },
        { title: 'پشتیبانی تخصصی', desc: 'تیم کارشناسی ما در هر مرحله از معامله همراه شماست.' },
        { title: 'دسترسی جهانی', desc: 'به بازارهای بین المللی و شرکای تجاری جدید متصل شوید.' },
      ],
      terminalTitle: 'ترمینال صادرات و واردات',
      categoriesTitle: 'دسته بندی های کلیدی تجارت',
      categories: [
        { title: 'پتروشیمی', icon: '🛢️', to: '/catalog' },
        { title: 'انرژی', icon: '⚡', to: '/catalog' },
        { title: 'کشاورزی', icon: '🌿', to: '/catalog' },
        { title: 'صنعت', icon: '🏭', to: '/catalog' },
        { title: 'تکنولوژی', icon: '🧠', to: '/catalog' },
        { title: 'غذایی', icon: '🍽️', to: '/catalog' },
      ],
      latestProducts: 'جدیدترین محصولات',
      viewAll: 'مشاهده همه',
      emptyProducts: 'محصولی برای نمایش وجود ندارد.',
      productNoDesc: 'توضیحات محصول ثبت نشده است.',
      productDetails: 'مشاهده جزئیات',
      latestNews: 'آخرین اخبار و مقالات',
      allNews: 'همه اخبار',
      emptyNews: 'خبری برای نمایش وجود ندارد.',
      newsNoSummary: 'خلاصه خبر ثبت نشده است.',
      newsletterDesc: 'آخرین تحلیل های بازار و اخبار تجارت را دریافت کنید.',
      subscribeBtn: 'عضویت',
      footer: {
        about: 'درباره ما',
        aboutDesc: 'انجمن صنفی کارفرمایی صادرکنندگان و واردکنندگان کالا و خدمات، به عنوان مرجع تسهیل تجارت، فرآیندهای بین المللی را برای کسب وکارها ساده می کند.',
        goods: 'کالاها',
        services: 'خدمات',
        contact: 'تماس',
        goodsItems: ['کالاهای پتروشیمی', 'صنایع غذایی', 'تجهیزات صنعتی'],
        serviceItems: ['مشاوره بازرگانی', 'اخبار و رویدادها', 'درخواست همکاری'],
        city: 'تهران، ایران',
      },
    },
    en: {
      topStripTitle: 'Your One-Stop Trade Hub',
      topStripDesc: 'Effortless import and export for your supply chain needs',
      supportBadge: '24/7 Support',
      verifyBadge: 'B2B Verified',
      ctaRequest: 'Request Quote',
      nav: { home: 'Home', about: 'About', products: 'Products', news: 'News', contact: 'Contact' },
      heroSlides: [
        {
          title: 'EXPORTERS & IMPORTERS ASSOCIATION',
          subtitle: 'Export and Import Trade Network',
          desc: 'Connect with international traders and present your products in new markets with confidence.',
          ctaText: 'Partnership Request',
          ctaTo: '/contact',
          bg: 'from-slate-900 via-blue-900 to-slate-800',
        },
        {
          title: 'GLOBAL TRADE GATEWAY',
          subtitle: 'Your International Commerce Gateway',
          desc: 'Simplify complex cross-border commerce from sourcing to sales in one integrated experience.',
          ctaText: 'View Catalog',
          ctaTo: '/catalog',
          bg: 'from-zinc-900 via-slate-800 to-zinc-900',
        },
        {
          title: 'EXPORT & IMPORT TERMINAL',
          subtitle: 'Reliable Trade Operations',
          desc: 'Operate with confidence through market insights, partner matching, and professional support.',
          ctaText: 'Create Account',
          ctaTo: '/auth/register',
          bg: 'from-slate-800 via-cyan-900 to-slate-700',
        },
      ] as const,
      heroProductsCta: 'Browse Products',
      introTitle: 'Employers Association of Exporters and Importers',
      introText: 'We provide an integrated platform for export and import. By connecting suppliers, producers, and buyers, we make international trade workflows simpler and more manageable.',
      introMore: 'Learn More',
      whyTitle: 'Why Choose Us?',
      whyItems: [
        { title: 'Real-Time Market Insight', desc: 'Access valuable market signals to make data-backed decisions.' },
        { title: 'Expert Support', desc: 'Our specialists assist your team through every stage of each transaction.' },
        { title: 'Global Access', desc: 'Expand into international markets and discover new business partners.' },
      ],
      terminalTitle: 'The Terminal of Export and Import',
      categoriesTitle: 'Key Trade Categories',
      categories: [
        { title: 'Petrochemical', icon: '🛢️', to: '/catalog' },
        { title: 'Energy', icon: '⚡', to: '/catalog' },
        { title: 'Agriculture', icon: '🌿', to: '/catalog' },
        { title: 'Industry', icon: '🏭', to: '/catalog' },
        { title: 'Technology', icon: '🧠', to: '/catalog' },
        { title: 'Food', icon: '🍽️', to: '/catalog' },
      ],
      latestProducts: 'Latest Products',
      viewAll: 'View All',
      emptyProducts: 'No products available yet.',
      productNoDesc: 'No product description provided.',
      productDetails: 'View details',
      latestNews: 'Latest News & Insights',
      allNews: 'All News',
      emptyNews: 'No news available yet.',
      newsNoSummary: 'No summary available for this article.',
      newsletterDesc: 'Get market insights and trade updates in your inbox.',
      subscribeBtn: 'Subscribe',
      footer: {
        about: 'About',
        aboutDesc: 'The Employers Association of Exporters and Importers simplifies global trade operations for businesses.',
        goods: 'Products',
        services: 'Services',
        contact: 'Contact',
        goodsItems: ['Petrochemical Products', 'Food Products', 'Industrial Equipment'],
        serviceItems: ['Commercial Consulting', 'News and Events', 'Partnership Request'],
        city: 'Tehran, Iran',
      },
    },
    ar: {
      topStripTitle: 'محطتك الشاملة للتجارة',
      topStripDesc: 'حل متكامل لعمليات الاستيراد والتصدير وسلسلة الإمداد',
      supportBadge: 'دعم 24/7',
      verifyBadge: 'شبكة B2B موثقة',
      ctaRequest: 'طلب عرض سعر',
      nav: { home: 'الرئيسية', about: 'من نحن', products: 'المنتجات', news: 'الأخبار', contact: 'تواصل معنا' },
      heroSlides: [
        {
          title: 'جمعية المصدرين والمستوردين',
          subtitle: 'شبكة تجارة الاستيراد والتصدير',
          desc: 'اتصل بالتجار الدوليين واعرض منتجاتك في أسواق جديدة بثقة عالية.',
          ctaText: 'طلب شراكة',
          ctaTo: '/contact',
          bg: 'from-slate-900 via-blue-900 to-slate-800',
        },
        {
          title: 'GLOBAL TRADE GATEWAY',
          subtitle: 'بوابتك إلى التجارة الدولية',
          desc: 'بسّط العمليات التجارية المعقدة من التوريد حتى البيع ضمن منصة واحدة.',
          ctaText: 'عرض الكتالوج',
          ctaTo: '/catalog',
          bg: 'from-zinc-900 via-slate-800 to-zinc-900',
        },
        {
          title: 'EXPORT & IMPORT TERMINAL',
          subtitle: 'عمليات تجارية موثوقة',
          desc: 'اعمل بثقة عبر تحليلات السوق وربط الشركاء ودعم خبراء التجارة.',
          ctaText: 'إنشاء حساب',
          ctaTo: '/auth/register',
          bg: 'from-slate-800 via-cyan-900 to-slate-700',
        },
      ] as const,
      heroProductsCta: 'تصفح المنتجات',
      introTitle: 'جمعية أصحاب العمل للمصدرين والمستوردين',
      introText: 'نقدم منصة متكاملة لتسهيل التصدير والاستيراد. من خلال ربط الموردين والمنتجين والمشترين، نجعل مسارات التجارة الدولية أكثر بساطة وكفاءة.',
      introMore: 'المزيد عنا',
      whyTitle: 'لماذا نحن؟',
      whyItems: [
        { title: 'رؤية سوقية لحظية', desc: 'احصل على مؤشرات سوقية دقيقة لاتخاذ قرارات أفضل.' },
        { title: 'دعم احترافي', desc: 'فريقنا المتخصص يرافقك في جميع مراحل الصفقة.' },
        { title: 'وصول عالمي', desc: 'وسع أعمالك إلى أسواق دولية واعثر على شركاء جدد.' },
      ],
      terminalTitle: 'محطة التصدير والاستيراد',
      categoriesTitle: 'الفئات التجارية الرئيسية',
      categories: [
        { title: 'بتروكيماويات', icon: '🛢️', to: '/catalog' },
        { title: 'طاقة', icon: '⚡', to: '/catalog' },
        { title: 'زراعة', icon: '🌿', to: '/catalog' },
        { title: 'صناعة', icon: '🏭', to: '/catalog' },
        { title: 'تقنية', icon: '🧠', to: '/catalog' },
        { title: 'غذاء', icon: '🍽️', to: '/catalog' },
      ],
      latestProducts: 'أحدث المنتجات',
      viewAll: 'عرض الكل',
      emptyProducts: 'لا توجد منتجات للعرض.',
      productNoDesc: 'لا يوجد وصف لهذا المنتج.',
      productDetails: 'عرض التفاصيل',
      latestNews: 'آخر الأخبار والمقالات',
      allNews: 'كل الأخبار',
      emptyNews: 'لا توجد أخبار للعرض.',
      newsNoSummary: 'لا يوجد ملخص لهذا الخبر.',
      newsletterDesc: 'احصل على تحديثات السوق والتجارة عبر البريد الإلكتروني.',
      subscribeBtn: 'اشتراك',
      footer: {
        about: 'من نحن',
        aboutDesc: 'جمعية أصحاب العمل للمصدرين والمستوردين تسهّل عمليات التجارة الدولية للشركات.',
        goods: 'المنتجات',
        services: 'الخدمات',
        contact: 'التواصل',
        goodsItems: ['منتجات بتروكيماوية', 'منتجات غذائية', 'معدات صناعية'],
        serviceItems: ['استشارات تجارية', 'الأخبار والفعاليات', 'طلب شراكة'],
        city: 'طهران، إيران',
      },
    },
  } as const;

  const content = pageCopy[language];
  const officialBrandNameFa = 'انجمن صنفی کارفرمایی صادرکنندگان و واردکنندگان کالا و خدمات';
  const officialBrandNameByLanguage = {
    fa: 'انجمن صنفی کارفرمایی صادرکنندگان و واردکنندگان کالا و خدمات',
    en: 'Employers Association of Exporters and Importers of Goods and Services',
    ar: 'جمعية أصحاب العمل للمصدرين والمستوردين للسلع والخدمات',
  } as const;

  const heroSlides = content.heroSlides;
  const categories = content.categories;
  const prevArrow = isRtl ? '›' : '‹';
  const nextArrow = isRtl ? '‹' : '›';

  const currentSlide = heroSlides[heroIndex] ?? heroSlides[0];
  const latestNews = (news.data ?? []) as Array<{ id: string; title: string; summary: string | null }>;

  useEffect(() => {
    if (isHeroPaused || heroSlides.length <= 1) return;

    const intervalId = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 6500);

    return () => window.clearInterval(intervalId);
  }, [isHeroPaused, heroSlides.length]);

  const goToPrevSlide = () => {
    setHeroIndex((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  };

  const goToNextSlide = () => {
    setHeroIndex((prev) => (prev + 1) % heroSlides.length);
  };

  const localizedProductName = (nameFa: string, nameEn?: string | null) => {
    if (language === 'en') return nameEn || nameFa;
    return nameFa;
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_30%)]">
      {/* Top Header */}
      <header className="bg-white border-b border-border shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
        <div className="bg-slate-900 text-slate-100 text-[11px]">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
            <p className="tracking-wide">{content.topStripTitle}</p>
            <p className="hidden sm:block text-slate-300">{content.topStripDesc}</p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <img
              src="/brand/logo_without_persian_words.png"
              alt={officialBrandNameFa}
              className="h-16 sm:h-20 w-auto rounded-md border border-slate-200 bg-white object-contain p-1"
            />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground leading-5 line-clamp-2">
                {officialBrandNameFa}
              </p>
              <p className="text-[11px] text-slate-500 leading-none mt-1 line-clamp-1">
                {officialBrandNameByLanguage[language]}
              </p>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-3 text-xs">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold">{content.supportBadge}</span>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">{content.verifyBadge}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <LanguageSwitcher />
            <Button variant="ghost" asChild><Link to="/auth/login">{t('auth.login')}</Link></Button>
            <Button asChild><Link to="/contact">{content.ctaRequest}</Link></Button>
          </div>
        </div>
        <nav className="border-t border-border bg-white">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-4 text-sm">
            <Link to="/" className="font-medium hover:text-[var(--brand)]">{content.nav.home}</Link>
            <Link to="/about" className="font-medium hover:text-[var(--brand)]">{content.nav.about}</Link>
            <Link to="/catalog" className="font-medium hover:text-[var(--brand)]">{content.nav.products}</Link>
            <Link to="/news" className="font-medium hover:text-[var(--brand)]">{content.nav.news}</Link>
            <Link to="/contact" className="font-medium hover:text-[var(--brand)]">{content.nav.contact}</Link>
          </div>
        </nav>
      </header>

      {/* Hero Slider */}
      <section
        className={`relative overflow-hidden bg-gradient-to-r ${currentSlide.bg}`}
        onMouseEnter={() => setIsHeroPaused(true)}
        onMouseLeave={() => setIsHeroPaused(false)}
      >
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.5),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(125,211,252,0.5),transparent_35%)]" />
        <div className="max-w-6xl mx-auto px-4 py-24 lg:py-28 text-center text-white relative z-10">
          <p className="text-xs tracking-[0.18em] opacity-80 mb-3">TERMINAL OF EXPORT AND IMPORT</p>
          <h1 className="text-4xl lg:text-6xl font-black mb-4 drop-shadow-sm">{currentSlide.title}</h1>
          <h2 className="text-xl lg:text-2xl font-bold opacity-95 mb-4">{currentSlide.subtitle}</h2>
          <p className="max-w-3xl mx-auto text-sm lg:text-base opacity-90 mb-8">{currentSlide.desc}</p>
          <div className="flex items-center justify-center gap-3">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-white/90" asChild>
              <Link to={currentSlide.ctaTo}>{currentSlide.ctaText}</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/70 text-white hover:bg-white/10" asChild>
              <Link to="/catalog">{content.heroProductsCta}</Link>
            </Button>
          </div>
        </div>
        <button
          type="button"
          className={`absolute z-20 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/15 border border-white/35 text-white hover:bg-white/25 backdrop-blur-sm transition ${isRtl ? 'right-3 lg:right-5' : 'left-3 lg:left-5'}`}
          onClick={goToPrevSlide}
          aria-label="hero-prev"
        >
          {prevArrow}
        </button>
        <button
          type="button"
          className={`absolute z-20 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/15 border border-white/35 text-white hover:bg-white/25 backdrop-blur-sm transition ${isRtl ? 'left-3 lg:left-5' : 'right-3 lg:right-5'}`}
          onClick={goToNextSlide}
          aria-label="hero-next"
        >
          {nextArrow}
        </button>
        <div className="absolute left-0 right-0 bottom-4 flex justify-center gap-2">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              className={`h-2.5 rounded-full transition-all ${heroIndex === idx ? 'w-8 bg-white' : 'w-2.5 bg-white/50'}`}
              onClick={() => setHeroIndex(idx)}
              aria-label={`slide-${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Intro + Why */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div>
              <h3 className="text-2xl font-black text-foreground mb-4">{content.introTitle}</h3>
              <div className="rounded-2xl overflow-hidden border border-border mb-5 h-64 bg-gradient-to-br from-blue-100 to-slate-200 flex items-center justify-center">
                <span className="text-7xl">🌍</span>
              </div>
              <p className="text-muted-foreground leading-8 text-sm">
                {content.introText}
              </p>
              <Button className="mt-5" asChild><Link to="/about">{content.introMore}</Link></Button>
            </div>
            <div>
              <h3 className="text-2xl font-black text-foreground mb-4">{content.whyTitle}</h3>
              <div className="space-y-4">
                {content.whyItems.map((item) => (
                  <div key={item.title} className="rounded-xl border border-border bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_100%)] p-5 hover:shadow-sm transition-shadow">
                    <h4 className="font-bold text-foreground mb-2">{item.title}</h4>
                    <p className="text-sm text-muted-foreground leading-7">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Terminal Banner */}
      <section className="py-14 bg-slate-900 text-white text-center">
        <div className="max-w-5xl mx-auto px-4">
          <p className="tracking-[0.03em] text-xs text-slate-300">{officialBrandNameFa}</p>
          <h2 className="text-3xl lg:text-4xl font-black mt-2">{content.terminalTitle}</h2>
        </div>
      </section>

      {/* Categories */}
      <section className="py-14 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-7">
            <p className="text-xs tracking-[0.16em] text-muted-foreground">EXPLORE BY SECTOR</p>
            <h3 className="text-2xl font-black text-foreground mt-2">{content.categoriesTitle}</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((c) => (
              <Link key={c.title} to={c.to} className="group rounded-xl border border-border bg-white p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">{c.icon}</div>
                <h4 className="font-semibold text-sm text-foreground">{c.title}</h4>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Products */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black text-foreground">{content.latestProducts}</h3>
            <Button variant="outline" asChild><Link to="/catalog">{content.viewAll}</Link></Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {(products.data?.data ?? []).map((p) => (
              <Link key={p.id} to="/catalog/$productId" params={{ productId: p.id }} className="group block">
                <Card className="h-full overflow-hidden border-border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                  <div className="h-44 bg-gradient-to-br from-blue-50 via-slate-100 to-cyan-50 flex items-center justify-center">
                    <span className="text-4xl">📦</span>
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-bold text-sm text-foreground line-clamp-2 min-h-[2.5rem]">{localizedProductName(p.nameFa, p.nameEn)}</h4>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.description ?? content.productNoDesc}</p>
                    <p className="text-xs text-[var(--brand)] mt-3 font-semibold">{content.productDetails}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {!products.isLoading && (products.data?.data?.length ?? 0) === 0 && (
              <div className="col-span-full text-center text-sm text-muted-foreground py-6">{content.emptyProducts}</div>
            )}
          </div>
        </div>
      </section>

      {/* Latest Blog */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black text-foreground">{content.latestNews}</h3>
            <Button variant="outline" asChild><Link to="/news">{content.allNews}</Link></Button>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {latestNews.map((n) => (
              <Link key={n.id} to="/news/$newsId" params={{ newsId: n.id }} className="block">
                <Card className="h-full border-border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="h-40 bg-gradient-to-br from-zinc-200 via-zinc-100 to-slate-200" />
                  <CardContent className="p-4">
                    <h4 className="font-bold text-sm text-foreground line-clamp-2 min-h-[2.5rem]">{n.title}</h4>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{n.summary ?? content.newsNoSummary}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {!news.isLoading && (news.data?.length ?? 0) === 0 && (
              <div className="col-span-full text-center text-sm text-muted-foreground py-6">{content.emptyNews}</div>
            )}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-14 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Badge className="mb-3">For Any Question We Are Available For You</Badge>
          <h2 className="text-2xl font-black text-foreground mb-2">{t('newsletter.subscribe')}</h2>
          <p className="text-muted-foreground mb-6 text-sm">{content.newsletterDesc}</p>
          <div className="flex gap-2 max-w-lg mx-auto">
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
              {subscribe.isPending ? '...' : content.subscribeBtn}
            </Button>
          </div>
          {nlMsg && (
            <p className="text-sm mt-3 text-green-600">{nlMsg}</p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-200 py-12">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-4 gap-8 text-sm">
          <div>
            <h4 className="font-bold text-white mb-3">{content.footer.about}</h4>
            <p className="text-slate-300 leading-7 text-xs">
              {content.footer.aboutDesc}
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-3">{content.footer.goods}</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><Link to="/catalog" className="hover:text-white">{content.footer.goodsItems[0]}</Link></li>
              <li><Link to="/catalog" className="hover:text-white">{content.footer.goodsItems[1]}</Link></li>
              <li><Link to="/catalog" className="hover:text-white">{content.footer.goodsItems[2]}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-3">{content.footer.services}</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><Link to="/contact" className="hover:text-white">{content.footer.serviceItems[0]}</Link></li>
              <li><Link to="/news" className="hover:text-white">{content.footer.serviceItems[1]}</Link></li>
              <li><Link to="/contact" className="hover:text-white">{content.footer.serviceItems[2]}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-3">{content.footer.contact}</h4>
            <p className="text-xs text-slate-300 leading-7">{content.footer.city}</p>
            <p className="text-xs text-slate-300">+98 21 0000 0000</p>
            <p className="text-xs text-slate-300">contact@eikhs.ir</p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-8 pt-5 border-t border-slate-700 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} {officialBrandNameFa}
        </div>
      </footer>
    </div>
  );
}
