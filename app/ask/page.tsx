"use client"

import { useState } from "react"
import ChatView from "@/components/ChatView"
import SearchView from "@/components/SearchView"
import RecipeCard from "@/components/RecipeCard"
import ChatHistorySidebar from "@/components/ChatHistorySidebar"
import { ArrowUp, Sparkle, Search } from "lucide-react"
import { motion } from "framer-motion"
import { Back } from "@/components/Controls"
import { sfSparkle, sfMagnifyingglass, sfTextAlignleft } from "@bradleyhodges/sfsymbols"
import { SFIcon } from "@bradleyhodges/sfsymbols-react"
import { parseAnswerXml } from "@/lib/parseAnswerXml"
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js' 
import { useEffect } from "react"


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
  const router = useRouter()
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [allRecipeCards, setAllRecipeCards] = useState<{ messageIndex: number; recipes: AssistantContent }[]>([])

  const [isChatStarted, setIsChatStarted] = useState(false)
  const [aiSearchOn, setAiSearchOn] = useState(true)
  const [showSearchView, setShowSearchView] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const supabase = createClient(  
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

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

  const handleSelectConversation = async (convId: string) => {
    // Load the selected conversation
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', convId)
      .single()

    if (error) {
      console.error('Error loading conversation:', error)
      return
    }

    // Set the conversation as active
    setConversationId(convId)
    setMessages(data.content || [])
    setIsChatStarted(true)
    
    // Extract recipe cards from the conversation
    const loadedRecipeCards: { messageIndex: number; recipes: AssistantContent }[] = []
    
    data.content?.forEach((msg: any, index: number) => {
      if (msg.role === 'assistant' && msg.recipes && msg.recipes.length > 0) {
        loadedRecipeCards.push({
          messageIndex: index,
          recipes: {
            text: msg.content,
            items: msg.recipes
          }
        })
      }
    })
    
    setAllRecipeCards(loadedRecipeCards)
  }

  const handleNewChat = () => {
    setConversationId(null)
    setMessages([])
    setIsChatStarted(false)
    setInput("")
    setAllRecipeCards([]) // Clear all recipe cards
  }

  const [userId, setUserId] = useState<string | null>(null)

  // Add useEffect to get user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    getUser()
  }, [])

  const saveMessage = async (role: 'user' | 'assistant', content: string) => {
    if (!conversationId) return
    
    const { data: conv } = await supabase
      .from('conversations')
      .select('content')
      .eq('id', conversationId)
      .single()
    
    const currentContent = conv?.content || []
    const newContent = [...currentContent, { role, content: content }]  
    
    const { error } = await supabase
      .from('conversations')
      .update({ 
        content: newContent,
        updated_at: new Date().toISOString()  // 👈 ADD THIS
      })
      .eq('id', conversationId)
    
    if (error) console.error('Save message error:', error)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (aiSearchOn && input.trim()) handleSubmit(e)
    }
  }

  const saveMessageWithId = async (
    convId: string,
    role: 'user' | 'assistant',
    content: string,
    recipes?: AssistantContent  // Add optional recipes parameter
  ) => {
    const { data: conv } = await supabase
      .from('conversations')
      .select('content')
      .eq('id', convId)
      .single()

    const currentContent = conv?.content || []
    
    // Create message object with optional recipes
    const newMessage: any = { role, content }
    if (recipes && recipes.items.length > 0) {
      newMessage.recipes = recipes.items
    }
    
    const newContent = [...currentContent, newMessage]

    const { error } = await supabase
      .from('conversations')
      .update({
        content: newContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', convId)

    if (error) console.error('Save message error:', error)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    let activeConversationId = conversationId
    e.preventDefault()
    if (!input.trim() || !aiSearchOn) return

    if (!isChatStarted) setIsChatStarted(true)

    const userText = input
    setInput("")

    if (!conversationId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) return

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          title: userText.slice(0, 50) + '...',
          user_id: user.id,
          content: [{ role: 'user', content: userText }]
        })
        .select('id')
        .single()

      if (error) {
        console.error('Create conv error:', error)
        return
      }

      if (data) {
        setConversationId(data.id)
        activeConversationId = data.id   // ⭐ IMPORTANT LINE
      }
    } else {
      await saveMessage('user', userText)
    }


    setMessages(prev => [
      ...prev,
      { role: "user", content: userText }
    ])

    // Your existing API/streaming code:
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
    setMessages(prev => [...prev, { role: "assistant", content: "" }])

    const aiResponse = parsed ? parsed.text : fullResponse

    if (parsed) {
      await typeAssistantText(parsed.text)
      // Add recipes to the collection with the message index
      setAllRecipeCards(prev => [...prev, { 
        messageIndex: messages.length, // the index of this assistant message
        recipes: parsed 
      }])
    } else {
      await typeAssistantText(fullResponse)
    }

    if (activeConversationId) {
      // Save assistant message with recipes if they exist
      await saveMessageWithId(
        activeConversationId, 
        'assistant', 
        aiResponse,
        parsed || undefined  // ⭐ ADD THIS LINE - Pass the parsed recipes
      )
    }

  }

return (
  <>
    {/* Chat History Sheet */}
    {userId && (
      <ChatHistorySidebar
        userId={userId}
        currentConversationId={conversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    )}

    {/* Main Chat Area */}
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
                {input.trim() && aiSearchOn ? (
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
          <SearchView 
            query={input} 
            onSelect={(recipe) => {
              router.push(`/recipe/${recipe.id}`)
            }}
          />
        )}

        {/* MODE 2 → Chat */}
        {!showSearchView && (
          <>
            <ChatView messages={messages} isTyping={isTyping} recipeCards={allRecipeCards} />

          </>
        )}
      </div>

      {/* ========== BOTTOM INPUT (chat only) ========== */}
      {isChatStarted && (
        <div className="p-4 pb-8 bg-white/80 backdrop-blur-sm">
          <div>
            <div className="flex items-end bg-chef-grey-calcium rounded-full px-2 py-2.5">
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  autoResize(e.target)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !aiSearchOn) {
                    e.preventDefault()
                    router.push(`/search?q=${encodeURIComponent(input.trim())}`)
                  } else {
                    handleKeyDown(e)
                  }
                }}
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

      {/* Chat History Button - Bottom Left Corner */}
      <button
        onClick={() => setIsHistoryOpen(true)}
        className="fixed bottom-4 left-4 w-11 h-11 rounded-full bg-white shadow-hands flex items-center justify-center active:scale-95 transition-all z-20"
        aria-label="Chat History"
      >
        <SFIcon icon={sfTextAlignleft} className="w-5 h-5 text-black" />
      </button>

    </div>
  </>
)
}