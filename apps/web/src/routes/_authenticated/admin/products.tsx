import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { trpc } from '../../../trpc.js';

export const Route = createFileRoute('/_authenticated/admin/products')({
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.admin.pendingProducts.useQuery({
    page,
    limit: 20,
  });

  const review = trpc.admin.reviewProduct.useMutation({
    onSuccess: () => {
      void utils.admin.pendingProducts.invalidate();
      setRejectId(null);
      setRejectReason('');
    },
  });

  const products = data?.items ?? [];
  const totalPages = data?.pages ?? 1;

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">تایید محصولات</h1>
        <p className="text-gray-500 text-sm mt-1">محصولات در انتظار تایید</p>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-400">در حال بارگذاری...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">ok</div>
          <p>هیچ محصولی در انتظار تایید نیست</p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{product.nameFa}</h3>
                  <div className="text-xs text-gray-500">
                    <span className="font-mono" dir="ltr">HS: {product.hsCode}</span>
                    <span className="mx-2">|</span>
                    <span>{product.user?.profile?.companyName ?? 'ناشناس'}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.technicalSpecs}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => review.mutate({ productId: product.id, approved: true })}
                    disabled={review.isPending}
                    className="bg-green-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    تایید
                  </button>
                  <button
                    onClick={() => setRejectId(product.id)}
                    disabled={review.isPending}
                    className="bg-red-50 text-red-600 border border-red-200 text-xs px-4 py-2 rounded-lg hover:bg-red-100 disabled:opacity-50"
                  >
                    رد
                  </button>
                </div>
              </div>

              {rejectId === product.id && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="دلیل رد محصول..."
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => review.mutate({ productId: product.id, approved: false, rejectionReason: rejectReason })}
                      disabled={!rejectReason.trim() || review.isPending}
                      className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      ثبت
                    </button>
                    <button onClick={() => setRejectId(null)} className="text-gray-500 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50">
                      انصراف
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">
            قبلی
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">
            بعدی
          </button>
        </div>
      )}
    </div>
  );
}
