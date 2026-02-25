import { createFileRoute } from '@tanstack/react-router';
import { useState, useRef } from 'react';
import { trpc } from '../../../trpc.js';

export const Route = createFileRoute('/_authenticated/admin/circulars')({
  component: AdminCircularsPage,
});

function AdminCircularsPage() {
  const utils = trpc.useUtils();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ key: string; name: string } | null>(null);
  const [tagInput, setTagInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    content: '',
    summary: '',
    tags: [] as string[],
  });

  const { data, isLoading } = trpc.services.circulars.useQuery({
    page,
    limit: 10,
    search: '',
  });

  const getUrl = trpc.services.adminGetUploadUrl.useMutation();
  const create = trpc.services.adminCreateCircular.useMutation({
    onSuccess: () => {
      void utils.services.circulars.invalidate();
      setShowForm(false);
      setForm({ title: '', content: '', summary: '', tags: [] });
      setUploadedFile(null);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url, key } = await getUrl.mutateAsync({
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
      });
      await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      setUploadedFile({ key, name: file.name });
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
    create.mutate({
      title: form.title,
      content: form.content,
      summary: form.summary || undefined,
      fileKey: uploadedFile?.key,
      tags: form.tags,
    });
  };

  return (
    <div className="p-6 max-w-4xl" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مدیریت بخشنامه‌ها</h1>
          <p className="text-sm text-gray-500 mt-1">ایجاد و مدیریت بخشنامه‌های تجاری</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary"
        >
          {showForm ? 'انصراف' : '+ بخشنامه جدید'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-4">
          <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">بخشنامه جدید</h2>

          <div>
            <label className="label-text">عنوان *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="input-field"
              placeholder="عنوان بخشنامه..."
              required
            />
          </div>

          <div>
            <label className="label-text">خلاصه</label>
            <input
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              className="input-field"
              placeholder="خلاصه کوتاه..."
            />
          </div>

          <div>
            <label className="label-text">متن کامل *</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={5}
              className="input-field resize-none"
              placeholder="متن کامل بخشنامه..."
              required
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

          {/* File upload */}
          <div>
            <label className="label-text">فایل پیوست (اختیاری)</label>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xlsx" onChange={handleFileSelect} className="hidden" />
            {uploadedFile ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-700 text-sm">✓ {uploadedFile.name}</span>
                <button type="button" onClick={() => setUploadedFile(null)} className="text-xs text-red-500 mr-auto">حذف</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="btn-secondary w-full"
              >
                {uploading ? 'در حال آپلود...' : '📎 انتخاب فایل'}
              </button>
            )}
          </div>

          {create.error && (
            <p className="text-red-500 text-sm">{create.error.message}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={create.isPending} className="btn-primary">
              {create.isPending ? 'در حال ذخیره...' : 'انتشار بخشنامه'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
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
          <p className="text-gray-500">هیچ بخشنامه‌ای ثبت نشده است</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-4">اولین بخشنامه را ایجاد کنید</button>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((c) => (
            <div key={c.id} className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{c.title}</h3>
                  {c.summary && <p className="text-sm text-gray-500 mt-1">{c.summary}</p>}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {c.publishedAt && (
                      <span className="text-xs text-gray-400">
                        {new Date(c.publishedAt).toLocaleDateString('fa-IR')}
                      </span>
                    )}
                    {c.tags?.map((tag: string) => (
                      <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
                {c.fileKey && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full shrink-0">📎 فایل دارد</span>
                )}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-secondary disabled:opacity-40"
              >
                ‹ قبلی
              </button>
              <span className="text-sm text-gray-600">{page} / {data.pages}</span>
              <button
                disabled={page >= data.pages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-secondary disabled:opacity-40"
              >
                بعدی ›
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
