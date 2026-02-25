import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { trpc } from '../trpc.js';
import { CommodityGroup, ProductOrigin } from '@repo/shared';

export const Route = createFileRoute('/catalog')({
  component: CatalogPage,
});

const COMMODITY_LABELS: Record<string, string> = {
  INDUSTRIAL: 'صنعتی', CHEMICAL: 'شیمیایی', TELECOM: 'مخابراتی', METAL: 'فلزی',
  FOOD: 'غذایی', TEXTILE: 'نساجی', AGRICULTURAL: 'کشاورزی',
  CONSTRUCTION: 'ساختمانی', PETROCHEMICAL: 'پتروشیمی', OTHER: 'سایر',
};

const ORIGIN_LABELS: Record<string, string> = {
  DOMESTIC_FACTORY: 'تولید داخلی',
  KNOWLEDGE_BASED: 'دانش‌بنیان',
  IMPORTED: 'وارداتی',
};

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'جدیدترین', order: 'desc' },
  { value: 'createdAt', label: 'قدیمی‌ترین', order: 'asc' },
  { value: 'nameFa', label: 'نام (الفبایی)', order: 'asc' },
  { value: 'nameFa', label: 'نام (معکوس)', order: 'desc' },
  { value: 'hsCode', label: 'کد HS', order: 'asc' },
] as const;

function CatalogPage() {
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [origin, setOrigin] = useState<string>('');
  const [commodityGroup, setCommodityGroup] = useState<string>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'nameFa' | 'hsCode'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

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
        <title>کاتالوگ محصولات | پلتفرم تجارت متمرکز هوشمند ایرانیان</title>
        <meta name="description" content="جستجو و مشاهده محصولات صنعتی، شیمیایی و تجاری تولیدکنندگان و بازرگانان ایرانی" />
        <meta property="og:title" content="کاتالوگ محصولات" />
        <meta property="og:description" content="پلتفرم B2B تجارت الکترونیک" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://your-domain.ir/catalog" />
      </Helmet>
      <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="text-xl font-bold text-blue-700 shrink-0">وهدی</Link>
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-lg">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جستجو محصول، کد HS، نام..."
              className="input-field"
            />
            <button type="submit" className="btn-primary shrink-0">جستجو</button>
          </form>
          <Link to="/auth/login" className="btn-secondary shrink-0 hidden sm:inline-block">ورود</Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar filters */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 p-4 sticky top-24">
            <h3 className="font-semibold text-gray-800 mb-4">فیلترها</h3>

            <div className="mb-4">
              <label className="label-text">گروه کالایی</label>
              <select
                value={commodityGroup}
                onChange={(e) => { setCommodityGroup(e.target.value); setPage(1); }}
                className="input-field text-xs"
              >
                <option value="">همه</option>
                {Object.entries(COMMODITY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-text">منشأ کالا</label>
              <select
                value={origin}
                onChange={(e) => { setOrigin(e.target.value); setPage(1); }}
                className="input-field text-xs"
              >
                <option value="">همه</option>
                {Object.entries(ORIGIN_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            {(commodityGroup || origin || search) && (
              <button
                onClick={() => { setCommodityGroup(''); setOrigin(''); setSearch(''); setQ(''); setPage(1); }}
                className="mt-4 text-xs text-red-500 hover:text-red-700"
              >
                پاک کردن فیلترها
              </button>
            )}
          </div>
        </aside>

        {/* Products grid */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">
              کاتالوگ محصولات
              {data && <span className="text-sm font-normal text-gray-500 mr-2">({data.pagination.total} محصول)</span>}
            </h2>
            <div className="flex items-center gap-3">
              {/* Mobile filter button */}
              <button
                onClick={() => setShowFilters(true)}
                className="lg:hidden btn-secondary text-sm"
              >
                فیلترها
              </button>
              {/* Sort dropdown */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [by, order] = e.target.value.split('-') as ['createdAt' | 'nameFa' | 'hsCode', 'asc' | 'desc'];
                  setSortBy(by);
                  setSortOrder(order);
                  setPage(1);
                }}
                className="input-field text-sm max-w-40"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={`${option.value}-${option.order}`} value={`${option.value}-${option.order}`}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-16 text-gray-400">در حال بارگذاری...</div>
          ) : !data?.data?.length ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <p className="text-4xl mb-3">📦</p>
              <p className="text-gray-500">محصولی یافت نشد</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {data.data.map((product) => (
                  <Link key={product.id} to="/catalog/$productId" params={{ productId: product.id }} className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow block">
                    {/* Image placeholder */}
                    <div className="h-40 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-4xl">
                      📦
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">{product.nameFa}</h3>
                      <p className="text-xs text-gray-400 mb-2 truncate" dir="ltr">{product.nameEn}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {product.commodityGroup && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            {COMMODITY_LABELS[product.commodityGroup] ?? product.commodityGroup}
                          </span>
                        )}
                        {product.origin && (
                          <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                            {ORIGIN_LABELS[product.origin] ?? product.origin}
                          </span>
                        )}
                      </div>
                      {product.hsCode && (
                        <p className="text-xs text-gray-400 mt-2" dir="ltr">HS: {product.hsCode}</p>
                      )}
                      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                        <span className="text-xs text-gray-400">{product.user?.userCode}</span>
                        <span className="text-xs text-blue-600 font-medium">
                          مشاهده جزئیات ›
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary disabled:opacity-40">‹ قبلی</button>
                  <span className="text-sm text-gray-600">{page} / {data.pagination.totalPages}</span>
                  <button disabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="btn-secondary disabled:opacity-40">بعدی ›</button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile filters drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowFilters(false)} />
          <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-xl">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">فیلترها</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="label-text">گروه کالایی</label>
                <select
                  value={commodityGroup}
                  onChange={(e) => { setCommodityGroup(e.target.value); setPage(1); }}
                  className="input-field"
                >
                  <option value="">همه</option>
                  {Object.entries(COMMODITY_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-text">منشأ کالا</label>
                <select
                  value={origin}
                  onChange={(e) => { setOrigin(e.target.value); setPage(1); }}
                  className="input-field"
                >
                  <option value="">همه</option>
                  {Object.entries(ORIGIN_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              {(commodityGroup || origin || search) && (
                <button
                  onClick={() => { setCommodityGroup(''); setOrigin(''); setSearch(''); setQ(''); setPage(1); setShowFilters(false); }}
                  className="w-full btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                >
                  پاک کردن فیلترها
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
