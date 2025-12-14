"use client"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Sparkle, ArrowUp } from "lucide-react"
import { Back } from "@/components/Controls"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface ChatViewProps {
  messages: Message[]
  onSendMessage?: (message: string) => void
  isTyping?: boolean
}

export default function ChatView({ messages, onSendMessage, isTyping }: ChatViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [inputValue, setInputValue] = useState("")
  const [aiSearchOn, setAiSearchOn] = useState(true)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = () => {
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue.trim())
      setInputValue("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleAISearch = () => {
    if (inputValue.trim().length > 0) {
      handleSend()
    } else {
      setAiSearchOn(!aiSearchOn)
    }
  }

  //
  if ((!messages || messages.length === 0) && !isTyping) {
    return (
      
      <div className="flex items-center justify-center h-48 text-center">
        <div>
          <h2 className="text-lg font-semibold text-black">
            Turn leftovers into dinner
          </h2>
          <p className="text-sm text-chef-grey">
            Ask Hands to help with cooking, ingredients, substitutions, meal ideas, and more.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      {/* Messages Container - with top padding to avoid overlap */}
      <div className="pt-8 pb-8 h-full overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className="mb-6">
            {msg.role === "user" ? (
              /* USER BUBBLE */
              <div className="flex justify-end">
                <div className="max-w-[80%] bg-[#F7F7F7] text-black rounded-full px-4 py-3 text-base leading-snug">
                  {msg.content}
                </div>
              </div>
            ) : (
              /* ASSISTANT BUBBLE */
              <div className="flex justify-start">
                <div className="max-w-[82%] bg-transparent text-black px-4 py-3 text-base leading-snug">
                  {msg.content}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div ref={bottomRef} />
    </div>
  )
}