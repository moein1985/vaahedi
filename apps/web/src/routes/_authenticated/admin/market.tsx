import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { trpc } from '../../../trpc.js';
import { Button } from '../../../components/ui/button.js';
import { Input } from '../../../components/ui/input.js';
import { Badge } from '../../../components/ui/badge.js';
import { useConfirm } from '../../../components/ui/confirm-dialog.js';
import { TrendingUp, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/admin/market')({
  component: AdminMarketPage,
});

const INSIGHT_TYPE_LABELS: Record<string, string> = {
  price: 'قیمت',
  demand: 'تقاضا',
  supply: 'عرضه',
  trend: 'روند',
  regulation: 'مقررات',
};

const INSIGHT_TYPE_COLORS: Record<string, string> = {
  price: 'bg-yellow-100 text-yellow-800',
  demand: 'bg-[hsl(195_56%_33%_/_0.12)] text-[var(--data-blue)]',
  supply: 'bg-green-100 text-green-800',
  trend: 'bg-purple-100 text-purple-800',
  regulation: 'bg-muted text-muted-foreground',
};

type InsightType = 'price' | 'demand' | 'supply' | 'trend' | 'regulation';

type FormState = {
  title: string;
  commodityFa: string;
  commodityEn: string;
  insightType: InsightType;
  content: string;
  dataDate: string;
  sourceUrl: string;
  tags: string;
  isPublished: boolean;
};

const EMPTY_FORM: FormState = {
  title: '', commodityFa: '', commodityEn: '', insightType: 'price',
  content: '', dataDate: '', sourceUrl: '', tags: '', isPublished: false,
};

