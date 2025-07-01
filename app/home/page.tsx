"use client"

import { useEffect, useState } from "react"
import Navigation from "@/components/Navigation"
import SearchBar from "@/components/SearchBar"
import RecipeCard from "@/components/RecipeCard"
import type { Recipe } from "@/types"
import { supabase } from "@/lib/supabase/client"
import { RefreshCw } from "lucide-react"

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([])
  const [heroRecipe, setHeroRecipe] = useState<Recipe | null>(null)

  const shuffleRecipes = () => {
    const newRecipes = [...recipes]
    const yourWeekSection = newRecipes.slice(5, 9)
    const shuffledYourWeek = yourWeekSection.sort(() => Math.random() - 0.5)
    
    // Replace the "Your Week" section with the shuffled version
    newRecipes.splice(5, 4, ...shuffledYourWeek)
    setRecipes(newRecipes)
  }
  
  useEffect(() => {
    // Fetch recipes
    async function loadRecipes() {
      try {
        const { data: allRecipes, error: fetchError } = await supabase
          .from('recipes')
          .select('*')
        
        if (fetchError) {
          console.error("Error fetching recipes:", fetchError)
          return
        }
        
        setRecipes(allRecipes as Recipe[] || [])
        
        // Select a random recipe from the first 5 recipes for the hero section
        if (allRecipes && allRecipes.length > 0) {
          const randomIndex = Math.floor(Math.random() * Math.min(5, allRecipes.length))
          setHeroRecipe(allRecipes[randomIndex] as Recipe)
        }
      } catch (error) {
        console.error("Error in loadRecipes:", error)
      }
    }

    loadRecipes()
  }, [])

  useEffect(() => {
    async function loadRecents() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
    
      const { data: recents, error } = await supabase
        .rpc("get_recent_recipes", { p_user_id: user.id, p_limit: 9 });
      if (error) return console.error(error);
      setRecentRecipes(recents as Recipe[]);
    }

    loadRecents();
  }, []);

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
          <div className="flex overflow-x-auto space-x-2 px-4 pb-4">
            {recentRecipes && recentRecipes.length > 0 ? (
              recentRecipes.map((recipe: Recipe) => (
                <div key={recipe.id} className="w-48 flex-shrink-0">
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
        
        {recipes && recipes.length > 0 && (
          <section className="py-2">
            <div className="flex items-center gap-3 mb-2 px-4">
              <h2 className="text-3xl tracking-tight font-bold">Your Week</h2>
              <button 
                onClick={shuffleRecipes}
                className="p-1 rounded-full"
                aria-label="Shuffle recipes"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
            <div className="flex overflow-x-auto space-x-2 px-4 pb-4">
              {recipes.slice(5, 9).map((recipe: Recipe) => (
                <div key={`unique-${recipe.id}`} className="w-48 flex-shrink-0">
                  <RecipeCard 
                    id={recipe.id.toString()} 
                    title={recipe.title} 
                    image={recipe.image || '/placeholder.svg'}
                    cardType="thumbnail"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {recipes && recipes.length > 0 && (
          <section className="py-4">
            <h2 className="text-3xl font-semibold mb-2 px-4">All</h2>
            <div className="grid grid-cols-2 gap-4 px-4">
              {recipes.slice(9, 100).map((recipe: Recipe) => (
                <RecipeCard 
                  key={`all-${recipe.id}`} 
                  id={recipe.id.toString()} 
                  title={recipe.title} 
                  image={recipe.image || '/placeholder.svg'}
                  cardType="square"
                />
              ))}
            </div>
          </section>
        )}
      </div>
      <Navigation />
    </div>
  )
} 