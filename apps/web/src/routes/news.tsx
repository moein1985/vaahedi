import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { trpc } from '../trpc.js';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../components/ui/card.js';
import { Input } from '../components/ui/input.js';
import { Button } from '../components/ui/button.js';

export const Route = createFileRoute('/news')({
  component: NewsPage,
});

function NewsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');

  const { data, isLoading } = trpc.news.list.useQuery({
    page,
    limit: 12,
    search: search || undefined,
  });

  return (
    <div dir="rtl" className="min-h-screen bg-muted/50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/brand/logo_without_persian_words.png"
                alt="ذینفعان کشاورزی"
                className="h-8 w-8 rounded-lg border border-slate-200 bg-white object-contain p-0.5"
              />
              <span className="font-black text-foreground">ذینفعان کشاورزی</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild><Link to="/catalog">بازار محصولات</Link></Button>
            <Button variant="ghost" asChild><Link to="/auth/login">ورود</Link></Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{t('news.title')}</h1>

        {/* Search */}
        <div className="flex gap-2 mb-8 max-w-md">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجوی اخبار..."
            onKeyDown={(e) => e.key === 'Enter' && (setSearch(q), setPage(1))}
          />
          <Button onClick={() => { setSearch(q); setPage(1); }}>جستجو</Button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            در حال بارگذاری...
          </div>
        )}

        {data && data.items.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">خبری یافت نشد</div>
        )}

        {/* News Grid */}
        {data && data.items.length > 0 && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.items.map((item: { id: string; title: string; summary: string | null; imageKey: string | null; sourceName: string | null; sourceUrl: string | null; category: string | null; tags: string[]; publishedAt: Date | string | null }) => (
                <Link key={item.id} to="/news/$newsId" params={{ newsId: item.id }}>
                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-5">
                      {item.category && (
                        <span className="text-xs bg-[hsl(195_56%_33%_/_0.12)] text-[var(--data-blue)] px-2 py-0.5 rounded-full mb-2 inline-block">
                          {item.category}
                        </span>
                      )}
                      <h2 className="font-bold text-foreground mb-2 line-clamp-2">
                        {item.title}
                      </h2>
                      {item.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                          {item.summary}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {item.sourceName && <span>{item.sourceName}</span>}
                        {item.publishedAt && (
                          <span dir="ltr">
                            {new Date(item.publishedAt).toLocaleDateString('fa-IR')}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {data.pages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  قبلی
                </Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  صفحه {page} از {data.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  بعدی
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
