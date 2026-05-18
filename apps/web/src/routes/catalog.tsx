import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { trpc } from '../trpc.js';
import { CommodityGroup, ProductOrigin } from '@repo/shared';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher.js';

export const Route = createFileRoute('/catalog')({
  component: CatalogPage,
});

const COMMODITY_LABELS = {
  fa: {
    INDUSTRIAL: 'صنعتی', CHEMICAL: 'شیمیایی', TELECOM: 'مخابراتی', METAL: 'فلزی',
    FOOD: 'غذایی', TEXTILE: 'نساجی', AGRICULTURAL: 'کشاورزی',
    CONSTRUCTION: 'ساختمانی', PETROCHEMICAL: 'پتروشیمی', OTHER: 'سایر',
  },
  en: {
    INDUSTRIAL: 'Industrial', CHEMICAL: 'Chemical', TELECOM: 'Telecom', METAL: 'Metal',
    FOOD: 'Food', TEXTILE: 'Textile', AGRICULTURAL: 'Agricultural',
    CONSTRUCTION: 'Construction', PETROCHEMICAL: 'Petrochemical', OTHER: 'Other',
  },
  ar: {
    INDUSTRIAL: 'صناعي', CHEMICAL: 'كيميائي', TELECOM: 'اتصالات', METAL: 'معدني',
    FOOD: 'غذائي', TEXTILE: 'نسيج', AGRICULTURAL: 'زراعي',
    CONSTRUCTION: 'إنشائي', PETROCHEMICAL: 'بتروكيماويات', OTHER: 'أخرى',
  },
} as const;

const ORIGIN_LABELS = {
  fa: {
    DOMESTIC_FACTORY: 'تولید داخلی',
    KNOWLEDGE_BASED: 'دانش‌بنیان',
    IMPORTED: 'وارداتی',
  },
  en: {
    DOMESTIC_FACTORY: 'Domestic Production',
    KNOWLEDGE_BASED: 'Knowledge-Based',
    IMPORTED: 'Imported',
  },
  ar: {
    DOMESTIC_FACTORY: 'إنتاج محلي',
    KNOWLEDGE_BASED: 'قائم على المعرفة',
    IMPORTED: 'مستورد',
  },
} as const;

