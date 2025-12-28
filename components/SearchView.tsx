"use client"

import { useEffect, useState } from "react"
import { Search, Loader2 } from "lucide-react"
import { supabase } from '@/lib/supabase/client'
import RecipeCard from '@/components/RecipeCard'

interface SearchViewProps {
  query: string
  onSelect?: (item: any) => void
}

export default function SearchView({ query, onSelect }: SearchViewProps) {
  const [showGridView, setShowGridView] = useState(false)
  const [gridResults, setGridResults] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Simulated fetch — replace with Supabase or your API call
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }

    let isCancelled = false

    const timeout = setTimeout(async () => {
      try {
        setLoading(true)
        
        const { data: recipes, error } = await supabase
          .from('recipes')
          .select('id, title, image')
          .ilike('title', `%${query}%`)
          .limit(10)

        if (!isCancelled && !error) {
          setResults(
            recipes?.map(recipe => ({
              id: recipe.id,
              title: recipe.title,
              type: "Recipe",
              image: recipe.image
            })) || []
          )
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }, 400)

    return () => {
      clearTimeout(timeout)
      isCancelled = true
    }
  }, [query])

  // Handle Enter key for grid toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && query.length > 0 && !loading) {
        e.preventDefault()
        setShowGridView(true)
        
        // Fetch more results for grid
        supabase
          .from('recipes')
          .select('id, title, image')
          .ilike('title', `%${query}%`)
          .limit(20)
          .then(({ data }) => {
            setGridResults(
              data?.map(recipe => ({
                id: recipe.id,
                title: recipe.title,
                image: recipe.image
              })) || []
            )
          })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [query, loading])


  return (
    <div className="w-full h-full pt-2 pb-6 flex flex-col">
      {/* Grid Toggle Bar */}
      {showGridView && (
        <div className="flex items-center mb-6 p-4 bg-white rounded-2xl shadow-hands mx-4">
          <button
            onClick={() => setShowGridView(false)}
            className="flex items-center gap-2 text-sm font-medium text-chef-grey hover:text-black transition-colors"
          >
            <Search className="w-4 h-4" />
            Back to list
          </button>
        </div>
      )}

      {/* Content Container */}
      <div className="flex-1 overflow-y-auto px-4">
        {/* Loading Spinner */}
        {loading && !showGridView && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        )}

        {/* Empty State */}
        {!loading && query.length === 0 && (
          <div className="flex items-center justify-center flex-1 min-h-[400px] text-center">
            <div className="max-w-md">
              <h2 className="text-2xl font-bold text-black mb-2">
                Find your favorites
              </h2>
              <p className="text-sm text-chef-grey">
                Start typing to find any recipe.
              </p>
            </div>
          </div>
        )}

        {/* Grid Results */}
        {showGridView && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridResults.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                id={recipe.id.toString()}
                title={recipe.title}
                image={recipe.image || '/placeholder.svg'}
                cardType="square"
              />
            ))}
          </div>
        )}

        {/* List Results */}
        {!loading && !showGridView && query.length > 0 && results.length === 0 && (
          <div className="flex items-center justify-center flex-1 min-h-[300px]">
            <p className="text-chef-grey text-center">No results found</p>
          </div>
        )}

        {!loading && !showGridView && results.length > 0 && (
          <ul className="divide-y divide-neutral-200 rounded-2xl bg-white shadow-hands overflow-hidden">
            {results.map((item) => (
              <li
                key={item.id}
                onClick={() => onSelect?.(item)}
                className="px-5 py-4 active:bg-neutral-100 transition-all cursor-pointer hover:bg-neutral-50"
              >
                <div className="font-semibold text-black text-base">{item.title}</div>
                <div className="text-xs text-neutral-500 mt-0.5">{item.type}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )

}