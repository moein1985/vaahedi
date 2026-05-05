import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { trpc } from '../../../trpc.js';
import { createProductSchema, CommodityGroup, ProductOrigin, DeliveryTerms, PaymentMethod } from '@repo/shared';
import type { z } from 'zod';
import { toast } from 'sonner';
import { getFriendlyTrpcError } from '../../../lib/trpc-error.js';
import { FORM_LABELS, FORM_PLACEHOLDERS, FORM_HINTS, FORM_ERRORS } from '../../../lib/form-constants.js';

const CREATED_ID_STORAGE_KEY = 'vaahedi:new-product-created-id';
const CREATED_ID_TS_STORAGE_KEY = 'vaahedi:new-product-created-at';
const CREATED_ID_TTL_MS = 5 * 60 * 1000;

function loadRecentCreatedProductId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const createdId = window.sessionStorage.getItem(CREATED_ID_STORAGE_KEY);
  const createdAtRaw = window.sessionStorage.getItem(CREATED_ID_TS_STORAGE_KEY);
  const createdAt = createdAtRaw ? Number(createdAtRaw) : 0;

  if (!createdId || !createdAt || Number.isNaN(createdAt)) {
    return null;
  }

  const isFresh = Date.now() - createdAt <= CREATED_ID_TTL_MS;
  if (!isFresh) {
    window.sessionStorage.removeItem(CREATED_ID_STORAGE_KEY);
    window.sessionStorage.removeItem(CREATED_ID_TS_STORAGE_KEY);
    return null;
  }

  return createdId;
}

