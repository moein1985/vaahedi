import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { trpc } from '../../trpc.js';
import { Badge } from '../../components/ui/badge.js';
import { Button } from '../../components/ui/button.js';
import { Skeleton } from '../../components/ui/skeleton.js';
import { Bell, BellOff, CheckCheck, Package, Handshake, FileCheck, MessageSquare, Megaphone } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/notifications')({
  component: NotificationsPage,
});

const NOTIF_TYPE_ICON: Record<string, React.ElementType> = {
  TRADE_REQUEST_MATCH:  Handshake,
  PRODUCT_APPROVED:     Package,
  DOCUMENT_VERIFIED:    FileCheck,
  NEW_MESSAGE:          MessageSquare,
  SYSTEM_ANNOUNCEMENT:  Megaphone,
};

const NOTIF_TYPE_LABEL: Record<string, string> = {
  TRADE_REQUEST_MATCH:  'تطابق درخواست',
  PRODUCT_APPROVED:     'تایید کالا',
  DOCUMENT_VERIFIED:    'تایید مدرک',
  NEW_MESSAGE:          'پیام جدید',
  SYSTEM_ANNOUNCEMENT:  'اعلان سیستم',
};

function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.notification.list.useQuery({ page, limit: 20, unreadOnly });
  const { data: unreadCount } = trpc.notification.unreadCount.useQuery();

  const markRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      void utils.notification.list.invalidate();
      void utils.notification.unreadCount.invalidate();
    },
  });
  const markAllRead = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      void utils.notification.list.invalidate();
      void utils.notification.unreadCount.invalidate();
    },
  });

  const totalPages = data?.pagination.totalPages ?? 1;

  return (
    <div className="p-5 lg:p-7 max-w-2xl" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">اعلان‌ها</h1>
          {(unreadCount ?? 0) > 0 && (
            <Badge variant="destructive" className="text-xs">{unreadCount} جدید</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setUnreadOnly((v) => !v); setPage(1); }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs border transition-colors ${unreadOnly ? 'bg-[hsl(148_62%_24%_/_0.12)] text-[var(--agri-primary)] border-[hsl(148_40%_74%)]' : 'bg-card text-muted-foreground border-border'}`}
          >
            {unreadOnly ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
            {unreadOnly ? 'خوانده نشده' : 'همه'}
          </button>
          {(unreadCount ?? 0) > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1.5"
              loading={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              همه را خواندم
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : !data?.notifications?.length ? (
        <div className="text-center py-20">
          <BellOff className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-foreground mb-1">
            {unreadOnly ? 'اعلان خوانده نشده‌ای وجود ندارد' : 'اعلانی وجود ندارد'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {unreadOnly
              ? 'همه اعلان‌ها خوانده شده‌اند'
              : 'هنگام تغییر وضعیت کالا، مدارک یا درخواست ها اینجا اطلاع رسانی می شود'
            }
          </p>
          {unreadOnly && (
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => setUnreadOnly(false)}>
              نمایش همه اعلان‌ها
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {data.notifications.map((n: any) => {
            const Icon = NOTIF_TYPE_ICON[n.type as string] ?? Bell;
            const typeLabel = NOTIF_TYPE_LABEL[n.type as string];
            return (
              <div
                key={n.id}
                onClick={() => !n.isRead && markRead.mutate({ ids: [n.id] })}
                className={`rounded-xl border p-4 transition-colors cursor-pointer ${
                  n.isRead
                    ? 'bg-card border-border/70 hover:border-border'
                    : 'bg-[hsl(148_62%_24%_/_0.08)] border-[hsl(148_40%_78%)] hover:bg-[hsl(148_62%_24%_/_0.12)]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2 shrink-0 mt-0.5 ${n.isRead ? 'bg-muted' : 'bg-[hsl(148_62%_24%_/_0.14)]'}`}>
                    <Icon className={`h-4 w-4 ${n.isRead ? 'text-muted-foreground' : 'text-[var(--agri-primary)]'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      {typeLabel && (
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                          {typeLabel}
                        </span>
                      )}
                      {!n.isRead && <Badge variant="blue" className="text-[10px] px-1.5 py-0.5">جدید</Badge>}
                    </div>
                    {n.title && (
                      <p className={`text-sm font-semibold mb-0.5 ${n.isRead ? 'text-foreground' : 'text-foreground'}`}>
                        {n.title}
                      </p>
                    )}
                    <p className={`text-sm leading-5 ${n.isRead ? 'text-muted-foreground' : 'text-[var(--soil-neutral)]'}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1.5">
                      {new Date(n.createdAt).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })}
                      {' · '}
                      {new Date(n.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            قبلی
          </Button>
          <span className="px-3 py-1.5 text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            بعدی
          </Button>
        </div>
      )}
    </div>
  );
}
