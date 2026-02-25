import { createFileRoute } from '@tanstack/react-router';
import { trpc } from '../../../trpc.js';
import { VerificationStatus } from '@repo/shared';

export const Route = createFileRoute('/_authenticated/admin/documents')({
  component: AdminDocumentsPage,
});

function AdminDocumentsPage() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.pendingDocuments.useQuery({ page: 1, limit: 20 });
  const verifyDoc = trpc.admin.verifyDocument.useMutation({
    onSuccess: () => void utils.admin.pendingDocuments.invalidate(),
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">تایید مدارک</h1>
        <p className="text-gray-500 text-sm mt-1">مدارک در انتظار بررسی</p>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-400">بارگذاری...</div>
      ) : !data?.items?.length ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">OK</div>
          <p>همه مدارک بررسی شده اند</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-gray-700">کاربر</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">نوع مدرک</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">فایل</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">تاریخ</th>
                <th className="px-4 py-3 font-medium text-gray-700">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.items.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {doc.profile?.companyName ?? 'ناشناس'}
                    </div>
                    <div className="text-xs text-gray-400" dir="ltr">{doc.profile?.user?.mobile}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{doc.type}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`/api/files/${doc.fileKey}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 text-xs hover:underline"
                    >
                      {doc.fileName ?? 'مشاهده فایل'}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(doc.createdAt).toLocaleDateString('fa-IR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => verifyDoc.mutate({ documentId: doc.id, status: VerificationStatus.APPROVED })}
                        disabled={verifyDoc.isPending}
                        className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        تایید
                      </button>
                      <button
                        onClick={() => verifyDoc.mutate({ documentId: doc.id, status: VerificationStatus.REJECTED, rejectionReason: 'مدرک قابل قبول نیست' })}
                        disabled={verifyDoc.isPending}
                        className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-100 disabled:opacity-50"
                      >
                        رد
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
