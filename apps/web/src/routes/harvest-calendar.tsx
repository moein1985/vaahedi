import { createFileRoute } from '@tanstack/react-router';
import { trpc } from '../trpc.js';
import { useState } from 'react';
import { Wheat, MapPin, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export const Route = createFileRoute('/harvest-calendar')({
  component: HarvestCalendarPage,
});

const MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

const PROVINCES = [
  'تهران', 'اصفهان', 'خراسان رضوی', 'فارس', 'مازندران', 'آذربایجان شرقی',
  'خوزستان', 'کرمان', 'گیلان', 'سیستان و بلوچستان', 'آذربایجان غربی',
  'کرمانشاه', 'مرکزی', 'گلستان', 'همدان', 'لرستان', 'قزوین', 'زنجان',
  'سمنان', 'بوشهر', 'خراسان شمالی', 'خراسان جنوبی', 'ایلام', 'کهگیلویه و بویراحمد',
  'چهارمحال و بختیاری', 'یزد', 'قم', 'اردبیل', 'البرز', 'هرمزگان',
  'شمال خراسان', 'جنوب خراسان',
];

function HarvestCalendarPage() {
  const now = new Date();
  // تقریب ماه شمسی: ماه میلادی → ماه شمسی تقریبی
  const currentMonth = ((now.getMonth() + 9) % 12) + 1;
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(currentMonth);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.agri.harvest.list.useQuery({
    month: selectedMonth,
    province: selectedProvince || undefined,
    onlyActive: true,
    page,
    limit: 20,
  });

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* هدر */}
      <div className="bg-gradient-to-l from-green-700 to-green-500 text-white py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Wheat className="h-7 w-7" />
            <h1 className="text-2xl font-bold">تقویم برداشت محصول</h1>
          </div>
          <p className="text-green-100 text-sm">
            اطلاعات نمایشی و آگاه‌سازی — فصل‌های برداشت محصولات کشاورزی در مناطق مختلف ایران
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 bg-yellow-400 text-yellow-900 text-xs px-3 py-1 rounded-full font-medium">
            <span>⚠️</span>
            این اطلاعات صرفاً جنبه اطلاع‌رسانی دارد و تعهدی ایجاد نمی‌کند
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* فیلترها */}
        <div className="bg-white rounded-xl border p-5 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            {/* فیلتر ماه */}
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline h-4 w-4 ml-1" />
                ماه برداشت
              </label>
              <select
                title="ماه برداشت"
                value={selectedMonth ?? ''}
                onChange={(e) => { setSelectedMonth(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
              >
                <option value="">همه ماه‌ها</option>
                {MONTH_NAMES.map((name, i) => (
                  <option key={i + 1} value={i + 1}>
                    {name} {i + 1 === currentMonth ? '(ماه جاری)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* فیلتر استان */}
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="inline h-4 w-4 ml-1" />
                استان
              </label>
              <select
                title="استان"
                value={selectedProvince}
                onChange={(e) => { setSelectedProvince(e.target.value); setPage(1); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
              >
                <option value="">همه مناطق</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* دکمه ریست */}
            {(selectedMonth !== undefined || selectedProvince) && (
              <button
                onClick={() => { setSelectedMonth(undefined); setSelectedProvince(''); setPage(1); }}
                className="text-sm text-[var(--data-blue)] underline"
              >
                پاک کردن فیلتر
              </button>
            )}
          </div>
        </div>

        {/* نتایج */}
        {isLoading ? (
          <div className="text-center text-gray-400 py-20">در حال بارگذاری...</div>
        ) : !data?.items.length ? (
          <div className="text-center text-gray-400 py-20">
            <Wheat className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>اطلاعاتی برای نمایش یافت نشد</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{data.total} آیتم یافت شد</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.items.map((item) => (
                <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.cropNameFa}</h3>
                      {item.cropNameEn && <p className="text-xs text-gray-400" dir="ltr">{item.cropNameEn}</p>}
                    </div>
                    {item.variety && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full shrink-0">
                        {item.variety}
                      </span>
                    )}
                  </div>

                  {/* بازه برداشت */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Calendar className="h-4 w-4 text-green-500" />
                    <span>
                      {MONTH_NAMES[item.harvestStartMonth - 1]}
                      {item.harvestStartMonth !== item.harvestEndMonth && ` تا ${MONTH_NAMES[item.harvestEndMonth - 1]}`}
                    </span>
                  </div>

                  {/* استان */}
                  {item.province && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <MapPin className="h-4 w-4 text-[var(--data-blue)]" />
                      <span>{item.province}</span>
                    </div>
                  )}

                  {item.description && (
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">{item.description}</p>
                  )}

                  {/* نوار ماه بصری */}
                  <div className="mt-3 flex gap-0.5">
                    {MONTH_NAMES.map((_, i) => {
                      const m = i + 1;
                      const inRange = m >= item.harvestStartMonth && m <= item.harvestEndMonth;
                      const isCurrent = m === currentMonth;
                      return (
                        <div
                          key={m}
                          title={MONTH_NAMES[i]}
                          className={`h-2 flex-1 rounded-sm ${
                            inRange
                              ? isCurrent
                                ? 'bg-green-600'
                                : 'bg-green-300'
                              : isCurrent
                              ? 'bg-gray-300 ring-1 ring-[var(--data-blue)]'
                              : 'bg-gray-100'
                          }`}
                        />
                      );
                    })}
                  </div>
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
