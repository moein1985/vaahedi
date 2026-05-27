import { createFileRoute } from '@tanstack/react-router';
import { trpc } from '../../../trpc.js';
import { VerificationStatus } from '@repo/shared';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/admin/documents')({
  component: AdminDocumentsPage,
});

function AdminDocumentsPage() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.pendingDocuments.useQuery({ page: 1, limit: 20 });
  const verifyDoc = trpc.admin.verifyDocument.useMutation({
    onSuccess: (_, vars) => {
      void utils.admin.pendingDocuments.invalidate();
      toast.success(vars.status === VerificationStatus.APPROVED ? 'مدرک تایید شد' : 'مدرک رد شد');
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">تایید مدارک</h1>
        <p className="text-muted-foreground text-sm mt-1">مدارک در انتظار بررسی</p>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground/70">بارگذاری...</div>
      ) : !data?.items?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-4xl mb-3">OK</div>
          <p>همه مدارک بررسی شده اند</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-muted/60">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-foreground">کاربر</th>
                <th className="text-right px-4 py-3 font-medium text-foreground">نوع مدرک</th>
                <th className="text-right px-4 py-3 font-medium text-foreground">فایل</th>
                <th className="text-right px-4 py-3 font-medium text-foreground">تاریخ</th>
                <th className="px-4 py-3 font-medium text-foreground">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {data.items.map((doc) => (
                <tr key={doc.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">
                      {doc.profile?.companyName ?? 'ناشناس'}
                    </div>
                    <div className="text-xs text-muted-foreground/70" dir="ltr">{doc.profile?.user?.mobile}</div>
                  </td>
                  <td className="px-4 py-3 text-foreground">{doc.type}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`/api/files/${doc.fileKey}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--data-blue)] text-xs hover:text-[var(--agri-primary)] hover:underline"
                    >
                      {doc.fileName ?? 'مشاهده فایل'}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
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
        </div>
      )}
    </div>
  );
}
