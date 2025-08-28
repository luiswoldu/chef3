"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import Navigation from "@/components/Navigation"
import SearchBar from "@/components/SearchBar"
import RecipeCard from "@/components/RecipeCard"
import type { Recipe } from "@/types"
import { supabase } from "@/lib/supabase/client"

// Cache outside component to persist across navigations
let recipeCache: Recipe[] | null = null
let recipeCacheTime: number = 0
let recentCache: { heroRecipe: Recipe | null; recentRecipes: Recipe[] } | null = null
let recentCacheTime: number = 0

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>(recipeCache || [])
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>(recentCache?.recentRecipes || [])
  const [heroRecipe, setHeroRecipe] = useState<Recipe | null>(recentCache?.heroRecipe || null)
  const [isLoading, setIsLoading] = useState(false)

  // Memoized random recipe generator with consistent results
  const sections = useMemo(() => {
    if (!recipes || recipes.length === 0) return []
    
    // Use a seed for consistent randomization during the session
    const getRandomRecipes = (count: number, seed: string) => {
      // Simple seeded random function
      let hash = 0
      for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
      }
      
      const seededRandom = (hash: number) => {
        hash = Math.sin(hash) * 10000
        return hash - Math.floor(hash)
      }
      
      const shuffled = [...recipes].sort(() => seededRandom(hash++) - 0.5)
      return shuffled.slice(0, count)
    }

    return [
      { title: "For You", recipes: getRandomRecipes(9, "for-you") },
      { title: "Popular", recipes: getRandomRecipes(9, "popular") },
      { title: "Added Recipes", recipes: getRandomRecipes(9, "added") },
      { title: "Summer Hits", recipes: getRandomRecipes(9, "summer") },
      { title: "How to", recipes: getRandomRecipes(9, "howto") },
      { title: "Untitled", recipes: getRandomRecipes(9, "untitled") }
    ]
  }, [recipes])

  const loadRecipes = useCallback(async () => {
    const now = Date.now()
    
    // Check cache first
    if (recipeCache && (now - recipeCacheTime) < CACHE_DURATION) {
      setRecipes(recipeCache)
      return
    }

    try {
      setIsLoading(true)
      const { data: allRecipes, error: fetchError } = await supabase
        .from('recipes')
        .select('*')
      
      if (fetchError) {
        console.error("Error fetching recipes:", fetchError)
        return
      }
      
      const recipesData = allRecipes as Recipe[] || []
      
      // Update cache
      recipeCache = recipesData
      recipeCacheTime = now
      
      setRecipes(recipesData)
    } catch (error) {
      console.error("Error in loadRecipes:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadRecents = useCallback(async () => {
    const now = Date.now()
    
    // Check cache first
    if (recentCache && (now - recentCacheTime) < CACHE_DURATION) {
      setHeroRecipe(recentCache.heroRecipe)
      setRecentRecipes(recentCache.recentRecipes)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: recents, error } = await supabase
        .rpc("get_recent_recipes", { p_user_id: user.id, p_limit: 10 })
      
      if (error) {
        console.error(error)
        return
      }
      
      let heroRecipeData: Recipe | null = null
      let recentRecipesData: Recipe[] = []
      
      if (recents && recents.length > 0) {
        heroRecipeData = recents[0] as Recipe
        recentRecipesData = recents.slice(1) as Recipe[]
      }
      
      // Update cache
      recentCache = {
        heroRecipe: heroRecipeData,
        recentRecipes: recentRecipesData
      }
      recentCacheTime = now
      
      setHeroRecipe(heroRecipeData)
      setRecentRecipes(recentRecipesData)
    } catch (error) {
      console.error("Error in loadRecents:", error)
    }
  }, [])

  // Load data only if not cached
  useEffect(() => {
    if (!recipeCache || (Date.now() - recipeCacheTime) >= CACHE_DURATION) {
      loadRecipes()
    }
  }, [loadRecipes])

  useEffect(() => {
    if (!recentCache || (Date.now() - recentCacheTime) >= CACHE_DURATION) {
      loadRecents()
    }
  }, [loadRecents])

  return (
    <div className="flex flex-col min-h-screen pb-[70px]">
      <div className="relative w-full h-[56.4vh]">
        {heroRecipe ? (
          <RecipeCard
            id={heroRecipe.id?.toString() || "0"}
            title={heroRecipe.title || "Untitled Recipe"}
            image={heroRecipe.image || '/placeholder.svg'}
            isHero={true}
            showAddButton={true}
            cardType="hero"
            rounded="none"
          />
        ) : (
          <div className="w-full h-full bg-gray-700 animate-pulse rounded-md overflow-hidden">
            <div className="w-2/3 h-8 bg-gray-600 absolute bottom-6 left-6 rounded-md animate-shimmer"></div>
          </div>
        )}
      </div>
      <SearchBar />
      <div className="flex-1 overflow-y-auto">
        <section className="py-4">
          <h2 className="text-3xl tracking-tight font-bold mb-2 px-4">Recents</h2>
          <div className="flex overflow-x-auto space-x-2 px-4 pb-2">
            {recentRecipes && recentRecipes.length > 0 ? (
              recentRecipes.map((recipe: Recipe) => (
                <div key={recipe.id} className="w-48">
                  <RecipeCard 
                    id={recipe.id?.toString() || "0"} 
                    title={recipe.title || "Untitled Recipe"} 
                    image={recipe.image || '/placeholder.svg'}
                    cardType="thumbnail"
                  />
                </div>
              ))
            ) : (
              <div className="flex space-x-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="w-48 h-40 flex-shrink-0 rounded-lg bg-gray-700 animate-pulse overflow-hidden">
                    <div className="w-2/3 h-4 bg-gray-600 absolute bottom-3 left-3 rounded-md animate-shimmer"></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Render all sections */}
        {sections.map((section) => (
          <section key={section.title} className="py-2">
            <h2 className="text-3xl tracking-tight font-bold mb-2 px-4">{section.title}</h2>
            <div className="flex overflow-x-auto space-x-2 px-4 pb-4">
              {section.recipes && section.recipes.length > 0 ? (
                section.recipes.map((recipe: Recipe) => (
                  <div key={`${section.title}-${recipe.id}`} className="w-48">
                    <RecipeCard 
                      id={recipe.id?.toString() || "0"} 
                      title={recipe.title || "Untitled Recipe"} 
                      image={recipe.image || '/placeholder.svg'}
                      cardType="thumbnail"
                    />
                  </div>
                ))
              ) : (
                <div className="flex space-x-4">
                  {[...Array(3)].map((_, index) => (
                    <div key={`${section.title}-skeleton-${index}`} className="w-48 h-40 flex-shrink-0 rounded-lg bg-gray-700 animate-pulse overflow-hidden">
                      <div className="w-2/3 h-4 bg-gray-600 absolute bottom-3 left-3 rounded-md animate-shimmer"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
      <Navigation />
    </div>
  )
} 