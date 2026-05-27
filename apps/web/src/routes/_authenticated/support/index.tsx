import { createFileRoute } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from '../../../trpc.js';
import { useState } from 'react';
import { Input } from '../../../components/ui/input.js';
import { Button } from '../../../components/ui/button.js';
import { Badge } from '../../../components/ui/badge.js';

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
          <h1 className="text-2xl font-bold text-foreground">پشتیبانی</h1>
          <p className="text-muted-foreground text-sm mt-1">مرکز پشتیبانی برای پیگیری درخواست های تجاری و فنی</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ تیکت جدید</Button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-lg">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold">ثبت تیکت پشتیبانی</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
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
        <div className="col-span-1 bg-card border border-border rounded-xl overflow-y-auto">
          {!tickets.length ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              <div className="text-3xl mb-2">🎫</div>
              <p>تیکتی وجود ندارد</p>
            </div>
          ) : tickets.map((t) => (
            <button key={t.id} onClick={() => setActiveTicketId(t.id)}
              className={`w-full text-right p-4 border-b border-border/70 hover:bg-accent transition-colors ${activeTicketId === t.id ? 'bg-[hsl(195_56%_33%_/_0.12)]' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground truncate">{t.subject}</span>
                <Badge variant={
                t.status === 'OPEN' ? 'blue' :
                t.status === 'IN_PROGRESS' ? 'warning' :
                t.status === 'RESOLVED' ? 'success' :
                'outline'
              } className="px-2 py-0.5">
                {STATUS_LABELS[t.status]}
              </Badge>
              </div>
              <p className="text-xs text-muted-foreground/70">{new Date(t.createdAt).toLocaleDateString('fa-IR')}</p>
            </button>
          ))}
        </div>

        <div className="col-span-2 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
          {!activeTicketId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">یک تیکت را انتخاب کنید</div>
          ) : !selectedTicket ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">بارگذاری...</div>
          ) : (
            <>
              <div className="p-4 border-b border-border/70 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{selectedTicket.subject}</h3>
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
                  <Button variant="outline" size="sm" onClick={() => closeTicket.mutate({ ticketId: selectedTicket.id })} className="text-[var(--error-red)] border-[hsl(2_52%_50%_/_0.25)] hover:bg-[hsl(2_52%_50%_/_0.08)]">
                    بستن تیکت
                  </Button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {ticketDetail?.messages?.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-xl px-4 py-2.5 text-sm ${
                      msg.senderType === 'user' ? 'bg-[var(--agri-primary)] text-white rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'}`}>
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.senderType === 'user' ? 'text-white/70' : 'text-muted-foreground/70'}`}>
                        {msg.senderType === 'admin' && 'پشتیبانی · '}
                        {new Date(msg.createdAt).toLocaleString('fa-IR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {selectedTicket.status !== 'CLOSED' && selectedTicket.status !== 'RESOLVED' && (
                <div className="p-4 border-t border-border/70">
                  <form onSubmit={replyForm.handleSubmit(onReplySubmit)} className="flex gap-2">
                    <Input {...replyForm.register('message')} className="flex-1" placeholder="پاسخ خود را بنویسید ..." />
                    <button type="submit" disabled={sendMessage.isPending}
                      className="px-4 py-2 bg-[var(--agri-primary)] text-white text-sm rounded-lg hover:bg-[var(--agri-leaf)] disabled:opacity-40">ارسال</button>
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