function CatalogPage() {
  const { t, i18n } = useTranslation();
  const normalizedLanguage = (i18n.resolvedLanguage ?? i18n.language ?? 'fa').split('-')[0];
  const language = (normalizedLanguage === 'en' || normalizedLanguage === 'ar' ? normalizedLanguage : 'fa') as 'fa' | 'en' | 'ar';
  const isRtl = language !== 'en';

  const copy = {
    fa: {
      title: 'Marketplace محصولات کشاورزی',
      titleSeo: 'کاتالوگ محصولات | سامانه ذینفعان حوزه کشاورزی',
      descriptionSeo: 'جستجو و مشاهده محصولات کشاورزی ، دامی و غذایی تولیدکنندگان و بازرگانان حوزه کشاورزی',
      heroTitle: 'Marketplace هوشمند صادرات و واردات محصولات کشاورزی',
      heroDesc: 'محصولات کشاورزی را بر اساس گروه کالایی، منشا، کد HS و نام جستجو کنید و سریع به جزئیات کامل هر مورد دسترسی پیدا کنید.',',
      searchPlaceholder: 'جستجو محصول، کد HS، نام...',
      searchBtn: 'جستجو',
      catalogLabel: 'Catalog',
      filtersTitle: 'فیلترهای کلیدی Marketplace',
      commodityGroup: 'گروه کالایی',
      origin: 'منشأ کالا',
      all: 'همه',
      clearFilters: 'پاک کردن فیلترها',
      productsCount: 'محصول',
      mobileFilters: 'فیلترها',
      activeSearch: 'جستجو',
      activeGroup: 'گروه',
      activeOrigin: 'منشا',
      loading: 'در حال بارگذاری...',
      empty: 'محصولی یافت نشد',
      details: 'مشاهده جزئیات',
      previous: 'قبلی',
      next: 'بعدی',
      sortOptions: [
        { value: 'createdAt', label: 'جدیدترین', order: 'desc' },
        { value: 'createdAt', label: 'قدیمی‌ترین', order: 'asc' },
        { value: 'nameFa', label: 'نام (الفبایی)', order: 'asc' },
        { value: 'nameFa', label: 'نام (معکوس)', order: 'desc' },
        { value: 'hsCode', label: 'کد HS', order: 'asc' },
      ] as const,
    },
    en: {
      title: 'Agricultural Product Catalog',
      titleSeo: 'Product Catalog | Agriculture Stakeholders Platform',
      descriptionSeo: 'Search and explore agricultural, livestock, and food products from verified producers and traders.',
      heroTitle: 'Smart Catalog for Agricultural Export & Import Products',
      heroDesc: 'Filter products by commodity group, origin, HS code and name, then access details instantly.',
      searchPlaceholder: 'Search products, HS code, names...',
      searchBtn: 'Search',
      catalogLabel: 'Catalog',
      filtersTitle: 'Advanced Filters',
      commodityGroup: 'Commodity Group',
      origin: 'Origin',
      all: 'All',
      clearFilters: 'Clear Filters',
      productsCount: 'products',
      mobileFilters: 'Filters',
      activeSearch: 'Search',
      activeGroup: 'Group',
      activeOrigin: 'Origin',
      loading: 'Loading...',
      empty: 'No products found',
      details: 'View Details',
      previous: 'Previous',
      next: 'Next',
      sortOptions: [
        { value: 'createdAt', label: 'Newest', order: 'desc' },
        { value: 'createdAt', label: 'Oldest', order: 'asc' },
        { value: 'nameFa', label: 'Name (A-Z)', order: 'asc' },
        { value: 'nameFa', label: 'Name (Z-A)', order: 'desc' },
        { value: 'hsCode', label: 'HS Code', order: 'asc' },
      ] as const,
    },
    ar: {
      title: 'كتالوج المنتجات',
      titleSeo: 'كتالوج المنتجات | منصة واحدي التجارية',
      descriptionSeo: 'ابحث واستعرض المنتجات الصناعية والكيميائية والتجارية من الموردين المعتمدين.',
      heroTitle: 'كتالوج ذكي لمنتجات الاستيراد والتصدير',
      heroDesc: 'ابحث حسب الفئة التجارية والمنشأ ورمز HS واسم المنتج مع وصول سريع للتفاصيل.',
      searchPlaceholder: 'ابحث عن منتج، رمز HS، اسم...',
      searchBtn: 'بحث',
      catalogLabel: 'Catalog',
      filtersTitle: 'فلاتر متقدمة',
      commodityGroup: 'الفئة التجارية',
      origin: 'المنشأ',
      all: 'الكل',
      clearFilters: 'مسح الفلاتر',
      productsCount: 'منتج',
      mobileFilters: 'الفلاتر',
      activeSearch: 'بحث',
      activeGroup: 'الفئة',
      activeOrigin: 'المنشأ',
      loading: 'جار التحميل...',
      empty: 'لم يتم العثور على منتجات',
      details: 'عرض التفاصيل',
      previous: 'السابق',
      next: 'التالي',
      sortOptions: [
        { value: 'createdAt', label: 'الأحدث', order: 'desc' },
        { value: 'createdAt', label: 'الأقدم', order: 'asc' },
        { value: 'nameFa', label: 'الاسم (تصاعدي)', order: 'asc' },
        { value: 'nameFa', label: 'الاسم (تنازلي)', order: 'desc' },
        { value: 'hsCode', label: 'رمز HS', order: 'asc' },
      ] as const,
    },
  } as const;

  const content = copy[language];
  const commodityLabels = COMMODITY_LABELS[language];
  const originLabels = ORIGIN_LABELS[language];
  const SORT_OPTIONS = content.sortOptions;
  const previousArrow = isRtl ? '›' : '‹';
  const nextArrow = isRtl ? '‹' : '›';
  const officialBrandNameFa = 'سامانه ذینفعان حوزه کشاورزی';
  const officialBrandNameByLanguage = {
    fa: 'سامانه ذینفعان حوزه کشاورزی',
    en: 'Agriculture Stakeholders Platform',
    ar: 'منصة أصحاب المصلحة في قطاع الزراعة',
  } as const;

  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [origin, setOrigin] = useState<string>('');
  const [commodityGroup, setCommodityGroup] = useState<string>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'nameFa' | 'hsCode'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!showFilters) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowFilters(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [showFilters]);

  const { data, isLoading } = trpc.product.list.useQuery({
    q: search || undefined,
    origin: (origin as ProductOrigin) || undefined,
    commodityGroup: (commodityGroup as CommodityGroup) || undefined,
    page,
    limit: 12,
    sortBy,
    sortOrder,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(q);
    setPage(1);
  };

  return (
    <>
      <Helmet>
        <title>{content.titleSeo}</title>
        <meta name="description" content={content.descriptionSeo} />
        <meta property="og:title" content={content.title} />
        <meta property="og:description" content={content.descriptionSeo} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://your-domain.ir/catalog" />
      </Helmet>
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_35%)] overflow-x-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white/95 border-b border-gray-200 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3 shrink-0 min-w-0">
            <img
              src="/brand/logo_without_persian_words.png"
              alt={officialBrandNameFa}
              className="h-14 sm:h-16 w-auto rounded-md border border-slate-200 bg-white object-contain p-1"
            />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 leading-5 line-clamp-2">{officialBrandNameFa}</p>
              <p className="text-[11px] text-gray-500 leading-none mt-1 line-clamp-1">{officialBrandNameByLanguage[language]}</p>
            </div>
          </Link>
          <form onSubmit={handleSearch} className="order-3 lg:order-none flex gap-2 w-full lg:flex-1 lg:max-w-xl">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={content.searchPlaceholder}
              className="input-field"
            />
            <button type="submit" className="btn-primary shrink-0">{content.searchBtn}</button>
          </form>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <LanguageSwitcher />
            <Link to="/auth/login" className="btn-secondary shrink-0 hidden sm:inline-block">{t('auth.login')}</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-8 pb-6">
        <div
          className="rounded-2xl overflow-hidden p-6 lg:p-8 text-white relative"
          style={{ background: 'radial-gradient(circle at 52% 56%, rgba(255,217,99,0.82), rgba(245,132,31,0.5) 30%, rgba(19,19,19,0.94) 70%), linear-gradient(180deg, rgba(197,99,10,0.62), rgba(9,18,33,0.92))' }}
        >
          <div className="relative z-10">
            <p className="text-[11px] tracking-[0.16em] text-amber-200/80">GLOBAL TRADE PRODUCTS</p>
            <h1 className="text-2xl lg:text-3xl font-black mt-2" style={{ color: 'hsl(0 0% 95%)' }}>{content.heroTitle}</h1>
            <p className="text-sm mt-3 max-w-3xl leading-7" style={{ color: 'hsl(215 20% 75%)' }}>
              {content.heroDesc}
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* Sidebar filters */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-24 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">{content.filtersTitle}</h3>

            <div className="mb-4">
              <label className="label-text">{content.commodityGroup}</label>
              <select
                title={content.commodityGroup}
                value={commodityGroup}
                onChange={(e) => { setCommodityGroup(e.target.value); setPage(1); }}
                className="input-field text-xs"
              >
                <option value="">{content.all}</option>
                {Object.entries(commodityLabels).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-text">{content.origin}</label>
              <select
                title={content.origin}
                value={origin}
                onChange={(e) => { setOrigin(e.target.value); setPage(1); }}
                className="input-field text-xs"
              >
                <option value="">{content.all}</option>
                {Object.entries(originLabels).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            {(commodityGroup || origin || search) && (
              <button
                onClick={() => { setCommodityGroup(''); setOrigin(''); setSearch(''); setQ(''); setPage(1); }}
                className="mt-4 w-full btn-secondary text-red-600 border-red-200 hover:bg-red-50"
              >
                {content.clearFilters}
              </button>
            )}
          </div>
        </aside>

        {/* Products grid */}
        <main className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-black text-gray-900 text-xl">
              {content.title}
              {data && <span className={`text-sm font-normal text-gray-500 ${isRtl ? 'mr-2' : 'ml-2'}`}>({data.pagination.total} {content.productsCount})</span>}
            </h2>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Mobile filter button */}
              <button
                onClick={() => setShowFilters(true)}
                className="lg:hidden btn-secondary text-sm"
              >
                {content.mobileFilters}
              </button>
              {/* Sort dropdown */}
              <select
                title="مرتب‌سازی نتایج"
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [by, order] = e.target.value.split('-') as ['createdAt' | 'nameFa' | 'hsCode', 'asc' | 'desc'];
                  setSortBy(by);
                  setSortOrder(order);
                  setPage(1);
                }}
                className="input-field text-sm flex-1 sm:flex-none sm:max-w-44"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={`${option.value}-${option.order}`} value={`${option.value}-${option.order}`}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(commodityGroup || origin || search) && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {search && (
                <span className="px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100">{content.activeSearch}: {search}</span>
              )}
              {commodityGroup && (
                <span className="px-3 py-1 rounded-full text-xs bg-slate-100 text-slate-700 border border-slate-200">
                  {content.activeGroup}: {commodityLabels[commodityGroup as keyof typeof commodityLabels] ?? commodityGroup}
                </span>
              )}
              {origin && (
                <span className="px-3 py-1 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {content.activeOrigin}: {originLabels[origin as keyof typeof originLabels] ?? origin}
                </span>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-16 text-gray-400">{content.loading}</div>
          ) : !data?.data?.length ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
              <p className="text-4xl mb-3">📦</p>
              <p className="text-gray-500">{content.empty}</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {data.data.map((product) => {
                  const mainImage = (product as any).media?.[0]?.fileKey
                  return (
                  <Link key={product.id} to="/catalog/$productId" params={{ productId: product.id }} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 block">
                    {/* Product image or placeholder */}
                    <div className="h-40 bg-gradient-to-br from-blue-50 via-slate-100 to-cyan-50 flex items-center justify-center text-4xl overflow-hidden">
                      {mainImage ? (
                        <img src={`/api/media/${mainImage}`} alt={product.nameFa} className="w-full h-full object-cover" />
                      ) : (
                        <span>📦</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">{product.nameFa}</h3>
                      <p className="text-xs text-gray-400 mb-2 truncate" dir="ltr">{product.nameEn}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {product.commodityGroup && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            {commodityLabels[product.commodityGroup as keyof typeof commodityLabels] ?? product.commodityGroup}
                          </span>
                        )}
                        {product.origin && (
                          <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                            {originLabels[product.origin as keyof typeof originLabels] ?? product.origin}
                          </span>
                        )}
                      </div>
                      {product.hsCode && (
                        <p className="text-xs text-gray-400 mt-2" dir="ltr">HS: {product.hsCode}</p>
                      )}
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-400">{product.user?.userCode}</span>
                        <span className="text-xs text-blue-600 font-medium">
                          {content.details} {isRtl ? '‹' : '›'}
                        </span>
                      </div>
                    </div>
                  </Link>
                  )
                })}
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary disabled:opacity-40 min-w-24">{previousArrow} {content.previous}</button>
                  <span className="text-sm text-gray-600 px-3">{page} / {data.pagination.totalPages}</span>
                  <button disabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="btn-secondary disabled:opacity-40 min-w-24">{content.next} {nextArrow}</button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile filters drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={content.filtersTitle}>
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
            onClick={() => setShowFilters(false)}
            aria-label="بستن پنل فیلتر"
          />
          <div className={`absolute top-0 h-full w-[88vw] max-w-sm bg-white shadow-xl overflow-y-auto ${isRtl ? 'left-0' : 'right-0'}`}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-semibold text-gray-800">{content.filtersTitle}</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="label-text">{content.commodityGroup}</label>
                <select
                  title={content.commodityGroup}
                  value={commodityGroup}
                  onChange={(e) => { setCommodityGroup(e.target.value); setPage(1); }}
                  className="input-field"
                >
                  <option value="">{content.all}</option>
                  {Object.entries(commodityLabels).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-text">{content.origin}</label>
                <select
                  title={content.origin}
                  value={origin}
                  onChange={(e) => { setOrigin(e.target.value); setPage(1); }}
                  className="input-field"
                >
                  <option value="">{content.all}</option>
                  {Object.entries(originLabels).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              {(commodityGroup || origin || search) && (
                <button
                  onClick={() => { setCommodityGroup(''); setOrigin(''); setSearch(''); setQ(''); setPage(1); setShowFilters(false); }}
                  className="w-full btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                >
                  {content.clearFilters}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
