import { createFileRoute } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRef, useState } from 'react';
import { trpc } from '../../../trpc.js';
import { UserRole, CommodityGroup, DocumentType } from '@repo/shared';
import { Input } from '../../../components/ui/input.js';
import { getFriendlyTrpcError } from '../../../lib/trpc-error.js';
import { toast } from 'sonner';
import { FORM_LABELS, FORM_PLACEHOLDERS, FORM_HINTS } from '../../../lib/form-constants.js';
import { CheckCircle2, Circle, User, Building2, Phone, FileText } from 'lucide-react';
import { Progress } from '../../../components/ui/progress.js';

export const Route = createFileRoute('/_authenticated/profile/')({
  component: ProfilePage,
});

const formSchema = z.object({
  role: z.nativeEnum(UserRole),
  companyName: z.string().min(2).max(150).optional().or(z.literal('')),
  unitName: z.string().min(2).max(150).optional().or(z.literal('')),
  unitType: z.enum(['COMPANY', 'GUILD', 'PRODUCER', 'TRADER', 'WHOLESALER', 'INDUSTRIAL']).optional().or(z.literal('')),
  guildCode: z.string().max(20).optional().or(z.literal('')),
  businessId: z.string().max(30).optional().or(z.literal('')),
  producedGoods: z.string().max(500).optional().or(z.literal('')),
  productIdNumber: z.string().max(50).optional().or(z.literal('')),
  singleProduct: z.boolean().optional(),
  phone: z.string().regex(/^0\d{10}$/, 'شماره تلفن معتبر نیست').optional().or(z.literal('')),
  fax: z.string().regex(/^0\d{10}$/, 'شماره فکس معتبر نیست').optional().or(z.literal('')),
  website: z.preprocess(
    (value) => {
      if (typeof value !== 'string') return value;
      const normalized = value.trim();
      if (!normalized) return '';
      if (/^https?:\/\//i.test(normalized)) return normalized;
      return `https://${normalized}`;
    },
    z.string().url('آدرس سایت معتبر نیست').optional().or(z.literal('')),
  ),
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
  passportNumber: z.string().max(30).optional().or(z.literal('')),
  passportExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاریخ اعتبار پاسپورت معتبر نیست').optional().or(z.literal('')),
  licenseTypes: z.array(z.nativeEnum(DocumentType)).min(1, 'حداقل یک نوع مجوز انتخاب کنید'),
  description: z.string().max(1000).optional().or(z.literal('')),
  // کشاورزی
  occupationCategoryId: z.string().cuid().optional().or(z.literal('')),
  farmingAreaHectares: z.coerce.number().positive().max(100000).optional(),
  irrigationType: z.enum(['آبی', 'دیم', 'گلخانه']).optional().or(z.literal('')),
  mainCropsInput: z.string().max(500).optional().or(z.literal('')),
  tradeDirection: z.enum(['صادراتی', 'وارداتی', 'هر دو', 'داخلی']).optional().or(z.literal('')),
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
  FARMER: 'کشاورز',
  INVESTOR: 'سرمایه‌گذار',
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
  ID_DOCUMENT: 'مدرک هویتی (کارت ملی/پاسپورت)',
  // کشاورزی
  AGRICULTURAL_LICENSE: 'مجوز کشاورزی (جهاد کشاورزی)',
  FARMING_CERTIFICATE: 'گواهینامه کشاورز',
  WATER_RIGHTS_DOCUMENT: 'سند حق آب و زمین',
  EXPORT_CERTIFICATE: 'گواهی صادراتی (بهداشت/قرنطینه)',
};

const MAX_DOC_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_DOC_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function sanitizeOptionalText(value: string | undefined): string | undefined {
  if (typeof value !== 'string') return value;
  const normalized = value.trim();
  return normalized.length ? normalized : undefined;
}

function toProfilePayload(data: FormData) {
  const mainCrops = data.mainCropsInput
    ? data.mainCropsInput.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  return {
    ...data,
    companyName: sanitizeOptionalText(data.companyName),
    unitName: sanitizeOptionalText(data.unitName),
    unitType: sanitizeOptionalText(data.unitType) as FormData['unitType'],
    guildCode: sanitizeOptionalText(data.guildCode),
    businessId: sanitizeOptionalText(data.businessId),
    producedGoods: sanitizeOptionalText(data.producedGoods),
    productIdNumber: sanitizeOptionalText(data.productIdNumber),
    phone: sanitizeOptionalText(data.phone),
    fax: sanitizeOptionalText(data.fax),
    website: sanitizeOptionalText(data.website),
    activityType: sanitizeOptionalText(data.activityType),
    commodityGroup: sanitizeOptionalText(data.commodityGroup) as FormData['commodityGroup'],
    position: sanitizeOptionalText(data.position),
    passportNumber: sanitizeOptionalText(data.passportNumber),
    passportExpiryDate: sanitizeOptionalText(data.passportExpiryDate),
    description: sanitizeOptionalText(data.description),
    // کشاورزی
    occupationCategoryId: sanitizeOptionalText(data.occupationCategoryId),
    irrigationType: sanitizeOptionalText(data.irrigationType) as FormData['irrigationType'],
    tradeDirection: sanitizeOptionalText(data.tradeDirection) as FormData['tradeDirection'],
    mainCrops,
    mainCropsInput: undefined,
  };
}

function ProfilePage() {
  const { data, isLoading } = trpc.profile.me.useQuery();
  const { data: completion } = trpc.profile.completionStatus.useQuery();
  const { data: occupationCategories } = trpc.agri.taxonomy.listFlat.useQuery({ onlyActive: true });
  const profileWithPassport = data?.profile as (typeof data extends undefined ? never : any) | undefined;
  const utils = trpc.useUtils();

  const upsert = trpc.profile.upsert.useMutation({
    onSuccess: () => {
      void utils.profile.me.invalidate();
      toast.success('پروفایل با موفقیت ذخیره شد');
    },
    onError: (err) => toast.error(getFriendlyTrpcError(err, 'ذخیره پروفایل انجام نشد')),
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

    if (!ALLOWED_DOC_MIME_TYPES.has(file.type)) {
      setUploadMsg('فرمت فایل مجاز نیست. فقط PDF, PNG, JPG, DOC, DOCX');
      if (docFileRef.current) docFileRef.current.value = '';
      return;
    }

    if (file.size > MAX_DOC_SIZE_BYTES) {
      setUploadMsg('حجم فایل بیشتر از حد مجاز است (حداکثر ۲۰ مگابایت)');
      if (docFileRef.current) docFileRef.current.value = '';
      return;
    }

    setUploading(true);
    setUploadMsg('');
    try {
      const { uploadUrl, key } = await getUploadUrl.mutateAsync({
        documentType: docType,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
      });
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      await saveDoc.mutateAsync({
        documentType: docType,
        fileKey: key,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
      });
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
    resolver: zodResolver(formSchema) as any,
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
          unitType: (data.profile.unitType as any) ?? '',
          guildCode: data.profile.guildCode ?? '',
          businessId: data.profile.businessId ?? '',
          producedGoods: data.profile.producedGoods ?? '',
          productIdNumber: data.profile.productIdNumber ?? '',
          singleProduct: data.profile.singleProduct ?? false,
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
          passportNumber: profileWithPassport?.passportNumber ?? '',
          passportExpiryDate: profileWithPassport?.passportExpiryDate
            ? new Date(profileWithPassport.passportExpiryDate).toISOString().slice(0, 10)
            : '',
          licenseTypes: [],
          description: data.profile.description ?? '',
          // کشاورزی
          occupationCategoryId: (profileWithPassport as any)?.occupationCategoryId ?? '',
          farmingAreaHectares: (profileWithPassport as any)?.farmingAreaHectares ?? undefined,
          irrigationType: ((profileWithPassport as any)?.irrigationType ?? '') as any,
          mainCropsInput: ((profileWithPassport as any)?.mainCrops as string[] | undefined)?.join(', ') ?? '',
          tradeDirection: ((profileWithPassport as any)?.tradeDirection ?? '') as any,
        }
      : undefined,
  });

  const selectedDocs = watch('licenseTypes') ?? [];

  const onSubmitProfile = (data: FormData) => {
    const uploadedDocTypes = new Set((myDocs ?? []).map((doc) => String(doc.type)));
    const missingDocType = data.licenseTypes.find((type) => !uploadedDocTypes.has(String(type)));

    if (missingDocType) {
      const docLabel = DOC_TYPE_LABELS[String(missingDocType)] ?? 'مدرک انتخاب‌شده';
      const message = `ابتدا فایل مربوط به «${docLabel}» را آپلود کنید`;
      setUploadMsg(message);
      toast.error(message);
      return;
    }

    upsert.mutate(toProfilePayload(data) as any);
  };

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

  const STATUS_LABELS: Record<string, string> = {
    ACTIVE: 'فعال',
    PENDING: 'در انتظار تأیید',
    SUSPENDED: 'معلق',
    REJECTED: 'رد شده',
  };
  const STATUS_COLORS: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700 border-green-200',
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    SUSPENDED: 'bg-red-100 text-red-700 border-red-200',
    REJECTED: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  const userStatus = data?.user.status ?? 'PENDING';

  const completionSteps = [
    { key: 'basicInfo',    icon: Building2,  label: 'اطلاعات پایه' },
    { key: 'contactInfo',  icon: Phone,       label: 'اطلاعات تماس' },
    { key: 'businessInfo', icon: User,        label: 'حوزه فعالیت' },
    { key: 'documents',    icon: FileText,    label: 'مدارک' },
  ] as const;

  const completionPercent = completionSteps.filter(
    (s) => !!(completion?.steps as Record<string, boolean> | undefined)?.[s.key]
  ).length * 25;

  return (
    <div className="p-6 max-w-3xl" dir="rtl">
      {/* Profile Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">پروفایل کاربری</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-sm text-gray-500 font-mono" dir="ltr">
                {data?.user.mobile}
              </span>
              {data?.user.userCode && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  کد: {data.user.userCode}
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[userStatus] ?? STATUS_COLORS['PENDING']}`}>
                {STATUS_LABELS[userStatus] ?? userStatus}
              </span>
            </div>
          </div>
          {data?.profile?.companyName && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2">
              <Building2 className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-800">{data.profile.companyName}</span>
            </div>
          )}
        </div>

        {/* Completion Progress */}
        <div className="mt-5 bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">تکمیل پروفایل</p>
            <span className={`text-sm font-bold ${completionPercent === 100 ? 'text-green-600' : 'text-amber-600'}`}>
              {completionPercent}%
            </span>
          </div>
          <Progress value={completionPercent} className="h-2 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {completionSteps.map((step) => {
              const done = !!(completion?.steps as Record<string, boolean> | undefined)?.[step.key];
              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${
                    done ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  {done
                    ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    : <Circle className="h-3.5 w-3.5 shrink-0" />
                  }
                  {step.label}
                </div>
              );
            })}
          </div>
          {completionPercent < 100 && (
            <p className="text-xs text-amber-600 mt-3">
              پروفایل ناقص شانس پذیرش درخواست‌های تجاری شما را کاهش می‌دهد.
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-6">
        {/* نوع فعالیت */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide text-gray-500">
            نوع فعالیت
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {FORM_LABELS.profile.role} <span className="text-red-500">*</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{FORM_LABELS.profile.companyName}</label>
              <input
                {...register('companyName')}
                placeholder={FORM_PLACEHOLDERS.profile.companyName}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{FORM_LABELS.profile.unitName}</label>
              <input
                {...register('unitName')}
                placeholder={FORM_PLACEHOLDERS.profile.unitName}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{FORM_LABELS.profile.unitType}</label>
              <select
                {...register('unitType')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{FORM_LABELS.selectPlaceholder}</option>
                <option value="COMPANY">شرکتی</option>
                <option value="GUILD">صنفی</option>
                <option value="PRODUCER">تولیدکننده</option>
                <option value="TRADER">بازرگان/تاجر</option>
                <option value="WHOLESALER">عمده‌فروش</option>
                <option value="INDUSTRIAL">صنعتی کارگاهی</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{FORM_LABELS.profile.guildCode}</label>
              <input
                {...register('guildCode')}
                placeholder={FORM_PLACEHOLDERS.profile.guildCode}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{FORM_LABELS.profile.businessId}</label>
              <input
                {...register('businessId')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{FORM_LABELS.profile.producedGoods}</label>
              <input
                {...register('producedGoods')}
                placeholder={FORM_PLACEHOLDERS.profile.producedGoods}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-gray-400 mt-0.5">{FORM_HINTS.profile.producedGoods}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{FORM_LABELS.profile.productIdNumber}</label>
              <input
                {...register('productIdNumber')}
                placeholder={FORM_PLACEHOLDERS.profile.productIdNumber}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                dir="ltr"
              />
            </div>
            <div className="flex items-center gap-2 mt-5">
              <input
                type="checkbox"
                {...register('singleProduct')}
                className="rounded text-blue-600"
              />
              <label className="text-sm text-gray-700">{FORM_LABELS.profile.singleProduct}</label>
            </div>
          </div>
        </div>

        {/* اطلاعات تماس */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">اطلاعات تماس</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{FORM_LABELS.profile.phone}</label>
              <Input
                {...register('phone')}
                className="w-full"
                placeholder={FORM_PLACEHOLDERS.profile.phone}
                dir="ltr"
              />
              <p className="text-[11px] text-gray-400 mt-0.5">{FORM_HINTS.profile.phone}</p>
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{FORM_LABELS.profile.fax}</label>
              <Input
                {...register('fax')}
                className="w-full"
                placeholder={FORM_PLACEHOLDERS.profile.fax}
                dir="ltr"
              />
              <p className="text-[11px] text-gray-400 mt-0.5">{FORM_HINTS.profile.fax}</p>
              {errors.fax && <p className="text-red-500 text-xs mt-1">{errors.fax.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{FORM_LABELS.profile.website}</label>
              <Input
                {...register('website')}
                className="w-full"
                placeholder={FORM_PLACEHOLDERS.profile.website}
                dir="ltr"
              />
              <p className="text-[11px] text-gray-400 mt-0.5">{FORM_HINTS.profile.website}</p>
              {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website.message}</p>}
            </div>
          </div>
        </div>

        {/* آدرس */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">آدرس <span className="text-red-500">*</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{FORM_LABELS.profile.province} <span className="text-red-500">*</span></label>
              <Input
                {...register('address.province')}
                placeholder={FORM_PLACEHOLDERS.profile.province}
                className="w-full"
              />
              {errors.address?.province && <p className="text-red-500 text-xs mt-1">{errors.address.province.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{FORM_LABELS.profile.city} <span className="text-red-500">*</span></label>
              <Input
                {...register('address.city')}
                placeholder={FORM_PLACEHOLDERS.profile.city}
                className="w-full"
              />
              {errors.address?.city && <p className="text-red-500 text-xs mt-1">{errors.address.city.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{FORM_LABELS.profile.addressLine} <span className="text-red-500">*</span></label>
              <textarea
                {...register('address.addressLine')}
                rows={2}
                placeholder={FORM_PLACEHOLDERS.profile.addressLine}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.address?.addressLine && <p className="text-red-500 text-xs mt-1">{errors.address.addressLine.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{FORM_LABELS.profile.postalCode} <span className="text-red-500">*</span></label>
              <Input
                {...register('address.postalCode')}
                maxLength={10}
                placeholder={FORM_PLACEHOLDERS.profile.postalCode}
                className="w-full"
                dir="ltr"
              />
              <p className="text-[11px] text-gray-400 mt-0.5">{FORM_HINTS.profile.postalCode}</p>
              {errors.address?.postalCode && <p className="text-red-500 text-xs mt-1">{errors.address.postalCode.message}</p>}
            </div>
          </div>
        </div>

        {/* فعالیت تجاری */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">اطلاعات تجاری</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{FORM_LABELS.profile.activityType}</label>
              <Input
                {...register('activityType')}
                placeholder={FORM_PLACEHOLDERS.profile.activityType}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{FORM_LABELS.profile.commodityGroup}</label>
              <select
                {...register('commodityGroup')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{FORM_LABELS.selectPlaceholder}</option>
                {Object.entries(COMMODITY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{FORM_LABELS.profile.position}</label>
              <Input
                {...register('position')}
                placeholder={FORM_PLACEHOLDERS.profile.position}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{FORM_LABELS.profile.experienceYears}</label>
              <Input
                type="number"
                {...register('experienceYears')}
                min={0}
                max={99}
                placeholder={FORM_PLACEHOLDERS.profile.experienceYears}
                className="w-full"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{FORM_LABELS.profile.passportNumber}</label>
              <Input
                {...register('passportNumber')}
                placeholder={FORM_PLACEHOLDERS.profile.passportNumber}
                className="w-full"
                dir="ltr"
              />
              <p className="text-[11px] text-gray-400 mt-0.5">{FORM_HINTS.profile.passportNumber}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{FORM_LABELS.profile.passportExpiryDate}</label>
              <Input
                type="date"
                {...register('passportExpiryDate')}
                placeholder={FORM_PLACEHOLDERS.profile.passportExpiryDate}
                className="w-full"
                dir="ltr"
              />
              <p className="text-[11px] text-gray-400 mt-0.5">{FORM_HINTS.profile.passportExpiryDate}</p>
              {errors.passportExpiryDate && <p className="text-red-500 text-xs mt-1">{errors.passportExpiryDate.message}</p>}
            </div>
          </div>
        </div>

        {/* فیلدهای تخصصی کشاورزی */}
        <div className="bg-white rounded-xl border border-green-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-1">اطلاعات تخصصی کشاورزی</h2>
          <p className="text-xs text-gray-500 mb-4">اگر در حوزه کشاورزی فعالیت می‌کنید این اطلاعات را تکمیل کنید</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">دسته‌بندی شغلی</label>
              <select
                {...register('occupationCategoryId')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">انتخاب کنید...</option>
                {(occupationCategories ?? []).filter(c => !c.parentId).map((parent) => (
                  <optgroup key={parent.id} label={parent.nameFa}>
                    {(occupationCategories ?? []).filter(c => c.parentId === parent.id).map((child) => (
                      <option key={child.id} value={child.id}>{child.nameFa}</option>
                    ))}
                    <option value={parent.id}>{parent.nameFa} — (سایر)</option>
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">مساحت زمین کشاورزی (هکتار)</label>
              <Input
                type="number"
                {...register('farmingAreaHectares')}
                min={0}
                step="0.1"
                placeholder="مثال: ۱۲.۵"
                className="w-full"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نوع آبیاری</label>
              <select
                {...register('irrigationType')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">انتخاب کنید...</option>
                <option value="آبی">آبی (آبیاری)</option>
                <option value="دیم">دیم (بارانی)</option>
                <option value="گلخانه">گلخانه</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">محصولات اصلی</label>
              <Input
                {...register('mainCropsInput')}
                placeholder="مثال: گندم، ذرت، سیب (با ویرگول جدا کنید)"
                className="w-full"
              />
              <p className="text-[11px] text-gray-400 mt-0.5">محصولات را با ویرگول از هم جدا کنید</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">جهت تجاری</label>
              <select
                {...register('tradeDirection')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">انتخاب کنید...</option>
                <option value="صادراتی">صادراتی</option>
                <option value="وارداتی">وارداتی</option>
                <option value="هر دو">صادراتی و وارداتی</option>
                <option value="داخلی">داخلی</option>
              </select>
            </div>
          </div>
        </div>

        {/* مجوزها */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">
            {FORM_LABELS.profile.licenseTypes} <span className="text-red-500">*</span>
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
          <h2 className="font-semibold text-gray-800 mb-4">{FORM_LABELS.profile.description}</h2>
          <textarea
            {...register('description')}
            rows={4}
            placeholder={FORM_PLACEHOLDERS.profile.description}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {upsert.error && !upsert.error.message && null}

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
        <p className="text-xs text-gray-500 mb-4">حداکثر حجم فایل: ۲۰ مگابایت</p>

        <div className="flex gap-3 items-end flex-wrap mb-4">
          <div className="flex-1 min-w-48">
            <label className="label-text">نوع مدرک</label>
            <select
              title="نوع مدرک"
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
              title="انتخاب فایل مدرک"
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
