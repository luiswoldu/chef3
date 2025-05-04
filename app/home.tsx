"use client"

import { useEffect, useState } from "react"
import Navigation from "@/components/Navigation"
import SearchBar from "@/components/SearchBar"
import RecipeCard from "@/components/RecipeCard"
import type { Recipe } from "@/types"
import { getAllRecipes } from "@/lib/db"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [heroRecipe, setHeroRecipe] = useState<Recipe | null>(null)
  
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

  return (
    <div className="flex flex-col min-h-screen pb-[70px]">
      <div className="relative w-full h-[56.4vh] bg-gradient-to-b from-gray-500 to-gray-600">
        {heroRecipe ? (
          <Link href={`/recipe/${heroRecipe.id}`} className="absolute inset-0">
            <div className="relative w-full h-full">
              <img 
                src={heroRecipe.image || '/placeholder.svg'} 
                alt={heroRecipe.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h2 className="text-3xl font-bold">{heroRecipe.title}</h2>
              </div>
            </div>
          </Link>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full bg-gray-700 animate-pulse rounded-md overflow-hidden">
              <div className="w-2/3 h-8 bg-gray-600 absolute bottom-6 left-6 rounded-md animate-shimmer"></div>
            </div>
          </div>
        )}
      </div>
      <SearchBar />
      <div className="flex-1 overflow-y-auto">
        <section className="py-4">
          <h2 className="text-xl font-semibold mb-2 px-4">Recents</h2>
          <div className="flex overflow-x-auto space-x-4 px-4 pb-4">
            {recipes && recipes.length > 0 ? (
              recipes.slice(0, 5).map((recipe: Recipe) => (
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
          <section className="py-4">
            <h2 className="text-xl font-semibold mb-2 px-4">Uniquely Yours</h2>
            <div className="flex overflow-x-auto space-x-4 px-4 pb-4">
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
            <h2 className="text-xl font-semibold mb-2 px-4">All</h2>
            <div className="grid grid-cols-2 gap-4 px-4">
              {recipes.slice(9, 15).map((recipe: Recipe) => (
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

