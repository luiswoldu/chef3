"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import RecipeCard from "../../components/RecipeCard"
import type { Recipe } from "@/types"
import { Loader2 } from "lucide-react"
import { fullTextSearch } from "@/lib/supabase/client"

function SearchResultsContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") ?? ""

  const [results, setResults] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const searchRecipes = async () => {
      setIsLoading(true)

      if (!query) {
        setResults([])
        setIsLoading(false)
        return
      }

      try {
        const { recipes } = await fullTextSearch(query)
        setResults(recipes)
      } catch (error) {
        console.error("Error in searchRecipes:", error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    searchRecipes()
  }, [query])

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">
        Search Results for "{query}"
      </h1>

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
                image={recipe.image || ""}
                cardType="square"
              />
            ))}
          </div>

          {results.length === 0 && (
            <p className="text-chef-grey-iron text-center mt-8">
              No results found for "{query}"
            </p>
          )}
        </>
      )}
    </>
  )
}

function SearchLoader() {
  return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="h-10 w-10 text-green-500 animate-spin" />
      <span className="ml-2">Loading search results...</span>
    </div>
  )
}

export default function SearchResults() {
  return (
    <div className="container mx-auto px-4 py-8 bg-white min-h-screen">
      <Suspense fallback={<SearchLoader />}>
        <SearchResultsContent />
      </Suspense>
    </div>
  )
}