function AdminMarketPage() {
  const utils = trpc.useUtils();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data, isLoading } = trpc.agri.market.listAdmin.useQuery({ page, limit: 20 });
  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  const createMut = trpc.agri.market.create.useMutation({
    onSuccess: () => { void utils.agri.market.listAdmin.invalidate(); resetForm(); },
  });
  const updateMut = trpc.agri.market.update.useMutation({
    onSuccess: () => { void utils.agri.market.listAdmin.invalidate(); resetForm(); },
  });
  const deleteMut = trpc.agri.market.delete.useMutation({
    onSuccess: () => void utils.agri.market.listAdmin.invalidate(),
  });
  const publishMut = trpc.agri.market.publish.useMutation({
    onSuccess: () => void utils.agri.market.listAdmin.invalidate(),
  });

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(false); };

  const startEdit = (item: NonNullable<typeof data>['items'][number]) => {
    setForm({
      title: item.title,
      commodityFa: item.commodityFa,
      commodityEn: item.commodityEn ?? '',
      insightType: item.insightType as InsightType,
      content: item.content,
      dataDate: item.dataDate ? new Date(item.dataDate).toISOString().slice(0, 10) : '',
      sourceUrl: item.sourceUrl ?? '',
      tags: (item.tags ?? []).join(', '),
      isPublished: item.isPublished,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
    const payload = {
      title: form.title,
      commodityFa: form.commodityFa,
      commodityEn: form.commodityEn || undefined,
      insightType: form.insightType,
      content: form.content,
      dataDate: form.dataDate || undefined,
      sourceUrl: form.sourceUrl || undefined,
      tags: tags.length ? tags : undefined,
      isPublished: form.isPublished,
    };
    if (editingId) {
      await updateMut.mutateAsync({ id: editingId, data: payload });
    } else {
      await createMut.mutateAsync(payload);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const ok = await confirm({ title: `آیا تحلیل "${title}" حذف شود؟`, variant: 'destructive' });
    if (ok) await deleteMut.mutateAsync({ id });
  };

  const isSubmitting = createMut.isPending || updateMut.isPending;

  return (
    <div className="p-6" dir="rtl">
      {confirmDialog}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-[var(--data-blue)]" />
          <h1 className="text-xl font-bold">مدیریت تحلیل بازار</h1>
          {data && <span className="text-sm text-muted-foreground/70">({data.total} تحلیل)</span>}
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4 ml-1" />
          تحلیل جدید
        </Button>
      </div>

      {/* فرم */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <h2 className="font-semibold mb-4">{editingId ? 'ویرایش تحلیل' : 'تحلیل جدید'}</h2>
          <form onSubmit={(e) => { void handleSubmit(e); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-full">
              <label className="block text-sm font-medium mb-1">عنوان *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="تحلیل قیمت گندم در فصل پاییز"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">محصول (فارسی) *</label>
              <Input
                value={form.commodityFa}
                onChange={(e) => setForm((f) => ({ ...f, commodityFa: e.target.value }))}
                placeholder="گندم"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">محصول (انگلیسی)</label>
              <Input
                value={form.commodityEn}
                onChange={(e) => setForm((f) => ({ ...f, commodityEn: e.target.value }))}
                placeholder="Wheat"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">نوع تحلیل *</label>
              <select
                title="نوع تحلیل"
                value={form.insightType}
                onChange={(e) => setForm((f) => ({ ...f, insightType: e.target.value as InsightType }))}
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm"
              >
                {Object.entries(INSIGHT_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">تاریخ داده (میلادی)</label>
              <Input
                type="date"
                value={form.dataDate}
                onChange={(e) => setForm((f) => ({ ...f, dataDate: e.target.value }))}
                dir="ltr"
              />
            </div>
            <div className="col-span-full">
              <label className="block text-sm font-medium mb-1">محتوا *</label>
              <textarea
                title="محتوا"
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                rows={5}
                required
                placeholder="متن تحلیل بازار را وارد کنید"
                className="w-full border border-input rounded-lg px-3 py-2 text-sm resize-y"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">لینک منبع</label>
              <Input
                value={form.sourceUrl}
                onChange={(e) => setForm((f) => ({ ...f, sourceUrl: e.target.value }))}
                placeholder="https://..."
                dir="ltr"
                type="url"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">تگ‌ها (کاما جدا)</label>
              <Input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="گندم, قیمت, پاییز"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={form.isPublished}
                onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
              />
              <label htmlFor="isPublished" className="text-sm">منتشر شود</label>
            </div>
            <div className="flex gap-2 col-span-full">
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'در حال ذخیره...' : editingId ? 'ذخیره تغییرات' : 'ایجاد'}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={resetForm}>انصراف</Button>
              {(createMut.error || updateMut.error) && (
                <p className="text-sm text-red-600 self-center">خطا: {(createMut.error ?? updateMut.error)?.message}</p>
              )}
            </div>
          </form>
        </div>
      )}

      {/* لیست */}
      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground/70">در حال بارگذاری...</div>
      ) : (
        <div className="space-y-3">
          {(data?.items ?? []).map((item) => (
            <div key={item.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${INSIGHT_TYPE_COLORS[item.insightType] ?? ''}`}>
                      {INSIGHT_TYPE_LABELS[item.insightType] ?? item.insightType}
                    </span>
                    <span className="text-xs text-[var(--data-blue)] bg-[hsl(195_56%_33%_/_0.12)] px-2 py-0.5 rounded-full">{item.commodityFa}</span>
                    {item.isPublished ? (
                      <Badge variant="green" className="text-xs">منتشر</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">پیش‌نویس</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.content}</p>
                  {item.publishedAt && (
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      انتشار: {new Date(item.publishedAt).toLocaleDateString('fa-IR')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* دکمه انتشار/پیش‌نویس سریع */}
                  <button
                    onClick={() => void publishMut.mutateAsync({ id: item.id, isPublished: !item.isPublished })}
                    title={item.isPublished ? 'تبدیل به پیش‌نویس' : 'انتشار'}
                    className={`p-1.5 rounded-lg transition-colors ${item.isPublished ? 'text-green-600 hover:bg-green-50' : 'text-muted-foreground/70 hover:bg-muted'}`}
                  >
                    {item.isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button title="ویرایش" onClick={() => startEdit(item)} className="p-1.5 text-[var(--data-blue)] hover:text-[var(--agri-primary)] rounded-lg hover:bg-[hsl(195_56%_33%_/_0.12)]">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button title="حذف" onClick={() => void handleDelete(item.id, item.title)} className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!data?.items.length && (
            <div className="text-center py-16 text-muted-foreground/70">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
              تحلیلی ثبت نشده
            </div>
          )}
        </div>
      )}

      {/* صفحه‌بندی */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button title="صفحه قبل" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg border disabled:opacity-40">
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="text-sm text-muted-foreground">صفحه {page} از {totalPages}</span>
          <button title="صفحه بعد" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg border disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
