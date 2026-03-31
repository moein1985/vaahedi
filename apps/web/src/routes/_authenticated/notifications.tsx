import { createFileRoute } from '@tanstack/react-router';
import { trpc } from '../../trpc.js';
import { Badge } from '../../components/ui/badge.js';
import { Skeleton } from '../../components/ui/skeleton.js';

export const Route = createFileRoute('/_authenticated/notifications')({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { data, isLoading } = trpc.notification.list.useQuery({ page: 1 });
  const markRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => void utils.notification.list.invalidate(),
  });
  const utils = trpc.useUtils();

  return (
    <div className="p-6 max-w-2xl" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">اعلان‌ها</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : !data?.notifications?.length ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔔</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">اعلانی وجود ندارد</h3>
          <p className="text-sm text-gray-400">هنگام تغییر وضعیت محصولات و مدارک، اینجا اطلاع‌رسانی می‌شود</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.notifications.map((n: any) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && markRead.mutate({ ids: [n.id] })}
              className={`rounded-xl border p-4 cursor-pointer transition-colors ${n.isRead ? 'bg-white border-gray-100' : 'bg-blue-50/50 border-blue-100'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.isRead ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleDateString('fa-IR')}
                  </p>
                </div>
                {!n.isRead && <Badge variant="blue" className="text-[10px] shrink-0">جدید</Badge>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
