import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { trpc } from '../../../trpc.js';
import { Button } from '../../../components/ui/button.js';
import { Input } from '../../../components/ui/input.js';
import { Badge } from '../../../components/ui/badge.js';
import { useConfirm } from '../../../components/ui/confirm-dialog.js';
import { Wheat, Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/admin/harvest')({
  component: AdminHarvestPage,
});

const MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

type FormState = {
  cropNameFa: string;
  cropNameEn: string;
  harvestStartMonth: number;
  harvestEndMonth: number;
  province: string;
  variety: string;
  description: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  cropNameFa: '', cropNameEn: '', harvestStartMonth: 1, harvestEndMonth: 1,
  province: '', variety: '', description: '', isActive: true,
};

function AdminHarvestPage() {
  const utils = trpc.useUtils();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data, isLoading } = trpc.agri.harvest.list.useQuery({ onlyActive: false, page, limit: 20 });
  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  const createMut = trpc.agri.harvest.create.useMutation({
    onSuccess: () => { void utils.agri.harvest.list.invalidate(); resetForm(); },
  });
  const updateMut = trpc.agri.harvest.update.useMutation({
    onSuccess: () => { void utils.agri.harvest.list.invalidate(); resetForm(); },
  });
  const deleteMut = trpc.agri.harvest.delete.useMutation({
    onSuccess: () => void utils.agri.harvest.list.invalidate(),
  });

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(false); };

  const startEdit = (item: NonNullable<typeof data>['items'][number]) => {
    setForm({
      cropNameFa: item.cropNameFa,
      cropNameEn: item.cropNameEn ?? '',
      harvestStartMonth: item.harvestStartMonth,
      harvestEndMonth: item.harvestEndMonth,
      province: item.province ?? '',
      variety: item.variety ?? '',
      description: item.description ?? '',
      isActive: item.isActive,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      cropNameFa: form.cropNameFa,
      cropNameEn: form.cropNameEn || undefined,
      harvestStartMonth: form.harvestStartMonth,
      harvestEndMonth: form.harvestEndMonth,
      province: form.province || undefined,
      variety: form.variety || undefined,
      description: form.description || undefined,
      isActive: form.isActive,
    };
    if (editingId) {
      await updateMut.mutateAsync({ id: editingId, data: payload });
    } else {
      await createMut.mutateAsync(payload);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({ title: `آیا "${name}" حذف شود؟`, variant: 'destructive' });
    if (ok) await deleteMut.mutateAsync({ id });
  };

  const isSubmitting = createMut.isPending || updateMut.isPending;

  return (
    <div className="p-6" dir="rtl">
      {confirmDialog}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Wheat className="h-6 w-6 text-green-600" />
          <h1 className="text-xl font-bold">مدیریت تقویم برداشت</h1>
          {data && <span className="text-sm text-gray-400">({data.total} ردیف)</span>}
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4 ml-1" />
          محصول جدید
        </Button>
      </div>

      {/* فرم */}
      {showForm && (
        <div className="bg-white border rounded-xl p-5 mb-6">
          <h2 className="font-semibold mb-4">{editingId ? 'ویرایش محصول' : 'محصول جدید'}</h2>
          <form onSubmit={(e) => { void handleSubmit(e); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">نام محصول (فارسی) *</label>
              <Input
                value={form.cropNameFa}
                onChange={(e) => setForm((f) => ({ ...f, cropNameFa: e.target.value }))}
                placeholder="مثال: گندم"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">نام انگلیسی</label>
              <Input
                value={form.cropNameEn}
                onChange={(e) => setForm((f) => ({ ...f, cropNameEn: e.target.value }))}
                placeholder="Wheat"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ماه شروع برداشت *</label>
              <select
                title="ماه شروع برداشت"
                value={form.harvestStartMonth}
                onChange={(e) => setForm((f) => ({ ...f, harvestStartMonth: parseInt(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={i + 1} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ماه پایان برداشت *</label>
              <select
                title="ماه پایان برداشت"
                value={form.harvestEndMonth}
                onChange={(e) => setForm((f) => ({ ...f, harvestEndMonth: parseInt(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={i + 1} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">استان (اختیاری)</label>
              <Input
                value={form.province}
                onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
                placeholder="خراسان رضوی"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">رقم/واریته</label>
              <Input
                value={form.variety}
                onChange={(e) => setForm((f) => ({ ...f, variety: e.target.value }))}
                placeholder="سپاهان، پیشتاز..."
              />
            </div>
            <div className="col-span-full">
              <label className="block text-sm font-medium mb-1">توضیحات</label>
              <textarea
                title="توضیحات"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="توضیحات تکمیلی (اختیاری)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="harvestActive"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              <label htmlFor="harvestActive" className="text-sm">فعال</label>
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
        <div className="text-center py-16 text-gray-400">در حال بارگذاری...</div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-right">محصول</th>
                <th className="px-4 py-3 text-right">بازه برداشت</th>
                <th className="px-4 py-3 text-right">استان</th>
                <th className="px-4 py-3 text-right">وضعیت</th>
                <th className="px-4 py-3 text-right">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((item) => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.cropNameFa}</div>
                    {item.cropNameEn && <div className="text-xs text-gray-400" dir="ltr">{item.cropNameEn}</div>}
                    {item.variety && <div className="text-xs text-green-600">{item.variety}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {MONTH_NAMES[item.harvestStartMonth - 1]}
                    {item.harvestStartMonth !== item.harvestEndMonth && ` — ${MONTH_NAMES[item.harvestEndMonth - 1]}`}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.province ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={item.isActive ? 'green' : 'secondary'} className="text-xs">
                      {item.isActive ? 'فعال' : 'غیرفعال'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(item)} className="text-blue-500 hover:text-blue-700" title="ویرایش آیتم">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => void handleDelete(item.id, item.cropNameFa)} className="text-red-400 hover:text-red-600" title="حذف آیتم">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!data?.items.length && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">ردیفی ثبت نشده</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* صفحه‌بندی */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button title="صفحه قبل" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg border disabled:opacity-40">
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-600">صفحه {page} از {totalPages}</span>
          <button title="صفحه بعد" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg border disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
