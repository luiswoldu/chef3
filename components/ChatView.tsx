"use client"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Sparkle, ArrowUp } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface ChatViewProps {
  messages: Message[]
  onSendMessage?: (message: string) => void
}

export default function ChatView({ messages, onSendMessage }: ChatViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [inputValue, setInputValue] = useState("")
  const [aiSearchOn, setAiSearchOn] = useState(true)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const isTyping = inputValue.trim().length > 0

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
    if (isTyping) {
      handleSend()
    } else {
      setAiSearchOn(!aiSearchOn)
    }
  }  

  if (!messages || messages.length === 0) {
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
      {/* Top Bar - Fixed with higher z-index */}
      <div
        className="fixed top-0 left-1/2 transform -translate-x-1/2 z-50 p-4 w-full max-w-lg mx-auto"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 100%)",
        }}
      >
        <div className="flex items-center gap-3 mt-3 w-full">

          {/* Middle label */}
          <div className="text-white font-medium text-[17px] flex-1 text-center">
            Ask Hands
          </div>

          {/* Spacer to balance flex for center alignment */}
          <div className="w-[42px] h-[42px]" />
        </div>
      </div>

      {/* Messages Container - with top padding to avoid overlap */}
      <div className="pt-20 pb-20 px-4 h-full overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className="mb-6">
            {msg.role === "user" ? (
              /* USER BUBBLE */
              <div className="flex justify-end">
                <div className="max-w-[80%] bg-[#E6F8D9] text-black rounded-2xl px-4 py-3 text-[15px] leading-snug shadow-sm">
                  {msg.content}
                </div>
              </div>
            ) : (
              /* ASSISTANT BUBBLE */
              <div className="flex justify-start">
                <div className="max-w-[82%] bg-chef-grey-calcium text-black rounded-2xl px-4 py-3 text-[15px] leading-snug shadow-sm">
                  {msg.content}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white z-40 border-t border-gray-200">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          {/* Remove the duplicate back button here since we have one in the top bar */}
          <div className="w-[42px] h-[42px] flex-shrink-0 opacity-0">
            {/* Invisible spacer for layout consistency */}
          </div>

          {/* Ask/Search Input Bubble */}
          <div className="flex items-center bg-chef-grey-calcium rounded-full px-4 py-2.5 relative flex-1">
            <input
              type="text"
              className="flex-1 bg-transparent text-black pl-0 focus:outline-none placeholder-chef-grey"
              placeholder={aiSearchOn ? "Ask" : "Search"}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            {/* Toggle button */}
            <button
              onClick={toggleAISearch}
              aria-label={isTyping ? "Send message" : "Toggle AI Search"}
              className={`
                absolute right-1.5 top-1/2 -translate-y-1/2
                w-8 h-8 rounded-full flex items-center justify-center
                active:scale-95 transition-all
                ${isTyping
                  ? "bg-gradient-to-r from-[#6ED308] to-[#A5E765]"
                  : aiSearchOn
                  ? "bg-white"
                  : "bg-transparent"
                }
              `}
              style={{ padding: "6px" }}
            >
              {isTyping ? (
                <ArrowUp className="w-5 h-5 text-white" />
              ) : (
                <Sparkle
                  className="w-6 h-6 transition-colors"
                  fill={aiSearchOn ? "#6ED308" : "#B2B2B2"}
                  color={aiSearchOn ? "#6ED308" : "#B2B2B2"}
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}