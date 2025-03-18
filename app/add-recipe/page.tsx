"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ArrowUp, Loader2 } from "lucide-react"
import { supabase } from "../../lib/supabase/client"
import { useToast } from "../../hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

// Add supported platforms
const SUPPORTED_PLATFORMS = [
  {
    domain: 'themediterraneandish.com',
    pattern: /^https?:\/\/(www\.)?themediterraneandish\.com\/[a-zA-Z0-9-]+(\/)?$/,
    name: 'The Mediterranean Dish'
  },
  {
    domain: 'instagram.com',
    pattern: /^https?:\/\/(www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+/,
    name: 'Instagram'
  },
  {
    domain: 'facebook.com',
    pattern: /^https?:\/\/(www\.)?facebook\.com\/[A-Za-z0-9_-]+/,
    name: 'Facebook'
  },
  {
    domain: 'tiktok.com',
    pattern: /^https?:\/\/(www\.)?tiktok\.com\/@[A-Za-z0-9_-]+\/video\/[0-9]+/,
    name: 'TikTok'
  },
  {
    domain: 'youtube.com',
    pattern: /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[A-Za-z0-9_-]+/,
    name: 'YouTube'
  },
  {
    domain: 'allrecipes.com',
    pattern: /^https?:\/\/(www\.)?allrecipes\.com\/recipe\/[0-9]+/,
    name: 'AllRecipes'
  }
]

export default function AddRecipe() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState("")
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [recipeData, setRecipeData] = useState<null | {
    title: string
    image: string
    tags: string[]
    ingredients: string[]
    steps: string[]
  }>(null)
  const [sheetHeight, setSheetHeight] = useState('min(85vh, 800px)')
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    startY: number;
    startHeight: number;
    isDragging: boolean;
  }>({ startY: 0, startHeight: 0, isDragging: false })

  // Add animation effect when recipe data is loaded
  useEffect(() => {
    if (recipeData) {
      // Short delay to trigger animation
      const timer = setTimeout(() => {
        setIsModalVisible(true)
      }, 50)
      return () => clearTimeout(timer)
    } else {
      setIsModalVisible(false)
    }
  }, [recipeData])

  // Handle closing modal with escape key
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && recipeData && !loading) {
        setRecipeData(null)
      }
    }
    
    window.addEventListener('keydown', handleEscapeKey)
    return () => window.removeEventListener('keydown', handleEscapeKey)
  }, [recipeData, loading])

  // Handle sheet resizing
  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return

    const handleTouchStart = (e: Event) => {
      const touchEvent = e as TouchEvent
      const touch = touchEvent.touches[0]
      startDragging(touch.clientY)
    }

    const handleMouseDown = (e: Event) => {
      const mouseEvent = e as MouseEvent
      if (mouseEvent.button !== 0) return // Only handle left click
      startDragging(mouseEvent.clientY)
    }

    const handleTouchMove = (e: Event) => {
      const touchEvent = e as TouchEvent
      const touch = touchEvent.touches[0]
      handleDragging(touch.clientY)
    }

    const handleMouseMove = (e: Event) => {
      const mouseEvent = e as MouseEvent
      handleDragging(mouseEvent.clientY)
    }

    const handleTouchEnd = () => stopDragging()
    const handleMouseUp = () => stopDragging()

    const startDragging = (clientY: number) => {
      dragRef.current = {
        startY: clientY,
        startHeight: sheet.offsetHeight,
        isDragging: true
      }
    }

    const handleDragging = (clientY: number) => {
      if (!dragRef.current.isDragging) return

      const delta = dragRef.current.startY - clientY
      const newHeight = dragRef.current.startHeight + delta
      const windowHeight = window.innerHeight
      
      // Define detents (snap points)
      const detents = [
        windowHeight * 0.25,  // 25% of screen height (minimum)
        windowHeight * 0.5,   // 50% of screen height (medium)
        windowHeight * 0.85   // 85% of screen height (maximum)
      ]

      // Find nearest detent
      const nearestDetent = detents.reduce((prev, curr) => {
        return Math.abs(curr - newHeight) < Math.abs(prev - newHeight) ? curr : prev
      })

      // Only snap to detent if we're close enough (within 20px)
      const snapThreshold = 20
      if (Math.abs(nearestDetent - newHeight) < snapThreshold) {
        setSheetHeight(`${(nearestDetent / windowHeight) * 100}vh`)
      } else {
        // Constrain height between min and max detents
        const constrainedHeight = Math.max(
          Math.min(newHeight, detents[2]),
          detents[0]
        )
        setSheetHeight(`${(constrainedHeight / windowHeight) * 100}vh`)
      }
    }

    const stopDragging = () => {
      dragRef.current.isDragging = false
    }

    // Add grabber event listeners
    const grabber = sheet.querySelector('[data-grabber]')
    if (grabber) {
      grabber.addEventListener('touchstart', handleTouchStart as EventListener)
      grabber.addEventListener('mousedown', handleMouseDown as EventListener)
      
      window.addEventListener('touchmove', handleTouchMove as EventListener)
      window.addEventListener('mousemove', handleMouseMove as EventListener)
      window.addEventListener('touchend', handleTouchEnd)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      if (grabber) {
        grabber.removeEventListener('touchstart', handleTouchStart as EventListener)
        grabber.removeEventListener('mousedown', handleMouseDown as EventListener)
      }
      window.removeEventListener('touchmove', handleTouchMove as EventListener)
      window.removeEventListener('mousemove', handleMouseMove as EventListener)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const validateUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      const platform = SUPPORTED_PLATFORMS.find(platform => 
        urlObj.hostname.includes(platform.domain) && 
        platform.pattern.test(url)
      )
      
      if (!platform) {
        return {
          isValid: false,
          message: 'URL must be from a supported platform'
        }
      }

      return {
        isValid: true,
        platform: platform.name
      }
    } catch {
      return {
        isValid: false,
        message: 'Please enter a valid URL'
      }
    }
  }

  // Recipe extraction API call
  const extractRecipeFromUrl = async (url: string) => {
    try {
      // Fetch the HTML content of the URL
      const response = await fetch(`/api/fetch-url?url=${encodeURIComponent(url)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`)
      }
      
      const html = await response.text()
      
      // Extract JSON-LD data
      const jsonLdRegex = /<script[^>]*type=['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script>/gmi
      const jsonLdMatches = Array.from(html.matchAll(jsonLdRegex))
      
      if (jsonLdMatches.length === 0) {
        throw new Error("No JSON-LD data found on the page")
      }
      
      // Try to find Recipe schema in JSON-LD blocks
      let recipeData = null
      
      for (const match of jsonLdMatches) {
        try {
          const jsonContent = match[1].trim()
          const parsedData = JSON.parse(jsonContent)
          
          // Handle both direct Recipe objects and @graph arrays containing Recipe objects
          const recipes = []
          
          if (Array.isArray(parsedData)) {
            recipes.push(...parsedData.filter(item => 
              item['@type'] === 'Recipe' || 
              (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))
            ))
          } else if (parsedData['@graph'] && Array.isArray(parsedData['@graph'])) {
            recipes.push(...parsedData['@graph'].filter(item => 
              item['@type'] === 'Recipe' || 
              (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))
            ))
          } else if (
            parsedData['@type'] === 'Recipe' || 
            (Array.isArray(parsedData['@type']) && parsedData['@type'].includes('Recipe'))
          ) {
            recipes.push(parsedData)
          }
          
          if (recipes.length > 0) {
            // Use the first recipe found
            const recipe = recipes[0]
            
            // Map recipe properties
            recipeData = {
              title: recipe.name || '',
              image: recipe.image || (Array.isArray(recipe.image) ? recipe.image[0] : ''),
              tags: recipe.keywords 
                ? (typeof recipe.keywords === 'string' 
                  ? recipe.keywords.split(',').map((k: string) => k.trim()) 
                  : Array.isArray(recipe.keywords) 
                    ? recipe.keywords 
                    : [])
                : [],
              ingredients: Array.isArray(recipe.recipeIngredient) 
                ? recipe.recipeIngredient 
                : [],
              steps: Array.isArray(recipe.recipeInstructions) 
                ? recipe.recipeInstructions.map((step: any) => 
                    typeof step === 'string' 
                      ? step 
                      : step.text || step.description || '')
                : typeof recipe.recipeInstructions === 'string'
                  ? [recipe.recipeInstructions]
                  : []
            }
            
            break
          }
        } catch (err) {
          console.error('Error parsing JSON-LD block:', err)
          // Continue to the next JSON-LD block
          continue
        }
      }
      
      // Fallback: If no recipe data was found in JSON-LD
      if (!recipeData) {
        throw new Error("No recipe schema found in the page's JSON-LD data")
      }
      
      return recipeData
    } catch (error: unknown) {
      console.error('Recipe extraction error:', error)
      throw new Error(`Failed to extract recipe: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleUrlSubmit = async () => {
    const validation = validateUrl(url)
    
    if (!validation.isValid) {
      toast({
        title: "Invalid URL",
        description: validation.message,
      })
      return
    }

    setLoading(true)
    try {
      const data = await extractRecipeFromUrl(url)
      setRecipeData(data)
      toast({
        title: "Recipe Found",
        description: `Successfully extracted recipe from ${validation.platform}.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to extract recipe from URL.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveRecipe = async () => {
    if (!recipeData) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('recipes')
        .insert([recipeData])
      
      if (error) throw error

      toast({
        title: "Recipe Saved",
        description: "Your recipe has been saved successfully.",
      })
      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save recipe. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      <Link href="/" className="absolute top-4 left-4 z-10">
        <ChevronLeft className="h-6 w-6 text-white" />
      </Link>

      <div className="flex flex-col h-full pt-16 px-4">
        <div className="max-w-md mx-auto w-full relative z-50">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6 text-white">Import Recipe</h2>
          
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="url"
                  placeholder="Paste recipe URL here"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pr-12 bg-white/20 text-white placeholder:text-white/70"
                  disabled={loading}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleUrlSubmit}
                  disabled={loading || !url}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <ArrowUp className="h-4 w-4 text-white" />
                  )}
                </Button>
              </div>
            </div>
          </div>
              </div>

              {recipeData && (
          <div 
            className="fixed inset-x-0 bottom-0 z-40"
            aria-modal="true"
            role="dialog"
            aria-labelledby="recipe-modal-title"
            onClick={(e) => {
              if (e.target === e.currentTarget && !loading) {
                setRecipeData(null)
              }
            }}
          >
            <div 
              ref={sheetRef}
              style={{ height: sheetHeight }}
              className={`mx-auto bg-white rounded-t-[20px] shadow-lg w-full max-w-2xl transform transition-all duration-300 ease-out mt-[10px] sm:mt-[30px] overflow-y-auto overscroll-contain ${
                isModalVisible ? 'translate-y-0' : 'translate-y-full'
              }`}
            >
              <div className="relative">
                  {recipeData.image && (
                  <div className="w-full h-36 overflow-hidden">
                    <img 
                      src={recipeData.image} 
                      alt={recipeData.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200">
                  <Button
                    variant="link"
                    onClick={() => setRecipeData(null)}
                    disabled={loading}
                    className="text-gray-600 hover:text-gray-900 p-0 h-auto font-normal"
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={handleSaveRecipe}
                    disabled={loading}
                    variant="link"
                    className="text-emerald-600 hover:text-emerald-700 p-0 h-auto font-medium"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Save
                  </Button>
                </div>
                
                <div className="p-4">
                  <h3 id="recipe-modal-title" className="font-bold text-xl text-gray-900 mb-3">
                    {recipeData.title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {recipeData.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">
                        {tag}
                      </span>
                    ))}
                    {recipeData.tags.length > 3 && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                        +{recipeData.tags.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-gray-600">
                    {recipeData.steps.length} steps · {recipeData.ingredients.length} ingredients
                  </div>
                </div>

                <div className="border-t border-gray-200 p-4 space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-3">
                      Ingredients
                    </h4>
                    <ul className="space-y-2">
                      {recipeData.ingredients.map((ingredient, i) => (
                        <li key={i} className="flex items-start text-gray-700">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 mr-2"></span>
                          {ingredient}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-3">
                      Step-by-Step Instructions
                    </h4>
                    <ol className="space-y-3">
                      {recipeData.steps.map((step, i) => (
                        <li key={i} className="text-gray-700">
                          <div className="flex items-start">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mr-3 mt-0.5 text-sm font-semibold">
                              {i + 1}
                            </span>
                            <span>{step}</span>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

