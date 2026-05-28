import { createFileRoute, Link } from '@tanstack/react-router';
import { trpc } from '../trpc.js';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button.js';

export const Route = createFileRoute('/news/$newsId')({
  component: NewsDetailPage,
});

function NewsDetailPage() {
  const { newsId } = Route.useParams();
  const { t } = useTranslation();

  const { data: article, isLoading } = trpc.news.byId.useQuery({ id: newsId });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        در حال بارگذاری...
      </div>
    );
  }

  if (!article) {
    return (
      <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">خبر مورد نظر یافت نشد</p>
        <Button asChild><Link to="/news">بازگشت به اخبار</Link></Button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-muted/50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/brand/logo_without_persian_words.png"
              alt="ذینفعان کشاورزی"
              className="h-8 w-8 rounded-lg border border-slate-200 bg-white object-contain p-0.5"
            />
            <span className="font-black text-foreground">ذینفعان کشاورزی</span>
          </Link>
          <Button variant="ghost" asChild><Link to="/news">{t('news.title')}</Link></Button>
        </div>
      </header>

      <article className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-border p-6 md:p-10">
          {article.category && (
            <span className="text-xs bg-[hsl(195_56%_33%_/_0.12)] text-[var(--data-blue)] px-2 py-0.5 rounded-full mb-3 inline-block">
              {article.category}
            </span>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            {article.title}
          </h1>

          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6 border-b pb-4">
            {article.sourceName && <span>منبع: {article.sourceName}</span>}
            {article.publishedAt && (
              <span dir="ltr">
                {new Date(article.publishedAt).toLocaleDateString('fa-IR')}
              </span>
            )}
          </div>

          {article.summary && (
            <p className="text-base text-muted-foreground mb-6 leading-relaxed font-medium">
              {article.summary}
            </p>
          )}

          <div className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
            {article.content}
          </div>

          {article.sourceUrl && (
            <div className="mt-8 pt-4 border-t">
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--data-blue)] hover:underline"
              >
                مشاهده منبع اصلی ←
              </a>
            </div>
          )}

          {article.tags && article.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {article.tags.map((tag: string) => (
                <span key={tag} className="text-xs bg-muted px-2 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Button variant="outline" asChild>
            <Link to="/news">← بازگشت به اخبار</Link>
          </Button>
        </div>
      </article>
    </div>
  );
}
