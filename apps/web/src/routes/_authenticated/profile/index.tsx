import { createFileRoute } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRef, useState } from 'react';
import { trpc } from '../../../trpc.js';
import { UserRole, CommodityGroup, DocumentType } from '@repo/shared';
import { Input } from '../../../components/ui/input.js';
import { Button } from '../../../components/ui/button.js';
import { Badge } from '../../../components/ui/badge.js';
import { cn } from '../../../lib/utils.js';

export const Route = createFileRoute('/_authenticated/profile/')({
  component: ProfilePage,
});

const formSchema = z.object({
  role: z.nativeEnum(UserRole),
  companyName: z.string().min(2).max(150).optional().or(z.literal('')),
  unitName: z.string().min(2).max(150).optional().or(z.literal('')),
  unitType: z.enum(['TYPE_1', 'TYPE_2', 'TYPE_3']).optional(),
  guildCode: z.string().max(20).optional().or(z.literal('')),
  businessId: z.string().max(30).optional().or(z.literal('')),
  phone: z.string().regex(/^0\d{10}$/, 'شماره تلفن معتبر نیست').optional().or(z.literal('')),
  fax: z.string().regex(/^0\d{10}$/, 'شماره فکس معتبر نیست').optional().or(z.literal('')),
  website: z.string().url('آدرس سایت معتبر نیست').optional().or(z.literal('')),
  address: z.object({
    province: z.string().min(1, 'استان الزامی است'),
    city: z.string().min(1, 'شهر الزامی است'),
    addressLine: z.string().min(10, 'آدرس کامل را وارد کنید').max(300),
    postalCode: z.string().length(10, 'کد پستی باید ۱۰ رقم باشد').regex(/^\d{10}$/, 'کد پستی فقط عدد'),
  }),
  activityType: z.string().max(100).optional().or(z.literal('')),
  commodityGroup: z.nativeEnum(CommodityGroup).optional().or(z.literal('')),
  position: z.string().max(100).optional().or(z.literal('')),
  experienceYears: z.coerce.number().int().min(0).max(99).optional(),
  licenseTypes: z.array(z.nativeEnum(DocumentType)).min(1, 'حداقل یک نوع مجوز انتخاب کنید'),
  description: z.string().max(1000).optional().or(z.literal('')),
});

type FormData = z.infer<typeof formSchema>;

const ROLE_LABELS: Record<string, string> = {
  TRADER: 'تاجر',
  PRODUCER: 'تولیدکننده',
  KNOWLEDGE_BASED: 'دانش‌بنیان',
  WHOLESALER: 'عمده‌فروش',
  BROKER: 'کارگزار',
  INTERMEDIARY: 'شرکت واسط',
  GUILD: 'صنفی',
};

const COMMODITY_LABELS: Record<string, string> = {
  INDUSTRIAL: 'صنعتی',
  CHEMICAL: 'شیمیایی',
  TELECOM: 'مخابراتی',
  METAL: 'فلزی',
  FOOD: 'غذایی',
  TEXTILE: 'نساجی',
  AGRICULTURAL: 'کشاورزی',
  CONSTRUCTION: 'ساختمانی',
  PETROCHEMICAL: 'پتروشیمی',
  OTHER: 'سایر',
};

const DOC_TYPE_LABELS: Record<string, string> = {
  ESTABLISHMENT_NOTICE: 'آگهی تأسیس',
  BOARD_CHANGES: 'تغییرات هیئت مدیره',
  OPERATION_LICENSE: 'پروانه بهره‌برداری',
  PRODUCTION_LICENSE: 'مجوز تولید',
  GUILD_LICENSE: 'مجوز صنفی',
  KNOWLEDGE_BASED_LICENSE: 'مجوز دانش‌بنیان',
  OTHER_LICENSES: 'سایر مجوزها',
  ISO_CERTIFICATE: 'گواهی ایزو',
  BUSINESS_CARD: 'کارت بازرگانی',
};

