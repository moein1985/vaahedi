import { createFileRoute } from '@tanstack/react-router';
import { useState, useRef } from 'react';
import { trpc } from '../../../trpc.js';
import { Button } from '../../../components/ui/button.js';
import { Input } from '../../../components/ui/input.js';
import { Badge } from '../../../components/ui/badge.js';
import { useConfirm } from '../../../components/ui/confirm-dialog.js';

export const Route = createFileRoute('/_authenticated/admin/news')({
  component: AdminNewsPage,
});

function AdminNewsPage() {
  const utils = trpc.useUtils();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{ key: string; name: string } | null>(null);
  const [tagInput, setTagInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    summary: '',
    content: '',
    sourceName: '',
    sourceUrl: '',
    category: '',
    tags: [] as string[],
    isPublished: true,
  });

  const resetForm = () => {
    setForm({ title: '', summary: '', content: '', sourceName: '', sourceUrl: '', category: '', tags: [], isPublished: true });
    setUploadedImage(null);
    setEditingId(null);
    setTagInput('');
  };

  const { data, isLoading } = trpc.news.adminList.useQuery({ page, limit: 20 });

  const getUploadUrl = trpc.news.adminGetUploadUrl.useMutation();
  const createNews = trpc.news.adminCreate.useMutation({
    onSuccess: () => {
      void utils.news.adminList.invalidate();
      setShowForm(false);
      resetForm();
    },
  });
  const updateNews = trpc.news.adminUpdate.useMutation({
    onSuccess: () => {
      void utils.news.adminList.invalidate();
      setShowForm(false);
      resetForm();
    },
  });
  const deleteNews = trpc.news.adminDelete.useMutation({
    onSuccess: () => void utils.news.adminList.invalidate(),
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url, key } = await getUploadUrl.mutateAsync({
        fileName: file.name,
        contentType: file.type || 'image/jpeg',
      });
      await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      setUploadedImage({ key, name: file.name });
    } finally {
      setUploading(false);
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    }
    setTagInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) return;

    const payload = {
      title: form.title,
      content: form.content,
      summary: form.summary || undefined,
      sourceName: form.sourceName || undefined,
      sourceUrl: form.sourceUrl || undefined,
      category: form.category || undefined,
      tags: form.tags,
      isPublished: form.isPublished,
      imageKey: uploadedImage?.key,
    };

    if (editingId) {
      updateNews.mutate({ id: editingId, ...payload });
    } else {
      createNews.mutate(payload);
    }
  };

  const startEdit = (item: any) => {
    setForm({
      title: item.title ?? '',
      summary: item.summary ?? '',
      content: item.content ?? '',
      sourceName: item.sourceName ?? '',
      sourceUrl: item.sourceUrl ?? '',
      category: item.category ?? '',
      tags: item.tags ?? [],
      isPublished: item.isPublished ?? true,
    });
    if (item.imageKey) setUploadedImage({ key: item.imageKey, name: 'تصویر موجود' });
    setEditingId(item.id);
    setShowForm(true);
  };

  const isPending = createNews.isPending || updateNews.isPending;

  return (
    <div className="p-6 max-w-4xl" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مدیریت اخبار</h1>
          <p className="text-sm text-gray-500 mt-1">ایجاد، ویرایش و حذف اخبار</p>
        </div>
        <button
          onClick={() => { showForm ? (setShowForm(false), resetForm()) : setShowForm(true); }}
          className="btn-primary"
        >
          {showForm ? 'انصراف' : '+ خبر جدید'}
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-4">
          <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">
            {editingId ? 'ویرایش خبر' : 'خبر جدید'}
          </h2>

          <div>
            <label className="label-text">عنوان *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="input-field"
              placeholder="عنوان خبر..."
              required
            />
          </div>

          <div>
            <label className="label-text">خلاصه</label>
            <input
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              className="input-field"
              placeholder="خلاصه کوتاه خبر..."
            />
          </div>

          <div>
            <label className="label-text">متن کامل *</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={6}
              className="input-field resize-none"
              placeholder="متن کامل خبر..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">نام منبع</label>
              <input
                value={form.sourceName}
                onChange={(e) => setForm((f) => ({ ...f, sourceName: e.target.value }))}
                className="input-field"
                placeholder="مثال: خبرگزاری فارس"
              />
            </div>
            <div>
              <label className="label-text">لینک منبع</label>
              <input
                value={form.sourceUrl}
                onChange={(e) => setForm((f) => ({ ...f, sourceUrl: e.target.value }))}
                className="input-field"
                dir="ltr"
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <label className="label-text">دسته‌بندی</label>
            <input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="input-field"
              placeholder="مثال: تجاری، فلزات، پتروشیمی..."
            />
          </div>

          {/* Tags */}
          <div>
            <label className="label-text">برچسب‌ها</label>
            <div className="flex gap-2 flex-wrap mb-2">
              {form.tags.map((t) => (
                <span key={t} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                  {t}
                  <button type="button" onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }))} className="text-blue-400 hover:text-blue-700">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="input-field"
                placeholder="برچسب جدید + Enter"
              />
              <button type="button" onClick={addTag} className="btn-secondary shrink-0">افزودن</button>
            </div>
          </div>

          {/* Image upload */}
          <div>
            <label className="label-text">تصویر خبر (اختیاری)</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" title="انتخاب تصویر خبر" />
            {uploadedImage ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-700 text-sm">{uploadedImage.name}</span>
                <button type="button" onClick={() => setUploadedImage(null)} className="text-xs text-red-500 mr-auto">حذف</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="btn-secondary w-full"
              >
                {uploading ? 'در حال آپلود...' : '🖼️ انتخاب تصویر'}
              </button>
            )}
          </div>

          {/* Published checkbox */}
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
              className="rounded text-blue-600"
            />
            انتشار فوری
          </label>

          {(createNews.error || updateNews.error) && (
            <p className="text-red-500 text-sm">{(createNews.error || updateNews.error)?.message}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending ? 'در حال ذخیره...' : editingId ? 'بروزرسانی' : 'انتشار خبر'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="btn-secondary">
              انصراف
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">در حال بارگذاری...</div>
      ) : !data?.items?.length ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500">هیچ خبری ثبت نشده است</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-4">اولین خبر را ایجاد کنید</button>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((item) => (
            <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                    {item.isPublished ? (
                      <Badge variant="green" className="text-xs">منتشر شده</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">پیش‌نویس</Badge>
                    )}
                    {item.category && (
                      <Badge variant="blue" className="text-xs">{item.category}</Badge>
                    )}
                  </div>
                  {item.summary && (
                    <p className="text-sm text-gray-500 truncate">{item.summary}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    {item.sourceName && <span>منبع: {item.sourceName}</span>}
                    <span dir="ltr">{new Date(item.createdAt).toLocaleDateString('fa-IR')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(item)}
                    className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg text-sm"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={async () => {
                      const ok = await confirm({ title: 'آیا از حذف این خبر مطمئن هستید؟', variant: 'destructive' });
                      if (ok) deleteNews.mutate({ id: item.id });
                    }}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg text-sm"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn-secondary text-sm"
          >
            قبلی
          </button>
          <span className="flex items-center px-4 text-sm text-gray-500">
            {page} / {data.pages}
          </span>
          <button
            disabled={page >= data.pages}
            onClick={() => setPage((p) => p + 1)}
            className="btn-secondary text-sm"
          >
            بعدی
          </button>
        </div>
      )}
      {confirmDialog}
    </div>
  );
}
