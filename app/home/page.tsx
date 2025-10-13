"use client"

import { useEffect, useState, useMemo, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Navigation from "@/components/Navigation"
import SearchBar from "@/components/SearchBar"
import RecipeCard from "@/components/RecipeCard"
import type { Recipe } from "@/types"
import { supabase } from "@/lib/supabase/client"

// Cache outside component to persist across navigations
let recipeCache: Recipe[] | null = null
let recipeCacheTime: number = 0

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Function to invalidate the cache (can be called when recipes are added/updated)
const invalidateRecipeCache = () => {
  recipeCache = null
  recipeCacheTime = 0
}

function HomePageContent() {
  const searchParams = useSearchParams()
  const [recipes, setRecipes] = useState<Recipe[]>(recipeCache || [])
  const [heroRecipe, setHeroRecipe] = useState<Recipe | null>(null)
  const [featuredRecipes, setFeaturedRecipes] = useState<Recipe[]>([])
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([])
  const [popularRecipes, setPopularRecipes] = useState<Recipe[]>([])
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

  const loadRecipes = useCallback(async (forceRefresh = false) => {
    const now = Date.now()
    if (!forceRefresh && recipeCache && (now - recipeCacheTime) < CACHE_DURATION) {
      console.log('Using cached Added Recipes:', recipeCache.length, 'recipes')
      setRecipes(recipeCache)
      return
    }
    try {
      setIsLoading(true)
      console.log('Loading fresh Added Recipes from database...')
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: allRecipes, error: fetchError } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (fetchError) {
        console.error("Error fetching recipes:", fetchError)
        return
      }
      const recipesData = allRecipes as Recipe[] || []
      recipeCache = recipesData
      recipeCacheTime = now
      setRecipes([...recipesData]) // Ensure new array reference to force re-render
      console.log('Loaded', recipesData.length, 'Added Recipes from database')
    } catch (error) {
      console.error("Error in loadRecipes:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadFeaturedRecipes = useCallback(async () => {
    try {
      console.log('Loading Our Picks...')
      
      // Get a larger sample of featured recipes to randomize from
      const { data: featured, error } = await supabase
        .from('featured_library')
        .select('*')
        .limit(50)
      
      if (error) {
        console.error("Error fetching featured recipes:", error)
        return
      }
      
      console.log(`Fetched ${featured?.length || 0} featured recipes from DB`)
      
      // Deduplicate by recipe_id and randomly select 9 recipes
      if (featured && featured.length > 0) {
        // Remove duplicates based on recipe_id
        const uniqueFeatured = featured.reduce((acc: any[], recipe: any) => {
          const recipeId = recipe.recipe_id || recipe.id
          if (!acc.find(r => (r.recipe_id || r.id) === recipeId)) {
            acc.push(recipe)
          } else {
            console.log(`Skipped duplicate recipe_id: ${recipeId}`)
          }
          return acc
        }, [])
        
        console.log(`After deduplication: ${uniqueFeatured.length} unique recipes`)
        
        const shuffled = [...uniqueFeatured].sort(() => Math.random() - 0.5)
        const randomPicks = shuffled.slice(0, 9)
        
        console.log(`Selected ${randomPicks.length} Our Picks:`, randomPicks.map(r => ({ 
          id: r.recipe_id || r.id, 
          title: r.title?.substring(0, 30) + '...' 
        })))
        
        // Final duplicate check
        const pickedIds = randomPicks.map(r => r.recipe_id || r.id)
        const uniqueIds = Array.from(new Set(pickedIds))
        if (pickedIds.length !== uniqueIds.length) {
          console.error('DUPLICATES in Our Picks!', pickedIds)
        }
        
        setFeaturedRecipes(randomPicks as Recipe[] || [])
      } else {
        setFeaturedRecipes([])
      }
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
      
      console.log('Loading recent recipes for user:', user.id.substring(0, 8) + '...')
      
      const { data: recent, error } = await supabase
        .rpc('get_recent_recipes', {
          user_id_param: user.id,
          limit_param: 9
        })
      
      if (error) {
        console.error('Error fetching recent recipes:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        return
      }
      
      console.log('Recent recipes loaded:', recent?.length || 0)
      console.log('Recent recipes data:', recent?.slice(0, 3).map((r: any) => ({ id: r.id, title: r.title?.substring(0, 30) + '...', viewed_at: r.viewed_at })))
      
      // Set data directly without additional frontend processing
      setRecentRecipes(recent as Recipe[] || [])
    } catch (error) {
      console.error('Error in loadRecentRecipes:', error)
    }
  }, [])

  const loadPopularRecipes = useCallback(async () => {
    try {
      const { data: popular, error } = await supabase
        .rpc('get_popular_recipes', {
          days_window: 7,
          limit_count: 12
        })
      
      if (error) {
        console.error('Error fetching popular recipes:', error)
        return
      }
      
      setPopularRecipes(popular as Recipe[] || [])
    } catch (error) {
      console.error('Error in loadPopularRecipes:', error)
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

  useEffect(() => {
    loadPopularRecipes()
  }, [loadPopularRecipes])

  // Listen for page visibility changes to refresh recipes when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, refreshing recipes...')
        // Invalidate cache and reload recipes when user returns to the page
        invalidateRecipeCache()
        loadRecipes(true) // Force refresh
        loadRecentRecipes() // Also refresh recent recipes
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Also listen for focus events as a fallback
    const handleFocus = () => {
      console.log('Window focused, refreshing recipes...')
      invalidateRecipeCache()
      loadRecipes(true) // Force refresh
      loadRecentRecipes()
    }
    
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [loadRecipes, loadRecentRecipes])

  // Check for recipeAdded parameter and refresh immediately
  useEffect(() => {
    const recipeAdded = searchParams.get('recipeAdded')
    console.log('Checking URL parameters:', {
      recipeAdded,
      fullURL: window.location.href,
      searchParams: Object.fromEntries(searchParams.entries())
    })
    
    if (recipeAdded === 'true') {
      console.log('Recipe was just added! Refreshing Added Recipes immediately...')
      invalidateRecipeCache()
      loadRecipes(true) // Force refresh by passing true
      loadRecentRecipes() // Also refresh recent recipes in case the new recipe gets viewed
      
      // Clean up the URL parameter
      const url = new URL(window.location.href)
      url.searchParams.delete('recipeAdded')
      window.history.replaceState({}, '', url.toString())
      console.log('URL cleaned up, new URL:', window.location.href)
    }
  }, [searchParams, loadRecipes, loadRecentRecipes])

  // Also check localStorage as a backup trigger
  useEffect(() => {
    const checkForNewRecipe = () => {
      const newRecipeFlag = localStorage.getItem('recipeJustAdded')
      if (newRecipeFlag === 'true') {
        console.log('New recipe detected via localStorage! Refreshing...')
        localStorage.removeItem('recipeJustAdded')
        invalidateRecipeCache()
        loadRecipes(true)
        loadRecentRecipes()
      }
    }
    
    // Listen for custom event from AddRecipePanel (immediate trigger)
    const handleRecipeAdded = () => {
      console.log('Custom recipeAdded event detected! Refreshing immediately...')
      invalidateRecipeCache()
      loadRecipes(true)
      loadRecentRecipes()
    }
    
    // Check immediately
    checkForNewRecipe()
    
    // Listen for custom events (immediate notification)
    window.addEventListener('recipeAdded', handleRecipeAdded)
    
    // Listen for storage events (in case of multiple tabs)
    window.addEventListener('storage', checkForNewRecipe)
    
    // Polling as a fallback (check every 2 seconds)
    const interval = setInterval(checkForNewRecipe, 2000)
    
    return () => {
      window.removeEventListener('recipeAdded', handleRecipeAdded)
      window.removeEventListener('storage', checkForNewRecipe)
      clearInterval(interval)
    }
  }, [loadRecipes, loadRecentRecipes])

  return (
    <div className="flex flex-col min-h-screen pb-[70px]">
      <div className="relative w-full h-[56.4vh]">
        {heroRecipe ? (
          <RecipeCard
            id={((heroRecipe as any).recipe_id || (heroRecipe as any).id)?.toString() || "0"}
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
              recentRecipes.map((recipe: Recipe, index: number) => (
                <div key={`recent-${recipe.id}-${index}`} className="w-48">
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

        {/* Trending section */}
        {popularRecipes && popularRecipes.length > 0 && (
          <section className="py-2">
            <h2 className="text-[28px] tracking-tight font-bold mb-2 px-4">Trending</h2>
            <div className="flex overflow-x-auto space-x-2 px-4 pb-4">
              {popularRecipes.map((recipe: Recipe) => (
                <div key={`popular-${recipe.id}`} className="w-48">
                  <RecipeCard 
                    id={recipe.id?.toString() || "0"} 
                    title={recipe.title || "Untitled Recipe"} 
                    image={recipe.image || '/placeholder.svg'}
                    cardType="thumbnail"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

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
              featuredRecipes.map((recipe: any) => (
                <div key={`featured-${recipe.id}`} className="w-48">
                  <RecipeCard 
                    id={(recipe.recipe_id || recipe.id)?.toString() || "0"} 
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

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>}>
      <HomePageContent />
    </Suspense>
  )
}
