import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { trpc } from '../../../trpc.js';
import { TrendingUp, Info, Filter, ChevronLeft, ChevronRight, ExternalLink, Tag } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/market-insights/')({
  component: MarketInsightsPage,
});

const INSIGHT_TYPE_LABELS: Record<string, string> = {
  price:      'قیمت',
  demand:     'تقاضا',
  supply:     'عرضه',
  trend:      'روند بازار',
  regulation: 'مقررات',
};

const INSIGHT_TYPE_COLORS: Record<string, string> = {
  price:      'bg-[hsl(195_56%_33%_/_0.12)] text-[var(--data-blue)]',
  demand:     'bg-green-100 text-green-800',
  supply:     'bg-amber-100 text-amber-800',
  trend:      'bg-purple-100 text-purple-800',
  regulation: 'bg-red-100 text-red-800',
};

function MarketInsightsPage() {
  const [insightType, setInsightType] = useState('');
  const [commodity, setCommodity] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = trpc.agri.market.list.useQuery({
    onlyPublished: true,
    insightType: (insightType || undefined) as 'price' | 'demand' | 'supply' | 'trend' | 'regulation' | undefined,
    commodity: commodity || undefined,
    page,
    limit: 10,
  });

  const totalPages = data ? Math.ceil(data.total / 10) : 1;

  return (
    <div className="p-5 max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-5 w-5 text-[var(--data-blue)]" />
          <h1 className="text-xl font-bold text-foreground">تحلیل بازار کشاورزی</h1>
        </div>
        <p className="text-sm text-muted-foreground">تحلیل قیمت، عرضه، تقاضا و روند بازار محصولات کشاورزی</p>
      </div>

      {/* Disclaimer */}
      <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700">
          اطلاعات این صفحه صرفاً جنبه اطلاع‌رسانی دارد و هیچ‌گونه توصیه سرمایه‌گذاری یا تعهد تجاری محسوب نمی‌شود. برای تصمیم‌گیری‌های مهم به منابع رسمی و متخصصین مراجعه کنید.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground/70 shrink-0" />
          <select
            title="نوع تحلیل"
            value={insightType}
            onChange={(e) => { setInsightType(e.target.value); setPage(1); }}
            className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--data-blue)]"
          >
            <option value="">همه انواع</option>
            {Object.entries(INSIGHT_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <input
          type="text"
          value={commodity}
          onChange={(e) => { setCommodity(e.target.value); setPage(1); }}
          placeholder="جستجو بر اساس محصول..."
          className="border border-border rounded-lg px-3 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-[var(--data-blue)]"
        />
        {(insightType || commodity) && (
          <button
            onClick={() => { setInsightType(''); setCommodity(''); setPage(1); }}
            className="text-xs text-muted-foreground/70 hover:text-foreground"
          >
            پاک کردن فیلترها
          </button>
        )}
      </div>

      {/* Type badges quick filter */}
      <div className="mb-5 flex flex-wrap gap-2">
        {Object.entries(INSIGHT_TYPE_LABELS).map(([val, label]) => (
          <button
            key={val}
            onClick={() => { setInsightType(insightType === val ? '' : val); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
              insightType === val
                ? 'border-[var(--data-blue)] bg-[var(--data-blue)] text-white'
                : `${INSIGHT_TYPE_COLORS[val]} border-transparent hover:border-current`
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Results */}
      {!isLoading && data && (
        <p className="text-xs text-muted-foreground/70 mb-4">{data.total} تحلیل یافت شد</p>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-muted rounded-xl h-28" />
          ))}
        </div>
      ) : data?.items?.length === 0 ? (
        <div className="text-center py-16">
          <TrendingUp className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">تحلیلی برای این فیلترها یافت نشد.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.items?.map((item) => {
            const isExpanded = expandedId === item.id;
            const typeColor = INSIGHT_TYPE_COLORS[item.insightType] ?? 'bg-muted text-muted-foreground';
            const typeLabel = INSIGHT_TYPE_LABELS[item.insightType] ?? item.insightType;

            return (
              <div key={item.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-[hsl(195_36%_76%)] transition-colors">
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${typeColor}`}>
                          {typeLabel}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">{item.commodityFa}</span>
                        {item.commodityEn && (
                          <span className="text-xs text-muted-foreground/70" dir="ltr">{item.commodityEn}</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground text-sm leading-snug">{item.title}</h3>
                    </div>
                    <div className="text-xs text-muted-foreground/70 shrink-0 text-left">
                      {item.dataDate && (
                        <p>{new Date(item.dataDate).toLocaleDateString('fa-IR')}</p>
                      )}
                      <p className="mt-0.5">{isExpanded ? '▲ بستن' : '▼ بیشتر'}</p>
                    </div>
                  </div>

                  {/* Tags */}
                  {item.tags?.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      <Tag className="h-3 w-3 text-muted-foreground/40" />
                      {item.tags.map((tag: string) => (
                        <span key={tag} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border/70">
                    <p className="text-sm text-foreground leading-relaxed mt-3 whitespace-pre-wrap">{item.content}</p>
                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center gap-1 text-xs text-[var(--data-blue)] hover:text-[var(--agri-primary)]"
                      >
                        <ExternalLink className="h-3 w-3" />
                        منبع اطلاعات
                      </a>
                    )}
                    {item.publishedAt && (
                      <p className="mt-2 text-[11px] text-muted-foreground/70">
                        تاریخ انتشار: {new Date(item.publishedAt).toLocaleDateString('fa-IR')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            title="صفحه قبل"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="p-2 rounded-lg border border-border disabled:opacity-40 hover:bg-muted/50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="text-sm text-muted-foreground">صفحه {page} از {totalPages}</span>
          <button
            title="صفحه بعد"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="p-2 rounded-lg border border-border disabled:opacity-40 hover:bg-muted/50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
