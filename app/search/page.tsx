"use client"

import { useSearchParams } from "next/navigation"
import RecipeCard from "../../components/RecipeCard"
import { supabase } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import type { Recipe } from "@/types"

export default function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams?.get("q") || ""
  const [results, setResults] = useState<Recipe[]>([])

  useEffect(() => {
    const searchRecipes = async () => {
      if (query) {
        try {
          const { data, error } = await supabase
            .from('recipes')
            .select('*')
            .or(`title.ilike.%${query}%,ingredients->ingredient.ilike.%${query}%`)
          
          if (error) {
            console.error('Error searching recipes:', error)
            return
          }
          
          setResults(data || [])
        } catch (error) {
          console.error('Error in searchRecipes:', error)
        }
      }
    }

    searchRecipes()
  }, [query])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Search Results for "{query}"</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            id={recipe.id.toString()}
            title={recipe.title}
            image={recipe.image || ''}
            cardType="square"
          />
        ))}
      </div>
      {results.length === 0 && <p className="text-gray-500 text-center mt-8">No results found for "{query}"</p>}
    </div>
  )
}

