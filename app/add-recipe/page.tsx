"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ArrowUp, Loader } from "lucide-react"
import { supabase } from "../../lib/supabase/client"
import { showNotification } from "@/hooks/use-notification"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

// Define interfaces for type safety
interface ExtractedRecipe {
  title: string
  image: string
  caption: string
  tags: string[]
  steps: string[]
  created_at: string
}

interface Ingredient {
  name: string
  amount: string
  details: string
  created_at: string
}

interface GroceryItem {
  name: string
  amount: string
  details: string
  aisle: string
  purchased: boolean
  created_at: string
}

interface RecipeData {
  recipe: ExtractedRecipe
  ingredients: Ingredient[]
  groceryItems: GroceryItem[]
}

// Add supported platforms
const SUPPORTED_PLATFORMS = [
  {
    domain: 'themediterraneandish.com',
    pattern: /^https?:\/\/(www\.)?themediterraneandish\.com\/[a-zA-Z0-9-]+(\/)?$/,
    name: 'The Mediterranean Dish'
  },
  {
    domain: 'themodernproper.com',
    pattern: /^https?:\/\/(www\.)?themodernproper\.com\/[a-zA-Z0-9-]+(\/)?$/,
    name: 'The Modern Proper'
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
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState("")
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [extractedRecipe, setExtractedRecipe] = useState<RecipeData | null>(null)
  const [sheetHeight, setSheetHeight] = useState('min(85vh, 800px)')
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    startY: number;
    startHeight: number;
    isDragging: boolean;
  }>({ startY: 0, startHeight: 0, isDragging: false })

  // Add debouncing refs to prevent multiple rapid clicks
  const extractTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastExtractTime = useRef<number>(0)
  const lastSaveTime = useRef<number>(0)

  // Add animation effect when recipe data is loaded
  useEffect(() => {
    if (extractedRecipe) {
      // Short delay to trigger animation
      const timer = setTimeout(() => {
        setIsModalVisible(true)
      }, 50)
      return () => clearTimeout(timer)
    } else {
      setIsModalVisible(false)
    }
  }, [extractedRecipe])

  // Handle closing modal with escape key
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
      if (extractTimeoutRef.current) {
        clearTimeout(extractTimeoutRef.current)
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

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
        return 'URL must be from a supported platform'
      }

      return null
    } catch {
      return 'Please enter a valid URL'
    }
  }

  // Recipe extraction API call
  const extractRecipeFromUrl = async (url: string): Promise<RecipeData> => {
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
      let recipeData: ExtractedRecipe | null = null
      let ingredients: Ingredient[] = []
      let groceryItems: GroceryItem[] = []
      
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
            
            // Validate and clean image URL
            let imageUrl = recipe.image || ''
            if (Array.isArray(recipe.image)) {
              imageUrl = recipe.image[0] || ''
            }
            
            // If no image URL is found, try to extract from HTML
            if (!imageUrl) {
              const imgRegex = /<img[^>]+src="([^">]+)"/g
              const imgMatch = html.match(imgRegex)
              if (imgMatch) {
                const srcMatch = imgMatch[0].match(/src="([^">]+)"/)
                if (srcMatch) {
                  imageUrl = srcMatch[1]
                }
              }
            }

            // Ensure image URL is absolute
            if (imageUrl && !imageUrl.startsWith('http')) {
              try {
                const urlObj = new URL(url)
                imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`
              } catch (e) {
                console.warn('Failed to make image URL absolute:', e)
              }
            }

            // Map recipe properties with validation
            recipeData = {
              title: recipe.name || recipe.headline || '',
              image: imageUrl || '/placeholder.svg', // Fallback to placeholder if no image
              caption: recipe.description || '',
              tags: recipe.keywords 
                ? (typeof recipe.keywords === 'string' 
                  ? recipe.keywords.split(',').map((k: string) => k.trim()).slice(0, 3) 
                  : Array.isArray(recipe.keywords) 
                    ? recipe.keywords.slice(0, 3) 
                    : [])
                : [],
              steps: Array.isArray(recipe.recipeInstructions) 
                ? recipe.recipeInstructions.map((step: any) => 
                    typeof step === 'string' 
                      ? step 
                      : step.text || step.description || '')
                : typeof recipe.recipeInstructions === 'string'
                  ? [recipe.recipeInstructions]
                  : [],
              created_at: new Date().toISOString()
            }

            // Map ingredients with validation
            ingredients = await Promise.all(
              (Array.isArray(recipe.recipeIngredient) ? recipe.recipeIngredient : [])
                .map(async (ingredient: string) => {
                  try {
                    // Call our new ingredient parsing API
                    const response = await fetch('/api/parse-ingredient', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ ingredient }),
                    });

                    if (!response.ok) {
                      throw new Error('Failed to parse ingredient');
                    }

                    const parsed = await response.json();
                    
                    // Only include the details, not alternatives
                    return {
                      name: parsed.name || ingredient.trim(),
                      amount: parsed.amount || '',
                      details: parsed.details || '',
                      created_at: new Date().toISOString()
                    };
                  } catch (error) {
                    console.error('Error parsing ingredient:', error);
                    // Fallback to basic parsing if API parsing fails
                    const match = ingredient.match(/^([\d\s/]+)?\s*(.+)$/);
                    if (match) {
                      const [, amount, name] = match;
                      return {
                        name: name.trim(),
                        amount: amount ? amount.trim() : '',
                        details: '',
                        created_at: new Date().toISOString()
                      };
                    }
                    return {
                      name: ingredient.trim(),
                      amount: '',
                      details: '',
                      created_at: new Date().toISOString()
                    };
                  }
                })
            );

            // Map ingredients to grocery items with more detailed information
            groceryItems = ingredients.map((ingredient: Ingredient) => ({
              name: ingredient.name,
              amount: ingredient.amount,
              details: ingredient.details,
              aisle: '', // This will be set by the user later
              purchased: false,
              created_at: new Date().toISOString()
            }));

            break; // Exit the loop once we've found and processed a valid recipe
          }
        } catch (err) {
          console.error('Error parsing JSON-LD block:', err)
          continue
        }
      }
      
      // Fallback: If no recipe data was found in JSON-LD
      if (!recipeData) {
        throw new Error("No recipe schema found in the page's JSON-LD data")
      }

      return {
        recipe: recipeData,
        ingredients,
        groceryItems
      };
    } catch (error: unknown) {
      console.error('Recipe extraction error:', error)
      throw new Error(`Failed to extract recipe: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleExtractRecipe = async () => {
    if (!url || loading) return

    // Debouncing: prevent multiple rapid clicks
    const now = Date.now()
    if (now - lastExtractTime.current < 1000) { // 1 second debounce
      return
    }
    lastExtractTime.current = now

    // Clear any existing timeout
    if (extractTimeoutRef.current) {
      clearTimeout(extractTimeoutRef.current)
    }

    const validationError = validateUrl(url)
    if (validationError) {
      showNotification(validationError)
      return
    }

    // Set loading immediately to prevent multiple clicks
    setLoading(true)
    
    try {
      const data = await extractRecipeFromUrl(url)
      if (data) {
        setExtractedRecipe(data)
        showNotification("Recipe found! Please review and save.")
      }
    } catch (error) {
      console.error('Error extracting recipe:', error)
      showNotification("Failed to extract recipe. Please check the URL and try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveRecipe = async () => {
    if (!extractedRecipe || loading) return

    // Debouncing: prevent multiple rapid clicks
    const now = Date.now()
    if (now - lastSaveTime.current < 1000) { // 1 second debounce
      return
    }
    lastSaveTime.current = now

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set loading immediately to prevent multiple clicks
    setLoading(true)
    
    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        showNotification("Please log in to save recipes")
        router.push('/auth') // Redirect to auth page
        return
      }

      // Insert recipe with user_id (the trigger will handle this automatically, but we can be explicit)
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .insert([{
          title: extractedRecipe.recipe.title,
          image: extractedRecipe.recipe.image,
          caption: extractedRecipe.recipe.caption,
          tags: extractedRecipe.recipe.tags,
          steps: extractedRecipe.recipe.steps,
          created_at: new Date().toISOString()
          // user_id will be set automatically by the trigger
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

      // Insert ingredients with recipe_id (user_id set automatically by trigger)
      if (extractedRecipe.ingredients.length > 0) {
        const ingredientsWithRecipeId = extractedRecipe.ingredients.map(ingredient => ({
          ...ingredient,
          recipe_id: recipeData.id
          // user_id will be set automatically by the trigger
        }))

        const { error: ingredientsError } = await supabase
          .from('ingredients')
          .insert(ingredientsWithRecipeId)

        if (ingredientsError) {
          console.error('Ingredients insert error:', ingredientsError)
          throw new Error('Failed to save ingredients: ' + ingredientsError.message)
        }
      }

      // Insert grocery items with recipe_id (user_id set automatically by trigger)
      if (extractedRecipe.groceryItems.length > 0) {
        const groceryItemsWithRecipeId = extractedRecipe.groceryItems.map(item => ({
          recipe_id: recipeData.id,
          name: item.name,
          amount: item.amount,
          details: item.details,
          aisle: '', // This will be set by the user later
          purchased: false,
          created_at: new Date().toISOString()
          // user_id will be set automatically by the trigger
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
      
      router.push('/')
    } catch (error) {
      console.error('Error saving recipe:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      showNotification("Failed to save recipe: " + errorMessage)
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
          <div className="relative">
            <Input
              type="url"
              placeholder="Paste Link"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-4 pr-12 bg-[#343434] text-white placeholder:text-white/30 rounded-full focus:ring-0 border-0 focus:border-0 h-[3.3125rem] text-xl"
              disabled={loading}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleExtractRecipe}
              disabled={loading || !url}
              className={`absolute right-2 top-1/2 -translate-y-1/2 border-0 rounded-full transition-all duration-200 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : url 
                    ? 'bg-gradient-to-r from-[#6ED308] to-[#A5E765] hover:scale-105' 
                    : 'bg-white/30'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader className="h-6 w-6 animate-spin text-white" />
                </div>
              ) : (
                <ArrowUp className="!h-6 !w-6 text-white" />
              )}
            </Button>
          </div>
        </div>

        {extractedRecipe && (
          <div 
            className="fixed inset-x-0 bottom-0 z-40"
            aria-modal="true"
            role="dialog"
            aria-labelledby="recipe-modal-title"
            onClick={(e) => {
              if (e.target === e.currentTarget && !loading) {
                setExtractedRecipe(null)
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
                  {extractedRecipe.recipe.image && (
                  <div className="w-full h-36 overflow-hidden">
                    <img 
                      src={extractedRecipe.recipe.image} 
                      alt={extractedRecipe.recipe.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200">
                  <Button
                    variant="link"
                    onClick={() => setExtractedRecipe(null)}
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
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Save
                  </Button>
                </div>
                
                <div className="p-4">
                  <h3 id="recipe-modal-title" className="font-bold text-xl text-gray-900 mb-3">
                    {extractedRecipe.recipe.title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {extractedRecipe.recipe.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 p-4 space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-3">
                      Ingredients
                    </h4>
                    <ul className="space-y-2">
                      {extractedRecipe.ingredients.map((ingredient, i) => (
                        <li key={i} className="flex items-start text-gray-700">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 mr-2"></span>
                          <div className="flex-1">
                            <span className="font-medium">{ingredient.name}</span>
                            {ingredient.amount && (
                              <span className="text-gray-500 ml-2">{ingredient.amount}</span>
                            )}
                            {ingredient.details && (
                              <span className="text-gray-500 block text-sm mt-0.5">{ingredient.details}</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-3">
                      Steps
                    </h4>
                    <ol className="space-y-3">
                      {extractedRecipe.recipe.steps.map((step, i) => (
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