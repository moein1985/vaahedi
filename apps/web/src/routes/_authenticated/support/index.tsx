import { createFileRoute } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from '../../../trpc.js';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card.js';
import { Input } from '../../../components/ui/input.js';
import { Button } from '../../../components/ui/button.js';
import { Badge } from '../../../components/ui/badge.js';
import { cn } from '../../../lib/utils.js';

export const Route = createFileRoute('/_authenticated/support/')({
  component: SupportPage,
});

const createTicketSchema = z.object({
  subject: z.string().min(5, 'عنوان الزامی است'),
  message: z.string().min(10, 'متن پیام الزامی است'),
  category: z.enum(['TECHNICAL', 'BILLING', 'TRADE', 'DOCUMENT', 'OTHER']).default('OTHER'),
});

const replySchema = z.object({
  message: z.string().min(1, 'پیام نمی‌تواند خالی باشد'),
});

type CreateTicketForm = z.infer<typeof createTicketSchema>;
type ReplyForm = z.infer<typeof replySchema>;

const CATEGORY_LABELS: Record<string, string> = {
  TECHNICAL: 'فنی', BILLING: 'مالی', TRADE: 'تجاری', DOCUMENT: 'مدارک', OTHER: 'سایر',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'باز', IN_PROGRESS: 'در حال بررسی', RESOLVED: 'حل‌شده', CLOSED: 'بسته',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-800', IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-800', CLOSED: 'bg-gray-100 text-gray-600',
};

function SupportPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const { data: ticketsData } = trpc.support.myTickets.useQuery({ page: 1, limit: 50 });
  const tickets = ticketsData?.items ?? [];

  const { data: ticketDetail } = trpc.support.getById.useQuery(
    { id: activeTicketId! },
    { enabled: !!activeTicketId },
  );

  const createTicket = trpc.support.create.useMutation({
    onSuccess: (data) => {
      setShowCreate(false);
      setActiveTicketId(data.id);
      createForm.reset();
      void utils.support.myTickets.invalidate();
    },
  });

  const sendMessage = trpc.support.sendMessage.useMutation({
    onSuccess: () => {
      replyForm.reset();
      void utils.support.getById.invalidate({ id: activeTicketId! });
    },
  });

  const closeTicket = trpc.support.close.useMutation({
    onSuccess: () => {
      void utils.support.myTickets.invalidate();
      void utils.support.getById.invalidate({ id: activeTicketId! });
    },
  });

  const createForm = useForm<CreateTicketForm>({
    resolver: zodResolver(createTicketSchema) as any,
    defaultValues: { category: 'OTHER' },
  });

  const replyForm = useForm<ReplyForm>({ resolver: zodResolver(replySchema) });

  const onCreateSubmit = (data: CreateTicketForm) => createTicket.mutate(data);
  const onReplySubmit = (data: ReplyForm) => {
    sendMessage.mutate({ ticketId: activeTicketId!, message: data.message });
  };

  const selectedTicket = ticketDetail ?? tickets.find((t) => t.id === activeTicketId);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">پشتیبانی</h1>
          <p className="text-gray-500 text-sm mt-1">ارتباط با تیم پشتیبانی</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ تیکت جدید</Button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold">ثبت تیکت پشتیبانی</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 text-xl">×</button>
            </div>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="p-5 space-y-4">
              <div>
                <label className="label-text">عنوان *</label>
                <Input {...createForm.register('subject')} className="w-full" />
                {createForm.formState.errors.subject && (
                  <p className="field-error">{createForm.formState.errors.subject.message}</p>
                )}
              </div>
              <div>
                <label className="label-text">دسته‌بندی</label>
                <select {...createForm.register('category')} className="input-field">
                  {Object.entries(CATEGORY_LABELS).map(([v, label]) => (
                    <option key={v} value={v}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-text">متن پیام *</label>
                <textarea {...createForm.register('message')} rows={4} className="input-field resize-none" placeholder="مشکل یا سوال خود را شرح دهید ..." />
                {createForm.formState.errors.message && (
                  <p className="field-error">{createForm.formState.errors.message.message}</p>
                )}
              </div>
              {createTicket.error && <p className="text-red-600 text-sm">{createTicket.error.message}</p>}
              <div className="flex gap-3">
                <Button type="submit" loading={createTicket.isPending} className="flex-1">
                  ارسال تیکت
                </Button>
                <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>
                  انصراف
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
        <div className="col-span-1 bg-white border border-gray-100 rounded-xl overflow-y-auto">
          {!tickets.length ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              <div className="text-3xl mb-2">🎫</div>
              <p>تیکتی وجود ندارد</p>
            </div>
          ) : tickets.map((t) => (
            <button key={t.id} onClick={() => setActiveTicketId(t.id)}
              className={`w-full text-right p-4 border-b border-gray-50 hover:bg-gray-50 ${activeTicketId === t.id ? 'bg-blue-50' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900 truncate">{t.subject}</span>
                <Badge variant={
                t.status === 'OPEN' ? 'blue' :
                t.status === 'IN_PROGRESS' ? 'warning' :
                t.status === 'RESOLVED' ? 'success' :
                'outline'
              } className="px-2 py-0.5">
                {STATUS_LABELS[t.status]}
              </Badge>
              </div>
              <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString('fa-IR')}</p>
            </button>
          ))}
        </div>

        <div className="col-span-2 bg-white border border-gray-100 rounded-xl flex flex-col overflow-hidden">
          {!activeTicketId ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">یک تیکت را انتخاب کنید</div>
          ) : !selectedTicket ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">بارگذاری...</div>
          ) : (
            <>
              <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedTicket.subject}</h3>
                  <Badge variant={
                    selectedTicket.status === 'OPEN' ? 'blue' :
                    selectedTicket.status === 'IN_PROGRESS' ? 'warning' :
                    selectedTicket.status === 'RESOLVED' ? 'success' :
                    'outline'
                  } className="px-2 py-0.5">
                    {STATUS_LABELS[selectedTicket.status]}
                  </Badge>
                </div>
                {selectedTicket.status !== 'CLOSED' && selectedTicket.status !== 'RESOLVED' && (
                  <Button variant="outline" size="sm" onClick={() => closeTicket.mutate({ ticketId: selectedTicket.id })} className="text-red-600">
                    بستن تیکت
                  </Button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {ticketDetail?.messages?.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-xl px-4 py-2.5 text-sm ${
                      msg.senderType === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.senderType === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                        {msg.senderType === 'admin' && 'پشتیبانی · '}
                        {new Date(msg.createdAt).toLocaleString('fa-IR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {selectedTicket.status !== 'CLOSED' && selectedTicket.status !== 'RESOLVED' && (
                <div className="p-4 border-t border-gray-50">
                  <form onSubmit={replyForm.handleSubmit(onReplySubmit)} className="flex gap-2">
                    <Input {...replyForm.register('message')} className="flex-1" placeholder="پاسخ خود را بنویسید ..." />
                    <button type="submit" disabled={sendMessage.isPending}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-40">ارسال</button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
