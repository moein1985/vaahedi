import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { trpc } from '../../../trpc.js';
import { createProductSchema, CommodityGroup, ProductOrigin, DeliveryTerms, PaymentMethod } from '@repo/shared';
import type { z } from 'zod';

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

function NewProductPage() {
  const navigate = useNavigate();
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<{ name: string; status: 'pending' | 'uploading' | 'done' | 'error' }[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<NewProductForm>({
    resolver: zodResolver(createProductSchema) as any,
    defaultValues: {
      isAvailableInStock: false,
      preparationTimeDays: 7,
    },
  });

  const createMutation = trpc.product.create.useMutation({
    onSuccess: (data) => setCreatedId(data.id),
  });

  const uploadMedia = trpc.product.uploadMedia.useMutation();

  const handleMediaFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !createdId) return;
    setUploadingMedia(true);
    const newEntries = files.map((f) => ({ name: f.name, status: 'pending' as const }));
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
      } catch {
        setMediaFiles((prev) => prev.map((m, j) => j === idx ? { ...m, status: 'error' } : m));
      }
    }
    setUploadingMedia(false);
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  const onSubmit = (data: NewProductForm) => {
    createMutation.mutate(data);
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
          <p className="text-sm text-gray-500 mb-4">تصاویر یا ویدیوی کوتاه محصول را آپلود کنید (اختیاری)</p>

          <input
            ref={mediaInputRef}
            type="file"
            accept="image/*,video/*"
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

          {mediaFiles.length > 0 && (
            <div className="space-y-2">
              {mediaFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <span className="text-lg">{f.status === 'done' ? '✅' : f.status === 'error' ? '❌' : f.status === 'uploading' ? '⏳' : '📎'}</span>
                  <span className="text-sm text-gray-700 flex-1 truncate">{f.name}</span>
                  <span className="text-xs text-gray-400">
                    {f.status === 'done' ? 'آپلود شد' : f.status === 'error' ? 'خطا' : f.status === 'uploading' ? 'در حال آپلود' : 'آماده'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate({ to: '/products' })}
            className="btn-primary"
          >
            رفتن به محصولات ›
          </button>
          <button
            onClick={() => { setCreatedId(null); setMediaFiles([]); }}
            className="btn-secondary"
          >
            ثبت محصول دیگر
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">ثبت محصول جدید</h1>
        <p className="text-gray-500 text-sm mt-1">مشخصات محصول یا کالای خود را وارد کنید</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Basic info */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-50">اطلاعات پایه</h2>
          <div className="grid grid-cols-2 gap-4">
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
              <label className="label-text">کد HS (تعرفه گمرکی) *</label>
              <input {...register('hsCode')} dir="ltr" className="input-field" placeholder="3906100000" />
              {errors.hsCode && <p className="field-error">{errors.hsCode.message}</p>}
            </div>
            <div>
              <label className="label-text">کد ISIC</label>
              <input {...register('isicCode')} dir="ltr" className="input-field" placeholder="2411" />
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
          </div>
        </div>

        {/* Trade info */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-50">اطلاعات تجاری</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">حداقل مقدار سفارش *</label>
              <input {...register('minOrderQuantity')} className="input-field" placeholder="۱۰۰ کیلوگرم" />
              {errors.minOrderQuantity && <p className="field-error">{errors.minOrderQuantity.message}</p>}
            </div>
            <div>
              <label className="label-text">زمان آماده‌سازی (روز) *</label>
              <input {...register('preparationTimeDays', { valueAsNumber: true })} type="number" min={1} max={365} className="input-field" />
              {errors.preparationTimeDays && <p className="field-error">{errors.preparationTimeDays.message}</p>}
            </div>
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
            <div className="col-span-2">
              <label className="label-text">روش پرداخت *</label>
              <select {...register('paymentMethod')} className="input-field">
                <option value="">انتخاب کنید...</option>
                {PAYMENT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {errors.paymentMethod && <p className="field-error">{errors.paymentMethod.message}</p>}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-50">مشخصات تکنیکی</h2>
          <div className="space-y-4">
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
            <div>
              <label className="label-text">توضیحات</label>
              <textarea
                {...register('description')}
                rows={3}
                className="input-field resize-none"
                placeholder="توضیحات بیشتر در مورد محصول ..."
              />
            </div>
          </div>
        </div>

        {createMutation.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {createMutation.error.message}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-primary disabled:opacity-50"
          >
            {createMutation.isPending ? 'در حال ثبت...' : 'ثبت محصول'}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: '/products' })}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            انصراف
          </button>
        </div>
      </form>
    </div>
  );
}
