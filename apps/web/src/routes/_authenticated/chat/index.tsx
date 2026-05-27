import { createFileRoute } from '@tanstack/react-router'
import { trpc } from '../../../trpc'
import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../../../store/auth.store'
import { Input } from '../../../components/ui/input.js';
import { Button } from '../../../components/ui/button.js';
import { Card } from '../../../components/ui/card.js';

interface Conversation {
  id: string
  participants: Array<{
    id: string
    userCode: string
    companyName?: string | null
  }>
  lastMessage: {
    content: string
    senderUserCode: string
    createdAt: Date
  } | null
  messageCount: number
  updatedAt: Date
}

interface Message {
  id: string
  content: string
  sender: {
    userCode: string
    companyName?: string | null
  }
  isRead: boolean
  createdAt: Date
}

type ChatMode = 'messages' | 'advisor'

export const Route = createFileRoute('/_authenticated/chat/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { user } = useAuthStore()
  const [activeMode, setActiveMode] = useState<ChatMode>(() => {
    if (typeof window === 'undefined') return 'messages'
    const mode = window.sessionStorage.getItem('chat-mode')
    return mode === 'advisor' ? 'advisor' : 'messages'
  })
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [advisorInput, setAdvisorInput] = useState('')
  const [advisorReply, setAdvisorReply] = useState('')
  const [advisorLoading, setAdvisorLoading] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  const { data: conversations, refetch: refetchConversations } = trpc.userChat.listConversations.useQuery()
  const { data: messages, refetch: refetchMessages } = trpc.userChat.getMessages.useQuery(
    { conversationId: selectedConversation?.id || '' },
    { enabled: !!selectedConversation }
  )
  const sendMessageMutation = trpc.userChat.sendMessage.useMutation()

  // Context data for AI Advisor personalization
  const { data: productStats } = trpc.product.myStats.useQuery(undefined, { enabled: activeMode === 'advisor' })
  const { data: tradeStats } = trpc.trade.myStats.useQuery(undefined, { enabled: activeMode === 'advisor' })
  const { data: completion } = trpc.profile.completionStatus.useQuery(undefined, { enabled: activeMode === 'advisor' })
  const { data: unreadCount } = trpc.notification.unreadCount.useQuery(undefined, { enabled: activeMode === 'advisor' })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('chat-mode', activeMode)
    }
  }, [activeMode])

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!selectedConversation) return;

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/chat/${selectedConversation.id}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('🔗 Connected to chat WebSocket for conversation:', selectedConversation.id);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          refetchMessages();
          refetchConversations();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {};
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [selectedConversation, refetchConversations]);

  const handleSendMessage = async () => {
    if (!selectedConversation || !messageInput.trim()) return

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: selectedConversation.id,
        content: messageInput.trim(),
      })
      setMessageInput('')
      refetchMessages()
      refetchConversations()
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleAdvisorSubmit = async () => {
    const question = advisorInput.trim()
    if (!question) return

    setAdvisorLoading(true)

    // Build context-aware suggestions based on real user data
    const hasProducts = (productStats?.total ?? 0) > 0
    const hasActiveTrades = ((tradeStats?.pending ?? 0) + (tradeStats?.inNegotiation ?? 0)) > 0
    const profileIncomplete = completion && !completion.isComplete
    const hasUnread = (unreadCount ?? 0) > 0

    const contextSuggestions: string[] = []

    if (profileIncomplete) {
      contextSuggestions.push(`پروفایل شما ${completion.percent}% تکمیل شده — پروفایل کامل اعتماد طرف مقابل را بیشتر می‌کند.`)
    }
    if (!hasProducts) {
      contextSuggestions.push('هنوز کالایی ثبت نکرده‌اید — ثبت حداقل یک کالا در Marketplace دیده‌شدن شما را افزایش می‌دهد.')
    } else {
      contextSuggestions.push(`${productStats!.total} کالا در Marketplace دارید — بررسی کنید که توضیحات و تصاویر به‌روز هستند.`)
    }
    if (!hasActiveTrades) {
      contextSuggestions.push('هیچ RFQ فعالی ندارید — ایجاد یک درخواست خرید یا فروش، فرصت تطابق با طرف مقابل را فراهم می‌کند.')
    } else {
      contextSuggestions.push(`${(tradeStats?.pending ?? 0)} RFQ در انتظار تطابق دارید — پیگیری منظم احتمال بستن معامله را بالا می‌برد.`)
    }
    if (hasUnread) {
      contextSuggestions.push(`${unreadCount} اعلان خوانده نشده دارید — پاسخ سریع به پیام‌ها نرخ موفقیت مذاکره را افزایش می‌دهد.`)
    }
    contextSuggestions.push('برای تحلیل دقیق‌تر بازار کشاورزی، نام محصول، استان تولید یا کشور هدف صادراتی را در سوال بعدی مشخص کنید.')

    await new Promise((resolve) => setTimeout(resolve, 400))

    setAdvisorReply([
      `بر اساس وضعیت فعلی حساب شما، پیشنهاد مشاور کشاورزی برای: «${question}»`,
      '',
      ...contextSuggestions.map((item, index) => `${index + 1}. ${item}`),
    ].join('\n'))
    setAdvisorLoading(false)
  }

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.id !== user?.id)
  }

  // Quick advisor prompts — agri-focused
  const QUICK_PROMPTS = [
    'برای صادرات گندم به عراق چه مراحلی لازم است؟',
    'چطور گواهی بهداشت محصول کشاورزی دریافت کنم؟',
    'قیمت‌گذاری صادراتی محصول کشاورزی را چطور انجام دهم؟',
    'بهترین فصل صادرات میوه‌جات به بازارهای هدف کدام است؟',
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">مرکز ارتباطات</h2>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={() => setActiveMode('messages')}
              className={`rounded-lg px-3 py-2 text-sm border ${activeMode === 'messages' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              پیام ها
            </button>
            <button
              onClick={() => setActiveMode('advisor')}
              className={`rounded-lg px-3 py-2 text-sm border ${activeMode === 'advisor' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              AI مشاور
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {activeMode === 'messages' ? (
            <>
              {conversations?.map((conversation: Conversation) => {
                const otherUser = getOtherParticipant(conversation as Conversation)
                return (
                  <div
                    key={conversation.id}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedConversation?.id === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => setSelectedConversation(conversation as Conversation)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {otherUser?.userCode?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {otherUser?.companyName || otherUser?.userCode || 'کاربر ناشناس'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {conversation.lastMessage?.content || 'پیامی وجود ندارد'}
                        </p>
                      </div>
                      {conversation.lastMessage && (
                        <div className="text-xs text-gray-400">
                          {new Date(conversation.lastMessage.createdAt).toLocaleTimeString('fa-IR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              {(!conversations || conversations.length === 0) && (
                <div className="p-4 text-center text-gray-500">
                  هنوز مکالمه ای وجود ندارد
                </div>
              )}
            </>
          ) : (
            <div className="p-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">پیشنهادهای سریع:</p>
              <div className="space-y-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setAdvisorInput(prompt)}
                    className="w-full text-right text-xs text-gray-600 bg-gray-50 hover:bg-violet-50 hover:text-violet-700 rounded-lg px-3 py-2 border border-gray-100 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              {/* Context summary */}
              {(productStats !== undefined || tradeStats !== undefined) && (
                <div className="mt-3 rounded-lg bg-violet-50 border border-violet-100 p-3 space-y-1">
                  <p className="text-xs font-semibold text-violet-700 mb-1.5">وضعیت فعلی حساب:</p>
                  {productStats !== undefined && (
                    <p className="text-xs text-violet-600">{productStats.total} کالا در Marketplace</p>
                  )}
                  {tradeStats !== undefined && (
                    <p className="text-xs text-violet-600">{(tradeStats.pending ?? 0) + (tradeStats.inNegotiation ?? 0)} درخواست تجاری فعال</p>
                  )}
                  {completion !== undefined && (
                    <p className="text-xs text-violet-600">پروفایل: {completion.percent}% تکمیل شده</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeMode === 'advisor' ? (
          <div className="flex-1 p-6 overflow-y-auto">
            <Card className="max-w-3xl mx-auto p-5 border-violet-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">مشاور هوشمند کشاورزی</h3>
              <p className="text-sm text-gray-600 mb-4">سوال خود را درباره صادرات، واردات، مجوزهای کشاورزی، قیمت‌گذاری یا مراحل تجاری ثبت کنید.</p>
              <div className="space-y-3">
                <textarea
                  value={advisorInput}
                  onChange={(e) => setAdvisorInput(e.target.value)}
                  placeholder="مثال: چطور گواهی قرنطینه برای صادرات سیب دریافت کنم؟"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                  rows={4}
                />
                <div className="flex justify-end">
                  <Button onClick={handleAdvisorSubmit} loading={advisorLoading} disabled={!advisorInput.trim()}>
                    دریافت پیشنهاد
                  </Button>
                </div>
              </div>
              {advisorReply && (
                <div className="mt-4 bg-violet-50 border border-violet-100 rounded-lg p-4">
                  <p className="text-sm text-gray-800 whitespace-pre-line leading-7">{advisorReply}</p>
                </div>
              )}
            </Card>
          </div>
        ) : selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {getOtherParticipant(selectedConversation)?.userCode?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {getOtherParticipant(selectedConversation)?.companyName || getOtherParticipant(selectedConversation)?.userCode || 'کاربر ناشناس'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {getOtherParticipant(selectedConversation)?.userCode}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages?.map((message: Message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender.userCode === user?.userCode ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender.userCode === user?.userCode
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender.userCode === user?.userCode ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {new Date(message.createdAt).toLocaleTimeString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {(!messages || messages.length === 0) && (
                <div className="text-center text-gray-500 py-8">
                  هنوز پیامی در این مکالمه وجود ندارد
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex space-x-2">
                <Input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="پیام خود را برای طرف مقابل تایپ کنید..."
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  loading={sendMessageMutation.isPending}
                >
                  ارسال
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">یک مکالمه انتخاب کنید</h3>
              <p className="text-gray-500">برای شروع، یک مکالمه را از ستون سمت چپ انتخاب کنید</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
