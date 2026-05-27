import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { trpc } from '../../../trpc.js';
import { useDebounce } from '../../../hooks/useDebounce.js';
import { Input } from '../../../components/ui/input.js';
import { Button } from '../../../components/ui/button.js';
import { Card } from '../../../components/ui/card.js';
import { cn } from '../../../lib/utils.js';

export const Route = createFileRoute('/_authenticated/services/hs-codes')({
  component: HsCodesPage,
});

function HsCodesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = trpc.services.hsCodes.useQuery({
    search: debouncedSearch || undefined,
    page,
    limit: 20,
  });

  const items = (data as any)?.items ?? [];
  const totalPages = (data as any)?.pages ?? 1;

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">کدهای تعرفه گمرکی</h1>
        <p className="text-muted-foreground text-sm mt-1">مرجع کدهای HS برای ثبت دقیق محصولات و درخواست ها</p>
      </div>

      <div className="mb-4">
        <Input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="جستجو بر اساس کد یا توضیحات..."
          className="w-full max-w-md"
          dir="rtl"
        />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground/70">در حال جستجو...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground/70">
            <div className="text-3xl mb-2">🔍</div>
            <p>نتیجه‌ای یافت نشد</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground w-36" dir="ltr">
                  کد HS
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  توضیحات فارسی
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  English Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item: any) => (
                <tr key={item.code} className="hover:bg-muted/60">
                  <td className="px-4 py-3 font-mono text-[var(--data-blue)] font-medium" dir="ltr">
                    {item.code}
                  </td>
                  <td className="px-4 py-3 text-foreground">{item.descriptionFa}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs" dir="ltr">
                    {item.descriptionEn}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            variant="outline"
            size="sm"
          >
            قبلی
          </Button>
          <span className="px-3 py-1.5 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            variant="outline"
            size="sm"
          >
            بعدی
          </Button>
        </div>
      )}

      {data && (
        <p className="text-center text-xs text-muted-foreground/70 mt-4">
          {(data as any)?.total} نتیجه یافت شد
        </p>
      )}
    </div>
  );
}
