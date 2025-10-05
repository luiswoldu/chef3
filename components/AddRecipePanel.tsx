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
  const [imageLoading, setImageLoading] = useState(false) // NEW: Track image loading state

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
  
  // Add animation effect when recipe data is loaded - IMPROVED from page.tsx
  useEffect(() => {
    if (extractedRecipe) {
      // Debug image info when recipe is extracted
      console.log("Recipe extraction complete:", {
        title: extractedRecipe.recipe.title,
        hasImage: !!extractedRecipe.recipe.image,
        imageUrl: extractedRecipe.recipe.image || "No image found"
      });
      
      // Set image loading state if there's an image
      if (extractedRecipe.recipe.image) {
        setImageLoading(true);
      }
      
      // Short delay to trigger animation
      const timer = setTimeout(() => {
        setIsModalVisible(true)
      }, 50)
      return () => clearTimeout(timer)
    } else {
      setIsModalVisible(false)
    }
  }, [extractedRecipe])
  
  // Ensure height state is initialized properly
  useEffect(() => {
    // Set initial height based on mode
    if (extractedRecipe) {
      setSheetHeight(EXPANDED_HEIGHT)
    } else {
      setSheetHeight(embedded ? INITIAL_EMBEDDED_HEIGHT : INITIAL_STANDALONE_HEIGHT)
    }
  }, [embedded, extractedRecipe])

  // Handle closing modal with escape key - NEW from page.tsx
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && extractedRecipe && !loading) {
        setExtractedRecipe(null)
      }
    }
    
    window.addEventListener('keydown', handleEscapeKey)
    return () => window.removeEventListener('keydown', handleEscapeKey)
  }, [extractedRecipe, loading])

  // Cleanup timeouts on unmount
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

  // IMPROVED: Enhanced extraction function from page.tsx
  const extractRecipeFromUrl = async (u: string): Promise<RecipeData> => {
    try {
      // Call the enhanced recipe extraction API (Beautiful Soup + OpenAI fallback)
      const response = await fetch(`/api/fetch-url?url=${encodeURIComponent(u)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to extract recipe: ${response.statusText}`)
      }
      
      const extractedData = await response.json()
      
      return {
        recipe: extractedData.recipe,
        ingredients: extractedData.ingredients,
        groceryItems: extractedData.groceryItems
      }
    } catch (error: unknown) {
      console.error('Recipe extraction error:', error)
      throw new Error(`Failed to extract recipe: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // IMPROVED: Enhanced extract handler from page.tsx
  const handleExtract = async () => {
    if (!url || loading) return
    
    // Debouncing: prevent multiple rapid clicks
    const now = Date.now()
    if (now - lastExtractTime.current < 1000) return
    lastExtractTime.current = now
    
    // Clear any existing timeout
    if (extractTimeoutRef.current) {
      clearTimeout(extractTimeoutRef.current)
    }

    const validationError = validateUrl(url)
    if (validationError) { showNotification(validationError); return }

    setLoading(true)
    try {
      const data = await extractRecipeFromUrl(url)
      if (data) {
        setExtractedRecipe(data)
        setTimeout(() => setSheetHeight(EXPANDED_HEIGHT), 80)
        showNotification("Recipe found! Please review and save.")
      }
    } catch (e) {
      console.error('Error extracting recipe:', e)
      showNotification("Failed to extract recipe. Please check the URL and try again.")
    } finally {
      setLoading(false)
    }
  }

  // IMPROVED: Enhanced save handler from page.tsx
  const handleSave = async () => {
    if (!extractedRecipe || loading) return
    
    // Debouncing: prevent multiple rapid clicks
    const now = Date.now()
    if (now - lastSaveTime.current < 1000) return
    lastSaveTime.current = now
    
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    setLoading(true)
    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        showNotification("Please log in to save recipes")
        router.push('/auth') // Redirect to auth page
        return
      }

      // Insert recipe with user_id - ADDED user_id from page.tsx
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .insert([{
          title: extractedRecipe.recipe.title,
          image: extractedRecipe.recipe.image,
          caption: extractedRecipe.recipe.caption,
          tags: extractedRecipe.recipe.tags,
          steps: extractedRecipe.recipe.steps,
          user_id: user.id, // ADDED: user_id
          created_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (recipeError) {
        console.error('Recipe insert error:', recipeError)
        throw new Error('Failed to save recipe: ' + recipeError.message)
      }
      
      if (!recipeData) {
        throw new Error('Failed to create recipe - no data returned')
      }

      // Insert ingredients with recipe_id and user_id - ADDED user_id
      if (extractedRecipe.ingredients?.length) {
        const ingredientsWithRecipeId = extractedRecipe.ingredients.map(ingredient => ({
          ...ingredient,
          recipe_id: recipeData.id,
          user_id: user.id // ADDED: user_id
        }))

        const { error: ingredientsError } = await supabase
          .from('ingredients')
          .insert(ingredientsWithRecipeId)

        if (ingredientsError) {
          console.error('Ingredients insert error:', ingredientsError)
          throw new Error('Failed to save ingredients: ' + ingredientsError.message)
        }
      }

      // Insert grocery items with recipe_id and user_id - ADDED user_id
      if (extractedRecipe.groceryItems?.length) {
        const groceryItemsWithRecipeId = extractedRecipe.groceryItems.map(item => ({
          recipe_id: recipeData.id,
          name: item.name,
          amount: item.amount,
          details: item.details,
          aisle: '', // This will be set by the user later
          purchased: false,
          user_id: user.id, // ADDED: user_id
          created_at: new Date().toISOString()
        }))

        const { error: groceryItemsError } = await supabase
          .from('grocery_items')
          .insert(groceryItemsWithRecipeId)

        if (groceryItemsError) {
          console.error('Grocery items insert error:', groceryItemsError)
          throw new Error('Failed to save grocery items: ' + groceryItemsError.message)
        }
      }

      showNotification("Added to your library")
      
      // Trigger cache refresh directly since we're staying on the same page
      localStorage.setItem('recipeJustAdded', 'true')
      
      // Dispatch a custom event to notify the home page to refresh
      window.dispatchEvent(new CustomEvent('recipeAdded'))
      
      onClose()
      // Don't navigate away since we're already on the home page
    } catch (err) {
      console.error('Error saving recipe:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      showNotification("Failed to save recipe: " + errorMessage)
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

            {/* Paste link input - REMOVED chevron and kept only the input */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 max-w-md mx-auto w-full">
                <div className="relative w-full">
                  <Input
                    type="url"
                    placeholder="Paste Link"
                    value={url || ""}
                    onChange={(e) => setUrl?.(e.target.value)}
                    className="pl-4 pr-12 bg-[#F7F7F7] border-0 focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none text-black placeholder:text-gray-400 rounded-full h-[3.3125rem] text-xl"
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
            {/* Buttons stay in fixed positions at the top */}
            <div className="absolute top-0 left-0 z-10">
              <Button 
                onClick={() => setExtractedRecipe(null)} 
                variant="secondary" 
                className="rounded-full w-[100px] text-gray-700 px-7 h-9 flex items-center justify-center text-base"
                disabled={loading}
              >
                <span className="inline-flex items-center justify-center leading-none">Cancel</span>
              </Button>
            </div>
            
            <div className="absolute top-0 right-0 z-10">
              <Button 
                onClick={handleSave} 
                variant="secondary" 
                className="rounded-full w-[100px] px-7 h-9 flex items-center justify-center text-white text-base"
                style={{ background: "#6CD401" }}
                disabled={loading}
              >
                <span className="inline-flex items-center justify-center leading-none">
                  {loading ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save
                </span>
              </Button>
            </div>

            {/* Fixed space for buttons */}
            <div className="h-12"></div>
            
            {/* Image section with consistent spacing */}
            {extractedRecipe.recipe.image ? (
              <div className="w-full h-36 overflow-hidden mb-4 rounded-lg">
                <div className="relative w-full h-full">
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <Loader className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  )}
                  <img 
                    src={extractedRecipe.recipe.image} 
                    alt={extractedRecipe.recipe.title} 
                    className="w-full h-full object-cover"
                    onLoad={() => {
                      console.log("Image loaded successfully:", extractedRecipe.recipe.image);
                      setImageLoading(false);
                    }}
                    onError={(e) => {
                      console.error("Image failed to load:", extractedRecipe.recipe.image);
                      setImageLoading(false);
                    }}
                  />
                </div>
              </div>
            ) : (
              <>
                {console.log("No image found for recipe:", extractedRecipe.recipe.title)}
                {/* When no image, still provide some spacing, but less than image height */}
              </>
            )}

            {/* Recipe title and caption */}
            <div className="py-2">
              <h3 id="recipe-modal-title" className="font-bold text-2xl leading-[1.1] tracking-tight text-gray-900">
                {extractedRecipe.recipe.title}
              </h3>
              {extractedRecipe.recipe.caption && (
                <p className="text-gray-600 text-sm mt-2">{extractedRecipe.recipe.caption}</p>
              )}
            </div>

            {/* Rest of the recipe content remains unchanged */}
            <div className="space-y-6 mt-2">
              <div>
                <h4 className="text-2xl font-bold text-gray-900 mb-1">Ingredients</h4>
                <ul className="space-y-2">
                  {extractedRecipe.ingredients.map((ingredient, i) => (
                    <li key={i} className="flex items-start text-gray-700">
                      <span className="inline-block w-5 h-5 rounded-full border-2 border-gray-400 mt-1 mr-2" />
                      <div className="flex-1">
                        <span className="text-base font-bold text-black">{ingredient.name}</span>
                        {ingredient.amount && <span className="text-base font-chef-grey ml-2">{ingredient.amount}</span>}
                        {ingredient.details && <span className="text-gray-500 block text-sm mt-0.5">{ingredient.details}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-2xl font-bold text-gray-900 mb-3">Steps</h4>
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