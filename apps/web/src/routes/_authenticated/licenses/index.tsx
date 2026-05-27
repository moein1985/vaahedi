import { createFileRoute, Link } from '@tanstack/react-router';
import { trpc } from '../../../trpc.js';
import { VerificationStatus } from '@repo/shared';
import { BadgeCheck, Clock, XCircle, RefreshCw, Upload, ExternalLink } from 'lucide-react';
import { Badge } from '../../../components/ui/badge.js';
import { Button } from '../../../components/ui/button.js';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card.js';

export const Route = createFileRoute('/_authenticated/licenses/')({
  component: LicensesPage,
});

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
  AGRICULTURAL_LICENSE: 'مجوز کشاورزی (جهاد کشاورزی)',
  FARMING_CERTIFICATE: 'گواهینامه کشاورز',
  WATER_RIGHTS_DOCUMENT: 'سند حق آب و زمین',
  EXPORT_CERTIFICATE: 'گواهی صادراتی (بهداشت/قرنطینه)',
};

const AGRI_DOC_TYPES = new Set([
  'AGRICULTURAL_LICENSE',
  'FARMING_CERTIFICATE',
  'WATER_RIGHTS_DOCUMENT',
  'EXPORT_CERTIFICATE',
]);

type StatusConfig = {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: React.ElementType;
  color: string;
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  [VerificationStatus.PENDING]: {
    label: 'در انتظار بررسی',
    variant: 'secondary',
    icon: Clock,
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  },
  [VerificationStatus.APPROVED]: {
    label: 'تایید شده',
    variant: 'default',
    icon: BadgeCheck,
    color: 'text-green-700 bg-green-50 border-green-200',
  },
  [VerificationStatus.REJECTED]: {
    label: 'رد شده',
    variant: 'destructive',
    icon: XCircle,
    color: 'text-red-700 bg-red-50 border-red-200',
  },
  [VerificationStatus.NEEDS_REVISION]: {
    label: 'نیاز به اصلاح',
    variant: 'outline',
    icon: RefreshCw,
    color: 'text-orange-700 bg-orange-50 border-orange-200',
  },
};

const FALLBACK_STATUS: StatusConfig = { label: 'در انتظار بررسی', variant: 'secondary', icon: Clock, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };

function StatusBadge({ status }: { status: string }) {
  const cfg: StatusConfig = STATUS_CONFIG[status] ?? FALLBACK_STATUS;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function DocCard({ doc }: { doc: any }) {
  const isAgri = AGRI_DOC_TYPES.has(doc.type);
  return (
    <div className={`flex items-start justify-between gap-3 p-4 rounded-xl border ${isAgri ? 'border-green-200 bg-green-50/30' : 'border-gray-100 bg-white'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-gray-900">
            {DOC_TYPE_LABELS[doc.type] ?? doc.type}
          </span>
          {isAgri && (
            <span className="text-xs text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full">
              🌾 کشاورزی
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-3 flex-wrap">
          <StatusBadge status={doc.verificationStatus ?? VerificationStatus.PENDING} />
          <span className="text-xs text-gray-400">
            {new Date(doc.createdAt).toLocaleDateString('fa-IR')}
          </span>
        </div>
        {doc.verificationStatus === VerificationStatus.REJECTED && doc.rejectionReason && (
          <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            دلیل رد: {doc.rejectionReason}
          </p>
        )}
      </div>
      <a
        href={`/api/files/${doc.fileKey}`}
        target="_blank"
        rel="noreferrer"
        className="flex-shrink-0 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
      >
        مشاهده
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}

function LicensesPage() {
  const { data: profileData, isLoading } = trpc.profile.me.useQuery();
  const profile = profileData as any;

  const docs = profile?.documents ?? [];
  const agriDocs = docs.filter((d: any) => AGRI_DOC_TYPES.has(d.type));
  const otherDocs = docs.filter((d: any) => !AGRI_DOC_TYPES.has(d.type));

  const pendingCount = docs.filter((d: any) => (d.verificationStatus ?? VerificationStatus.PENDING) === VerificationStatus.PENDING).length;
  const approvedCount = docs.filter((d: any) => d.verificationStatus === VerificationStatus.APPROVED).length;
  const rejectedCount = docs.filter((d: any) => d.verificationStatus === VerificationStatus.REJECTED).length;

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مجوزها و مدارک من</h1>
          <p className="text-gray-500 text-sm mt-1">وضعیت مدارک و مجوزهای آپلود شده شما</p>
        </div>
        <Link to="/profile">
          <Button size="sm" className="gap-2">
            <Upload className="w-4 h-4" />
            آپلود مدرک جدید
          </Button>
        </Link>
      </div>

      {/* خلاصه آماری */}
      {docs.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-yellow-700">{pendingCount}</div>
            <div className="text-xs text-yellow-600 mt-0.5">در انتظار بررسی</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-green-700">{approvedCount}</div>
            <div className="text-xs text-green-600 mt-0.5">تایید شده</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-red-700">{rejectedCount}</div>
            <div className="text-xs text-red-600 mt-0.5">رد شده</div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-16 text-gray-400">بارگذاری...</div>
      ) : docs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500 mb-4">هنوز مدرکی آپلود نشده است</p>
            <Link to="/profile">
              <Button size="sm" className="gap-2">
                <Upload className="w-4 h-4" />
                آپلود مدرک
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {/* مجوزهای کشاورزی */}
          {agriDocs.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  🌾 مجوزهای کشاورزی
                  <Badge variant="secondary" className="text-xs">{agriDocs.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {agriDocs.map((doc: any) => (
                  <DocCard key={doc.id} doc={doc} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* سایر مدارک */}
          {otherDocs.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  📁 سایر مدارک
                  <Badge variant="secondary" className="text-xs">{otherDocs.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {otherDocs.map((doc: any) => (
                  <DocCard key={doc.id} doc={doc} />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* راهنما */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800" dir="rtl">
        <p className="font-medium mb-1">راهنما:</p>
        <ul className="space-y-1 text-xs text-blue-700 list-disc list-inside">
          <li>مدارک پس از آپلود توسط کارشناسان ما بررسی می‌شوند (معمولاً ۱–۳ روز کاری)</li>
          <li>مدارک تایید شده برای صادرات، تجارت و دریافت خدمات ویژه استفاده می‌شود</li>
          <li>در صورت رد مدرک، علت رد در همین صفحه نمایش داده می‌شود</li>
        </ul>
      </div>
    </div>
  );
}
