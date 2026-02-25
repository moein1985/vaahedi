import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { trpc } from '../../../trpc.js';
import { UserStatus } from '@repo/shared';

export const Route = createFileRoute('/_authenticated/admin/users')({
  component: AdminUsersPage,
});

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'در انتظار',
  ACTIVE: 'فعال',
  SUSPENDED: 'تعلیق',
  REJECTED: 'رد شده',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  REJECTED: 'bg-gray-100 text-gray-600',
};

function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.admin.userList.useQuery({
    page,
    limit: 15,
    search: search || undefined,
    status: (statusFilter as UserStatus) || undefined,
  });

  const updateStatus = trpc.admin.updateUserStatus.useMutation({
    onSuccess: () => void utils.admin.userList.invalidate(),
  });

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مدیریت کاربران</h1>
          <p className="text-gray-500 text-sm mt-1">لیست کلیه کاربران سیستم</p>
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">همه وضعیت‌ها</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="جستجو..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
            dir="rtl"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16 text-gray-400">در حال بارگذاری...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-gray-700">موبایل</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">نام شرکت</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">تاریخ ثبت</th>
                <th className="px-4 py-3 font-medium text-gray-700">وضعیت</th>
                <th className="px-4 py-3 font-medium text-gray-700">تغییر وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.items ?? []).map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm" dir="ltr">
                    <Link to="/admin/users/$userId" params={{ userId: user.id }} className="text-blue-600 hover:text-blue-800">
                      {user.mobile}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {user.profile?.companyName ?? user.profile?.unitName ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(user.createdAt).toLocaleDateString('fa-IR')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[user.status] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {STATUS_LABELS[user.status] ?? user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.status}
                      disabled={updateStatus.isPending}
                      onChange={(e) =>
                        updateStatus.mutate({
                          userId: user.id,
                          status: e.target.value as UserStatus,
                        })
                      }
                      className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none"
                    >
                      {Object.values(UserStatus).map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            قبلی
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">
            {page} / {data.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
            disabled={page === data.pages}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            بعدی
          </button>
        </div>
      )}
    </div>
  );
}
