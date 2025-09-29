"use client"
import React, { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ArrowUp, Loader } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase/client"
import { showNotification } from "@/hooks/use-notification"

interface ExtractedRecipe { title: string; image: string; caption: string; tags: string[]; steps: string[]; created_at: string }
interface Ingredient { name: string; amount: string; details: string; created_at: string }
interface GroceryItem { name: string; amount: string; details: string; aisle: string; purchased: boolean; created_at: string }
interface RecipeData { recipe: ExtractedRecipe; ingredients: Ingredient[]; groceryItems: GroceryItem[] }

interface AddRecipePanelProps {
  onClose: () => void
  embedded?: boolean
  controllers?: {
    url?: string
    setUrl?: (v: string) => void
    loading?: boolean
    setLoading?: (v: boolean) => void
    extractedRecipe?: any | null
    setExtractedRecipe?: (v: any | null) => void
    sheetHeight?: string
    setSheetHeight?: (v: string) => void
    sheetRef?: React.RefObject<HTMLDivElement>
    isModalVisible?: boolean
    handleExtract?: (u?: string) => Promise<void>
    handleSave?: (data?: any) => Promise<void>
  } | null
}

export default function AddRecipePanel({
  onClose,
  embedded = false,
  controllers = null,
}: AddRecipePanelProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState("")
  const [extractedRecipe, setExtractedRecipe] = useState<RecipeData | null>(null)

  const [sheetHeight, setSheetHeight] = useState("min(28vh, 320px)")
  const sheetRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{ startY: number; startHeight: number; isDragging: boolean }>({ startY: 0, startHeight: 0, isDragging: false })

  const extractTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastExtractTime = useRef<number>(0)
  const lastSaveTime = useRef<number>(0)
  const [isModalVisible, setIsModalVisible] = useState(false)

  // Override height values for better UI flow
  const INITIAL_EMBEDDED_HEIGHT = "220px"   // Panel inside Dialog (Navigation)
  const INITIAL_STANDALONE_HEIGHT = "400px" // Direct on page (add-recipe)
  const EXPANDED_HEIGHT = "min(85vh, 800px)" // Both when recipe loaded
  
  // Ensure height state is initialized properly
  useEffect(() => {
    // Set initial height based on mode
    if (extractedRecipe) {
      setSheetHeight?.(EXPANDED_HEIGHT)
    } else {
      setSheetHeight?.(embedded ? INITIAL_EMBEDDED_HEIGHT : INITIAL_STANDALONE_HEIGHT)
    }
  }, [embedded])

  // Always expand when recipe loads
  useEffect(() => {
    if (extractedRecipe) {
      const timer = setTimeout(() => {
        setSheetHeight?.(EXPANDED_HEIGHT)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [extractedRecipe])

  useEffect(() => {
    return () => {
      if (extractTimeoutRef.current) clearTimeout(extractTimeoutRef.current)
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    // simple drag handlers to allow sheet resizing (optional but mirrors page)
    const sheet = sheetRef.current
    if (!sheet) return

    const startDragging = (clientY: number) => {
      dragRef.current = { startY: clientY, startHeight: sheet.offsetHeight, isDragging: true }
    }
    const handleDragging = (clientY: number) => {
      if (!dragRef.current.isDragging) return
      const delta = dragRef.current.startY - clientY
      const newHeight = dragRef.current.startHeight + delta
      const windowHeight = window.innerHeight
      const detents = [windowHeight * 0.25, windowHeight * 0.5, windowHeight * 0.85]
      const nearest = detents.reduce((p, c) => (Math.abs(c - newHeight) < Math.abs(p - newHeight) ? c : p))
      const snapThreshold = 20
      if (Math.abs(nearest - newHeight) < snapThreshold) {
        setSheetHeight(`${(nearest / windowHeight) * 100}vh`)
      } else {
        const constrained = Math.max(Math.min(newHeight, detents[2]), detents[0])
        setSheetHeight(`${(constrained / windowHeight) * 100}vh`)
      }
    }
    const stopDragging = () => { dragRef.current.isDragging = false }

    const grabber = sheet.querySelector("[data-grabber]")
    const onTouchStart = (e: TouchEvent) => startDragging(e.touches[0].clientY)
    const onMouseDown = (e: MouseEvent) => { if (e.button === 0) startDragging(e.clientY) }
    const onTouchMove = (e: TouchEvent) => handleDragging(e.touches[0].clientY)
    const onMouseMove = (e: MouseEvent) => handleDragging(e.clientY)

    if (grabber) {
      grabber.addEventListener("touchstart", onTouchStart as EventListener, { passive: true } as AddEventListenerOptions)
      grabber.addEventListener("mousedown", onMouseDown as EventListener)
    }
    window.addEventListener("touchmove", onTouchMove as EventListener, { passive: true } as AddEventListenerOptions)
    window.addEventListener("mousemove", onMouseMove as EventListener)
    window.addEventListener("touchend", stopDragging as EventListener)
    window.addEventListener("mouseup", stopDragging as EventListener)

    return () => {
      if (grabber) {
        try {
          grabber.removeEventListener("touchstart", onTouchStart as EventListener)
          grabber.removeEventListener("mousedown", onMouseDown as EventListener)
        } catch {}
      }
      window.removeEventListener("touchmove", onTouchMove as EventListener)
      window.removeEventListener("mousemove", onMouseMove as EventListener)
      window.removeEventListener("touchend", stopDragging as EventListener)
      window.removeEventListener("mouseup", stopDragging as EventListener)
    }
  }, [])

  const validateUrl = (u: string) => {
    try { new URL(u); return null } catch { return "Please enter a valid URL" }
  }

  const extractRecipeFromUrl = async (u: string): Promise<RecipeData> => {
    const res = await fetch(`/api/fetch-url?url=${encodeURIComponent(u)}`, { method: "GET", headers: { "Content-Type": "application/json" } })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || res.statusText)
    }
    return await res.json()
  }

  const handleExtract = async () => {
    if (!url || loading) return
    const now = Date.now()
    if (now - lastExtractTime.current < 1000) return
    lastExtractTime.current = now

    const validationError = validateUrl(url)
    if (validationError) { showNotification(validationError); return }

    setLoading(true)
    try {
      const data = await extractRecipeFromUrl(url)
      setExtractedRecipe(data)
      setTimeout(() => setSheetHeight("min(85vh, 800px)"), 80)
      showNotification("Recipe found! Please review and save.")
    } catch (e) {
      console.error(e)
      showNotification("Failed to extract recipe. Please check the URL and try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!extractedRecipe || loading) return
    const now = Date.now()
    if (now - lastSaveTime.current < 1000) return
    lastSaveTime.current = now

    setLoading(true)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) { showNotification("Please log in to save recipes"); router.push("/auth"); return }

      const { data: recipeData, error: recipeError } = await supabase.from("recipes").insert([{
        title: extractedRecipe.recipe.title,
        image: extractedRecipe.recipe.image,
        caption: extractedRecipe.recipe.caption,
        tags: extractedRecipe.recipe.tags,
        steps: extractedRecipe.recipe.steps,
        created_at: new Date().toISOString(),
      }]).select().single()
      if (recipeError || !recipeData) throw new Error(recipeError?.message || "Failed to create recipe")

      if (extractedRecipe.ingredients?.length) {
        const ingredientsWithRecipeId = extractedRecipe.ingredients.map(i => ({ ...i, recipe_id: recipeData.id }))
        const { error: ingredientsError } = await supabase.from("ingredients").insert(ingredientsWithRecipeId)
        if (ingredientsError) throw new Error(ingredientsError.message)
      }

      if (extractedRecipe.groceryItems?.length) {
        const groceryItemsWithRecipeId = extractedRecipe.groceryItems.map(item => ({
          recipe_id: recipeData.id, name: item.name, amount: item.amount, details: item.details, aisle: "", purchased: false, created_at: new Date().toISOString()
        }))
        const { error: groceryItemsError } = await supabase.from("grocery_items").insert(groceryItemsWithRecipeId)
        if (groceryItemsError) throw new Error(groceryItemsError.message)
      }

      showNotification("Added to your library")
      onClose()
      router.push("/")
    } catch (err) {
      console.error(err)
      showNotification("Failed to save recipe: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="w-full"
      style={{
        height: extractedRecipe ? EXPANDED_HEIGHT : (embedded ? INITIAL_EMBEDDED_HEIGHT : INITIAL_STANDALONE_HEIGHT),
        minHeight: embedded ? '180px' : '200px',
        transition: "height 300ms ease-out",
        overflowY: "auto" // Allow scrolling within the container
      }}
      ref={sheetRef} // Attach ref to main container 
    >
      {/* grabber */}
      <div className="w-full flex justify-center pt-2" data-grabber>
        <div className="w-12 h-1.5 rounded-full bg-gray-200" />
      </div>

      <div className="p-4">
        {/* Only show URL input when no recipe or loading */}
        {!extractedRecipe && (
          <>
            {/* Add headers at the top */}
            <div className="text-center mb-6">
              <h6 className="text-lg font-semibold text-gray-800">
                Import from your favorite recipe website
              </h6>
              <p className="text-sm text-gray-500 mt-1">
                Soon: Instagram, TikTok, and YouTube.
              </p>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <button aria-label="Close" onClick={onClose} className="p-1">
                <ChevronLeft className="h-6 w-6 text-gray-700" />
              </button>

              <div className={`flex-1 max-w-md mx-auto w-full ${embedded ? "py-2" : ""}`}>
                <div className="relative w-full">
                  <Input
                    type="url"
                    placeholder="Paste Link"
                    value={url || ""}
                    onChange={(e) => setUrl?.(e.target.value)}
                    className="pl-4 pr-12 bg-[#F7F7F7] text-black placeholder:text-gray-400 rounded-full h-[3.3125rem] text-xl"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleExtract?.()}
                    disabled={loading || !url}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 border-0 rounded-full transition-all duration-200 ${loading ? "bg-gray-400 cursor-not-allowed" : url ? "bg-gradient-to-r from-[#6ED308] to-[#A5E765] hover:scale-105" : "bg-white/30"}`}
                  >
                    {loading ? <Loader className="h-6 w-6 animate-spin text-white" /> : <ArrowUp className="!h-6 !w-6 text-white" />}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Inline recipe content - directly in the panel */}
        {extractedRecipe && (
          <div className="relative">
            {/* Back button at the top */}
            <div className="flex items-center gap-3 mb-4">
              <button aria-label="Back" onClick={() => setExtractedRecipe(null)} className="p-1">
                <ChevronLeft className="h-6 w-6 text-gray-700" />
              </button>
              <span className="text-lg font-medium">Recipe Details</span>
            </div>

            {extractedRecipe.recipe.image && (
              <div className="w-full h-36 overflow-hidden mb-2 rounded-lg">
                <img src={extractedRecipe.recipe.image} alt={extractedRecipe.recipe.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex items-center justify-between h-14 border-b border-gray-200">
              <Button variant="link" onClick={() => setExtractedRecipe(null)} disabled={loading} className="text-gray-600 hover:text-gray-900 p-0 h-auto font-normal">Cancel</Button>
              <Button onClick={handleSave} disabled={loading} variant="link" className="text-emerald-600 hover:text-emerald-700 p-0 h-auto font-medium">
                {loading ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}
                Save
              </Button>
            </div>

            <div className="py-4">
              <h3 id="recipe-modal-title" className="font-bold text-xl text-gray-900 mb-3">{extractedRecipe.recipe.title}</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {extractedRecipe.recipe.tags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">{tag}</span>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 p-4 space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-3">Ingredients</h4>
                <ul className="space-y-2">
                  {extractedRecipe.ingredients.map((ingredient, i) => (
                    <li key={i} className="flex items-start text-gray-700">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 mr-2" />
                      <div className="flex-1">
                        <span className="font-medium">{ingredient.name}</span>
                        {ingredient.amount && <span className="text-gray-500 ml-2">{ingredient.amount}</span>}
                        {ingredient.details && <span className="text-gray-500 block text-sm mt-0.5">{ingredient.details}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-3">Steps</h4>
                <ol className="space-y-3">
                  {extractedRecipe.recipe.steps.map((step, i) => (
                    <li key={i} className="text-gray-700">
                      <div className="flex items-start">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mr-3 mt-0.5 text-sm font-semibold">{i + 1}</span>
                        <span>{step}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}