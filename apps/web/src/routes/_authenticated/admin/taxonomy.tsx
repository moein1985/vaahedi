import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { trpc } from '../../../trpc.js';
import { Button } from '../../../components/ui/button.js';
import { Input } from '../../../components/ui/input.js';
import { Badge } from '../../../components/ui/badge.js';
import { useConfirm } from '../../../components/ui/confirm-dialog.js';
import { TreePine, Plus, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/admin/taxonomy')({
  component: AdminTaxonomyPage,
});

type FormState = {
  code: string;
  nameFa: string;
  nameEn: string;
  description: string;
  parentId: string;
  sortOrder: number;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  code: '', nameFa: '', nameEn: '', description: '', parentId: '', sortOrder: 0, isActive: true,
};

function AdminTaxonomyPage() {
  const utils = trpc.useUtils();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: categories, isLoading } = trpc.agri.taxonomy.listFlat.useQuery({ onlyActive: false });

  const createMut = trpc.agri.taxonomy.create.useMutation({
    onSuccess: () => { void utils.agri.taxonomy.listFlat.invalidate(); resetForm(); },
  });
  const updateMut = trpc.agri.taxonomy.update.useMutation({
    onSuccess: () => { void utils.agri.taxonomy.listFlat.invalidate(); resetForm(); },
  });
  const deleteMut = trpc.agri.taxonomy.delete.useMutation({
    onSuccess: () => void utils.agri.taxonomy.listFlat.invalidate(),
  });

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(false); };

  const startEdit = (cat: NonNullable<typeof categories>[number]) => {
    setForm({
      code: cat.code,
      nameFa: cat.nameFa,
      nameEn: cat.nameEn ?? '',
      description: cat.description ?? '',
      parentId: cat.parentId ?? '',
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
    });
    setEditingId(cat.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code: form.code,
      nameFa: form.nameFa,
      nameEn: form.nameEn || undefined,
      description: form.description || undefined,
      parentId: form.parentId || undefined,
      sortOrder: form.sortOrder,
      isActive: form.isActive,
    };
    if (editingId) {
      await updateMut.mutateAsync({ id: editingId, data: payload });
    } else {
      await createMut.mutateAsync(payload);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({ title: `آیا دسته‌بندی "${name}" حذف شود؟`, variant: 'destructive' });
    if (ok) await deleteMut.mutateAsync({ id });
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // تقسیم به ریشه و فرزند
  const roots = (categories ?? []).filter((c) => !c.parentId);
  const childMap = new Map<string, typeof roots>();
  (categories ?? []).forEach((c) => {
    if (c.parentId) {
      const arr = childMap.get(c.parentId) ?? [];
      arr.push(c);
      childMap.set(c.parentId, arr);
    }
  });

  const isSubmitting = createMut.isPending || updateMut.isPending;

  return (
    <div className="p-6" dir="rtl">
      {confirmDialog}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TreePine className="h-6 w-6 text-green-600" />
          <h1 className="text-xl font-bold">مدیریت دسته‌بندی شغلی</h1>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4 ml-1" />
          دسته جدید
        </Button>
      </div>

      {/* فرم */}
      {showForm && (
        <div className="bg-white border rounded-xl p-5 mb-6">
          <h2 className="font-semibold mb-4">{editingId ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'}</h2>
          <form onSubmit={(e) => { void handleSubmit(e); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">کد (انگلیسی)</label>
              <Input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="مثال: GRAIN_WHEAT"
                required
                disabled={!!editingId}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">نام فارسی *</label>
              <Input
                value={form.nameFa}
                onChange={(e) => setForm((f) => ({ ...f, nameFa: e.target.value }))}
                placeholder="مثال: غلات"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">نام انگلیسی</label>
              <Input
                value={form.nameEn}
                onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                placeholder="Grains"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">دسته والد</label>
              <select
                title="دسته والد"
                value={form.parentId}
                onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
              >
                <option value="">بدون والد (ریشه)</option>
                {roots.map((r) => (
                  <option key={r.id} value={r.id}>{r.nameFa} ({r.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">توضیحات</label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ترتیب نمایش</label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex items-center gap-2 col-span-full">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              <label htmlFor="isActive" className="text-sm">فعال</label>
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
                <th className="px-4 py-3 text-right">نام</th>
                <th className="px-4 py-3 text-right">کد</th>
                <th className="px-4 py-3 text-right">وضعیت</th>
                <th className="px-4 py-3 text-right">ترتیب</th>
                <th className="px-4 py-3 text-right">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {roots.map((root) => {
                const children = childMap.get(root.id) ?? [];
                const expanded = expandedIds.has(root.id);
                return [
                  <tr key={root.id} className="border-t border-gray-100 bg-green-50/30">
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      {children.length > 0 && (
                        <button onClick={() => toggleExpand(root.id)} className="text-gray-400">
                          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      )}
                      <span className="font-semibold text-green-800">{root.nameFa}</span>
                      {root.nameEn && <span className="text-xs text-gray-400" dir="ltr">{root.nameEn}</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{root.code}</td>
                    <td className="px-4 py-3">
                      <Badge variant={root.isActive ? 'green' : 'secondary'} className="text-xs">
                        {root.isActive ? 'فعال' : 'غیرفعال'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{root.sortOrder}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(root)} className="text-blue-500 hover:text-blue-700" title="ویرایش دسته">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => void handleDelete(root.id, root.nameFa)} className="text-red-400 hover:text-red-600" title="حذف دسته">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>,
                  ...(expanded ? children.map((child) => (
                    <tr key={child.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 pr-10 text-gray-700">
                        <span className="mr-2 text-gray-300">└</span>
                        {child.nameFa}
                        {child.nameEn && <span className="text-xs text-gray-400 mr-2" dir="ltr">{child.nameEn}</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{child.code}</td>
                      <td className="px-4 py-3">
                        <Badge variant={child.isActive ? 'green' : 'secondary'} className="text-xs">
                          {child.isActive ? 'فعال' : 'غیرفعال'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{child.sortOrder}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(child)} className="text-blue-500 hover:text-blue-700" title="ویرایش زیر‌دسته">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => void handleDelete(child.id, child.nameFa)} className="text-red-400 hover:text-red-600" title="حذف زیر‌دسته">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : []),
                ];
              })}
              {roots.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">دسته‌ای ثبت نشده</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
