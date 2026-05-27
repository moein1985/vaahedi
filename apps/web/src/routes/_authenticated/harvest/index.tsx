import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { trpc } from '../../../trpc.js';
import { Wheat, MapPin, Calendar, ChevronLeft, ChevronRight, Filter, Info } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/harvest/')({
  component: HarvestCalendarPage,
});

const MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

const MONTH_COLORS = [
  'bg-green-100 text-green-800',   // 1 - فروردین
  'bg-green-200 text-green-900',   // 2 - اردیبهشت
  'bg-yellow-100 text-yellow-800', // 3 - خرداد
  'bg-yellow-200 text-yellow-900', // 4 - تیر
  'bg-orange-100 text-orange-800', // 5 - مرداد
  'bg-orange-200 text-orange-900', // 6 - شهریور
  'bg-amber-100 text-amber-800',   // 7 - مهر
  'bg-amber-200 text-amber-900',   // 8 - آبان
  'bg-blue-100 text-blue-800',     // 9 - آذر
  'bg-blue-200 text-blue-900',     // 10 - دی
  'bg-indigo-100 text-indigo-800', // 11 - بهمن
  'bg-indigo-200 text-indigo-900', // 12 - اسفند
];

// ماه جاری شمسی (تقریبی)
function getCurrentShamsiMonth(): number {
  const now = new Date();
  const m = now.getMonth() + 1; // 1-12 میلادی
  // تبدیل تقریبی ماه میلادی به شمسی
  const shamsiMap: Record<number, number> = {
    1: 10, 2: 11, 3: 12, 4: 1, 5: 2, 6: 3,
    7: 4, 8: 5, 9: 6, 10: 7, 11: 8, 12: 9,
  };
  return shamsiMap[m] ?? 1;
}

function HarvestCalendarPage() {
  const currentMonth = getCurrentShamsiMonth();
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(currentMonth);
  const [province, setProvince] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.agri.harvest.list.useQuery({
    onlyActive: true,
    month: selectedMonth,
    province: province || undefined,
    page,
    limit: 20,
  });

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="p-5 max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Wheat className="h-5 w-5 text-emerald-600" />
          <h1 className="text-xl font-bold text-gray-900">تقویم برداشت محصولات کشاورزی</h1>
        </div>
        <p className="text-sm text-gray-500">فصل برداشت محصولات کشاورزی در استان‌های مختلف ایران</p>
      </div>

      {/* Disclaimer */}
      <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700">
          این اطلاعات صرفاً جنبه اطلاع‌رسانی و آگاه‌سازی دارد. زمان دقیق برداشت بسته به شرایط آب‌وهوایی، منطقه و رقم محصول متفاوت است. برای برنامه‌ریزی دقیق به متخصصان کشاورزی منطقه مراجعه کنید.
        </p>
      </div>

      {/* Month selector */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          فیلتر بر اساس ماه
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setSelectedMonth(undefined); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedMonth === undefined
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            همه ماه‌ها
          </button>
          {MONTH_NAMES.map((name, i) => (
            <button
              key={i + 1}
              onClick={() => { setSelectedMonth(i + 1); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedMonth === i + 1
                  ? 'bg-emerald-600 text-white'
                  : `${MONTH_COLORS[i]} hover:opacity-80`
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Province filter */}
      <div className="mb-5 flex items-center gap-3">
        <Filter className="h-4 w-4 text-gray-400 shrink-0" />
        <input
          type="text"
          value={province}
          onChange={(e) => { setProvince(e.target.value); setPage(1); }}
          placeholder="فیلتر استان (مثال: خراسان رضوی)"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-emerald-300"
        />
        {province && (
          <button onClick={() => { setProvince(''); setPage(1); }} className="text-xs text-gray-400 hover:text-gray-600">
            پاک کردن
          </button>
        )}
      </div>

      {/* Results count */}
      {!isLoading && data && (
        <p className="text-xs text-gray-400 mb-4">
          {data.total} محصول یافت شد
          {selectedMonth && ` برای ماه ${MONTH_NAMES[selectedMonth - 1]}`}
          {province && ` در استان ${province}`}
        </p>
      )}

      {/* Cards */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-32" />
          ))}
        </div>
      ) : data?.items?.length === 0 ? (
        <div className="text-center py-16">
          <Wheat className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">برای این بازه زمانی یا استان اطلاعاتی ثبت نشده است.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {data?.items?.map((item) => (
            <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-4 hover:border-emerald-200 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{item.cropNameFa}</h3>
                  {item.cropNameEn && (
                    <p className="text-xs text-gray-400 dir-ltr">{item.cropNameEn}</p>
                  )}
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${MONTH_COLORS[(item.harvestStartMonth - 1) % 12]}`}>
                  {MONTH_NAMES[item.harvestStartMonth - 1]}
                  {item.harvestEndMonth !== item.harvestStartMonth && ` — ${MONTH_NAMES[item.harvestEndMonth - 1]}`}
                </span>
              </div>

              <div className="space-y-1">
                {item.province && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {item.province}
                  </p>
                )}
                {item.variety && (
                  <p className="text-xs text-gray-500">🌱 رقم: {item.variety}</p>
                )}
                {item.description && (
                  <p className="text-xs text-gray-400 line-clamp-2 mt-1">{item.description}</p>
                )}
              </div>

              {/* Month bar */}
              <div className="mt-3 flex gap-1">
                {MONTH_NAMES.map((_, idx) => {
                  const m = idx + 1;
                  const inRange = m >= item.harvestStartMonth && m <= item.harvestEndMonth;
                  return (
                    <div
                      key={m}
                      title={MONTH_NAMES[idx]}
                      className={`h-1.5 flex-1 rounded-full ${inRange ? 'bg-emerald-500' : 'bg-gray-100'}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            title="صفحه قبل"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-600">صفحه {page} از {totalPages}</span>
          <button
            title="صفحه بعد"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
