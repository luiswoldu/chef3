'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Plus, X } from 'lucide-react'
import { getConversations } from '@/supabase/conversations'

interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
  content: any
}

interface ChatHistorySidebarProps {
  userId: string
  currentConversationId?: string | null
  onSelectConversation: (id: string) => void
  onNewChat: () => void
  isOpen: boolean
  onClose: () => void
}

export default function ChatHistorySidebar({
  userId,
  currentConversationId,
  onSelectConversation,
  onNewChat,
  isOpen,
  onClose
}: ChatHistorySidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId && isOpen) {
      loadConversations()
    }
  }, [userId, isOpen])

  const loadConversations = async () => {
    try {
      setLoading(true)
      const data = await getConversations(userId)
      setConversations(data || [])
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const handleSelectConversation = (id: string) => {
    onSelectConversation(id)
    onClose()
  }

  const handleNewChat = () => {
    onNewChat()
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-y-0 left-0 w-80 bg-white z-50 flex flex-col shadow-xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chat History</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#6ED308] to-[#A5E765] text-white rounded-full hover:opacity-90 transition-opacity"
          >
            <Plus size={20} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center text-gray-500 py-4">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No conversations yet
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    currentConversationId === conv.id
                      ? 'bg-green-50 border border-green-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare size={18} className="mt-0.5 flex-shrink-0 text-gray-600" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm">{conv.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {formatDate(conv.updated_at)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}