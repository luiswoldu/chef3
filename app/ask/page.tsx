"use client"

import { useState } from "react"
import ChatView from "@/components/ChatView"
import SearchView from "@/components/SearchView"
import RecipeCard from "@/components/RecipeCard"
import { ArrowUp, Sparkle, Search } from "lucide-react"
import { motion } from "framer-motion"
import { Back } from "@/components/Controls"
import { sfSparkle, sfMagnifyingglass } from "@bradleyhodges/sfsymbols"
import { SFIcon } from "@bradleyhodges/sfsymbols-react"
import { parseAnswerXml } from "@/lib/parseAnswerXml"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

type AssistantContent = {
  text: string
  items: {
    id: string
    title: string
    caption: string
    image: string
  }[]
}

export default function AskPage() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [assistantCards, setAssistantCards] = useState<AssistantContent | null>(null)

  const [isChatStarted, setIsChatStarted] = useState(false)
  const [aiSearchOn, setAiSearchOn] = useState(true)
  const [showSearchView, setShowSearchView] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }

  const toggleSearchMode = () => {
    setAiSearchOn(prev => !prev)
    setShowSearchView(prev => !prev)
  }

  const typeAssistantText = async (
    text: string,
    delay = 6
  ) => {
    let current = ""

    for (let i = 0; i < text.length; i++) {
      current += text[i]

      setMessages(prev =>
        prev.map((msg, idx) =>
          idx === prev.length - 1
            ? { ...msg, content: current }
            : msg
        )
      )

      await new Promise(res => setTimeout(res, delay))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !aiSearchOn) return

    if (!isChatStarted) setIsChatStarted(true)

    const userText = input
    setInput("")
    setAssistantCards(null)

    setMessages(prev => [
      ...prev,
      { role: "user", content: userText }
    ])

    const response = await fetch("/api/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: userText }),
    })

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    let fullResponse = ""
    setIsTyping(true)

    while (true) {
      const { value, done } = await reader!.read()
      if (done) break
      fullResponse += decoder.decode(value, { stream: true })
    }

    setIsTyping(false)

    const parsed = parseAnswerXml(fullResponse)
    
    setMessages(prev => [...prev,
      { role: "assistant", content: "" }])

    if (parsed) {
      await typeAssistantText(parsed.text)
      setAssistantCards(parsed) } 
    else {
      await typeAssistantText(fullResponse)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (aiSearchOn && input.trim()) handleSubmit(e)
    }
  }

  return (
    <div className="relative flex flex-col h-screen bg-white">

      {/* ========== TOP INPUT (only before conversation) ========== */}
      {!isChatStarted && (
        <div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10 p-4 w-full max-w-lg mx-auto"
        >
          <div className="flex items-center gap-3 mt-3 w-full">

            {/* Back Button Component */}
            <Back />

            {/* Input */}
            <motion.div className={`relative flex flex-grow items-center bg-white shadow-hands rounded-full px-4 py-2.5 cursor-text`}>
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  autoResize(e.target)
                }}
                onKeyDown={handleKeyDown}
                placeholder={aiSearchOn ? "Ask" : "Search"}
                autoFocus
                rows={1}
                className="flex-1 bg-transparent outline-none text-black placeholder-chef-grey resize-none overflow-hidden pr-10"
                style={{ minHeight: "24px", maxHeight: "200px" }}
              />

              {/* Buttons: Sparkle + Search OR Single Submit */}
              <div
                className="
                  absolute right-1.5 top-1/2 -translate-y-1/2
                  flex items-center
                "
              >
                {/* If typing & AI mode → SHOW ONLY THE ARROW BUTTON */}
                {isTyping && aiSearchOn ? (
                  <button
                    type="button"
                    aria-label="Submit"
                    onClick={handleSubmit}
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      active:scale-95 transition-all
                      bg-gradient-to-r from-[#6ED308] to-[#A5E765]
                    `}
                    style={{ padding: "6px" }}
                  >
                    <ArrowUp className="w-5 h-5 text-white" />
                  </button>
                ) : (
                  <>
                    {/* TWO BUTTONS (default state) */}
                    <div className="flex items-center gap-1.5">

                      {/* LEFT — Sparkle button */}
                      <button
                        type="button"
                        aria-label="AI Mode"
                        onClick={aiSearchOn ? undefined : toggleSearchMode}
                        className={`
                          w-8 h-8 rounded-full flex items-center justify-center
                          active:scale-95 transition-all
                          ${aiSearchOn ? "bg-white shadow-hands" : ""}
                        `}
                        style={{ padding: "6px" }}>
                        <SFIcon icon={sfSparkle}

                          className="w-4 h-4 transition-colors"
                          fill={aiSearchOn ? "#6ED308" : "#B2B2B2"}
                          color={aiSearchOn ? "#6ED308" : "#B2B2B2"}
                        />
                      </button>

                      {/* RIGHT — Search button */}
                      <button
                        type="button"
                        aria-label="Search Mode"
                        onClick={!aiSearchOn ? undefined : toggleSearchMode}
                        className={`
                          w-8 h-8 rounded-full flex items-center justify-center
                          active:scale-95 transition-all
                          ${!aiSearchOn ? "bg-white shadow-hands" : ""}
                        `}
                        style={{ padding: "6px" }}
                      >
                        <SFIcon icon={sfMagnifyingglass}
                          className="w-4 h-4"
                          style={{
                            color: !aiSearchOn ? "black" : "#B2B2B2",
                          }}
                        />
                      </button>

                    </div>
                  </>
                )}
              </div>

            </motion.div>
          </div>
        </div>
      )}

      {/* ========== CENTER AREA ========== */}
      <div className="flex-1 overflow-y-auto px-4 pt-4">

        {/* MODE 1 → Search */}
        {showSearchView && !isChatStarted && (
          <SearchView query={input} />
        )}

        {/* MODE 2 → Chat */}
        {!showSearchView && (
          <>
            <ChatView messages={messages} isTyping={isTyping} />

            {/* Recipe Cards are Rendered Here - Can change here */}
            {assistantCards && assistantCards.items.length > 0 && (
              <div className="mt-2 space-y-4">
                {assistantCards.items.map(recipe => (
                  <RecipeCard
                    key={recipe.id}
                    id={recipe.id}
                    title={recipe.title}
                    image={recipe.image}
                    cardType="square"
                    showAddButton
                  />
                ))}
              </div>
            )}
          </>
        )}
    </div>


      {/* ========== BOTTOM INPUT (chat only) ========== */}
      {isChatStarted && (
        <div className="p-4 pb-8 bg-white">
          <div>
            <div className="flex items-end bg-chef-grey-calcium rounded-full px-2 py-2.5">
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  autoResize(e.target)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask something"
                rows={1}
                className="flex-1 bg-transparent outline-none text-black resize-none overflow-hidden"
                style={{ minHeight: "24px", maxHeight: "200px" }}
              />

              <button
                type="submit"
                onClick={handleSubmit}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-r from-[#6ED308] to-[#A5E765] ml-2 flex-shrink-0"
              >
                <ArrowUp className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}