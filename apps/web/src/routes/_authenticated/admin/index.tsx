import { createFileRoute, Link } from '@tanstack/react-router';
import { trpc } from '../../../trpc.js';
import { Card } from '../../../components/ui/card.js';
import { Button } from '../../../components/ui/button.js';
import { Badge } from '../../../components/ui/badge.js';
import { cn } from '../../../lib/utils.js';

export const Route = createFileRoute('/_authenticated/admin/')({
  component: AdminDashboardPage,
});

function StatCard({
  label,
  value,
  href,
  color,
}: {
  label: string;
  value?: number;
  href: string;
  color: string;
}) {
  return (
    <Link
      to={href as '/admin/users'}
      className="block bg-white border rounded-xl p-5 hover:shadow-md transition-shadow"
    >
      <div className={`text-3xl font-bold mb-1 ${color}`}>{value ?? '—'}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </Link>
  );
}

function AdminDashboardPage() {
  const { data, isLoading } = trpc.admin.dashboard.useQuery();

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">پنل مدیریت</h1>
        <p className="text-gray-500 text-sm mt-1">خلاصه وضعیت سیستم</p>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-400">در حال بارگذاری...</div>
      ) : (
        <>
          {/* آمار کلی */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="کاربران فعال"
              value={data?.users.active}
              href="/admin/users"
              color="text-blue-600"
            />
            <StatCard
              label="بررسی مدارک"
              value={data?.users.pending}
              href="/admin/documents"
              color="text-orange-500"
            />
            <StatCard
              label="تایید محصولات"
              value={data?.products.pending}
              href="/admin/products"
              color="text-purple-600"
            />
            <StatCard
              label="درخواست تجاری"
              value={data?.tradeRequests.open}
              href="/admin/trade"
              color="text-green-600"
            />
          </div>

          {/* آمار بخش کشاورزی */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2">
              🌾 <span>بخش کشاورزی</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="مجوزهای کشاورزی معلق"
                value={data?.agri.pendingDocuments}
                href="/admin/documents"
                color="text-amber-600"
              />
              <StatCard
                label="درخواست‌های کشاورزی"
                value={data?.agri.tradeRequests}
                href="/admin/trade"
                color="text-emerald-600"
              />
              <StatCard
                label="تقویم برداشت فعال"
                value={data?.agri.harvestEntries}
                href="/admin/agri/harvest"
                color="text-teal-600"
              />
              <StatCard
                label="بینش بازار منتشرشده"
                value={data?.agri.publishedInsights}
                href="/admin/agri/market"
                color="text-cyan-600"
              />
            </div>
          </div>
        </>
      )}

      {/* نمودارها */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">آمار کاربران</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">کل کاربران</span>
              <span className="text-lg font-semibold text-blue-600">{data?.users.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">کاربران فعال</span>
              <span className="text-lg font-semibold text-green-600">{data?.users.active}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">در انتظار تایید</span>
              <span className="text-lg font-semibold text-orange-600">{data?.users.pending}</span>
            </div>
            <progress
              className="w-full h-2 mt-4 overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-gray-200 [&::-webkit-progress-value]:bg-blue-600 [&::-moz-progress-bar]:bg-blue-600"
              value={data?.users.active ?? 0}
              max={data?.users.total || 1}
              aria-label="نسبت کاربران فعال"
            />
          </div>
        </div>

        <div className="bg-white border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">آمار محصولات</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">کل محصولات</span>
              <span className="text-lg font-semibold text-blue-600">{data?.products.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">در انتظار تایید</span>
              <span className="text-lg font-semibold text-orange-600">{data?.products.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">تایید شده</span>
              <span className="text-lg font-semibold text-green-600">{(data?.products.total ?? 0) - (data?.products.pending ?? 0)}</span>
            </div>
            <progress
              className="w-full h-2 mt-4 overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-gray-200 [&::-webkit-progress-value]:bg-green-600 [&::-moz-progress-bar]:bg-green-600"
              value={(data?.products.total ?? 0) - (data?.products.pending ?? 0)}
              max={data?.products.total || 1}
              aria-label="نسبت محصولات تایید شده"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(
          [
            { label: 'مدیریت کاربران', href: '/admin/users', icon: '👥' },
            { label: 'تایید مدارک', href: '/admin/documents', icon: '📋' },
            { label: 'تایید محصولات', href: '/admin/products', icon: '📦' },
            { label: 'مدیریت اخبار', href: '/admin/news', icon: '📰' },
            { label: 'پشتیبانی', href: '/admin/support', icon: '🎫' },
            { label: 'تاکسونومی مشاغل', href: '/admin/agri/taxonomy', icon: '🌿' },
            { label: 'تقویم برداشت', href: '/admin/agri/harvest', icon: '📅' },
            { label: 'بینش بازار', href: '/admin/agri/market', icon: '📊' },
          ] as const
        ).map((item) => (
          <Link
            key={item.href}
            to={item.href as '/admin/users'}
            className="bg-white border border-gray-100 rounded-xl p-4 text-center hover:border-blue-200 hover:bg-blue-50 transition-colors"
          >
            <div className="text-3xl mb-2">{item.icon}</div>
            <div className="text-sm font-medium text-gray-700">{item.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
