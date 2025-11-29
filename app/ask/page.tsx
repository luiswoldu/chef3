// app/ask/page.tsx
"use client"

import { useState } from "react"
import ChatView from "@/components/ChatView"
import { ArrowUp, Sparkle } from "lucide-react"

export default function AskPage() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([])
  const [isChatStarted, setIsChatStarted] = useState(false)
  const [aiSearchOn, setAiSearchOn] = useState(true)
const isTyping = input.trim().length > 0


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // FIRST message — flip UI to conversation mode
if (!isChatStarted) setIsChatStarted(true)

    const userMessage = { role: "user", content: input }
  //   setMessages((prev) => [...prev, userMessage])

    // temp fake AI response (will replace this with streaming)
    const aiMessage = { role: "assistant", content: "…" }
    // setMessages((prev) => [...prev, aiMessage])

    setInput("")
  }

  return (
    <div className="relative flex flex-col h-screen bg-white">

      {/* ========== TOP INPUT (only before conversation) ========== */}
      {!isChatStarted && (
  <div className="p-4 flex items-center mt-3">
    <form onSubmit={handleSubmit} className="flex-1">
      <div className="flex items-center bg-chef-grey-calcium rounded-full px-4 py-2.5 relative">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask"
          autoFocus
          className="flex-1 bg-transparent outline-none text-black pl-0"
        />
<button
  type="submit"
  aria-label="Ask Hands"
  disabled={!aiSearchOn && !isTyping} // optional
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
    </form>
  </div>
)}

      {/* ========== CHAT AREA ========== */}
      <div className="flex-1 overflow-y-auto px-4">
        <ChatView messages={messages} />
      </div>

      {/* ========== BOTTOM INPUT (after conversation starts) ========== */}
      {isChatStarted && (
        <div className="p-4 pb-8 bg-white">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center bg-chef-grey-calcium rounded-full px-4 py-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something else…"
                className="flex-1 bg-transparent outline-none text-black"
              />

              <button
                type="submit"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-r from-[#6ED308] to-[#A5E765]"
              >
                <ArrowUp className="w-6 h-6 text-white" />
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  )
}