function ProfilePage() {
  const { data, isLoading } = trpc.profile.me.useQuery();
  const utils = trpc.useUtils();

  const upsert = trpc.profile.upsert.useMutation({
    onSuccess: () => void utils.profile.me.invalidate(),
  });

  // ── Document upload ────────────────────────────────────────────────────────
  const [docType, setDocType] = useState<DocumentType>(DocumentType.OPERATION_LICENSE);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const docFileRef = useRef<HTMLInputElement>(null);

  const { data: myDocs, refetch: refetchDocs } = trpc.profile.documents.useQuery();
  const getUploadUrl = trpc.profile.getUploadUrl.useMutation();
  const saveDoc = trpc.profile.saveDocument.useMutation({
    onSuccess: () => {
      void refetchDocs();
      setUploadMsg('مدرک با موفقیت آپلود شد');
      setTimeout(() => setUploadMsg(''), 3500);
    },
  });

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg('');
    try {
      const { uploadUrl, key } = await getUploadUrl.mutateAsync({
        documentType: docType,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
      });
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      await saveDoc.mutateAsync({ documentType: docType, fileKey: key, fileName: file.name });
    } catch {
      setUploadMsg('خطا در آپلود مدرک');
    } finally {
      setUploading(false);
      if (docFileRef.current) docFileRef.current.value = '';
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: UserRole.TRADER,
      address: { province: '', city: '', addressLine: '', postalCode: '' },
      licenseTypes: [],
    },
    values: data?.profile
      ? {
          role: (data.user.role as UserRole) ?? UserRole.TRADER,
          companyName: data.profile.companyName ?? '',
          unitName: data.profile.unitName ?? '',
          guildCode: data.profile.guildCode ?? '',
          businessId: data.profile.businessId ?? '',
          phone: data.profile.phone ?? '',
          fax: data.profile.fax ?? '',
          website: data.profile.website ?? '',
          address: {
            province: data.profile.province ?? '',
            city: data.profile.city ?? '',
            addressLine: data.profile.addressLine ?? '',
            postalCode: data.profile.postalCode ?? '',
          },
          activityType: data.profile.activityType ?? '',
          commodityGroup: (data.profile.commodityGroup as CommodityGroup) ?? '',
          position: data.profile.position ?? '',
          experienceYears: data.profile.experienceYears ?? undefined,
          licenseTypes: [],
          description: data.profile.description ?? '',
        }
      : undefined,
  });

  const selectedDocs = watch('licenseTypes') ?? [];

  const toggleDoc = (type: DocumentType) => {
    const current = selectedDocs;
    const updated = current.includes(type)
      ? current.filter((d) => d !== type)
      : [...current, type];
    setValue('licenseTypes', updated, { shouldValidate: true });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">در حال بارگذاری...</div>;
  }

  return (
    <div className="p-6 max-w-3xl" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">پروفایل کاربری</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-sm text-gray-500 font-mono" dir="ltr">
            {data?.user.mobile}
          </span>
          {data?.user.userCode && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {data.user.userCode}
            </span>
          )}
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              data?.user.status === 'ACTIVE'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {data?.user.status}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => upsert.mutate(d as any))} className="space-y-6">
        {/* نوع فعالیت */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide text-gray-500">
            نوع فعالیت
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              نقش در پلتفرم <span className="text-red-500">*</span>
            </label>
            <select
              {...register('role')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(ROLE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* اطلاعات شرکت */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">اطلاعات شرکت / واحد</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نام شرکت</label>
              <input
                {...register('companyName')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نام واحد</label>
              <input
                {...register('unitName')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">شناسه صنفی</label>
              <input
                {...register('guildCode')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">شناسه تجاری</label>
              <input
                {...register('businessId')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* اطلاعات تماس */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">اطلاعات تماس</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تلفن ثابت</label>
              <Input
                {...register('phone')}
                className="w-full"
                placeholder="مثال: 02112345678"
                dir="ltr"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">فکس</label>
              <Input
                {...register('fax')}
                className="w-full"
                dir="ltr"
              />
              {errors.fax && <p className="text-red-500 text-xs mt-1">{errors.fax.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">وب‌سایت</label>
              <Input
                {...register('website')}
                className="w-full"
                placeholder="https://example.com"
                dir="ltr"
              />
              {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website.message}</p>}
            </div>
          </div>
        </div>

        {/* آدرس */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">آدرس <span className="text-red-500">*</span></h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">استان <span className="text-red-500">*</span></label>
              <Input
                {...register('address.province')}
                className="w-full"
              />
              {errors.address?.province && <p className="text-red-500 text-xs mt-1">{errors.address.province.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">شهر <span className="text-red-500">*</span></label>
              <Input
                {...register('address.city')}
                className="w-full"
              />
              {errors.address?.city && <p className="text-red-500 text-xs mt-1">{errors.address.city.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">آدرس کامل <span className="text-red-500">*</span></label>
              <textarea
                {...register('address.addressLine')}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.address?.addressLine && <p className="text-red-500 text-xs mt-1">{errors.address.addressLine.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">کد پستی <span className="text-red-500">*</span></label>
              <Input
                {...register('address.postalCode')}
                maxLength={10}
                className="w-full"
                dir="ltr"
              />
              {errors.address?.postalCode && <p className="text-red-500 text-xs mt-1">{errors.address.postalCode.message}</p>}
            </div>
          </div>
        </div>

        {/* فعالیت تجاری */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">اطلاعات تجاری</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نوع فعالیت</label>
              <Input
                {...register('activityType')}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">گروه کالایی</label>
              <select
                {...register('commodityGroup')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">انتخاب کنید</option>
                {Object.entries(COMMODITY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">سمت</label>
              <Input
                {...register('position')}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">سابقه کار (سال)</label>
              <Input
                type="number"
                {...register('experienceYears')}
                min={0}
                max={99}
                className="w-full"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* مجوزها */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">
            مجوزها و مدارک <span className="text-red-500">*</span>
          </h2>
          <p className="text-xs text-gray-500 mb-3">حداقل یک مورد انتخاب کنید</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(DOC_TYPE_LABELS).map(([val, label]) => (
              <label key={val} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedDocs.includes(val as DocumentType)}
                  onChange={() => toggleDoc(val as DocumentType)}
                  className="rounded text-blue-600"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
          {errors.licenseTypes && (
            <p className="text-red-500 text-xs mt-2">{errors.licenseTypes.message}</p>
          )}
        </div>

        {/* معرفی */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">معرفی</h2>
          <textarea
            {...register('description')}
            rows={4}
            placeholder="خلاصه‌ای از فعالیت و تخصص خود..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {upsert.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
            {upsert.error.message}
          </div>
        )}

        {upsert.isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
            پروفایل با موفقیت ذخیره شد
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={upsert.isPending || !isDirty}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {upsert.isPending ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
          </button>
        </div>
      </form>

      {/* ── Document Upload Section ───────────────────────────────────────── */}
      <div className="mt-8 bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-1">آپلود مدارک</h2>
        <p className="text-xs text-gray-500 mb-4">فایل‌های PDF، تصویر یا اسناد مجوزها را آپلود کنید</p>

        <div className="flex gap-3 items-end flex-wrap mb-4">
          <div className="flex-1 min-w-48">
            <label className="label-text">نوع مدرک</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocumentType)}
              className="input-field"
            >
              {Object.entries(DOC_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <input
              ref={docFileRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={handleDocUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => docFileRef.current?.click()}
              disabled={uploading}
              className="btn-primary"
            >
              {uploading ? 'در حال آپلود...' : '📎 انتخاب فایل'}
            </button>
          </div>
        </div>

        {uploadMsg && (
          <p className={`text-sm mb-3 ${uploadMsg.includes('خطا') ? 'text-red-500' : 'text-green-600'}`}>
            {uploadMsg.includes('خطا') ? '✗' : '✓'} {uploadMsg}
          </p>
        )}

        {/* Uploaded docs list */}
        {myDocs && myDocs.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-medium">مدارک آپلود شده:</p>
            {myDocs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-lg">📄</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{doc.fileName}</p>
                  <p className="text-xs text-gray-400">
                    {DOC_TYPE_LABELS[doc.type] ?? doc.type} ·{' '}
                    {new Date(doc.createdAt).toLocaleDateString('fa-IR')}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    doc.status === 'APPROVED'
                      ? 'bg-green-100 text-green-700'
                      : doc.status === 'REJECTED'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {doc.status === 'APPROVED' ? 'تأیید شده' : doc.status === 'REJECTED' ? 'رد شده' : 'در انتظار'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">هنوز مدرکی آپلود نشده است</p>
        )}
      </div>
    </div>
  );
}
