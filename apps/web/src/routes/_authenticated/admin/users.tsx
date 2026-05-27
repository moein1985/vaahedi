import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { trpc } from '../../../trpc.js';
import { UserStatus } from '@repo/shared';
import { toast } from 'sonner';
import { useConfirm } from '../../../components/ui/confirm-dialog.js';

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
  REJECTED: 'bg-muted text-muted-foreground',
};

function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const utils = trpc.useUtils();
  const { confirm, dialog: confirmDialog } = useConfirm();

  const { data, isLoading } = trpc.admin.userList.useQuery({
    page,
    limit: 15,
    search: search || undefined,
    status: (statusFilter as UserStatus) || undefined,
  });

  const updateStatus = trpc.admin.updateUserStatus.useMutation({
    onSuccess: () => {
      void utils.admin.userList.invalidate();
      toast.success('وضعیت کاربر به‌روز شد');
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="p-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">مدیریت کاربران</h1>
          <p className="text-muted-foreground text-sm mt-1">لیست کلیه کاربران سیستم</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <select
            aria-label="فیلتر وضعیت کاربران"
            title="فیلتر وضعیت کاربران"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--data-blue)]"
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
            className="border border-input rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-[var(--data-blue)]"
            dir="rtl"
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground/70">در حال بارگذاری...</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-muted/60">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-foreground">موبایل</th>
                <th className="text-right px-4 py-3 font-medium text-foreground">نام شرکت</th>
                <th className="text-right px-4 py-3 font-medium text-foreground">تاریخ ثبت</th>
                <th className="px-4 py-3 font-medium text-foreground">وضعیت</th>
                <th className="px-4 py-3 font-medium text-foreground">تغییر وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {(data?.items ?? []).map((user) => (
                <tr key={user.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-mono text-sm" dir="ltr">
                    <Link to="/admin/users/$userId" params={{ userId: user.id }} className="text-[var(--data-blue)] hover:text-[var(--agri-primary)]">
                      {user.mobile}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {user.profile?.companyName ?? user.profile?.unitName ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(user.createdAt).toLocaleDateString('fa-IR')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[user.status] ?? 'bg-muted text-muted-foreground'}`}
                    >
                      {STATUS_LABELS[user.status] ?? user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      aria-label={`تغییر وضعیت ${user.mobile}`}
                      title="تغییر وضعیت کاربر"
                      value={user.status}
                      disabled={updateStatus.isPending}
                      onChange={async (e) => {
                        const newStatus = e.target.value as UserStatus;
                        if (newStatus === 'SUSPENDED' || newStatus === 'REJECTED') {
                          const ok = await confirm({
                            title: `آیا از تغییر وضعیت به ${STATUS_LABELS[newStatus]} اطمینان دارید؟`,
                            variant: 'destructive',
                          });
                          if (!ok) { e.target.value = user.status; return; }
                        }
                        updateStatus.mutate({ userId: user.id, status: newStatus });
                      }}
                      className="text-xs border border-border rounded px-2 py-1 focus:outline-none"
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
          </div>
        )}
      </div>

      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-40 hover:bg-muted/50"
          >
            قبلی
          </button>
          <span className="px-3 py-1.5 text-sm text-muted-foreground">
            {page} / {data.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
            disabled={page === data.pages}
            className="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-40 hover:bg-muted/50"
          >
            بعدی
          </button>
        </div>
      )}
      {confirmDialog}
    </div>
  );
}
