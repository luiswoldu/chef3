"use client"

import { Suspense, useEffect, useState } from "react"
import RecipeCard from "../../components/RecipeCard"
import type { Recipe } from "@/types"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

// Component that uses useSearchParams
function SearchResultsContent() {
  // Import useSearchParams inside the component that uses it
  const { useSearchParams } = require("next/navigation")
  const searchParams = useSearchParams()
  const query = searchParams?.get("q") || ""
  const [results, setResults] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const searchRecipes = async () => {
      setIsLoading(true)
      
      if (query) {
        try {
          // Get current user first
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            setResults([])
            setIsLoading(false)
            return
          }
          
          // Using ILIKE for server-side search with trailing wildcard
          const { data: recipesData, error } = await supabase
            .from('recipes')
            .select('*')
            .eq('user_id', user.id)
            .ilike('title', `${query}%`)
          
          if (error) {
            console.error('Supabase query error:', error)
            setResults([])
          } else {
            setResults(recipesData as Recipe[] || [])
          }
        } catch (error) {
          console.error('Error in searchRecipes:', error)
          setResults([])
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
    <>
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
    </>
  )
}

// Loading fallback for Suspense
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
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<SearchLoader />}>
        <SearchResultsContent />
      </Suspense>
    </div>
  )
} 