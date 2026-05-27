import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { trpc } from '../../../trpc.js';
import { toast } from 'sonner';
import { useConfirm } from '../../../components/ui/confirm-dialog.js';
import { getFriendlyTrpcError } from '../../../lib/trpc-error.js';

function showMutationError(err: any) {
  const zodFields = err?.data?.zodError?.fieldErrors;
  if (zodFields) {
    const first = Object.values(zodFields as Record<string, string[]>).flat()[0];
    if (first) { toast.error(first); return; }
  }
  toast.error(getFriendlyTrpcError(err));
}

export const Route = createFileRoute('/_authenticated/admin/admins')({
  component: AdminAdminsPage,
});

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'ادمین کل',
  EXPERT: 'کارشناس',
  MEDIA_SUPERVISOR: 'ناظر رسانه ای',
  ANALYST: 'تحلیلگر بازرگانی',
};

const MANAGEABLE_ROLES = ['EXPERT', 'MEDIA_SUPERVISOR', 'ANALYST'] as const;

function AdminAdminsPage() {
  const utils = trpc.useUtils();
  const { confirm, dialog: confirmDialog } = useConfirm();

  const [userCode, setUserCode] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [adminRole, setAdminRole] = useState<(typeof MANAGEABLE_ROLES)[number]>('EXPERT');

  const { data, isLoading } = trpc.admin.listAdmins.useQuery();

  const createAdmin = trpc.admin.createAdmin.useMutation({
    onSuccess: async () => {
      toast.success('ادمین جدید ایجاد شد');
      setUserCode('');
      setPassword('');
      setMobile('');
      setEmail('');
      setAdminRole('EXPERT');
      await utils.admin.listAdmins.invalidate();
    },
    onError: (err) => showMutationError(err),
  });

  const updateAdminRole = trpc.admin.updateAdminRole.useMutation({
    onSuccess: async () => {
      toast.success('نقش ادمین به روز شد');
      await utils.admin.listAdmins.invalidate();
    },
    onError: (err) => showMutationError(err),
  });

  const removeAdmin = trpc.admin.removeAdmin.useMutation({
    onSuccess: async () => {
      toast.success('دسترسی ادمین حذف شد');
      await utils.admin.listAdmins.invalidate();
    },
    onError: (err) => showMutationError(err),
  });

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    await createAdmin.mutateAsync({
      userCode,
      password,
      mobile,
      email: email || undefined,
      adminRole,
    });
  }

  async function handleRemoveAdmin(userId: string, userCodeValue: string) {
    const ok = await confirm({
      title: 'حذف دسترسی ادمین',
      description: `آیا از حذف دسترسی ادمین برای ${userCodeValue} مطمئن هستید؟`,
      variant: 'destructive',
    });
    if (!ok) return;
    await removeAdmin.mutateAsync({ userId });
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">مدیریت ادمین ها</h1>
        <p className="text-muted-foreground text-sm mt-1">
          ساخت، ویرایش و حذف ادمین های کارشناس، ناظر رسانه ای و تحلیلگر بازرگانی
        </p>
      </div>

      <form onSubmit={handleCreateAdmin} className="bg-card border border-border rounded-xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          value={userCode}
          onChange={(e) => setUserCode(e.target.value)}
          placeholder="نام کاربری (userCode)"
          className="border border-input rounded-lg px-3 py-2 text-sm"
          required
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="رمز عبور"
          type="password"
          className="border border-input rounded-lg px-3 py-2 text-sm"
          required
        />
        <input
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          placeholder="شماره همراه"
          className="border border-input rounded-lg px-3 py-2 text-sm"
          required
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ایمیل (اختیاری)"
          className="border border-input rounded-lg px-3 py-2 text-sm"
        />
        <select
          value={adminRole}
          onChange={(e) => setAdminRole(e.target.value as (typeof MANAGEABLE_ROLES)[number])}
          aria-label="نقش ادمین جدید"
          title="نقش ادمین جدید"
          className="border border-input rounded-lg px-3 py-2 text-sm"
        >
          <option value="EXPERT">کارشناس</option>
          <option value="MEDIA_SUPERVISOR">ناظر رسانه ای</option>
          <option value="ANALYST">تحلیلگر بازرگانی</option>
        </select>
        <button
          type="submit"
          className="md:col-span-5 bg-[var(--agri-primary)] text-white rounded-lg px-4 py-2 text-sm hover:bg-[var(--agri-leaf)] disabled:opacity-60"
          disabled={createAdmin.isPending}
        >
          {createAdmin.isPending ? 'در حال ایجاد...' : 'ایجاد ادمین'}
        </button>
      </form>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground/70">در حال بارگذاری...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-right">نام کاربری</th>
                <th className="px-4 py-3 text-right">موبایل</th>
                <th className="px-4 py-3 text-right">نقش ادمین</th>
                <th className="px-4 py-3 text-right">وضعیت</th>
                <th className="px-4 py-3 text-right">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((item) => (
                <tr key={item.id} className="border-t border-border/60">
                  <td className="px-4 py-3">{item.user.userCode}</td>
                  <td className="px-4 py-3">{item.user.mobile}</td>
                  <td className="px-4 py-3">
                    {item.adminRole === 'SUPER_ADMIN' ? (
                      <span>{ROLE_LABELS[item.adminRole]}</span>
                    ) : (
                      <select
                        value={item.adminRole}
                        onChange={(e) => {
                          void updateAdminRole.mutateAsync({
                            userId: item.userId,
                            adminRole: e.target.value as (typeof MANAGEABLE_ROLES)[number],
                          });
                        }}
                        aria-label={`تغییر نقش ادمین ${item.user.userCode}`}
                        title={`تغییر نقش ادمین ${item.user.userCode}`}
                        className="border border-input rounded-lg px-2 py-1 text-xs"
                      >
                        <option value="EXPERT">کارشناس</option>
                        <option value="MEDIA_SUPERVISOR">ناظر رسانه ای</option>
                        <option value="ANALYST">تحلیلگر بازرگانی</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3">{item.user.status}</td>
                  <td className="px-4 py-3">
                    {item.adminRole === 'SUPER_ADMIN' ? (
                      <span className="text-muted-foreground/70">غیرقابل حذف</span>
                    ) : (
                      <button
                        onClick={() => {
                          void handleRemoveAdmin(item.userId, item.user.userCode);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        حذف دسترسی
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {confirmDialog}
    </div>
  );
}
