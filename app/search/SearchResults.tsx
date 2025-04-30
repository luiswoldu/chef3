"use client"

import { useSearchParams } from "next/navigation"
import RecipeCard from "../../components/RecipeCard"
import { useEffect, useState } from "react"
import type { Recipe } from "@/types"
import { Loader2 } from "lucide-react"

export default function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams?.get("q") || ""
  const [results, setResults] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const searchRecipes = async () => {
      setIsLoading(true)
      
      if (query) {
        try {
          // Removing client-side RPC call
          // const recipesData = await searchRecipesFullText(query)
          
          // Placeholder until server-side search is implemented
          const recipesData: Recipe[] = []
          setResults(recipesData)
          
          // TODO: Replace with server-side API route call
          // const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
          // const data = await response.json()
          // setResults(data)
        } catch (error) {
          console.error('Error in searchRecipes:', error)
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    searchRecipes()
  }, [query])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Search Results for "{query}"</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-10 w-10 text-green-500 animate-spin" />
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  )
} 