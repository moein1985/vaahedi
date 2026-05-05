import { useEffect, useMemo, useState } from 'react';
import { MessageCircle, SendHorizontal, Sparkles, X } from 'lucide-react';
import { trpc } from '../trpc.js';
import { Button } from './ui/button.js';
import { Card } from './ui/card.js';
import { Input } from './ui/input.js';

type AiFabChatProps = {
  enabled?: boolean;
};

type AiMessage = {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt?: string | Date;
};

const QUICK_PROMPTS = [
  'برای بهبود RFQ های فعال من چه اقدامی اولویت دارد؟',
  'با توجه به حوزه فعالیتم، چه بازار هدفی پیشنهاد می دهی؟',
  'برای افزایش نرخ پاسخ پیام ها چه کنم؟',
];

export function AiFabChat({ enabled = true }: AiFabChatProps) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const createConversation = trpc.chat.newConversation.useMutation();
  const sendMessage = trpc.chat.sendMessage.useMutation();

  const messagesQuery = trpc.chat.getMessages.useQuery(
    { conversationId: conversationId ?? '' },
    { enabled: !!conversationId && open, staleTime: 0 },
  );

  const loading = createConversation.isPending || sendMessage.isPending || messagesQuery.isFetching;

  const messages = useMemo(() => (messagesQuery.data ?? []) as AiMessage[], [messagesQuery.data]);

  useEffect(() => {
    if (!open) return;
    if (!conversationId) return;
    void messagesQuery.refetch();
  }, [open, conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!enabled) return null;

  async function ensureConversation(): Promise<string | null> {
    if (conversationId) return conversationId;
    try {
      const conv = await createConversation.mutateAsync({ title: 'گفتگوی سریع با AI' });
      setConversationId(conv.id);
      return conv.id;
    } catch {
      setLocalError('ایجاد گفتگو ناموفق بود. لطفا دوباره تلاش کنید.');
      return null;
    }
  }

  async function handleOpen() {
    setOpen(true);
    setLocalError(null);
    const convId = await ensureConversation();
    if (!convId) return;
    await messagesQuery.refetch();
  }

  async function handleSendMessage() {
    const text = input.trim();
    if (!text) return;
    setLocalError(null);

    const convId = await ensureConversation();
    if (!convId) return;

    try {
      await sendMessage.mutateAsync({ conversationId: convId, message: text });
      setInput('');
      await Promise.all([
        messagesQuery.refetch(),
        utils.chat.listConversations.invalidate(),
      ]);
    } catch (error: any) {
      setLocalError(error?.message ?? 'ارسال پیام ناموفق بود.');
    }
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setOpen(false)} />
      )}

      <div className="fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-50" dir="rtl">
        {!open && (
          <Button
            onClick={handleOpen}
            size="lg"
            className="rounded-full h-14 w-14 p-0 shadow-xl"
            aria-label="چت سریع با AI"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        )}

        {open && (
          <Card className="w-[92vw] max-w-[420px] h-[70vh] max-h-[680px] flex flex-col shadow-2xl border-0 overflow-hidden">
            <div className="px-4 py-3 bg-[var(--brand)] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <div className="text-sm font-semibold">مشاور هوشمند سریع</div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/90 hover:text-white"
                aria-label="بستن پنل چت"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-3 pt-3 pb-2 border-b bg-muted/30">
              <div className="text-xs text-muted-foreground mb-2">شروع سریع:</div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setInput(prompt)}
                    className="text-xs whitespace-nowrap rounded-full border px-2.5 py-1 hover:bg-white"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white">
              {messages.length === 0 && !loading && (
                <div className="text-xs text-muted-foreground leading-6 bg-violet-50 border border-violet-100 rounded-lg p-3">
                  سوالت را بپرس. پاسخ ها با توجه به حوزه فعالیت و خدمات فعال حساب تو شخصی سازی می شوند.
                </div>
              )}

              {messages.map((msg) => {
                const isUser = msg.role === 'USER';
                return (
                  <div key={msg.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-7 whitespace-pre-line ${
                        isUser
                          ? 'bg-blue-50 border border-blue-100 text-gray-800'
                          : 'bg-gray-100 border border-gray-200 text-gray-900'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="text-xs text-muted-foreground">در حال دریافت پاسخ...</div>
              )}

              {localError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">
                  {localError}
                </div>
              )}
            </div>

            <div className="p-3 border-t bg-white">
              <div className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleSendMessage();
                    }
                  }}
                  placeholder="پیام خود را وارد کنید..."
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={() => void handleSendMessage()}
                  disabled={!input.trim() || sendMessage.isPending}
                  loading={sendMessage.isPending}
                >
                  <SendHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
