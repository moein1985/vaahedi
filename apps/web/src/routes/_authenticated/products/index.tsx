import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { trpc } from '../../../trpc.js';
import { Card, CardContent } from '../../../components/ui/card.js';
import { Badge } from '../../../components/ui/badge.js';
import { Button } from '../../../components/ui/button.js';
import { Skeleton } from '../../../components/ui/skeleton.js';

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
  const { data, isLoading } = trpc.product.myProducts.useQuery({ page });

  const items = data?.data ?? [];
  const totalPages = data?.pagination.totalPages ?? 1;

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">محصولات من</h1>
          <p className="text-muted-foreground text-sm mt-1">مدیریت کاتالوگ محصولات</p>
        </div>
        <Button asChild>
          <Link to="/products/new">+ محصول جدید</Link>
        </Button>
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
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-5xl mb-3">📦</div>
          <p className="text-muted-foreground mb-4">هنوز محصولی ثبت نشده</p>
          <Button asChild>
            <Link to="/products/new">اولین محصول را ثبت کنید</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((product) => {
            const status = getProductStatus(product);
            const { label, variant } = STATUS_MAP[status] ?? { label: status, variant: 'outline' };
            return (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{product.nameFa}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{product.nameEn}</p>
                    </div>
                    <Badge variant={variant} className="px-2 py-0.5">
                      {label}
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="font-mono" dir="ltr">HS: {product.hsCode}</div>
                    <div>حداقل سفارش: {product.minOrderQuantity}</div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-muted-foreground">
                      {new Date(product.createdAt).toLocaleDateString('fa-IR')}
                    </span>
                    {status === 'REJECTED' && product.rejectionReason && (
                      <span className="text-xs text-destructive line-clamp-1">
                        {product.rejectionReason}
                      </span>
                    )}
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
