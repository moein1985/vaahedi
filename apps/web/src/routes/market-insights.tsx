import { createFileRoute } from '@tanstack/react-router';
import { trpc } from '../trpc.js';
import { useState } from 'react';
import { TrendingUp, Search, ChevronLeft, ChevronRight, Tag, ExternalLink } from 'lucide-react';

export const Route = createFileRoute('/market-insights')({
  component: MarketInsightsPage,
});

const INSIGHT_TYPE_LABELS: Record<string, string> = {
  price: '💰 قیمت',
  demand: '📈 تقاضا',
  supply: '📦 عرضه',
  trend: '🔄 روند',
  regulation: '📋 مقررات',
};

const INSIGHT_TYPE_COLORS: Record<string, string> = {
  price: 'bg-[hsl(40_62%_57%_/_0.2)] text-[hsl(35_48%_33%)]',
  demand: 'bg-[hsl(195_56%_33%_/_0.14)] text-[var(--data-blue)]',
  supply: 'bg-[hsl(139_50%_37%_/_0.14)] text-[var(--agri-leaf)]',
  trend: 'bg-[hsl(146_22%_90%)] text-[var(--brand)]',
  regulation: 'bg-muted text-muted-foreground',
};

function MarketInsightsPage() {
  const [insightType, setInsightType] = useState<'price' | 'demand' | 'supply' | 'trend' | 'regulation' | undefined>();
  const [search, setSearch] = useState('');
  const [commodity, setCommodity] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.agri.market.list.useQuery({
    insightType,
    commodity: commodity || undefined,
    onlyPublished: true,
    page,
    limit: 12,
  });

  const totalPages = data ? Math.ceil(data.total / 12) : 1;

  const filteredItems = search
    ? (data?.items ?? []).filter((item) =>
        item.title.includes(search) ||
        item.commodityFa.includes(search) ||
        (item.commodityEn ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : (data?.items ?? []);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* هدر */}
      <div className="bg-gradient-to-l from-[var(--brand)] to-[var(--forest-deep)] text-white py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-7 w-7" />
            <h1 className="text-2xl font-bold">تحلیل بازار کشاورزی</h1>
          </div>
          <p className="text-[hsl(148_14%_80%)] text-sm">
            اطلاعات نمایشی — تحلیل قیمت، عرضه، تقاضا و روندهای بازار محصولات کشاورزی
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 bg-yellow-400 text-yellow-900 text-xs px-3 py-1 rounded-full font-medium">
            <span>⚠️</span>
            این تحلیل‌ها صرفاً اطلاع‌رسانی هستند و مبنای تصمیم تجاری قرار نمی‌گیرند
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* فیلترها */}
        <div className="bg-white rounded-xl border p-5 mb-6">
          <div className="flex flex-wrap gap-3 items-end">
            {/* جستجو */}
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Search className="inline h-4 w-4 ml-1" />
                جستجوی عنوان یا محصول
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="مثال: گندم، ذرت..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>

            {/* فیلتر نوع */}
            <div className="flex-1 min-w-40">
              <label className="block text-sm font-medium text-gray-700 mb-1">نوع تحلیل</label>
              <select
                title="نوع تحلیل"
                value={insightType ?? ''}
                onChange={(e) => { setInsightType(e.target.value as any || undefined); setPage(1); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
              >
                <option value="">همه انواع</option>
                {Object.entries(INSIGHT_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            {/* فیلتر محصول */}
            <div className="flex-1 min-w-40">
              <label className="block text-sm font-medium text-gray-700 mb-1">محصول</label>
              <input
                type="text"
                value={commodity}
                onChange={(e) => { setCommodity(e.target.value); setPage(1); }}
                placeholder="نام محصول..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>

            {(insightType || commodity) && (
              <button
                onClick={() => { setInsightType(undefined); setCommodity(''); setPage(1); }}
                className="text-sm text-[var(--data-blue)] underline"
              >
                پاک کردن
              </button>
            )}
          </div>
        </div>

        {/* نتایج */}
        {isLoading ? (
          <div className="text-center text-gray-400 py-20">در حال بارگذاری...</div>
        ) : !filteredItems.length ? (
          <div className="text-center text-gray-400 py-20">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>تحلیلی برای نمایش یافت نشد</p>
          </div>
        ) : (
          <>
            {data && <p className="text-sm text-gray-500 mb-4">{data.total} تحلیل یافت شد</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col">
                  {/* هدر کارت */}
                  <div className="flex items-start gap-2 mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${INSIGHT_TYPE_COLORS[item.insightType] ?? 'bg-gray-100 text-gray-700'}`}>
                      {INSIGHT_TYPE_LABELS[item.insightType] ?? item.insightType}
                    </span>
                    <span className="text-xs text-[var(--data-blue)] bg-[hsl(195_56%_33%_/_0.12)] px-2 py-0.5 rounded-full">
                      {item.commodityFa}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2 leading-snug">{item.title}</h3>

                  <p className="text-sm text-gray-600 leading-relaxed flex-1 line-clamp-3">{item.content}</p>

                  {/* فوتر */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-3">
                      {item.dataDate && (
                        <span className="text-xs text-gray-400">
                          داده: {new Date(item.dataDate).toLocaleDateString('fa-IR')}
                        </span>
                      )}
                      {item.publishedAt && (
                        <span className="text-xs text-gray-400">
                          {new Date(item.publishedAt).toLocaleDateString('fa-IR')}
                        </span>
                      )}
                    </div>
                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-[var(--data-blue)] hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        منبع
                      </a>
                    )}
                  </div>

                  {/* تگ‌ها */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {item.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                          <Tag className="h-2.5 w-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* صفحه‌بندی */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  title="صفحه قبل"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-2 rounded-lg border disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-600">صفحه {page} از {totalPages}</span>
                <button
                  title="صفحه بعد"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-2 rounded-lg border disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
