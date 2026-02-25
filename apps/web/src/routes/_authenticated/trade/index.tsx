import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { trpc } from '../../../trpc.js';
import { TradeType } from '@repo/shared';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '../../../components/ui/card.js';
import { Input } from '../../../components/ui/input.js';
import { Button } from '../../../components/ui/button.js';
import { Badge } from '../../../components/ui/badge.js';
import { cn } from '../../../lib/utils.js';

export const Route = createFileRoute('/_authenticated/trade/')({
  component: TradePage,
});

const formSchema = z.object({
  type: z.nativeEnum(TradeType),
  productNameFa: z.string().min(2, 'نام فارسی الزامی است'),
  quantity: z.string().min(1, 'مقدار الزامی است'),
  targetPrice: z.string().optional(),
  currency: z.enum(['IRR', 'USD', 'EUR', 'AED']).default('USD'),
  deliveryLocation: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'در انتظار',
  MATCHED: 'مطابقت یافت',
  IN_NEGOTIATION: 'در مذاکره',
  UNDER_REVIEW: 'در بررسی',
  COMPLETED: 'تکمیل شده',
  CANCELLED: 'لغو شده',
};

const CURRENCY_LABELS: Record<string, string> = {
  USD: 'دلار',
  EUR: 'یورو',
  AED: 'درهم',
  IRR: 'ریال',
};

function TradePage() {
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.trade.myRequests.useQuery({ page, limit: 15 });
  const createReq = trpc.trade.createRequest.useMutation({
    onSuccess: () => {
      void utils.trade.myRequests.invalidate();
      setShowForm(false);
      reset();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: { type: TradeType.BUY, currency: 'USD' },
  });

  const items = data?.items ?? [];

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">درخواست‌های تجاری</h1>
          <p className="text-gray-500 text-sm mt-1">مدیریت خرید و فروش کالا</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="">+ درخواست جدید</Button>
      </div>

      {/* New Request Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">درخواست تجاری جدید</h2>
              <button
                onClick={() => { setShowForm(false); reset(); }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit((d) => createReq.mutate(d as any))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع درخواست</label>
                <select
                  {...register('type')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={TradeType.BUY}>خرید</option>
                  <option value={TradeType.SELL}>فروش</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  نام کالا (فارسی) <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register('productNameFa')}
                  className="w-full"
                  placeholder="مثال: فولاد آلیاژی"
                />
                {errors.productNameFa && (
                  <p className="text-red-500 text-xs mt-1">{errors.productNameFa.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    مقدار <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register('quantity')}
                    className="w-full"
                    placeholder="مثال: ۱۰۰ تن"
                  />
                  {errors.quantity && (
                    <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ارز</label>
                  <select
                    {...register('currency')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(CURRENCY_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">قیمت هدف</label>
                <Input
                  {...register('targetPrice')}
                  className="w-full"
                  placeholder="اختیاری"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">محل تحویل</label>
                <Input
                  {...register('deliveryLocation')}
                  className="w-full"
                  placeholder="اختیاری"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">یادداشت</label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="input-field w-full resize-none"
                />
              </div>

              {createReq.error && (
                <p className="text-red-500 text-sm">{createReq.error.message}</p>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" loading={createReq.isPending}>
                  ثبت درخواست
                </Button>
                <Button variant="secondary" type="button" onClick={() => { setShowForm(false); reset(); }}>
                  انصراف
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">در حال بارگذاری...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📋</div>
          <p>هنوز درخواست تجاری ثبت نشده</p>
          <Button onClick={() => setShowForm(true)} className="mt-4">
            اولین درخواست را ثبت کنید
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-blue-200 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={item.type === TradeType.BUY ? 'blue' : 'green'} className="px-2 py-0.5">
                      {item.type === TradeType.BUY ? 'خرید' : 'فروش'}
                    </Badge>
                    <h3 className="font-semibold text-gray-900">
                      {item.productNameFa ?? item.product?.nameFa ?? '—'}
                    </h3>
                  </div>
                  <div className="text-sm text-gray-500">
                    مقدار: {item.quantity}
                    {item.targetPrice && ` · قیمت: ${item.targetPrice} ${CURRENCY_LABELS[item.currency] ?? item.currency}`}
                    {item.deliveryLocation && ` · ${item.deliveryLocation}`}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    variant={
                      item.status === 'MATCHED' ? 'success' :
                      item.status === 'PENDING' ? 'warning' :
                      'outline'
                    }
                    className="px-2 py-1 flex-shrink-0"
                  >
                    {STATUS_LABELS[item.status] ?? item.status}
                  </Badge>
                  <Link
                    to="/trade/$id"
                    params={{ id: item.id }}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    مشاهده جزئیات
                  </Link>
                </div>
              </div>
              {item.notes && (
                <p className="text-xs text-gray-400 mt-2 line-clamp-1">{item.notes}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                {new Date(item.createdAt).toLocaleDateString('fa-IR')}
              </p>
            </div>
          ))}
        </div>
      )}

      {data && data.pagination.total > data.pagination.limit && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            قبلی
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">
            صفحه {page}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={items.length < data.pagination.limit}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            بعدی
          </button>
        </div>
      )}
    </div>
  );
}
