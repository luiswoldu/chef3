"use client"

import { useState } from "react"
import ChatView from "@/components/ChatView"
import SearchView from "@/components/SearchView"
import { ChevronLeft, ArrowUp, Sparkle, Search as SearchIcon } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"



export default function AskPage() {
  type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isChatStarted, setIsChatStarted] = useState(false)

  // NEW: Search mode toggle
  const [aiSearchOn, setAiSearchOn] = useState(true)
  const [showSearchView, setShowSearchView] = useState(false)

  const isTyping = input.trim().length > 0
  const router = useRouter()

  const toggleSearchMode = () => {
    setAiSearchOn((prev) => !prev)
    setShowSearchView((prev) => !prev)
  }

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!input.trim()) return;

  if (!isChatStarted) setIsChatStarted(true);

  const userText = input;
  setInput("");

  let assistantIndex = -1;

  // Add user + assistant placeholder correctly
  setMessages(prev => {
    const next = [
      ...prev,
      { role: "user" as const, content: userText },
      { role: "assistant" as const, content: "" }
    ];

    assistantIndex = next.length - 1; // The assistant message is last
    return next;
  });

  // Send request
  const response = await fetch("/api/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: userText }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader!.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });

    // Update assistant message content
    setMessages(prev =>
      prev.map((msg, index) =>
        index === assistantIndex
          ? { ...msg, content: msg.content + text }
          : msg
      )
    );
  }
};

  return (
    <div className="relative flex flex-col h-screen bg-white">

      {/* ========== TOP INPUT (only before conversation) ========== */}
      {!isChatStarted && (
        <div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10 p-4 w-full max-w-lg mx-auto"
        >
          <div className="flex items-center gap-3 mt-3 w-full">

            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="w-[42px] h-[42px] rounded-full flex items-center justify-center flex-shrink-0 bg-chef-grey-calcium"
            >
              <ChevronLeft className="h-6 w-6 text-black" />
            </button>

            {/* Input */}
            <motion.div
              className="relative flex flex-grow items-center bg-chef-grey-calcium rounded-full px-4 py-2.5 cursor-text"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={aiSearchOn ? "Ask" : "Search"}
                autoFocus
                className="flex-1 bg-transparent outline-none text-black placeholder-chef-grey"
              />

              {/* Submit / Sparkle Button */}
              <button
                type="submit"
                aria-label="Ask Hands"
                onClick={
                  isTyping && aiSearchOn
                    ? handleSubmit
                    : toggleSearchMode
                }
                className={`
                  absolute right-1.5 top-1/2 -translate-y-1/2
                  w-8 h-8 rounded-full flex items-center justify-center
                  active:scale-95 transition-all
                  ${isTyping && aiSearchOn
                    ? "bg-gradient-to-r from-[#6ED308] to-[#A5E765]"
                    : "bg-white"
                  }
                `}
                style={{ padding: "6px" }}
              >
                {isTyping && aiSearchOn ? (
                  <ArrowUp className="w-5 h-5 text-white" />
                ) : aiSearchOn ? (
                  <Sparkle
                    className="w-5 h-5 transition-colors"
                    fill="#6ED308"
                    color="#6ED308"
                  />
                ) : (
                  <SearchIcon className="w-5 h-5 text-black" />
                )}
              </button>
            </motion.div>
          </div>
        </div>
      )}

      {/* ========== CENTER AREA ========== */}
      <div className="flex-1 overflow-y-auto px-4 pt-24">

        {/* MODE 1 → Search */}
        {showSearchView && !isChatStarted && (
          <SearchView query={input} />
        )}

        {/* MODE 2 → Chat */}
        {!showSearchView && (
          <ChatView messages={messages} />
        )}
      </div>

      {/* ========== BOTTOM INPUT (chat only) ========== */}
      {isChatStarted && (
        <div className="p-4 pb-8 bg-white">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center bg-chef-grey-calcium rounded-full px-4 py-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something"
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
