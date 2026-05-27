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

  const harvestSummary = trpc.agri.harvest.list.useQuery({
    onlyActive: true,
    page: 1,
    limit: 1,
  });

  const marketSummary = trpc.agri.market.list.useQuery({
    onlyPublished: true,
    page: 1,
    limit: 1,
  });

  const pageCopy = {
    fa: {
      topStripTitle: 'سامانه یکپارچه ذینفعان حوزه کشاورزی',
      topStripDesc: 'بستر تخصصی برای پروفایل، مجوزها، بازار محصولات و فرصت های همکاری',
      ctaRequest: 'ثبت درخواست',
      nav: { home: 'خانه', about: 'درباره', products: 'محصولات', services: 'خدمات', news: 'اخبار', contact: 'ارتباط' },
      heroSlides: [
        {
          title: 'شبکه تخصصی ذینفعان کشاورزی',
          subtitle: 'اتصال تولیدکننده، تامین کننده و متقاضی خدمات',
          desc: 'در یک مسیر یکپارچه، پروفایل حرفه ای خود را تکمیل کنید، محصولات را معرفی کنید و فرصت های همکاری را پیگیری کنید.',
          ctaText: 'مشاهده بازار محصولات',
          ctaTo: '/about',
          bgImage:
            'radial-gradient(circle at 52% 56%, rgba(255, 217, 99, 0.88), rgba(245, 132, 31, 0.54) 30%, rgba(19, 19, 19, 0.9) 72%), linear-gradient(180deg, rgba(197, 99, 10, 0.68), rgba(9, 18, 33, 0.85))',
        },
        {
          title: 'بازار محصولات و خدمات کشاورزی',
          subtitle: 'جستجو، مقایسه و ارتباط هدفمند',
          desc: 'محصولات حوزه کشاورزی را با فیلترهای دقیق بررسی کنید و برای تعامل سریع تر با طرف مقابل اقدام کنید.',
          ctaText: 'ورود به بازار',
          ctaTo: '/catalog',
          bgImage:
            'radial-gradient(circle at 50% 42%, rgba(250, 181, 60, 0.88), rgba(199, 82, 19, 0.48) 31%, rgba(20, 20, 20, 0.88) 72%), linear-gradient(180deg, rgba(161, 81, 12, 0.75), rgba(15, 23, 42, 0.85))',
        },
        {
          title: 'تقویم برداشت و تحلیل بازار نمایشی',
          subtitle: 'آگاهی بیشتر برای تصمیم های روزانه',
          desc: 'با استفاده از داده های نمایشی و تحلیل های قابل کنترل، برنامه ریزی تامین و فروش خود را دقیق تر انجام دهید.',
          ctaText: 'مشاهده تحلیل ها',
          ctaTo: '/contact',
          bgImage:
            'radial-gradient(circle at 54% 58%, rgba(239, 202, 112, 0.85), rgba(193, 91, 27, 0.46) 28%, rgba(17, 17, 17, 0.9) 70%), linear-gradient(180deg, rgba(185, 98, 22, 0.72), rgba(18, 24, 38, 0.85))',
        },
      ] as const,
      introTitle: 'سکوی یکپارچه عملیات کشاورزی',
      introText:
        'ما با اتصال ذینفعان حوزه کشاورزی، مسیر معرفی محصول، ثبت درخواست، پیگیری مجوزها و دسترسی به داده های بازار را شفاف تر و قابل اتکاتر می کنیم.',
      introMore: 'درباره ما',
      whyTitle: 'چرا ما را انتخاب کنید؟',
      whyItems: [
        { title: 'داده های قابل اقدام', desc: 'به داده های نمایشی بازار و تقویم برداشت دسترسی پیدا کنید و تصمیم های دقیق تر بگیرید.' },
        { title: 'اعتبارسنجی و اعتماد', desc: 'جریان بازبینی اولیه مدارک و وضعیت پروفایل، تعاملات حرفه ای را قابل اطمینان تر می کند.' },
        { title: 'فرصت های همکاری', desc: 'درخواست ها و فرصت های خرید، فروش و همکاری را در یک مسیر یکپارچه مدیریت کنید.' },
      ],
      terminalHead: 'داده، فرصت و همکاری در یک شبکه',
      terminalSub: 'AGRICULTURE STAKEHOLDERS PLATFORM',
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
      latestNews: 'آخرین خبرها و آگاهی ها',
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
          'این سامانه مسیر مدیریت پروفایل، مجوزها، محصولات، خدمات و فرصت های همکاری حوزه کشاورزی را برای ذینفعان ساده و عملیاتی می کند.',
        supplies: 'کالاها',
        services: 'خدمات',
        follow: 'شبکه های اجتماعی',
        city: 'تهران، ایران',
        serviceItems: ['مشاوره تخصصی', 'اخبار و آگاهی ها', 'درخواست همکاری'],
        defaultSupplies: ['محصولات کشاورزی', 'خدمات تخصصی', 'فرصت های همکاری'],
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
  const officialBrandNameFa = 'سامانه یکپارچه ذینفعان حوزه کشاورزی';

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

  const challengeItemsByLanguage = {
    fa: [
      'پراکندگی اطلاعات ذینفعان و دشواری یافتن طرف معتبر',
      'نبود مسیر یکپارچه برای پیگیری مجوز، محصول و درخواست',
      'کمبود دید سریع نسبت به تقویم برداشت و تحلیل بازار',
    ],
    en: [
      'Fragmented stakeholder information and hard partner discovery',
      'No unified workflow for licenses, products, and requests',
      'Limited visibility into harvest windows and market insights',
    ],
    ar: [
      'تشتت معلومات أصحاب المصلحة وصعوبة العثور على طرف موثوق',
      'غياب مسار موحد لإدارة التراخيص والمنتجات والطلبات',
      'ضعف الرؤية السريعة لتقويم الحصاد وتحليلات السوق',
    ],
  } as const;

  const solutionItemsByLanguage = {
    fa: [
      'پروفایل تخصصی و اعتبارسنجی اولیه برای افزایش اعتماد',
      'بازار محصولات و فرصت های همکاری در یک داشبورد عملیاتی',
      'داده های نمایشی قابل کنترل برای تصمیم گیری روزانه',
    ],
    en: [
      'Specialized profiles and initial verification for trust',
      'Products and opportunities managed in one operational view',
      'Controlled insight data for better day-to-day decisions',
    ],
    ar: [
      'ملفات تخصصية وتحقق أولي لرفع مستوى الثقة',
      'إدارة المنتجات والفرص ضمن واجهة تشغيل موحدة',
      'بيانات تحليلية منضبطة لدعم القرار اليومي',
    ],
  } as const;

  const stakeholderItemsByLanguage = {
    fa: [
      { title: 'تولیدکنندگان و کشاورزان', desc: 'معرفی محصول، تکمیل پروفایل و دریافت فرصت های هدفمند' },
      { title: 'تامین کنندگان و بازرگانان', desc: 'کشف سریع عرضه و تقاضا در زنجیره کشاورزی' },
      { title: 'ارائه دهندگان خدمات تخصصی', desc: 'ثبت خدمات، مجوزها و تعامل ساختارمند با متقاضیان' },
      { title: 'مدیران و اپراتورها', desc: 'کنترل taxonomy، بازبینی مدارک و پایش عملیات روزانه' },
    ],
    en: [
      { title: 'Producers & Farmers', desc: 'Showcase products and receive targeted opportunities' },
      { title: 'Suppliers & Traders', desc: 'Discover supply and demand across agri value chains' },
      { title: 'Specialized Service Providers', desc: 'Offer services with structured interactions and licenses' },
      { title: 'Operators & Admins', desc: 'Control taxonomy, verification queues, and daily operations' },
    ],
    ar: [
      { title: 'المنتجون والمزارعون', desc: 'عرض المنتجات والحصول على فرص مناسبة' },
      { title: 'الموردون والتجار', desc: 'اكتشاف العرض والطلب عبر سلسلة القيمة الزراعية' },
      { title: 'مقدمو الخدمات المتخصصة', desc: 'تقديم الخدمات مع تفاعل منظم وإدارة التراخيص' },
      { title: 'المشغلون والمديرون', desc: 'إدارة التصنيفات ومسارات التحقق والعمليات اليومية' },
    ],
  } as const;

  const stakeholderIcons = [Leaf, Factory, HousePlus, Cpu] as const;
  const challengeItems = challengeItemsByLanguage[language];
  const solutionItems = solutionItemsByLanguage[language];
  const stakeholderItems = stakeholderItemsByLanguage[language];

  const localizedNumber = (value: number) => value.toLocaleString(language === 'fa' ? 'fa-IR' : language === 'ar' ? 'ar-EG' : 'en-US');

  const keyMetrics = [
    {
      label: language === 'fa' ? 'محصول ثبت شده' : language === 'ar' ? 'منتج مسجل' : 'Registered Products',
      value: products.data?.pagination.total ?? productItems.length,
    },
    {
      label: language === 'fa' ? 'آیتم تقویم برداشت' : language === 'ar' ? 'عناصر تقويم الحصاد' : 'Harvest Calendar Items',
      value: harvestSummary.data?.total ?? 0,
    },
    {
      label: language === 'fa' ? 'تحلیل بازار نمایشی' : language === 'ar' ? 'تحليلات السوق' : 'Market Insights',
      value: marketSummary.data?.total ?? 0,
    },
    {
      label: language === 'fa' ? 'دسته تخصصی' : language === 'ar' ? 'فئات تخصصية' : 'Specialized Categories',
      value: categoryTiles.length,
    },
  ];

  const labelsByLanguage = {
    fa: {
      platformOverline: 'AGRICULTURE STAKEHOLDERS PLATFORM',
      viewMarket: 'مشاهده بازار محصولات',
      challengeTitle: 'چالش های رایج اکوسیستم',
      solutionTitle: 'راهکار سامانه',
      stakeholdersTitle: 'گروه های اصلی ذینفع',
      stakeholdersSubtitle: 'طراحی شده برای عملیات واقعی روزانه، نه صرفا نمایش اطلاعات',
      categoriesTitle: 'حوزه های بازار محصولات و خدمات',
      categoriesSubtitle: 'جستجو و مسیرهای سریع بر اساس دسته های تخصصی',
      freshProductsTitle: 'جدیدترین محصولات ثبت شده',
      freshProductsSubtitle: 'مستقیما از داده های سامانه',
      freshNewsTitle: 'جدیدترین خبرها و آگاهی ها',
      freshNewsSubtitle: 'به روزرسانی های منتخب حوزه کشاورزی',
      noImage: 'تصویر موجود نیست',
    },
    en: {
      platformOverline: 'AGRICULTURE STAKEHOLDERS PLATFORM',
      viewMarket: 'Explore Market',
      challengeTitle: 'Ecosystem Challenges',
      solutionTitle: 'Platform Approach',
      stakeholdersTitle: 'Primary Stakeholder Groups',
      stakeholdersSubtitle: 'Built for day-to-day operations, not just display pages',
      categoriesTitle: 'Products & Services Domains',
      categoriesSubtitle: 'Fast navigation through specialized market categories',
      freshProductsTitle: 'Latest Registered Products',
      freshProductsSubtitle: 'Directly from platform data',
      freshNewsTitle: 'Latest News & Insights',
      freshNewsSubtitle: 'Selected updates from the agricultural ecosystem',
      noImage: 'No image',
    },
    ar: {
      platformOverline: 'AGRICULTURE STAKEHOLDERS PLATFORM',
      viewMarket: 'استعراض السوق',
      challengeTitle: 'تحديات المنظومة',
      solutionTitle: 'منهج المنصة',
      stakeholdersTitle: 'الفئات الرئيسية لأصحاب المصلحة',
      stakeholdersSubtitle: 'مصممة للتشغيل اليومي العملي وليس للعرض فقط',
      categoriesTitle: 'مجالات المنتجات والخدمات',
      categoriesSubtitle: 'تنقل سريع عبر فئات السوق المتخصصة',
      freshProductsTitle: 'أحدث المنتجات المسجلة',
      freshProductsSubtitle: 'مباشرة من بيانات المنصة',
      freshNewsTitle: 'آخر الأخبار والتنبيهات',
      freshNewsSubtitle: 'تحديثات مختارة من منظومة الزراعة',
      noImage: 'لا توجد صورة',
    },
  } as const;

  const labels = labelsByLanguage[language];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-[var(--field-mist)] text-foreground">
      <header className="sticky top-0 z-40 border-b border-[var(--sidebar-border)] bg-[hsl(153_41%_9%_/_0.92)] backdrop-blur">
        <div className="max-w-[1120px] mx-auto px-4 py-3 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <img
              src="/brand/logo_without_persian_words.png"
              alt={officialBrandNameFa}
              className="h-14 sm:h-16 w-auto object-contain"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[hsl(0_0%_96%)] line-clamp-1">{content.topStripTitle}</p>
              <p className="text-xs text-[hsl(148_10%_74%)] line-clamp-2">{content.topStripDesc}</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            <Link to="/" className="px-3 py-2 text-sm text-[hsl(148_10%_82%)] hover:text-white hover:bg-white/10 rounded-md">{content.nav.home}</Link>
            <Link to="/about" className="px-3 py-2 text-sm text-[hsl(148_10%_82%)] hover:text-white hover:bg-white/10 rounded-md">{content.nav.about}</Link>
            <Link to="/catalog" className="px-3 py-2 text-sm text-[hsl(148_10%_82%)] hover:text-white hover:bg-white/10 rounded-md">{content.nav.products}</Link>
            <Link to="/news" className="px-3 py-2 text-sm text-[hsl(148_10%_82%)] hover:text-white hover:bg-white/10 rounded-md">{content.nav.news}</Link>
            <Link to="/contact" className="px-3 py-2 text-sm text-[hsl(148_10%_82%)] hover:text-white hover:bg-white/10 rounded-md">{content.nav.contact}</Link>
          </nav>

          <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <LanguageSwitcher />
            <Button size="sm" asChild>
              <Link to="/auth/register" aria-label="register-cta">{t('auth.register')}</Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-[hsl(148_12%_88%)] hover:text-white hover:bg-white/10" asChild>
              <Link to="/auth/login">{t('auth.login')}</Link>
            </Button>
            <div className="hidden md:flex items-center gap-1 text-[hsl(148_10%_74%)]">
              <a className="h-7 w-7 rounded-full border border-white/20 flex items-center justify-center hover:text-white hover:bg-white/10" href="#" aria-label="facebook">
                <Facebook className="h-3.5 w-3.5" />
              </a>
              <a className="h-7 w-7 rounded-full border border-white/20 flex items-center justify-center hover:text-white hover:bg-white/10" href="#" aria-label="linkedin">
                <Linkedin className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      <section
        className="relative overflow-hidden"
        onMouseEnter={() => setIsHeroPaused(true)}
        onMouseLeave={() => setIsHeroPaused(false)}
      >
        <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(153_41%_9%),hsl(148_62%_24%)_52%,hsl(139_50%_37%))]" />
        <div className={`absolute inset-0 opacity-20 ${currentSlideBackgroundClass}`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,hsl(40_62%_57%_/_0.24),transparent_34%)]" />

        <div className="relative max-w-[1120px] mx-auto px-4 py-10 lg:py-14 grid lg:grid-cols-[1.2fr_0.8fr] gap-7 items-start">
          <div>
            <p className="text-[11px] tracking-[0.2em] text-[hsl(90_22%_88%_/_0.86)]">{labels.platformOverline}</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mt-3 text-[hsl(0_0%_98%)]">{currentSlide.title}</h1>
            <p className="text-base sm:text-lg mt-3 text-[hsl(148_14%_86%)]">{currentSlide.subtitle}</p>
            <p className="mt-4 text-sm sm:text-base leading-8 text-[hsl(148_14%_80%)] max-w-2xl">{currentSlide.desc}</p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to="/auth/register" className="inline-flex items-center justify-center rounded-lg bg-white text-[hsl(153_41%_10%)] px-5 py-2.5 text-sm font-bold hover:bg-[hsl(90_22%_94%)] transition-colors">
                {t('auth.register')}
              </Link>
              <Link to="/catalog" className="inline-flex items-center justify-center rounded-lg border border-white/35 bg-white/10 text-white px-5 py-2.5 text-sm font-semibold hover:bg-white/15 transition-colors">
                {labels.viewMarket}
              </Link>
            </div>

            <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {keyMetrics.map((metric) => (
                <div key={metric.label} className="rounded-xl border border-white/20 bg-[hsl(153_24%_10%_/_0.45)] px-3 py-3">
                  <p className="text-xl sm:text-2xl font-black text-white">{localizedNumber(metric.value)}</p>
                  <p className="text-[11px] mt-1 text-[hsl(148_12%_82%)]">{metric.label}</p>
                </div>
              ))}
            </div>

            {heroSlides.length > 1 && (
              <div className="mt-6 flex items-center gap-2">
                <button
                  type="button"
                  className="h-8 w-8 rounded-full border border-white/30 bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                  onClick={() => setHeroIndex((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1))}
                  aria-label="hero-prev"
                >
                  {isRtl ? nextArrow : prevArrow}
                </button>
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setHeroIndex(index)}
                    className={`h-2.5 rounded-full transition-all ${heroIndex === index ? 'w-7 bg-white' : 'w-2.5 bg-white/45 hover:bg-white/70'}`}
                    aria-label={`hero-slide-${index + 1}`}
                  />
                ))}
                <button
                  type="button"
                  className="h-8 w-8 rounded-full border border-white/30 bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                  onClick={() => setHeroIndex((prev) => (prev + 1) % heroSlides.length)}
                  aria-label="hero-next"
                >
                  {isRtl ? prevArrow : nextArrow}
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/20 bg-[hsl(153_24%_10%_/_0.55)] p-5 lg:p-6 backdrop-blur-sm">
            <h2 className="text-base font-bold text-[hsl(0_0%_97%)]">{labels.challengeTitle}</h2>
            <ul className="mt-3 space-y-2 text-sm text-[hsl(148_14%_82%)] leading-7">
              {challengeItems.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--wheat-accent)] shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <h3 className="text-base font-bold text-[hsl(0_0%_97%)] mt-6">{labels.solutionTitle}</h3>
            <ul className="mt-3 space-y-2 text-sm text-[hsl(148_14%_82%)] leading-7">
              {solutionItems.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--agri-leaf)] shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link to="/about" className="inline-flex mt-5 text-sm font-semibold text-[hsl(90_22%_90%)] hover:text-white">
              {content.introMore} {isRtl ? '←' : '→'}
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-[1120px] mx-auto px-4 py-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">{labels.stakeholdersTitle}</h2>
            <p className="text-sm text-muted-foreground mt-2">{labels.stakeholdersSubtitle}</p>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/about">{content.introMore}</Link>
          </Button>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stakeholderItems.map((item, index) => {
            const Icon = stakeholderIcons[index % stakeholderIcons.length] ?? Leaf;
            return (
              <article key={item.title} className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_hsl(153_20%_12%_/_0.06)]">
                <div className="h-9 w-9 rounded-lg bg-[hsl(139_50%_37%_/_0.14)] text-[var(--agri-leaf)] flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-foreground leading-6">{item.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-6">{item.desc}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-background/80">
        <div className="max-w-[1120px] mx-auto px-4 py-10">
          <h3 className="text-2xl font-black text-foreground">{labels.categoriesTitle}</h3>
          <p className="text-sm text-muted-foreground mt-2">{labels.categoriesSubtitle}</p>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {categoryTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <Link
                  key={tile.key}
                  to={tile.to}
                  className="group rounded-xl border border-border bg-card px-3 py-4 hover:border-[hsl(139_50%_37%_/_0.45)] hover:shadow-sm transition-all"
                >
                  <div className={`h-9 w-9 rounded-lg text-white flex items-center justify-center ${tile.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-foreground leading-5 line-clamp-2">{content.categoryTitles[tile.key]}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-[1120px] mx-auto px-4 py-12 grid lg:grid-cols-2 gap-8">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_hsl(153_20%_12%_/_0.06)]">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-foreground">{labels.freshProductsTitle}</h3>
              <p className="text-xs text-muted-foreground mt-1">{labels.freshProductsSubtitle}</p>
            </div>
            <Link to="/catalog" className="text-xs text-[var(--data-blue)] hover:underline">{labels.viewMarket}</Link>
          </div>

          {productItems.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-3">
              {productItems.map((item) => {
                const imageSrc = item.media?.[0]?.fileKey ? `/api/media/${item.media[0].fileKey}` : null;
                return (
                  <Link key={item.id} to="/catalog/$productId" params={{ productId: item.id }} className="rounded-xl border border-border bg-background p-2 hover:border-[hsl(139_50%_37%_/_0.4)] transition-colors">
                    <div className="h-24 rounded-lg overflow-hidden bg-[hsl(146_22%_90%)] flex items-center justify-center text-xs text-muted-foreground">
                      {imageSrc ? (
                        <img src={imageSrc} alt={localizedProductName(item.nameFa, item.nameEn)} className="h-full w-full object-cover" />
                      ) : (
                        <span>{labels.noImage}</span>
                      )}
                    </div>
                    <p className="mt-2 text-xs font-semibold text-foreground line-clamp-2 leading-5">{localizedProductName(item.nameFa, item.nameEn)}</p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">{content.emptyProducts}</p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_hsl(153_20%_12%_/_0.06)]">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-foreground">{labels.freshNewsTitle}</h3>
              <p className="text-xs text-muted-foreground mt-1">{labels.freshNewsSubtitle}</p>
            </div>
            <Link to="/news" className="text-xs text-[var(--data-blue)] hover:underline">{content.readMore}</Link>
          </div>

          {newsItems.length > 0 ? (
            <div className="mt-5 space-y-3">
              {newsItems.map((item) => (
                <Link key={item.id} to="/news/$newsId" params={{ newsId: item.id }} className="block rounded-xl border border-border bg-background p-3 hover:border-[hsl(195_56%_33%_/_0.35)] transition-colors">
                  <h4 className="text-sm font-bold text-foreground line-clamp-2 leading-6">{item.title}</h4>
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-6">{item.summary ?? content.emptyNews}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">{content.emptyNews}</p>
          )}
        </div>
      </section>

      <section className="bg-[linear-gradient(90deg,var(--brand),var(--agri-leaf))] py-6">
        <div className="max-w-[1120px] mx-auto px-4 flex flex-wrap items-center justify-between gap-4 text-white">
          <p className="text-lg sm:text-xl font-medium">
            {content.contactStrip} <span className="font-black">{content.contactStripBold}</span>
          </p>
          <Link to="/contact" className="bg-white text-[hsl(153_41%_12%)] px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-[hsl(90_22%_94%)] transition-colors">
            {content.contactStripBtn}
          </Link>
        </div>
      </section>

      <footer className="bg-[hsl(153_41%_9%)] text-[hsl(148_12%_78%)]">
        <div className="max-w-[1120px] mx-auto px-4 py-7 border-b border-white/10">
          <div className={`grid md:grid-cols-3 gap-4 text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[var(--wheat-accent)]" /> {content.footer.office}: {content.footer.city}</div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-[var(--wheat-accent)]" /> {content.footer.mobile}: +98 21 0000 0000</div>
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-[var(--wheat-accent)]" /> {content.footer.email}: contact@eikhs.ir</div>
          </div>
        </div>

        <div className="max-w-[1120px] mx-auto px-4 py-8 grid md:grid-cols-4 gap-8 text-sm">
          <div>
            <h4 className="font-bold text-white mb-3">{content.footer.about}</h4>
            <p className="text-xs leading-7">{content.footer.aboutDesc}</p>
            <Link to="/about" className="inline-block mt-4 border border-white/20 px-3 py-2 text-xs hover:bg-white/10">{content.readMore}</Link>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3">{content.footer.supplies}</h4>
            <ul className="space-y-2 text-xs">
              {footerSupplies.map((item) => (
                <li key={item}><Link to="/catalog" className="hover:text-white">{item}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3">{content.footer.services}</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/contact" className="hover:text-white">{content.footer.serviceItems[0]}</Link></li>
              <li><Link to="/news" className="hover:text-white">{content.footer.serviceItems[1]}</Link></li>
              <li><Link to="/contact" className="hover:text-white">{content.footer.serviceItems[2]}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3">{content.footer.follow}</h4>
            <div className="flex items-center gap-2 text-slate-100 mb-4">
              <a className="h-8 w-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10" href="#" aria-label="facebook">
                <Facebook className="h-4 w-4" />
              </a>
              <a className="h-8 w-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10" href="#" aria-label="linkedin">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
            <img src="/brand/logo_without_persian_words.png" alt={officialBrandNameFa} className="h-12 w-auto object-contain" />
          </div>
        </div>

        <div className="max-w-[1120px] mx-auto px-4 pb-6 text-xs text-[hsl(148_10%_62%)] border-t border-white/10 pt-4 text-center">
          © {new Date().getFullYear()} {officialBrandNameFa}
        </div>
      </footer>
      <AiFabChat enabled={isAuthenticated} />
    </div>
  );
}
