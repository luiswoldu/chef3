"use client"

import { useSearchParams } from "next/navigation"
import RecipeCard from "../../components/RecipeCard"
import { db } from "../../lib/db"
import { useEffect, useState } from "react"

export default function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q")
  const [results, setResults] = useState<any[]>([])

  useEffect(() => {
    const searchRecipes = async () => {
      if (query) {
        const recipes = await db.recipes
          .filter(
            (recipe) =>
              recipe.title.toLowerCase().includes(query.toLowerCase()) ||
              recipe.ingredients.some((ing) => ing.ingredient.toLowerCase().includes(query.toLowerCase())),
          )
          .toArray()
        setResults(recipes)
      }
    }
    searchRecipes()
  }, [query])

  return (
    <div className="min-h-screen bg-white">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Search Results for "{query}"</h1>
        <div className="grid grid-cols-2 gap-4">
          {results.map((recipe) => (
            <RecipeCard key={recipe.id} id={recipe.id.toString()} title={recipe.title} image={recipe.image} />
          ))}
        </div>
        {results.length === 0 && <p className="text-gray-500 text-center mt-8">No results found for "{query}"</p>}
      </div>
    </div>
  )
}

