import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  Apple,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Factory,
  Facebook,
  FlaskConical,
  Gift,
  HousePlus,
  Leaf,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Shirt,
  Stethoscope,
  Zap,
} from 'lucide-react';
import { Button } from '../components/ui/button.js';
import { trpc } from '../trpc.js';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher.js';
import { AiFabChat } from '../components/ai-fab-chat.js';
import { useAuthStore } from '../store/auth.store.js';

export const Route = createFileRoute('/')({
  component: HomePage,
});

type Language = 'fa' | 'en' | 'ar';

type ProductCard = {
  id: string;
  nameFa: string;
  nameEn?: string | null;
  description?: string | null;
  media?: Array<{ fileKey: string }>;
};

type NewsCard = {
  id: string;
  title: string;
  summary: string | null;
  imageKey: string | null;
};

export function HomePage() {
  const { t, i18n } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const normalizedLanguage = (i18n.resolvedLanguage ?? i18n.language ?? 'fa').split('-')[0];
  const language = (normalizedLanguage === 'en' || normalizedLanguage === 'ar' ? normalizedLanguage : 'fa') as Language;
  const isRtl = language !== 'en';

  const [heroIndex, setHeroIndex] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);

  const products = trpc.product.list.useQuery({
    page: 1,
    limit: 4,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const news = trpc.news.list.useQuery({
    page: 1,
    limit: 3,
  });

  const pageCopy = {
    fa: {
      topStripTitle: 'دروازه تجارت و صادرات و واردات',
      topStripDesc: 'راهکار یکپارچه برای تجارت بین الملل و زنجیره تامین',
      ctaRequest: 'درخواست قیمت',
      nav: { home: 'خانه', about: 'درباره', products: 'کالاها', services: 'خدمات', news: 'اخبار', contact: 'ارتباط' },
      heroSlides: [
        {
          title: 'مرجع تجارت بین الملل',
          subtitle: 'شبکه مطمئن صادرکنندگان و واردکنندگان',
          desc: 'سبد محصولات خود را با تنوع جهانی گسترش دهید و به بازارهای جدید دسترسی پیدا کنید.',
          ctaText: 'راهکار ما',
          ctaTo: '/about',
          bgImage:
            'radial-gradient(circle at 52% 56%, rgba(255, 217, 99, 0.88), rgba(245, 132, 31, 0.54) 30%, rgba(19, 19, 19, 0.9) 72%), linear-gradient(180deg, rgba(197, 99, 10, 0.68), rgba(9, 18, 33, 0.85))',
        },
        {
          title: 'دروازه هوشمند تجارت',
          subtitle: 'اتصال تولیدکنندگان، تامین کنندگان و خریداران',
          desc: 'از کشف بازار تا مذاکره و تامین، همه مراحل را در یک پلتفرم یکپارچه انجام دهید.',
          ctaText: 'کاتالوگ',
          ctaTo: '/catalog',
          bgImage:
            'radial-gradient(circle at 50% 42%, rgba(250, 181, 60, 0.88), rgba(199, 82, 19, 0.48) 31%, rgba(20, 20, 20, 0.88) 72%), linear-gradient(180deg, rgba(161, 81, 12, 0.75), rgba(15, 23, 42, 0.85))',
        },
        {
          title: 'THE TERMINAL OF EXPORT & IMPORT',
          subtitle: 'پشتیبانی تخصصی در معاملات خارجی',
          desc: 'داده بازار، شبکه همکاران تجاری و خدمات مشاوره ای برای تصمیم گیری دقیق.',
          ctaText: 'تماس با ما',
          ctaTo: '/contact',
          bgImage:
            'radial-gradient(circle at 54% 58%, rgba(239, 202, 112, 0.85), rgba(193, 91, 27, 0.46) 28%, rgba(17, 17, 17, 0.9) 70%), linear-gradient(180deg, rgba(185, 98, 22, 0.72), rgba(18, 24, 38, 0.85))',
        },
      ] as const,
      introTitle: 'قطب یکپارچه تجارت بین الملل',
      introText:
        'ما با اتصال فعالان زنجیره تامین، مسیر صادرات و واردات را سریع تر، شفاف تر و قابل اطمینان تر می کنیم. از تحلیل بازار تا هماهنگی تامین و فروش، در کنار کسب وکار شما هستیم.',
      introMore: 'درباره ما',
      whyTitle: 'چرا ما را انتخاب کنید؟',
      whyItems: [
        { title: 'بینش لحظه ای', desc: 'به داده های ارزشمند بازار دسترسی پیدا کنید و تصمیم های دقیق بگیرید.' },
        { title: 'پشتیبانی تخصصی', desc: 'تیم حرفه ای ما در تمام مراحل معامله کنار شماست.' },
        { title: 'دسترسی جهانی', desc: 'با شرکای بین المللی ارتباط بگیرید و بازارهای جدید را فتح کنید.' },
      ],
      terminalHead: 'ترمینال صادرات و واردات',
      terminalSub: 'THE TERMINAL OF EXPORT AND IMPORT',
      categoryTitles: {
        petrochemical: 'پتروشیمی',
        energy: 'انرژی',
        agriculture: 'کشاورزی',
        industry: 'صنعت',
        technology: 'تکنولوژی',
        medicine: 'دارو و سلامت',
        handicrafts: 'صنایع دستی',
        construction: 'ساختمان و خانه',
        textile: 'پوشاک',
        food: 'غذایی',
      },
      latestProducts: 'جدیدترین محصولات',
      latestNews: 'آخرین مقالات',
      emptyProducts: 'محصولی برای نمایش وجود ندارد.',
      emptyNews: 'مقاله ای برای نمایش وجود ندارد.',
      readMore: 'بیشتر',
      contactStrip: 'برای هر سوالی',
      contactStripBold: 'در کنار شما هستیم',
      contactStripBtn: 'تماس',
      footer: {
        office: 'آدرس دفتر',
        mobile: 'تلفن',
        email: 'ایمیل',
        about: 'درباره ما',
        aboutDesc:
          'انجمن صنفی کارفرمایی صادرکنندگان و واردکنندگان کالا و خدمات، مسیر توسعه تجارت خارجی را برای کسب وکارها ساده و حرفه ای می کند.',
        supplies: 'کالاها',
        services: 'خدمات',
        follow: 'شبکه های اجتماعی',
        city: 'تهران، ایران',
        serviceItems: ['مشاوره بازرگانی', 'اخبار و رویدادها', 'درخواست همکاری'],
        defaultSupplies: ['محصولات پتروشیمی', 'محصولات غذایی', 'تجهیزات صنعتی'],
      },
    },
    en: {
      topStripTitle: 'Your One-Stop Trade Hub',
      topStripDesc: 'Effortless import and export for your global supply chain',
      ctaRequest: 'Request a Quote',
      nav: { home: 'Home', about: 'About', products: 'Supplies', services: 'Services', news: 'News & Events', contact: 'Contact' },
      heroSlides: [
        {
          title: 'Trade Hub for Global Markets',
          subtitle: 'Enrich Your Product Portfolio with Global Diversity',
          desc: 'Connect with reliable partners and unlock new import-export opportunities.',
          ctaText: 'Our Solution',
          ctaTo: '/about',
          bgImage:
            'radial-gradient(circle at 52% 56%, rgba(255, 217, 99, 0.88), rgba(245, 132, 31, 0.54) 30%, rgba(19, 19, 19, 0.9) 72%), linear-gradient(180deg, rgba(197, 99, 10, 0.68), rgba(9, 18, 33, 0.85))',
        },
        {
          title: 'International Commerce Gateway',
          subtitle: 'One trusted platform for procurement and sales',
          desc: 'Simplify cross-border workflows from sourcing to negotiation and delivery.',
          ctaText: 'View Catalog',
          ctaTo: '/catalog',
          bgImage:
            'radial-gradient(circle at 50% 42%, rgba(250, 181, 60, 0.88), rgba(199, 82, 19, 0.48) 31%, rgba(20, 20, 20, 0.88) 72%), linear-gradient(180deg, rgba(161, 81, 12, 0.75), rgba(15, 23, 42, 0.85))',
        },
        {
          title: 'Reliable Export & Import Terminal',
          subtitle: 'Operate with confidence through expert support',
          desc: 'Get market insight, partner matching, and operational assistance in every deal.',
          ctaText: 'Contact Us',
          ctaTo: '/contact',
          bgImage:
            'radial-gradient(circle at 54% 58%, rgba(239, 202, 112, 0.85), rgba(193, 91, 27, 0.46) 28%, rgba(17, 17, 17, 0.9) 70%), linear-gradient(180deg, rgba(185, 98, 22, 0.72), rgba(18, 24, 38, 0.85))',
        },
      ] as const,
      introTitle: 'Integrated Trade Hub',
      introText:
        'We streamline international trade by connecting suppliers, exporters, importers, and buyers in one operational ecosystem. Make faster and safer decisions with structured market workflows.',
      introMore: 'About Us',
      whyTitle: 'Why Choose Us?',
      whyItems: [
        { title: 'Real-Time Insights', desc: 'Access valuable market data and make informed decisions.' },
        { title: 'Expert Support', desc: 'Our dedicated team is here to guide you every step of the way.' },
        { title: 'Global Reach', desc: 'Connect with international partners and access new markets.' },
      ],
      terminalHead: 'TERMINAL OF EXPORT & IMPORT',
      terminalSub: 'THE TERMINAL OF EXPORT AND IMPORT',
      categoryTitles: {
        petrochemical: 'Petrochemicals',
        energy: 'Energy',
        agriculture: 'Agriculture',
        industry: 'Industry',
        technology: 'Technology',
        medicine: 'Medicine & Health',
        handicrafts: 'Handicrafts',
        construction: 'Construction & Home',
        textile: 'Clothing',
        food: 'Food',
      },
      latestProducts: 'Latest Products',
      latestNews: 'Latest Blog Posts',
      emptyProducts: 'No products available yet.',
      emptyNews: 'No blog posts available yet.',
      readMore: 'Read More',
      contactStrip: 'For Any Question We Are',
      contactStripBold: 'Available For You',
      contactStripBtn: 'Contact Us',
      footer: {
        office: 'Office Address',
        mobile: 'Phone',
        email: 'Email',
        about: 'About Us',
        aboutDesc:
          'The Employers Association of Exporters and Importers of Goods and Services simplifies global trade operations for businesses.',
        supplies: 'Supplies',
        services: 'Services',
        follow: 'Follow Us',
        city: 'Tehran, Iran',
        serviceItems: ['Commercial Consulting', 'News and Events', 'Partnership Requests'],
        defaultSupplies: ['Petrochemical Products', 'Food Products', 'Industrial Equipment'],
      },
    },
    ar: {
      topStripTitle: 'محطتك الشاملة للتجارة',
      topStripDesc: 'حل متكامل لعمليات الاستيراد والتصدير وسلسلة الإمداد',
      ctaRequest: 'طلب عرض سعر',
      nav: { home: 'الرئيسية', about: 'من نحن', products: 'المنتجات', services: 'الخدمات', news: 'الأخبار', contact: 'تواصل' },
      heroSlides: [
        {
          title: 'مركز التجارة للأسواق العالمية',
          subtitle: 'عزز محفظة منتجاتك بتنوع عالمي',
          desc: 'تواصل مع شركاء موثوقين وافتح فرصا جديدة في الاستيراد والتصدير.',
          ctaText: 'حلولنا',
          ctaTo: '/about',
          bgImage:
            'radial-gradient(circle at 52% 56%, rgba(255, 217, 99, 0.88), rgba(245, 132, 31, 0.54) 30%, rgba(19, 19, 19, 0.9) 72%), linear-gradient(180deg, rgba(197, 99, 10, 0.68), rgba(9, 18, 33, 0.85))',
        },
        {
          title: 'بوابة التجارة الدولية',
          subtitle: 'منصة موثوقة للتوريد والبيع',
          desc: 'بسّط العمليات العابرة للحدود من الشراء إلى التفاوض والتسليم.',
          ctaText: 'عرض الكتالوج',
          ctaTo: '/catalog',
          bgImage:
            'radial-gradient(circle at 50% 42%, rgba(250, 181, 60, 0.88), rgba(199, 82, 19, 0.48) 31%, rgba(20, 20, 20, 0.88) 72%), linear-gradient(180deg, rgba(161, 81, 12, 0.75), rgba(15, 23, 42, 0.85))',
        },
        {
          title: 'محطة تصدير واستيراد موثوقة',
          subtitle: 'اعمل بثقة عبر دعم متخصص',
          desc: 'تحليلات سوقية، ربط شركاء، ودعم تشغيلي في كل صفقة.',
          ctaText: 'اتصل بنا',
          ctaTo: '/contact',
          bgImage:
            'radial-gradient(circle at 54% 58%, rgba(239, 202, 112, 0.85), rgba(193, 91, 27, 0.46) 28%, rgba(17, 17, 17, 0.9) 70%), linear-gradient(180deg, rgba(185, 98, 22, 0.72), rgba(18, 24, 38, 0.85))',
        },
      ] as const,
      introTitle: 'مركز تجارة متكامل',
      introText:
        'نربط الموردين والمصدرين والمستوردين والمشترين ضمن منظومة واحدة لتبسيط التجارة الدولية وتسريع قرارات الأعمال.',
      introMore: 'من نحن',
      whyTitle: 'لماذا نحن؟',
      whyItems: [
        { title: 'رؤى فورية', desc: 'احصل على بيانات سوقية دقيقة لاتخاذ قرارات مدروسة.' },
        { title: 'دعم احترافي', desc: 'فريقنا المتخصص يرافقك في كل خطوة من الصفقة.' },
        { title: 'انتشار عالمي', desc: 'تواصل مع شركاء دوليين وادخل أسواقا جديدة.' },
      ],
      terminalHead: 'محطة التصدير والاستيراد',
      terminalSub: 'THE TERMINAL OF EXPORT AND IMPORT',
      categoryTitles: {
        petrochemical: 'بتروكيماويات',
        energy: 'طاقة',
        agriculture: 'زراعة',
        industry: 'صناعة',
        technology: 'تقنية',
        medicine: 'صحة ودواء',
        handicrafts: 'حرف يدوية',
        construction: 'بناء ومنزل',
        textile: 'ملابس',
        food: 'غذاء',
      },
      latestProducts: 'أحدث المنتجات',
      latestNews: 'أحدث المقالات',
      emptyProducts: 'لا توجد منتجات للعرض.',
      emptyNews: 'لا توجد مقالات للعرض.',
      readMore: 'اقرأ المزيد',
      contactStrip: 'لأي استفسار نحن',
      contactStripBold: 'متواجدون لخدمتك',
      contactStripBtn: 'تواصل',
      footer: {
        office: 'عنوان المكتب',
        mobile: 'الهاتف',
        email: 'البريد',
        about: 'من نحن',
        aboutDesc:
          'جمعية أصحاب العمل للمصدرين والمستوردين للسلع والخدمات تسهّل العمليات التجارية الدولية للشركات.',
        supplies: 'المنتجات',
        services: 'الخدمات',
        follow: 'تابعنا',
        city: 'طهران، إيران',
        serviceItems: ['استشارات تجارية', 'الأخبار والفعاليات', 'طلبات الشراكة'],
        defaultSupplies: ['منتجات بتروكيماوية', 'منتجات غذائية', 'معدات صناعية'],
      },
    },
  } as const;

  const content = pageCopy[language];
  const officialBrandNameFa = 'انجمن صنفی کارفرمایی صادرکنندگان و واردکنندگان کالا و خدمات';

  const productItems = (products.data?.data ?? []) as ProductCard[];
  const newsItems = (news.data?.items ?? []) as NewsCard[];

  const heroSlides = content.heroSlides;
  const currentSlide = heroSlides[heroIndex] ?? heroSlides[0];
  const heroSlideBackgroundClasses = [
    'bg-[radial-gradient(circle_at_52%_56%,rgba(255,217,99,0.88),rgba(245,132,31,0.54)_30%,rgba(19,19,19,0.9)_72%),linear-gradient(180deg,rgba(197,99,10,0.68),rgba(9,18,33,0.85))]',
    'bg-[radial-gradient(circle_at_50%_42%,rgba(250,181,60,0.88),rgba(199,82,19,0.48)_31%,rgba(20,20,20,0.88)_72%),linear-gradient(180deg,rgba(161,81,12,0.75),rgba(15,23,42,0.85))]',
    'bg-[radial-gradient(circle_at_54%_58%,rgba(239,202,112,0.85),rgba(193,91,27,0.46)_28%,rgba(17,17,17,0.9)_70%),linear-gradient(180deg,rgba(185,98,22,0.72),rgba(18,24,38,0.85))]',
  ] as const;
  const currentSlideBackgroundClass = heroSlideBackgroundClasses[heroIndex] ?? heroSlideBackgroundClasses[0];

  const prevArrow = <ChevronLeft className="h-5 w-5" />;
  const nextArrow = <ChevronRight className="h-5 w-5" />;

  useEffect(() => {
    if (isHeroPaused || heroSlides.length <= 1) return;

    const intervalId = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 6200);

    return () => window.clearInterval(intervalId);
  }, [isHeroPaused, heroSlides.length]);

  const localizedProductName = (nameFa: string, nameEn?: string | null) => {
    if (language === 'en') return nameEn || nameFa;
    return nameFa;
  };

  const leadImageSrc = productItems[0]?.media?.[0]?.fileKey ? `/api/media/${productItems[0].media[0].fileKey}` : null;

  const footerSupplies = productItems.length > 0
    ? productItems.slice(0, 6).map((item) => localizedProductName(item.nameFa, item.nameEn))
    : content.footer.defaultSupplies;

  const categoryTiles = [
    { key: 'petrochemical', to: '/catalog', icon: FlaskConical, color: 'bg-[#ec1c3d]' },
    { key: 'energy', to: '/catalog', icon: Zap, color: 'bg-[#d8a637]' },
    { key: 'agriculture', to: '/catalog', icon: Leaf, color: 'bg-[#4ba336]' },
    { key: 'industry', to: '/catalog', icon: Factory, color: 'bg-[#c61d3e]' },
    { key: 'technology', to: '/catalog', icon: Cpu, color: 'bg-[#ff3a27]' },
    { key: 'medicine', to: '/catalog', icon: Stethoscope, color: 'bg-[#35b5d8]' },
    { key: 'handicrafts', to: '/catalog', icon: Gift, color: 'bg-[#f2be06]' },
    { key: 'construction', to: '/catalog', icon: HousePlus, color: 'bg-[#a7174d]' },
    { key: 'textile', to: '/catalog', icon: Shirt, color: 'bg-[#fd6c2a]' },
    { key: 'food', to: '/catalog', icon: Apple, color: 'bg-[#dd0f73]' },
  ] as const;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="bg-[#e9e9e9] text-slate-900">
      <header className="bg-white shadow-sm">
        <div className="max-w-[1020px] mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <img
              src="/brand/logo_without_persian_words.png"
              alt={officialBrandNameFa}
              className="h-16 sm:h-20 w-auto object-contain"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 line-clamp-1">{content.topStripTitle}</p>
              <p className="text-xs text-slate-500 line-clamp-2">{content.topStripDesc}</p>
            </div>
          </Link>

          <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <LanguageSwitcher />
            <Button size="sm" asChild>
              <Link to="/auth/register" aria-label="register-cta">{t('auth.register')}</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth/login">{t('auth.login')}</Link>
            </Button>
            <div className="hidden md:flex items-center gap-1 text-slate-500">
              <a className="h-7 w-7 rounded-full border border-slate-300 flex items-center justify-center hover:text-slate-800" href="#" aria-label="facebook">
                <Facebook className="h-3.5 w-3.5" />
              </a>
              <a className="h-7 w-7 rounded-full border border-slate-300 flex items-center justify-center hover:text-slate-800" href="#" aria-label="linkedin">
                <Linkedin className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-[1020px] mx-auto px-4 relative z-30 -mb-7 sm:-mb-8">
          <div className="flex items-stretch overflow-hidden rounded-tl-lg rounded-tr-lg sm:rounded-tr-none shadow-[0_8px_20px_rgba(0,0,0,0.2)] bg-[linear-gradient(180deg,#1a8ec3_0%,#0f5f8f_25%,#0a3f67_68%,#082f4e_100%)] border border-[#0d4d75]">
            <nav className="flex-1 overflow-x-auto">
              <div className={`min-w-max flex ${isRtl ? 'justify-end' : ''}`}>
                <Link to="/" className="px-5 py-[14px] text-sm font-bold text-white uppercase tracking-wide border-x border-white/10 bg-[linear-gradient(180deg,rgba(5,31,54,0.4),rgba(3,18,33,0.68))]">{content.nav.home}</Link>
                <Link to="/about" className="px-5 py-[14px] text-sm font-semibold text-white uppercase tracking-wide border-r border-white/10 hover:bg-white/10 transition-colors">{content.nav.about}</Link>
                <Link to="/catalog" className="px-5 py-[14px] text-sm font-semibold text-white uppercase tracking-wide border-r border-white/10 hover:bg-white/10 transition-colors">{content.nav.products}</Link>
                <Link to="/contact" className="px-5 py-[14px] text-sm font-semibold text-white uppercase tracking-wide border-r border-white/10 hover:bg-white/10 transition-colors">{content.nav.services}</Link>
                <Link to="/news" className="px-5 py-[14px] text-sm font-semibold text-white uppercase tracking-wide border-r border-white/10 hover:bg-white/10 transition-colors">{content.nav.news}</Link>
                <Link to="/contact" className="px-5 py-[14px] text-sm font-semibold text-white uppercase tracking-wide border-r border-white/10 hover:bg-white/10 transition-colors">{content.nav.contact}</Link>
              </div>
            </nav>
            <Link to="/contact" className="shrink-0 bg-[#f5861f] hover:bg-[#ea760f] text-white px-8 py-[14px] text-sm font-bold uppercase tracking-wide border-l border-[#d86d10]">
              {content.ctaRequest}
            </Link>
          </div>
        </div>
      </header>

      <section
        className="relative min-h-[430px] sm:min-h-[500px] overflow-hidden"
        onMouseEnter={() => setIsHeroPaused(true)}
        onMouseLeave={() => setIsHeroPaused(false)}
      >
        <div className={`absolute inset-0 ${currentSlideBackgroundClass}`} />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 max-w-[1020px] mx-auto px-4 min-h-[430px] sm:min-h-[500px] flex items-center justify-center text-center text-white">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-black drop-shadow-sm">{currentSlide.title}</h1>
            <p className="text-xl sm:text-3xl mt-4 text-white/95">{currentSlide.subtitle}</p>
            <p className="mt-6 text-sm sm:text-base text-white/90 max-w-2xl mx-auto">{currentSlide.desc}</p>
            <Link
              to={currentSlide.ctaTo}
              className="inline-block mt-7 bg-[#f5861f] hover:bg-[#ec7410] text-white px-8 py-3 text-sm font-bold uppercase tracking-wide"
            >
              {currentSlide.ctaText}
            </Link>
          </div>
        </div>

        <button
          type="button"
          className="absolute top-1/2 left-4 -translate-y-1/2 z-20 h-11 w-11 bg-black/25 hover:bg-black/40 text-white flex items-center justify-center transition"
          onClick={() => setHeroIndex((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1))}
          aria-label="hero-prev"
        >
          {prevArrow}
        </button>
        <button
          type="button"
          className="absolute top-1/2 right-4 -translate-y-1/2 z-20 h-11 w-11 bg-black/25 hover:bg-black/40 text-white flex items-center justify-center transition"
          onClick={() => setHeroIndex((prev) => (prev + 1) % heroSlides.length)}
          aria-label="hero-next"
        >
          {nextArrow}
        </button>
      </section>

      <section className="py-16 bg-[radial-gradient(#dcdcdc_0.6px,transparent_0.6px)] [background-size:6px_6px] bg-[#f0f0f0]">
        <div className="max-w-[1020px] mx-auto px-4 grid lg:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tight text-slate-800 mb-6">{content.introTitle}</h2>
            <div className="h-48 w-full border border-slate-300 bg-white mb-6 overflow-hidden">
              {leadImageSrc ? (
                <img src={leadImageSrc} alt={content.introTitle} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-[linear-gradient(135deg,#72b2d9_0%,#3e4a69_60%,#1f2335_100%)] flex items-center justify-center text-white font-semibold">
                  TRADE TERMINAL
                </div>
              )}
            </div>
            <p className="text-sm leading-8 text-slate-700">{content.introText}</p>
            <Link to="/about" className="inline-block mt-6 border border-slate-300 bg-white hover:bg-slate-50 px-8 py-3 text-xs font-bold uppercase tracking-wide">
              {content.introMore}
            </Link>
          </div>

          <div>
            <h3 className="text-4xl font-black uppercase tracking-tight text-slate-800 mb-6">{content.whyTitle}</h3>
            <div className="space-y-4">
              <article className="border border-[#e9c22a] bg-[#fee88f] rounded-lg px-5 py-5 shadow-sm">
                <h4 className="text-lg font-black uppercase mb-2 text-slate-800">{content.whyItems[0].title}</h4>
                <p className="text-sm text-slate-700">{content.whyItems[0].desc}</p>
              </article>
              <article className="border border-[#8dc4df] bg-[#a8d4e7] rounded-lg px-5 py-5 shadow-sm">
                <h4 className="text-lg font-black uppercase mb-2 text-slate-800">{content.whyItems[1].title}</h4>
                <p className="text-sm text-slate-700">{content.whyItems[1].desc}</p>
              </article>
              <article className="border border-[#d7e437] bg-[#e7f35f] rounded-lg px-5 py-5 shadow-sm">
                <h4 className="text-lg font-black uppercase mb-2 text-slate-800">{content.whyItems[2].title}</h4>
                <p className="text-sm text-slate-700">{content.whyItems[2].desc}</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-16 text-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,#4f648b_0%,#324560_45%,#28344c_100%)]" />
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative z-10 max-w-[1020px] mx-auto px-4">
          <h3 className="text-4xl font-black uppercase">{content.terminalHead}</h3>
          <p className="text-3xl mt-4 text-white/90">{content.terminalSub}</p>
        </div>
      </section>

      <section className="bg-[#001126] py-14">
        <div className="max-w-[1020px] mx-auto px-4">
          <div className="max-w-[760px] mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-0">
            {categoryTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <Link
                  key={tile.key}
                  to={tile.to}
                  className={`${tile.color} h-36 flex flex-col items-center justify-center text-white text-center p-3 hover:brightness-110 transition`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide leading-4 min-h-8">
                    {content.categoryTitles[tile.key]}
                  </p>
                  <Icon className="h-10 w-10 mt-2" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f4f4f4] py-14 shadow-[0_-12px_22px_rgba(0,0,0,0.15)]">
        <div className="max-w-[1020px] mx-auto px-4">
          <h3 className="text-3xl font-black uppercase text-slate-800">{content.latestProducts}</h3>
          {(productItems.length > 0) ? (
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-6 place-items-center">
              {productItems.map((p) => {
                const imageSrc = p.media?.[0]?.fileKey ? `/api/media/${p.media[0].fileKey}` : null;
                return (
                  <Link key={p.id} to="/catalog/$productId" params={{ productId: p.id }} className="group text-center">
                    <div className="h-40 w-40 bg-white border border-slate-300 overflow-hidden shadow-sm group-hover:shadow-md transition">
                      {imageSrc ? (
                        <img src={imageSrc} alt={localizedProductName(p.nameFa, p.nameEn)} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-4xl">📦</div>
                      )}
                    </div>
                    <p className="mt-3 text-xs font-semibold text-slate-700 max-w-40 line-clamp-2">{localizedProductName(p.nameFa, p.nameEn)}</p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="mt-8 text-sm text-slate-600">{content.emptyProducts}</p>
          )}
        </div>
      </section>

      <section className="bg-[#ececec] py-14 border-t border-slate-300 border-b border-slate-300">
        <div className="max-w-[1020px] mx-auto px-4">
          <h3 className="text-3xl font-black uppercase text-slate-800">{content.latestNews}</h3>

          {(newsItems.length > 0) ? (
            <div className="mt-8 grid md:grid-cols-3 gap-6">
              {newsItems.map((n) => {
                const imageSrc = n.imageKey ? `/api/media/${n.imageKey}` : null;
                return (
                  <Link key={n.id} to="/news/$newsId" params={{ newsId: n.id }} className="block group">
                    <div className="bg-white border border-slate-300 overflow-hidden">
                      <div className="h-44 bg-slate-200 overflow-hidden">
                        {imageSrc ? (
                          <img src={imageSrc} alt={n.title} className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-200" />
                        ) : (
                          <div className="h-full w-full bg-[linear-gradient(135deg,#9ca3af_0%,#d1d5db_100%)]" />
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-2 min-h-[2.5rem]">{n.title}</h4>
                        <p className="text-xs text-slate-600 mt-3 line-clamp-4">{n.summary ?? content.emptyNews}</p>
                        <p className="mt-3 text-xs font-semibold text-[#0b4d82]">{content.readMore}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="mt-8 text-sm text-slate-600">{content.emptyNews}</p>
          )}
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#e85d17_0%,#b53a05_100%)] py-5">
        <div className="max-w-[1020px] mx-auto px-4 flex flex-wrap items-center justify-center gap-4 text-white text-2xl">
          <p className="text-center">
            {content.contactStrip} <span className="font-black">{content.contactStripBold}</span>
          </p>
          <Link to="/contact" className="bg-white text-slate-900 px-10 py-2 text-sm font-bold uppercase tracking-wide rounded-md">
            {content.contactStripBtn}
          </Link>
        </div>
      </section>

      <footer className="relative text-slate-200 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#111827_0%,#0b1323_55%,#070b14_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(244,114,21,0.2),transparent_30%),radial-gradient(circle_at_90%_20%,rgba(59,130,246,0.14),transparent_28%)]" />

        <div className="relative max-w-[1020px] mx-auto px-4 py-8 border-b border-white/10">
          <div className={`grid md:grid-cols-3 gap-4 text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
            <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-amber-400" /> {content.footer.office}: {content.footer.city}</div>
            <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-amber-400" /> {content.footer.mobile}: +98 21 0000 0000</div>
            <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-amber-400" /> {content.footer.email}: contact@eikhs.ir</div>
          </div>
        </div>

        <div className="relative max-w-[1020px] mx-auto px-4 py-10 grid md:grid-cols-4 gap-8 text-sm">
          <div>
            <h4 className="font-bold text-white mb-4 uppercase">{content.footer.about}</h4>
            <p className="text-slate-300 leading-7 text-xs">{content.footer.aboutDesc}</p>
            <Link to="/about" className="inline-block mt-4 border border-white/25 px-4 py-2 text-xs hover:bg-white/10">{content.readMore}</Link>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4 uppercase">{content.footer.supplies}</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {footerSupplies.map((item) => (
                <li key={item}>
                  <Link to="/catalog" className="hover:text-white">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4 uppercase">{content.footer.services}</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><Link to="/contact" className="hover:text-white">{content.footer.serviceItems[0]}</Link></li>
              <li><Link to="/news" className="hover:text-white">{content.footer.serviceItems[1]}</Link></li>
              <li><Link to="/contact" className="hover:text-white">{content.footer.serviceItems[2]}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4 uppercase">{content.footer.follow}</h4>
            <div className="flex items-center gap-2 text-slate-100 mb-4">
              <a className="h-8 w-8 rounded-full border border-white/25 flex items-center justify-center hover:bg-white/10" href="#" aria-label="facebook">
                <Facebook className="h-4 w-4" />
              </a>
              <a className="h-8 w-8 rounded-full border border-white/25 flex items-center justify-center hover:bg-white/10" href="#" aria-label="linkedin">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
            <img src="/brand/logo_without_persian_words.png" alt={officialBrandNameFa} className="h-12 w-auto object-contain" />
          </div>
        </div>

        <div className="relative max-w-[1020px] mx-auto px-4 pb-6 text-xs text-slate-400 border-t border-white/10 pt-4 text-center">
          © {new Date().getFullYear()} {officialBrandNameFa}
        </div>
      </footer>
      <AiFabChat enabled={isAuthenticated} />
    </div>
  );
}
