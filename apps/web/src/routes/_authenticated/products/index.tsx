import { useMemo, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { trpc } from '../../../trpc.js';
import { Card, CardContent } from '../../../components/ui/card.js';
import { Badge } from '../../../components/ui/badge.js';
import { Button } from '../../../components/ui/button.js';
import { Input } from '../../../components/ui/input.js';
import { Skeleton } from '../../../components/ui/skeleton.js';
import { Package, PackageCheck, Clock, XCircle, Edit } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/products/')({
  component: ProductsPage,
});

const STATUS_MAP: Record<string, { label: string; variant: React.ComponentProps<typeof Badge>['variant'] }> = {
  DRAFT: { label: 'پیش‌نویس', variant: 'outline' },
  PENDING_REVIEW: { label: 'در انتظار بررسی', variant: 'warning' },
  APPROVED: { label: 'تایید شده', variant: 'success' },
  REJECTED: { label: 'رد شده', variant: 'destructive' },
  SUSPENDED: { label: 'تعلیق', variant: 'secondary' },
};

function getProductStatus(product: { isApproved: boolean; rejectionReason: string | null }) {
  if (product.isApproved) return 'APPROVED';
  if (product.rejectionReason) return 'REJECTED';
  return 'PENDING_REVIEW';
}

function ProductsPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'>('ALL');
  const { data, isLoading } = trpc.product.myProducts.useQuery({ page });
  const { data: stats } = trpc.product.myStats.useQuery();

  const items = data?.data ?? [];
  const totalPages = data?.pagination.totalPages ?? 1;
  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return items.filter((product) => {
      const status = getProductStatus(product);
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter;
      const matchesSearch =
        q.length === 0 ||
        product.nameFa.toLowerCase().includes(q) ||
        product.nameEn.toLowerCase().includes(q) ||
        product.hsCode.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [items, searchTerm, statusFilter]);

  const approvedCount = items.filter((p) => p.isApproved).length;
  const pendingCount = items.filter((p) => !p.isApproved && !p.rejectionReason).length;
  const rejectedCount = items.filter((p) => !!p.rejectionReason).length;

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">کالاهای من</h1>
          <p className="text-muted-foreground text-sm mt-1">مدیریت کالاها برای نمایش در Marketplace</p>
        </div>
        <Button asChild>
          <Link to="/products/new">+ کالای جدید</Link>
        </Button>
      </div>

      {/* Stats Bar */}
      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'کل کالاها', value: stats?.total ?? items.length, icon: Package, color: 'bg-gray-50 text-gray-700', filter: 'ALL' as const },
            { label: 'تایید شده', value: approvedCount, icon: PackageCheck, color: 'bg-green-50 text-green-700', filter: 'APPROVED' as const },
            { label: 'در انتظار', value: pendingCount, icon: Clock, color: 'bg-amber-50 text-amber-700', filter: 'PENDING_REVIEW' as const },
            { label: 'رد شده', value: rejectedCount, icon: XCircle, color: 'bg-red-50 text-red-700', filter: 'REJECTED' as const },
          ].map(({ label, value, icon: Icon, color, filter }) => (
            <button
              key={label}
              onClick={() => setStatusFilter(filter)}
              className={`rounded-xl p-3 text-right border transition-all hover:shadow-sm ${color} ${statusFilter === filter ? 'ring-2 ring-offset-1 ring-current' : 'border-transparent'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xl font-bold">{value}</p>
                <Icon className="h-4 w-4 opacity-60" />
              </div>
              <p className="text-xs opacity-80">{label}</p>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <Input
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          placeholder="جستجو بر اساس نام یا HS Code"
          className="md:col-span-2"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED')}
          className="input-field"
          title="فیلتر وضعیت"
        >
          <option value="ALL">همه وضعیت‌ها</option>
          <option value="PENDING_REVIEW">در انتظار بررسی</option>
          <option value="APPROVED">تایید شده</option>
          <option value="REJECTED">رد شده</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-40 w-full rounded-lg mb-3" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-5xl mb-3">📦</div>
          {items.length === 0 ? (
            <>
              <p className="text-muted-foreground mb-4">هنوز محصولی ثبت نشده</p>
              <Button asChild>
                <Link to="/products/new">اولین محصول را ثبت کنید</Link>
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground">با فیلتر فعلی کالایی یافت نشد</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((product) => {
            const status = getProductStatus(product);
            const { label, variant } = STATUS_MAP[status] ?? { label: status, variant: 'outline' };
            return (
              <Card key={product.id} className="hover:shadow-md transition-shadow group">
                <CardContent className="p-5">
                  {/* Status badge top-right */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{product.nameFa}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{product.nameEn}</p>
                    </div>
                    <Badge variant={variant} className="px-2 py-0.5 shrink-0 mr-2">
                      {label}
                    </Badge>
                  </div>

                  {/* Product Details */}
                  <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center justify-between">
                      <span>کد HS:</span>
                      <span className="font-mono font-medium text-foreground" dir="ltr">{product.hsCode}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>حداقل سفارش:</span>
                      <span className="font-medium text-foreground">{product.minOrderQuantity}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>تاریخ ثبت:</span>
                      <span>{new Date(product.createdAt).toLocaleDateString('fa-IR')}</span>
                    </div>
                  </div>

                  {/* Rejection reason */}
                  {status === 'REJECTED' && product.rejectionReason && (
                    <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 mb-3">
                      <p className="text-xs text-red-600 line-clamp-2">{product.rejectionReason}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-dashed">
                    <Button asChild size="sm" variant="ghost" className="flex-1 text-xs">
                      <Link to="/marketplace">
                        مشاهده در Marketplace
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="flex-1 text-xs">
                      <Link to="/products/new">
                        <Edit className="h-3 w-3 ml-1" />
                        کالای جدید
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
