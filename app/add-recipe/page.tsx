"use client"

import { useState } from "react"
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
  const [recipeData, setRecipeData] = useState<null | {
    title: string
    image: string
    tags: string[]
    ingredients: string[]
    steps: string[]
  }>(null)

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

  // Simulate recipe extraction API call
  const extractRecipeFromUrl = async (url: string) => {
    // In a real app, this would be an API call to your backend
    // For demo, returning mock data
    await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate API delay
    
    return {
      title: "Homemade Pizza",
      image: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca",
      tags: ["Dinner", "Italian"],
      ingredients: [
        "2 cups flour",
        "1 cup water",
        "2 tbsp olive oil",
        "1 tsp salt",
        "1 tsp yeast"
      ],
      steps: [
        "Mix dry ingredients",
        "Add water and oil",
        "Knead dough",
        "Let rise for 1 hour",
        "Top and bake"
      ]
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
    <div className="min-h-screen bg-gray-100 p-4">
      <Link href="/" className="absolute top-4 left-4 z-10 bg-white rounded-full p-2">
        <ChevronLeft className="h-6 w-6" />
      </Link>

      <div className="max-w-md mx-auto pt-16">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Import Recipe</h2>
          
          <div className="space-y-4">
            <div className="relative">
              <Input
                type="url"
                placeholder="Paste recipe URL here"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pr-12"
                disabled={loading}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleUrlSubmit}
                disabled={loading || !url}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </Button>
            </div>

            {recipeData && (
              <div className="space-y-4 mt-6">
                <h3 className="font-semibold text-lg">{recipeData.title}</h3>
                
                {recipeData.image && (
                  <img 
                    src={recipeData.image} 
                    alt={recipeData.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}

                <div>
                  <h4 className="font-medium mb-2">Ingredients:</h4>
                  <ul className="list-disc pl-5">
                    {recipeData.ingredients.map((ingredient, i) => (
                      <li key={i}>{ingredient}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Steps:</h4>
                  <ol className="list-decimal pl-5">
                    {recipeData.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="flex space-x-4 pt-4">
                  <Button
                    onClick={handleSaveRecipe}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Save Recipe
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setRecipeData(null)}
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

