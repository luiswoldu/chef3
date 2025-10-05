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
  const [heroRecipe, setHeroRecipe] = useState<Recipe | null>(null)
  const [featuredRecipes, setFeaturedRecipes] = useState<Recipe[]>([])
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Memoized random recipe generator with consistent results
  const sections = useMemo(() => {
    if (!recipes || recipes.length === 0) return []
    
    const getRandomRecipes = (count: number, seed: string) => {
      let hash = 0
      for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      const seededRandom = (hash: number) => {
        hash = Math.sin(hash) * 10000
        return hash - Math.floor(hash)
      }
      const shuffled = [...recipes].sort(() => seededRandom(hash++) - 0.5)
      return shuffled.slice(0, count)
    }

    return [
      // { title: "For You", recipes: getRandomRecipes(9, "for-you") },
      // { title: "Popular", recipes: getRandomRecipes(9, "popular") },
      { title: "Added Recipes", recipes: getRandomRecipes(9, "added") },
      { title: "Summer Hits", recipes: getRandomRecipes(9, "summer") }
    ]
  }, [recipes])

  const loadRecipes = useCallback(async () => {
    const now = Date.now()
    if (recipeCache && (now - recipeCacheTime) < CACHE_DURATION) {
      setRecipes(recipeCache)
      return
    }
    try {
      setIsLoading(true)
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: allRecipes, error: fetchError } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
      if (fetchError) {
        console.error("Error fetching recipes:", fetchError)
        return
      }
      const recipesData = allRecipes as Recipe[] || []
      recipeCache = recipesData
      recipeCacheTime = now
      setRecipes(recipesData)
    } catch (error) {
      console.error("Error in loadRecipes:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadFeaturedRecipes = useCallback(async () => {
    try {
      const { data: featured, error } = await supabase
        .from('featured_library')
        .select('*')
        .limit(9)
      
      if (error) {
        console.error("Error fetching featured recipes:", error)
        return
      }
      
      setFeaturedRecipes(featured as Recipe[] || [])
    } catch (error) {
      console.error("Error in loadFeaturedRecipes:", error)
    }
  }, [])

  const loadHeroRecipe = useCallback(async () => {
    try {
      // Get random hero recipe from featured_library
      const { data: featured, error } = await supabase
        .from('featured_library')
        .select('*')
        .limit(50)
      
      if (error) {
        console.error("Error fetching featured for hero:", error)
        return
      }
      
      if (featured && featured.length > 0) {
        const randomIndex = Math.floor(Math.random() * featured.length)
        setHeroRecipe(featured[randomIndex] as Recipe)
      }
    } catch (error) {
      console.error("Error in loadHeroRecipe:", error)
    }
  }, [])

  const loadRecentRecipes = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: recent, error } = await supabase
        .rpc('get_recent_recipes', {
          user_id_param: user.id.toString(),
          limit_param: 9
        })
      
      if (error) {
        console.error('Error fetching recent recipes:', error)
        return
      }
      
      setRecentRecipes(recent as Recipe[] || [])
    } catch (error) {
      console.error('Error in loadRecentRecipes:', error)
    }
  }, [])


  useEffect(() => {
    if (!recipeCache || (Date.now() - recipeCacheTime) >= CACHE_DURATION) {
      loadRecipes()
    }
  }, [loadRecipes])

  useEffect(() => {
    loadHeroRecipe()
  }, [loadHeroRecipe])


  useEffect(() => {
    loadRecentRecipes()
  }, [loadRecentRecipes])

  useEffect(() => {
    loadFeaturedRecipes()
  }, [loadFeaturedRecipes])

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
        {/* Recents section */}
        <section className="py-4">
          <h2 className="text-[28px] tracking-tight font-bold mb-2 px-4">Recents</h2>
          <div className="flex overflow-x-auto space-x-2 px-4 pb-2">
            {recentRecipes && recentRecipes.length > 0 ? (
              recentRecipes.map((recipe: Recipe) => (
                <div key={`recent-${recipe.id}`} className="w-48">
                  <RecipeCard 
                    id={recipe.id?.toString() || "0"} 
                    title={recipe.title || "Untitled Recipe"} 
                    image={recipe.image || '/placeholder.svg'}
                    cardType="thumbnail"
                  />
                </div>
              ))
            ) : (
              <div className="flex space-x-2 px-4">
                <div className="text-gray-500 text-sm italic py-8">
                  No recent recipes yet. Start browsing to see your recently viewed recipes here!
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Added Recipes section */}
        <section className="py-2">
          <h2 className="text-[28px] tracking-tight font-bold mb-2 px-4">Added Recipes</h2>
          <div className="flex overflow-x-auto space-x-2 px-4 pb-4">
            {recipes && recipes.length > 0 ? (
              recipes.slice(0, 9).map((recipe: Recipe) => (
                <div key={`added-${recipe.id}`} className="w-48">
                  <RecipeCard 
                    id={recipe.id?.toString() || "0"} 
                    title={recipe.title || "Untitled Recipe"} 
                    image={recipe.image || '/placeholder.svg'}
                    cardType="thumbnail"
                  />
                </div>
              ))
            ) : (
              <div className="flex space-x-2 px-4">
                <div className="text-gray-500 text-sm italic py-8">
                  No recipes added yet. Create your first recipe to get started!
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Our Picks section (from featured_library) */}
        <section className="py-2">
          <h2 className="text-[28px] tracking-tight font-bold mb-2 px-4">Our Picks</h2>
          <div className="flex overflow-x-auto space-x-2 px-4 pb-4">
            {featuredRecipes && featuredRecipes.length > 0 ? (
              featuredRecipes.map((recipe: Recipe) => (
                <div key={`featured-${recipe.id}`} className="w-48">
                  <RecipeCard 
                    id={recipe.id?.toString() || "0"} 
                    title={recipe.title || "Untitled Recipe"} 
                    image={recipe.image || '/placeholder.svg'}
                    cardType="thumbnail"
                  />
                </div>
              ))
            ) : (
              <div className="flex space-x-2 px-4">
                <div className="text-gray-500 text-sm italic py-8">
                  Loading featured recipes...
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
      <Navigation />
    </div>
  )
}
