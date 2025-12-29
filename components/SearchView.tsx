"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import RecipeCard from "@/components/RecipeCard"

interface SearchViewProps {
  query: string
  onSelect?: (item: any) => void
}

type RecipeResult = {
  id: string | number
  title: string
  image?: string | null
}

export default function SearchView({ query, onSelect }: SearchViewProps) {
  const [results, setResults] = useState<RecipeResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query || query.length < 1) {
      setResults([])
      return
    }

    let isCancelled = false
    const timeout = setTimeout(async () => {
      try {
        setLoading(true)
        const { data: recipes, error } = await supabase
          .from("recipes")
          .select("id, title, image")
          .ilike("title", `%${query}%`)
          .limit(20)

        if (!isCancelled && !error) {
          setResults(
            (recipes || []).map((r: any) => ({
              id: r.id,
              title: r.title,
              image: r.image,
            }))
          )
        }
      } catch (err) {
        console.error("Search error:", err)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }, 400)

    return () => {
      clearTimeout(timeout)
      isCancelled = true
    }
  }, [query])

  return (
    <div className="w-full h-full pt-20 pb-6 flex flex-col">
      <div className="flex-1 overflow-y-auto px-4">
        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        )}

        {/* Empty Prompt */}
        {!loading && query.length === 0 && (
          <div className="flex items-center justify-center flex-1 min-h-[400px] text-center">
            <div className="max-w-md">
              <h2 className="text-2xl font-bold text-black mb-2">Find your favorites</h2>
              <p className="text-sm text-chef-grey">Start typing to find any recipe.</p>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && query.length > 0 && results.length === 0 && (
          <div className="flex items-center justify-center flex-1 min-h-[300px]">
            <p className="text-chef-grey text-center">No results found</p>
          </div>
        )}

        {/* Grid of Square Cards — 2 columns */}
        {!loading && results.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => onSelect?.(r)}
                className="w-full p-0 bg-transparent border-0 text-left"
                aria-label={`Open ${r.title}`}
              >
                <RecipeCard
                  id={String(r.id)}
                  title={r.title}
                  image={r.image || "/placeholder.svg"}
                  cardType="square"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
