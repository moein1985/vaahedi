import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { trpc } from '../../../trpc.js';
import { TradeType, ConsultationCategory, CommodityGroup } from '@repo/shared';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '../../../components/ui/card.js';
import { Input } from '../../../components/ui/input.js';
import { Button } from '../../../components/ui/button.js';
import { Badge } from '../../../components/ui/badge.js';
import { Skeleton } from '../../../components/ui/skeleton.js';
import { cn } from '../../../lib/utils.js';
import { useTranslation } from 'react-i18next';
import { FORM_LABELS, FORM_PLACEHOLDERS } from '../../../lib/form-constants.js';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Handshake,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  Filter,
} from 'lucide-react';

export const Route = createFileRoute('/_authenticated/trade/')({
  component: TradePage,
});

const formSchema = z.object({
  type: z.nativeEnum(TradeType),
  productNameFa: z.string().min(2, 'نام فارسی الزامی است'),
  serviceCode: z.string().min(2, 'کد کالا/خدمات الزامی است').max(50),
  supplySourceType: z.enum(['COMPANY', 'FACTORY', 'FARM', 'COOPERATIVE']),
  supplySourceName: z.string().min(2, 'نام مبدا تامین الزامی است').max(150),
  commodityGroup: z.nativeEnum(CommodityGroup).optional(),
  quantity: z.string().min(1, 'مقدار الزامی است'),
  quantityUnit: z.enum(['KG', 'TON', 'PIECE', 'LITER', 'METER']).default('KG'),
  targetPrice: z.string().optional(),
  currency: z.enum(['IRR', 'USD', 'EUR', 'AED']).default('USD'),
  deliveryLocation: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'در انتظار تطابق',
  MATCHED: 'تطابق یافته',
  IN_NEGOTIATION: 'در مذاکره',
  UNDER_REVIEW: 'در بررسی',
  COMPLETED: 'تکمیل شده',
  CANCELLED: 'لغو شده',
};

const STATUS_STEP: Record<string, number> = {
  PENDING: 1,
  MATCHED: 2,
  IN_NEGOTIATION: 3,
  COMPLETED: 4,
  CANCELLED: -1,
  UNDER_REVIEW: 1,
};

const PIPELINE_STEPS = [
  { key: 'PENDING',        label: 'ثبت شد',     icon: Clock },
  { key: 'MATCHED',        label: 'تطابق',       icon: Handshake },
  { key: 'IN_NEGOTIATION', label: 'مذاکره',      icon: ArrowUpCircle },
  { key: 'COMPLETED',      label: 'تکمیل',       icon: CheckCircle2 },
] as const;

const CURRENCY_LABELS: Record<string, string> = {
  USD: 'دلار',
  EUR: 'یورو',
  AED: 'درهم',
  IRR: 'ریال',
};

const QUANTITY_UNIT_LABELS: Record<string, string> = {
  KG: 'کیلوگرم',
  TON: 'تن',
  PIECE: 'عدد',
  LITER: 'لیتر',
  METER: 'متر',
};

const CONSULTATION_LABELS: Record<string, string> = {
  COMMERCIAL: 'بازرگانی',
  TECHNICAL: 'فنی',
  LEGAL: 'حقوقی',
  FINANCIAL: 'مالی',
  CUSTOMS: 'امور گمرکی',
  CURRENCY: 'ارزی',
  COMMODITY_PURCHASE: 'خرید کالایی',
  FOREX_OBLIGATIONS: 'رفع تعهدات ارزی',
  LOGISTICS: 'لجستیک',
};

const COMMODITY_LABELS: Record<string, string> = {
  INDUSTRIAL: 'صنعتی', CHEMICAL: 'شیمیایی', TELECOM: 'مخابراتی', METAL: 'فلزی',
  FOOD: 'غذایی', TEXTILE: 'نساجی', AGRICULTURAL: 'کشاورزی',
  CONSTRUCTION: 'ساختمانی', PETROCHEMICAL: 'پتروشیمی', OTHER: 'سایر',
};

const analysisFormSchema = z.object({
  subject: z.string().min(5, 'موضوع تحلیل الزامی است').max(300),
  consultationCategory: z.string().optional(),
  commodityGroup: z.string().optional(),
  targetMarket: z.string().max(200).optional(),
  description: z.string().min(20, 'شرح درخواست حداقل ۲۰ کاراکتر').max(3000),
});

type AnalysisFormData = z.infer<typeof analysisFormSchema>;

function TradePage() {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [showAnalysisForm, setShowAnalysisForm] = useState(false);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'MATCHED' | 'IN_NEGOTIATION' | 'COMPLETED'>('ALL');
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.trade.myRequests.useQuery({
    page,
    limit: 15,
    type: typeFilter !== 'ALL' ? (typeFilter as TradeType) : undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
  });
  const { data: stats } = trpc.trade.myStats.useQuery();
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
    defaultValues: {
      type: TradeType.BUY,
      currency: 'USD',
      supplySourceType: 'COMPANY',
      quantityUnit: 'KG',
    },
  });

  const analysisReq = trpc.trade.requestAnalysis.useMutation({
    onSuccess: () => {
      setShowAnalysisForm(false);
      analysisReset();
    },
  });

  const {
    register: analysisRegister,
    handleSubmit: analysisHandleSubmit,
    reset: analysisReset,
    formState: { errors: analysisErrors },
  } = useForm<AnalysisFormData>({
    resolver: zodResolver(analysisFormSchema) as any,
  });

  const items = data?.items ?? [];

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RFQ و درخواست‌های تجاری</h1>
          <p className="text-gray-500 text-sm mt-1">ثبت و پیگیری درخواست‌های خرید و فروش (محصولات کشاورزی و سایر کالاها)</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAnalysisForm(true)} variant="outline">تحلیل RFQ</Button>
          <Button onClick={() => setShowForm(true)}>+ RFQ جدید</Button>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'کل', value: stats.total, color: 'bg-gray-50 text-gray-700', onClick: () => setStatusFilter('ALL') },
            { label: 'در انتظار', value: stats.pending, color: 'bg-amber-50 text-amber-700', onClick: () => setStatusFilter('PENDING') },
            { label: 'تطابق یافته', value: stats.matched, color: 'bg-green-50 text-green-700', onClick: () => setStatusFilter('MATCHED') },
            { label: 'در مذاکره', value: stats.inNegotiation, color: 'bg-blue-50 text-blue-700', onClick: () => setStatusFilter('IN_NEGOTIATION') },
          ].map(({ label, value, color, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className={`rounded-xl p-3 text-right border transition-all hover:shadow-sm ${color} border-transparent`}
            >
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs mt-0.5 opacity-80">{label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <button onClick={() => setShowForm(true)} className="text-right bg-white border border-gray-200 hover:border-blue-300 rounded-xl p-4 transition-colors">
          <p className="font-semibold text-gray-900">ثبت RFQ خرید یا فروش</p>
          <p className="text-xs text-gray-500 mt-1">نوع درخواست، مقدار، مبدا تامین (مزرعه / شرکت / تعاونی) و قیمت هدف را سریع ثبت کنید.</p>
        </button>
        <button onClick={() => setShowAnalysisForm(true)} className="text-right bg-white border border-gray-200 hover:border-violet-300 rounded-xl p-4 transition-colors">
          <p className="font-semibold text-gray-900">درخواست تحلیل بازرگانی</p>
          <p className="text-xs text-gray-500 mt-1">برای تصمیم بهتر روی RFQ، تحلیل بازار و مشاوره هدفمند بگیرید.</p>
        </button>
        <a href="/catalog" target="_blank" rel="noopener noreferrer" className="bg-white border border-gray-200 hover:border-emerald-300 rounded-xl p-4 transition-colors">
          <p className="font-semibold text-gray-900">مرور Marketplace</p>
          <p className="text-xs text-gray-500 mt-1">قبل از ثبت RFQ، کالاهای فعال بازار را بررسی کنید.</p>
        </a>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Filter className="h-3.5 w-3.5" />
          فیلتر:
        </div>
        <div className="flex gap-1">
          {(['ALL', 'BUY', 'SELL'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setTypeFilter(f); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-xs border transition-colors ${typeFilter === f ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
            >
              {{ ALL: 'همه', BUY: 'خرید', SELL: 'فروش' }[f]}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(['ALL', 'PENDING', 'MATCHED', 'IN_NEGOTIATION', 'COMPLETED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setStatusFilter(f); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-xs border transition-colors ${statusFilter === f ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
            >
              {{ ALL: 'همه وضعیت', PENDING: 'در انتظار', MATCHED: 'تطابق', IN_NEGOTIATION: 'مذاکره', COMPLETED: 'تکمیل' }[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Analysis Request Modal */}
      {showAnalysisForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">درخواست تحلیل بازرگانی</h2>
              <button onClick={() => { setShowAnalysisForm(false); analysisReset(); }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            <form onSubmit={analysisHandleSubmit((d) => analysisReq.mutate(d as any))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">موضوع تحلیل <span className="text-red-500">*</span></label>
                <Input {...analysisRegister('subject')} placeholder="مثال: بررسی بازار فولاد ترکیه" />
                {analysisErrors.subject && <p className="text-red-500 text-xs mt-1">{analysisErrors.subject.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">دسته‌بندی مشاوره</label>
                  <select
                    {...analysisRegister('consultationCategory')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">انتخاب کنید</option>
                    {Object.entries(CONSULTATION_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">گروه کالایی</label>
                  <select
                    {...analysisRegister('commodityGroup')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">انتخاب کنید</option>
                    {Object.entries(COMMODITY_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">بازار هدف</label>
                <Input {...analysisRegister('targetMarket')} placeholder="مثال: ترکیه، عراق، امارات" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">شرح درخواست <span className="text-red-500">*</span></label>
                <textarea {...analysisRegister('description')} rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="توضیحات کامل درباره نیاز تحلیلی خود..." />
                {analysisErrors.description && <p className="text-red-500 text-xs mt-1">{analysisErrors.description.message}</p>}
              </div>

              {analysisReq.error && <p className="text-red-500 text-sm">{analysisReq.error.message}</p>}
              {analysisReq.isSuccess && <p className="text-green-600 text-sm">درخواست تحلیل بازرگانی ثبت شد</p>}

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" loading={analysisReq.isPending}>ثبت درخواست تحلیل</Button>
                <Button variant="secondary" type="button" onClick={() => { setShowAnalysisForm(false); analysisReset(); }}>انصراف</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">ثبت RFQ جدید (درخواست تجاری جدید)</h2>
              <button
                onClick={() => { setShowForm(false); reset(); }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit((d) => {
              const payload = { ...d, commodityGroup: d.commodityGroup || undefined };
              createReq.mutate(payload as any);
            })} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع RFQ</label>
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
                  {FORM_LABELS.trade.productNameFa} <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register('productNameFa')}
                  className="w-full"
                  placeholder={FORM_PLACEHOLDERS.trade.productNameFa}
                />
                {errors.productNameFa && (
                  <p className="text-red-500 text-xs mt-1">{errors.productNameFa.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {FORM_LABELS.trade.serviceCode} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register('serviceCode')}
                    className="w-full"
                    placeholder={FORM_PLACEHOLDERS.trade.serviceCode}
                  />
                  {errors.serviceCode && (
                    <p className="text-red-500 text-xs mt-1">{errors.serviceCode.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {FORM_LABELS.trade.supplySourceType} <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('supplySourceType')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="COMPANY">شرکت</option>
                    <option value="FACTORY">کارخانه</option>
                    <option value="FARM">مزرعه / باغ</option>
                    <option value="COOPERATIVE">تعاونی کشاورزی</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {FORM_LABELS.trade.supplySourceName} <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register('supplySourceName')}
                  className="w-full"
                  placeholder={FORM_PLACEHOLDERS.trade.supplySourceName}
                />
                {errors.supplySourceName && (
                  <p className="text-red-500 text-xs mt-1">{errors.supplySourceName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{FORM_LABELS.trade.commodityGroup}</label>
                <select
                  {...register('commodityGroup')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- انتخاب گروه کالایی (اختیاری) --</option>
                  {Object.entries(COMMODITY_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {FORM_LABELS.trade.quantity} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register('quantity')}
                    className="w-full"
                    placeholder={FORM_PLACEHOLDERS.trade.quantity}
                  />
                  {errors.quantity && (
                    <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {FORM_LABELS.trade.quantityUnit} <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('quantityUnit')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(QUANTITY_UNIT_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{FORM_LABELS.trade.currency}</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">{FORM_LABELS.trade.targetPrice}</label>
                <Input
                  {...register('targetPrice')}
                  className="w-full"
                  placeholder="اختیاری"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{FORM_LABELS.trade.deliveryLocation}</label>
                <Input
                  {...register('deliveryLocation')}
                  className="w-full"
                  placeholder="اختیاری"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{FORM_LABELS.trade.notes}</label>
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
                  ثبت درخواست (RFQ)
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
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📋</div>
          {(data?.pagination.total ?? 0) === 0 && typeFilter === 'ALL' && statusFilter === 'ALL' ? (
            <>
              <p className="mb-4 text-gray-500">هنوز RFQ ثبت نشده</p>
              <Button onClick={() => setShowForm(true)}>اولین RFQ را ثبت کنید</Button>
            </>
          ) : (
            <p className="text-gray-500">با فیلتر فعلی موردی یافت نشد</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const step = item.status === 'CANCELLED' ? -1 : (STATUS_STEP[item.status] ?? 1);
            const isCancelled = item.status === 'CANCELLED';
            return (
              <Card key={item.id} className={cn('hover:shadow-md transition-shadow', isCancelled && 'opacity-60')}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    {/* Left: info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant={item.type === TradeType.BUY ? 'blue' : 'green'} className="text-xs shrink-0">
                          {item.type === TradeType.BUY
                            ? <><ArrowDownCircle className="h-3 w-3 ml-1 inline" />خرید</>
                            : <><ArrowUpCircle className="h-3 w-3 ml-1 inline" />فروش</>
                          }
                        </Badge>
                        <h3 className="font-semibold text-gray-900 truncate">
                          {item.productNameFa ?? item.product?.nameFa ?? '—'}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 mt-1">
                        <span>مقدار: <span className="font-medium text-gray-700">{String(item.quantity ?? '').replace(/\s*undefined\s*/g, '').trim() || '—'}</span></span>
                        {item.targetPrice && (
                          <span>قیمت هدف: <span className="font-medium text-gray-700">{item.targetPrice} {CURRENCY_LABELS[item.currency] ?? item.currency}</span></span>
                        )}
                        {item.deliveryLocation && <span>تحویل: {item.deliveryLocation}</span>}
                        <span className="text-gray-400">{new Date(item.createdAt).toLocaleDateString('fa-IR')}</span>
                      </div>
                      {item.notes && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{item.notes}</p>
                      )}
                    </div>
                    {/* Right: detail link */}
                    <Link
                      to="/trade/$id"
                      params={{ id: item.id }}
                      className="shrink-0 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      جزئیات
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {/* Pipeline Timeline */}
                  {!isCancelled ? (
                    <div className="flex items-center gap-0 mt-1">
                      {PIPELINE_STEPS.map((s, idx) => {
                        const done = step > idx;
                        const active = step === idx + 1;
                        const Icon = s.icon;
                        return (
                          <div key={s.key} className="flex items-center flex-1">
                            <div className={cn(
                              'flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors',
                              done && 'text-green-700',
                              active && 'bg-blue-50 text-blue-700 font-semibold',
                              !done && !active && 'text-gray-300',
                            )}>
                              <Icon className="h-3.5 w-3.5 shrink-0" />
                              <span className="hidden sm:inline">{s.label}</span>
                            </div>
                            {idx < PIPELINE_STEPS.length - 1 && (
                              <div className={cn('flex-1 h-px mx-1', done ? 'bg-green-300' : 'bg-gray-200')} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-red-500 mt-1">
                      <XCircle className="h-3.5 w-3.5" />
                      لغو شده
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {data && data.pagination.total > data.pagination.limit && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            قبلی
          </Button>
          <span className="px-3 py-1.5 text-sm text-gray-600">صفحه {page}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={items.length < (data?.pagination.limit ?? 15)}>
            بعدی
          </Button>
        </div>
      )}
    </div>
  );
}
