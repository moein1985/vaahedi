import { createFileRoute } from '@tanstack/react-router';
import { trpc } from '../../../trpc.js';
import { useState } from 'react';
import { Input } from '../../../components/ui/input.js';
import { Button } from '../../../components/ui/button.js';
import { Badge } from '../../../components/ui/badge.js';
import { Card } from '../../../components/ui/card.js';
import { cn } from '../../../lib/utils.js';

export const Route = createFileRoute('/_authenticated/services/circulars')({
  component: CircularsPage,
});

function CircularsPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = trpc.services.circulars.useQuery({ search });
  const trackDownload = trpc.services.trackDownload.useMutation();

  const handleDownload = (id: string, fileKey: string) => {
    trackDownload.mutate({ id });
    // Open file through presigned URL - for now open fileKey directly
    window.open(`/api/files/${fileKey}`, '_blank');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">بخشنامه‌ها و دستورالعمل‌ها</h1>
        <p className="text-gray-500 text-sm mt-1">آخرین بخشنامه‌های تجاری و گمرکی</p>
      </div>

      <div className="relative mb-6">
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو در بخشنامه‌ها ..."
          className="pr-10"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-400">در حال بارگذاری...</div>
      ) : !data?.items?.length ? (
        <div className="text-center py-12 text-gray-500">بخشنامه‌ای یافت نشد</div>
      ) : (
        <div className="space-y-3">
          {data.items.map((c) => (
            <div key={c.id} className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">{c.title}</h3>
                  {c.summary && (
                    <p className="text-sm text-gray-500 leading-relaxed">{c.summary}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {c.publishedAt && (
                      <span className="text-xs text-gray-400">
                        {new Date(c.publishedAt).toLocaleDateString('fa-IR')}
                      </span>
                    )}
                    {c.tags?.length > 0 && c.tags.map((tag: string) => (
                      <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                {c.fileKey && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(c.id, c.fileKey!)}
                    className="flex-shrink-0 flex items-center gap-1"
                  >
                    <span>📄</span>
                    دانلود
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
