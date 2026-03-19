import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { trpc } from '../../trpc.js';
import { Button } from '../../components/ui/button.js';
import { Card, CardContent } from '../../components/ui/card.js';

export const Route = createFileRoute('/_authenticated/downloads')({
  component: DownloadsPage,
});

const CATEGORY_LABELS: Record<string, string> = {
  catalog: 'کاتالوگ',
  clip: 'کلیپ',
  document: 'مستندات',
  other: 'سایر',
};

function DownloadsPage() {
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.services.downloads.useQuery({
    category: category || undefined,
    page,
    limit: 12,
  });

  const trackDownload = trpc.services.trackDownload.useMutation();

  const handleDownload = (id: string, fileKey: string) => {
    trackDownload.mutate({ id });
    window.open(`/api/files/${fileKey}`, '_blank');
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">دانلودها</h1>
        <p className="text-gray-500 text-sm mt-1">کاتالوگ، کلیپ و مستندات مرتبط با انجمن و خدمات</p>
      </div>

      {/* فیلتر دسته‌بندی */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Button
          variant={category === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setCategory(''); setPage(1); }}
        >
          همه
        </Button>
        {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
          <Button
            key={val}
            variant={category === val ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setCategory(val); setPage(1); }}
          >
            {label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-center py-8">در حال بارگذاری...</p>
      ) : !data?.items.length ? (
        <p className="text-gray-400 text-center py-8">موردی یافت نشد</p>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.items.map((item: any) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 truncate">{item.title}</h3>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>{CATEGORY_LABELS[item.category] ?? item.category}</span>
                        <span>{Math.round(item.fileSize / 1024)} KB</span>
                        <span>{item.downloadCount} دانلود</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(item.id, item.fileKey)}
                    >
                      دانلود
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {data.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: data.pages }, (_, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant={page === i + 1 ? 'default' : 'outline'}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}