function persistCreatedProductId(createdId: string | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!createdId) {
    window.sessionStorage.removeItem(CREATED_ID_STORAGE_KEY);
    window.sessionStorage.removeItem(CREATED_ID_TS_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(CREATED_ID_STORAGE_KEY, createdId);
  window.sessionStorage.setItem(CREATED_ID_TS_STORAGE_KEY, String(Date.now()));
}

export const Route = createFileRoute('/_authenticated/products/new')({
  component: NewProductPage,
});

type NewProductForm = z.infer<typeof createProductSchema>;

const COMMODITY_OPTIONS = Object.values(CommodityGroup).map((v) => ({
  value: v,
  label: { INDUSTRIAL: 'صنعتی', CHEMICAL: 'شیمیایی', TELECOM: 'مخابراتی', METAL: 'فلزی',
    FOOD: 'غذایی', TEXTILE: 'نساجی', AGRICULTURAL: 'کشاورزی', CONSTRUCTION: 'ساختمانی', PETROCHEMICAL: 'پتروشیمی', OTHER: 'سایر' }[v] ?? v,
}));

const ORIGIN_OPTIONS = [
  { value: ProductOrigin.DOMESTIC_FACTORY, label: 'تولید داخلی' },
  { value: ProductOrigin.KNOWLEDGE_BASED, label: 'دانش‌بنیان' },
  { value: ProductOrigin.IMPORTED, label: 'وارداتی' },
];

const DELIVERY_OPTIONS = [
  { value: DeliveryTerms.EXW, label: 'EXW - تحویل در کارخانه' },
  { value: DeliveryTerms.FCA, label: 'FCA - تحویل آزاد' },
  { value: DeliveryTerms.FOB, label: 'FOB - آزاد روی عرشه' },
];

const PAYMENT_OPTIONS = [
  { value: PaymentMethod.LC, label: 'LC - اعتبار اسنادی' },
  { value: PaymentMethod.SBLC, label: 'SBLC - اعتبار اسنادی جایگزین' },
  { value: PaymentMethod.TT, label: 'TT - حواله بانکی' },
];

const PACKAGING_OPTIONS = [
  { value: 'BULK', label: 'فله' },
  { value: 'JUMBO_BAG', label: 'جامبوبگ' },
  { value: 'SACK', label: 'کیسه' },
  { value: 'TANK', label: 'تانکر' },
  { value: 'PALLET', label: 'پالت' },
  { value: 'CARTON', label: 'کارتن' },
  { value: 'DRUM', label: 'بشکه' },
  { value: 'OTHER', label: 'سایر' },
];

const STEP_ONE_FIELDS = ['nameFa', 'nameEn', 'commodityGroup', 'origin', 'hsCode', 'technicalSpecs'] as const;
const STEP_TWO_FIELDS = ['minOrderQuantity', 'preparationTimeDays', 'deliveryTerms', 'deliveryLocation', 'paymentMethod'] as const;

function NewProductPage() {
  const navigate = useNavigate();
  const [createdId, setCreatedId] = useState<string | null>(() => loadRecentCreatedProductId());
  const [step, setStep] = useState(1);
  const [submitReady, setSubmitReady] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<{ name: string; status: 'pending' | 'uploading' | 'done' | 'error'; preview?: string; file?: File; errorMsg?: string }[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const setCreatedProductId = (id: string | null) => {
    setCreatedId(id);
    persistCreatedProductId(id);
  };

  const MAX_MEDIA_SIZE_BYTES = 25 * 1024 * 1024;
  const allowedMimePrefixes = ['image/', 'video/'];
  const allowedMimeExact = ['application/pdf'];

  useEffect(() => {
    if (step !== 3) {
      setSubmitReady(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setSubmitReady(true);
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [step]);

  const { register, handleSubmit, trigger, formState: { errors } } = useForm<NewProductForm>({
    resolver: zodResolver(createProductSchema) as any,
    defaultValues: {
      isAvailableInStock: false,
      preparationTimeDays: 7,
      dimensions: { unit: 'kg' },
    },
  });

  const createMutation = trpc.product.create.useMutation();

  const uploadMedia = trpc.product.uploadMedia.useMutation();

  const getFilePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  const handleMediaFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !createdId) return;
    setMediaError(null);

    const invalidFile = files.find((file) => {
      const hasAllowedMime = allowedMimePrefixes.some((prefix) => file.type.startsWith(prefix))
        || allowedMimeExact.includes(file.type);
      return !hasAllowedMime;
    });

    if (invalidFile) {
      setMediaError(`فرمت فایل ${invalidFile.name} مجاز نیست. فقط تصویر، ویدیو یا PDF قابل آپلود است.`);
      if (mediaInputRef.current) mediaInputRef.current.value = '';
      return;
    }

    const oversizedFile = files.find((file) => file.size > MAX_MEDIA_SIZE_BYTES);
    if (oversizedFile) {
      setMediaError(`حجم فایل ${oversizedFile.name} بیشتر از ۲۵ مگابایت است.`);
      if (mediaInputRef.current) mediaInputRef.current.value = '';
      return;
    }

    setUploadingMedia(true);
    const newEntries = await Promise.all(
      files.map(async (f) => {
        const preview = await getFilePreview(f);
        return { name: f.name, status: 'pending' as const, preview, file: f };
      })
    );
    setMediaFiles((prev) => [...prev, ...newEntries]);
    const startIdx = mediaFiles.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;
      const idx = startIdx + i;
      setMediaFiles((prev) => prev.map((m, j) => j === idx ? { ...m, status: 'uploading' } : m));
      try {
        // Convert file to base64
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        // Remove data:image/jpeg;base64, prefix
        const base64 = base64Data.split(',')[1] ?? base64Data;

        await uploadMedia.mutateAsync({
          productId: createdId,
          fileName: file.name,
          mimeType: file.type || 'image/jpeg',
          base64Data: base64,
          isMain: i === 0 && mediaFiles.length === 0,
        });
        setMediaFiles((prev) => prev.map((m, j) => j === idx ? { ...m, status: 'done' } : m));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'خطای نامشخص در آپلود';
        setMediaFiles((prev) => prev.map((m, j) => j === idx ? { ...m, status: 'error', errorMsg } : m));
      }
    }
    setUploadingMedia(false);
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  const resolveCreatedProductId = (payload: unknown): string | null => {
    const data = payload as any;
    const batchedItem = Array.isArray(data) ? data[0] : null;

    return (
      (typeof data?.id === 'string' && data.id)
      || (typeof data?.json?.id === 'string' && data.json.id)
      || (typeof data?.result?.data?.json?.id === 'string' && data.result.data.json.id)
      || (typeof batchedItem?.id === 'string' && batchedItem.id)
      || (typeof batchedItem?.json?.id === 'string' && batchedItem.json.id)
      || (typeof batchedItem?.result?.data?.json?.id === 'string' && batchedItem.result.data.json.id)
      || null
    );
  };

  const onSubmit = async (data: NewProductForm) => {
    try {
      const result = await createMutation.mutateAsync(data);
      const createdProductId = resolveCreatedProductId(result);

      if (!createdProductId) {
        console.error('[product.create] missing id in response', result);
        toast.error('ثبت محصول انجام شد اما شناسه محصول دریافت نشد');
        return;
      }

      setCreatedProductId(createdProductId);
      toast.success('محصول با موفقیت ثبت شد');
    } catch (error) {
      toast.error(getFriendlyTrpcError(error, 'ثبت محصول انجام نشد'));
    }
  };

  const onInvalidSubmit = (formErrors: FieldErrors<NewProductForm>) => {
    const hasStepOneError = Boolean(
      formErrors.nameFa
      || formErrors.nameEn
      || formErrors.commodityGroup
      || formErrors.origin
      || formErrors.hsCode
      || formErrors.technicalSpecs,
    );

    const hasStepTwoError = Boolean(
      formErrors.minOrderQuantity
      || formErrors.preparationTimeDays
      || formErrors.deliveryTerms
      || formErrors.deliveryLocation
      || formErrors.paymentMethod
      || formErrors.saleConditions,
    );

    if (hasStepOneError) {
      setStep(1);
    } else if (hasStepTwoError) {
      setStep(2);
    } else {
      setStep(3);
    }

    toast.error('لطفا خطاهای فرم را اصلاح کنید');
  };

  const handleNextStep = async () => {
    const fieldsToValidate = step === 1 ? STEP_ONE_FIELDS : STEP_TWO_FIELDS;
    const isValid = await trigger(fieldsToValidate as any, { shouldFocus: true });

    if (!isValid) {
      toast.error('لطفا فیلدهای الزامی این مرحله را تکمیل کنید');
      return;
    }

    setStep((s) => Math.min(3, s + 1));
  };

  const handleRetryMedia = async (idx: number) => {
    const file = mediaFiles[idx]?.file;
    if (!file || !createdId) return;

    setMediaFiles((prev) => prev.map((m, j) => j === idx ? { ...m, status: 'uploading', errorMsg: undefined } : m));
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const base64 = base64Data.split(',')[1] ?? base64Data;

      await uploadMedia.mutateAsync({
        productId: createdId,
        fileName: file.name,
        mimeType: file.type || 'image/jpeg',
        base64Data: base64,
        isMain: false,
      });
      setMediaFiles((prev) => prev.map((m, j) => j === idx ? { ...m, status: 'done' } : m));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'خطای نامشخص در آپلود';
      setMediaFiles((prev) => prev.map((m, j) => j === idx ? { ...m, status: 'error', errorMsg } : m));
    }
  };

  // ── Image upload step ─────────────────────────────────────────────────────
  if (createdId) {
    return (
      <div className="p-6 max-w-2xl mx-auto" dir="rtl">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-medium text-green-800">محصول با موفقیت ثبت شد</p>
            <p className="text-sm text-green-600">در انتظار تأیید کارشناس است</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-1">آپلود تصاویر محصول</h2>
          <p className="text-sm text-gray-500 mb-1">تصاویر، ویدیوی کوتاه یا فایل PDF محصول را آپلود کنید (اختیاری)</p>
          <p className="text-xs text-gray-500 mb-4">حداکثر حجم هر فایل: ۲۵ مگابایت</p>

          <input
            ref={mediaInputRef}
            type="file"
            title="انتخاب فایل رسانه محصول"
            accept="image/*,video/*,.pdf,application/pdf"
            multiple
            onChange={handleMediaFiles}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => mediaInputRef.current?.click()}
            disabled={uploadingMedia}
            className="btn-secondary w-full mb-4"
          >
            {uploadingMedia ? 'در حال آپلود...' : '🖼️ انتخاب تصاویر / ویدیو'}
          </button>

          {mediaError && (
            <p className="text-sm text-red-600 mb-3">{mediaError}</p>
          )}

          {mediaFiles.length > 0 && (
            <div className="space-y-3">
              {mediaFiles.map((f, i) => {
                const isPdf = f.file?.type === 'application/pdf';
                const isVideo = f.file?.type?.startsWith('video/');
                return (
                  <div key={i} className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                    {/* Preview/Icon */}
                    <div className="shrink-0 w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                      {f.preview ? (
                        <img src={f.preview} alt={f.name} className="w-full h-full object-cover" />
                      ) : isPdf ? (
                        <span className="text-xl">📄</span>
                      ) : isVideo ? (
                        <span className="text-xl">🎬</span>
                      ) : (
                        <span className="text-xl">📎</span>
                      )}
                    </div>

                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                      {f.errorMsg && (
                        <p className="text-xs text-red-600 mt-0.5 line-clamp-2">{f.errorMsg}</p>
                      )}
                      {f.status === 'uploading' && (
                        <p className="text-xs text-blue-600 mt-0.5">⏳ در حال آپلود...</p>
                      )}
                    </div>

                    {/* Status & Action */}
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className={`text-lg ${
                        f.status === 'done' ? '✅' : f.status === 'error' ? '❌' : f.status === 'uploading' ? '⏳' : '📎'
                      }`} />
                      {f.status === 'error' && (
                        <button
                          type="button"
                          onClick={() => handleRetryMedia(i)}
                          disabled={uploadingMedia}
                          className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 disabled:opacity-50"
                        >
                          تلاش مجدد
                        </button>
                      )}
                      {f.status === 'done' && (
                        <button
                          type="button"
                          onClick={() => setMediaFiles((prev) => prev.filter((_, j) => j !== i))}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500">پس از تکمیل آپلود، می توانید از منوی محصولات به لیست کالاهای خود بازگردید.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">ثبت محصول جدید</h1>
        <p className="text-gray-500 text-sm mt-1">مشخصات محصول یا کالای خود را وارد کنید</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { n: 1, label: 'تعریف محصول' },
          { n: 2, label: 'تحویل و پرداخت' },
          { n: 3, label: 'جزئیات اضافی' },
        ].map(({ n, label }, i) => (
          <div key={n} className="flex items-center gap-2 flex-1">
            <button
              type="button"
              onClick={() => setStep(n)}
              className={`shrink-0 w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center transition-colors ${step === n ? 'bg-[var(--brand)] text-white' : step > n ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}
            >
              {step > n ? '✓' : n}
            </button>
            <span className={`text-xs hidden sm:inline ${step === n ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{label}</span>
            {i < 2 && <div className={`flex-1 h-0.5 ${step > n ? 'bg-green-400' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-5">
        {/* Step 1: Product Definition & Classification */}
        <div className={step !== 1 ? 'hidden' : ''}>
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-50">تعریف محصول</h2>
          
          <div className="space-y-1 mb-4 pb-3 border-b border-gray-50">
            <h3 className="text-xs font-semibold text-gray-600 uppercase">شناسایی محصول</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="label-text">نام فارسی محصول *</label>
              <input {...register('nameFa')} className="input-field" placeholder="مثال: پلیمر اکریلیک" />
              {errors.nameFa && <p className="field-error">{errors.nameFa.message}</p>}
            </div>
            <div>
              <label className="label-text">نام انگلیسی محصول *</label>
              <input {...register('nameEn')} dir="ltr" className="input-field" placeholder="Acrylic Polymer" />
              {errors.nameEn && <p className="field-error">{errors.nameEn.message}</p>}
            </div>
            <div>
              <label className="label-text">گروه کالایی *</label>
              <select {...register('commodityGroup')} className="input-field">
                <option value="">انتخاب کنید...</option>
                {COMMODITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {errors.commodityGroup && <p className="field-error">{errors.commodityGroup.message}</p>}
            </div>
            <div>
              <label className="label-text">مبدأ تولید *</label>
              <select {...register('origin')} className="input-field">
                <option value="">انتخاب کنید...</option>
                {ORIGIN_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {errors.origin && <p className="field-error">{errors.origin.message}</p>}
            </div>
            <div>
              <label className="label-text">کشور مبدأ</label>
              <input {...register('countryOfOrigin')} className="input-field" placeholder="ایران / ترکیه / ..." />
            </div>
          </div>

          <div className="space-y-1 mb-4 pb-3 border-b border-gray-50 mt-6">
            <h3 className="text-xs font-semibold text-gray-600 uppercase">کدهای دسته‌بندی</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="label-text">کد HS (تعرفه گمرکی) *</label>
              <input {...register('hsCode')} dir="ltr" className="input-field" placeholder="3906100000" />
              <p className="text-[11px] text-gray-400 mt-0.5">کد ۸ تا ۱۰ رقمی تعرفه گمرکی</p>
              {errors.hsCode && <p className="field-error">{errors.hsCode.message}</p>}
            </div>
            <div>
              <label className="label-text">کد ISIC</label>
              <input {...register('isicCode')} dir="ltr" className="input-field" placeholder="2411" />
              <p className="text-[11px] text-gray-400 mt-0.5">طبقه‌بندی بین‌المللی فعالیت اقتصادی</p>
            </div>
            <div>
              <label className="label-text">شناسه کالا/خدمت</label>
              <input {...register('serviceCode')} dir="ltr" className="input-field" placeholder="SRV-001" />
            </div>
            <div>
              <label className="label-text">شماره استاندارد</label>
              <input {...register('standardNumber')} className="input-field" placeholder="ISIRI / ISO / ..." />
            </div>
          </div>

          <div className="space-y-1 mb-4 pb-3 border-b border-gray-50 mt-6">
            <h3 className="text-xs font-semibold text-gray-600 uppercase">مشخصات تکنیکی</h3>
          </div>
          <div className="space-y-4 mb-5">
            <div>
              <label className="label-text">مشخصات فنی *</label>
              <textarea
                {...register('technicalSpecs')}
                rows={3}
                className="input-field resize-none"
                placeholder="ابعاد، استاندارد، گواهینامه‌ها ..."
              />
              {errors.technicalSpecs && <p className="field-error">{errors.technicalSpecs.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-text">گرید محصول</label>
                <input {...register('grade')} className="input-field" placeholder="A / Premium / ..." />
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Step 2: Delivery & Payment Terms */}
        <div className={step !== 2 ? 'hidden' : ''}>
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-50">شرایط تحویل و پرداخت</h2>

          <div className="space-y-1 mb-4 pb-3 border-b border-gray-50">
            <h3 className="text-xs font-semibold text-gray-600 uppercase">شرایط سفارش</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="label-text">حداقل مقدار سفارش *</label>
              <input {...register('minOrderQuantity')} className="input-field" placeholder="۱۰۰ کیلوگرم" />
              <p className="text-[11px] text-gray-400 mt-0.5">عدد + واحد (مثلاً: ۱۰۰ کیلوگرم)</p>
              {errors.minOrderQuantity && <p className="field-error">{errors.minOrderQuantity.message}</p>}
            </div>
            <div>
              <label className="label-text">زمان آماده‌سازی (روز) *</label>
              <input {...register('preparationTimeDays', { valueAsNumber: true })} type="number" min={1} max={365} className="input-field" />
              {errors.preparationTimeDays && <p className="field-error">{errors.preparationTimeDays.message}</p>}
            </div>
          </div>

          <div className="space-y-1 mb-4 pb-3 border-b border-gray-50 mt-6">
            <h3 className="text-xs font-semibold text-gray-600 uppercase">تحویل</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="label-text">شرایط تحویل *</label>
              <select {...register('deliveryTerms')} className="input-field">
                <option value="">انتخاب کنید...</option>
                {DELIVERY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {errors.deliveryTerms && <p className="field-error">{errors.deliveryTerms.message}</p>}
            </div>
            <div>
              <label className="label-text">محل تحویل *</label>
              <input {...register('deliveryLocation')} className="input-field" placeholder="بندر شهید رجایی" />
              {errors.deliveryLocation && <p className="field-error">{errors.deliveryLocation.message}</p>}
            </div>
          </div>

          <div className="space-y-1 mb-4 pb-3 border-b border-gray-50 mt-6">
            <h3 className="text-xs font-semibold text-gray-600 uppercase">پرداخت</h3>
          </div>
          <div className="space-y-4 mb-5">
            <div>
              <label className="label-text">روش پرداخت *</label>
              <select {...register('paymentMethod')} className="input-field">
                <option value="">انتخاب کنید...</option>
                {PAYMENT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {errors.paymentMethod && <p className="field-error">{errors.paymentMethod.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-text">درصد پیش‌پرداخت</label>
                <input
                  {...register('saleConditions.advancePercent', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                  type="number"
                  min={0}
                  max={100}
                  className="input-field"
                  placeholder="مثال: 30"
                />
              </div>
              <div>
                <label className="label-text">درصد هنگام تحویل</label>
                <input
                  {...register('saleConditions.onDeliveryPercent', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                  type="number"
                  min={0}
                  max={100}
                  className="input-field"
                  placeholder="مثال: 70"
                />
              </div>
              {(errors as any).saleConditions?.message && (
                <p className="field-error col-span-2">{(errors as any).saleConditions.message}</p>
              )}
            </div>
          </div>
        </div>
        </div>

        {/* Step 3: Physical Specs & Packaging */}
        <div className={step !== 3 ? 'hidden' : ''}>
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-50">مشخصات فیزیکی و جزئیات</h2>

          <div className="space-y-1 mb-4 pb-3 border-b border-gray-50">
            <h3 className="text-xs font-semibold text-gray-600 uppercase">توضیحات و بسته‌بندی</h3>
          </div>
          <div className="space-y-4 mb-5">
            <div>
              <label className="label-text">توضیحات</label>
              <textarea
                {...register('description')}
                rows={3}
                className="input-field resize-none"
                placeholder="توضیحات بیشتر در مورد محصول ..."
              />
            </div>
            <div>
              <label className="label-text">نوع بسته‌بندی</label>
              <select {...register('packagingType')} className="input-field">
                <option value="">انتخاب کنید...</option>
                {PACKAGING_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1 mb-4 pb-3 border-b border-gray-50 mt-6">
            <h3 className="text-xs font-semibold text-gray-600 uppercase">ابعاد و وزن</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="label-text">وزن</label>
              <input
                {...register('dimensions.weight', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                type="number"
                step="0.01"
                min={0}
                className="input-field"
                placeholder="0"
              />
            </div>
            <div>
              <label className="label-text">واحد</label>
              <select {...register('dimensions.unit')} className="input-field">
                <option value="kg">کیلوگرم</option>
                <option value="ton">تن</option>
                <option value="liter">لیتر</option>
                <option value="piece">عدد</option>
                <option value="meter">متر</option>
                <option value="sqm">مترمربع</option>
              </select>
            </div>
            <div>
              <label className="label-text">طول (cm)</label>
              <input
                {...register('dimensions.length', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                type="number"
                step="0.01"
                min={0}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-text">عرض (cm)</label>
              <input
                {...register('dimensions.width', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                type="number"
                step="0.01"
                min={0}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-text">ارتفاع (cm)</label>
              <input
                {...register('dimensions.height', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                type="number"
                step="0.01"
                min={0}
                className="input-field"
              />
            </div>
          </div>

          <div className="space-y-1 mb-4 pb-3 border-b border-gray-50 mt-6">
            <h3 className="text-xs font-semibold text-gray-600 uppercase">دوره اعتبار</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="label-text">تاریخ تولید</label>
              <input {...register('productionDate')} type="datetime-local" className="input-field" />
              {(errors as any).productionDate && (
                <p className="field-error">{(errors as any).productionDate.message}</p>
              )}
            </div>
            <div>
              <label className="label-text">تاریخ انقضا</label>
              <input {...register('expiryDate')} type="datetime-local" className="input-field" />
              {(errors as any).expiryDate && (
                <p className="field-error">{(errors as any).expiryDate.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-6">
            <input id="inStock" type="checkbox" {...register('isAvailableInStock')} className="h-4 w-4" />
            <label htmlFor="inStock" className="text-sm text-gray-700">موجود در انبار</label>
          </div>
        </div>

        {createMutation.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {createMutation.error.message}
          </div>
        )}
        </div>

        {/* Step Navigation */}
        <div className="flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              مرحله قبل
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="btn-primary"
            >
              مرحله بعد
            </button>
          ) : (
            submitReady ? (
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="btn-primary disabled:opacity-50"
              >
                {createMutation.isPending ? 'در حال ثبت...' : 'ثبت محصول'}
              </button>
            ) : (
              <div className="h-10 w-24" />
            )
          )}
          <button
            type="button"
            onClick={() => navigate({ to: '/products' })}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 mr-auto"
          >
            انصراف
          </button>
        </div>
      </form>
    </div>
  );
}
