import { createFileRoute } from '@tanstack/react-router'
import { trpc } from '../../../trpc'
import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../../../store/auth.store'
import { Input } from '../../../components/ui/input.js';
import { Button } from '../../../components/ui/button.js';
import { Card } from '../../../components/ui/card.js';
import { cn } from '../../../lib/utils.js';

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

export const Route = createFileRoute('/_authenticated/chat/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { user } = useAuthStore()
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const wsRef = useRef<WebSocket | null>(null)

  const { data: conversations, refetch: refetchConversations } = trpc.userChat.listConversations.useQuery()
  const { data: messages, refetch: refetchMessages } = trpc.userChat.getMessages.useQuery(
    { conversationId: selectedConversation?.id || '' },
    { enabled: !!selectedConversation }
  )
  const sendMessageMutation = trpc.userChat.sendMessage.useMutation()

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!selectedConversation) return;

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/chat/${selectedConversation.id}`;
    const ws = new WebSocket(wsUrl);

    // Add access token to WebSocket connection via cookie (handled by browser automatically)

    ws.onopen = () => {
      console.log('🔗 Connected to chat WebSocket for conversation:', selectedConversation.id);
    };

    ws.onmessage = (event) => {
      console.log('📨 Received WebSocket message:', event.data);
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          // Refresh messages and conversations to get latest data
          refetchMessages();
          // Refresh conversations to update last message
          refetchConversations();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket connection closed');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [selectedConversation, refetchConversations]);

  // Remove polling since we have WebSocket for real-time updates

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

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.id !== user?.id)
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Conversations List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">پیام‌ها</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
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
              هنوز مکالمه‌ای وجود ندارد
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
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
                  placeholder="پیام خود را تایپ کنید..."
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
              <p className="text-gray-500">برای شروع چت، یک مکالمه از نوار کناری انتخاب کنید</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
