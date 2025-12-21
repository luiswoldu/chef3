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

  if ((!messages || messages.length === 0) && !isTyping) {
    return (
      <div className="flex items-center justify-center h-72 text-center">
        <div>
          <h2 className="text-2xl font-semibold text-black">
            Make dinner from leftovers
          </h2>
          <p className="text-sm text-chef-grey max-w-80">
            Get recipe ideas, meal plans, substitutions, and budget-friendly tips.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Sticky Back Button */}
      <div className="sticky top-0 z-10">
        <Back />
      </div>

      {/* Messages Container */}
      <div>
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
                <div className="max-w-[82%] bg-transparent text-black py-3 text-base leading-snug">
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