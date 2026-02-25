import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { trpc } from '../../../trpc.js';

export const Route = createFileRoute('/_authenticated/admin/ads')({
  component: AdsPage,
});

function AdsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: ads, isLoading } = trpc.admin.listAds.useQuery({ page: 1, limit: 20 });
  const createAd = trpc.admin.createAd?.useMutation({
    onSuccess: () => {
      void utils.admin.listAds?.invalidate();
      setIsCreateModalOpen(false);
    },
  });

  const handleCreateAd = (formData: any) => {
    createAd.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مدیریت تبلیغات</h1>
          <p className="text-gray-600 text-sm mt-1">ایجاد و مدیریت تبلیغات پلتفرم</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary"
        >
          تبلیغات جدید
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="space-y-4">
            {ads?.items.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📢</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">تبلیغی وجود ندارد</h3>
                <p className="text-gray-500">اولین تبلیغات خود را ایجاد کنید</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {ads?.items.map((ad: any) => (
                  <div key={ad.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{ad.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{ad.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>نوع: {ad.adType}</span>
                          <span>وضعیت: {ad.isActive ? 'فعال' : 'غیرفعال'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn-secondary text-xs">ویرایش</button>
                        <button className="btn-danger text-xs">حذف</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isCreateModalOpen && (
        <CreateAdModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateAd}
          isLoading={createAd.isPending}
        />
      )}
    </div>
  );
}

function CreateAdModal({
  onClose,
  onSubmit,
  isLoading
}: {
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    adType: 'banner' as const,
    targetUrl: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">تبلیغات جدید</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              عنوان تبلیغات
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              توضیحات
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              نوع تبلیغات
            </label>
            <select
              value={formData.adType}
              onChange={(e) => setFormData({ ...formData, adType: e.target.value as any })}
              className="input-field"
            >
              <option value="banner">بنر</option>
              <option value="sponsored">اسپانسر</option>
              <option value="newsletter">خبرنامه</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              لینک مقصد (اختیاری)
            </label>
            <input
              type="url"
              value={formData.targetUrl}
              onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isLoading}
            >
              لغو
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'در حال ایجاد...' : 'ایجاد تبلیغات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}