"use client"

import { useEffect, useState } from "react"
import { Search, Loader2 } from "lucide-react"

interface SearchViewProps {
  query: string
  onSelect?: (item: any) => void
}

export default function SearchView({ query, onSelect }: SearchViewProps) {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Simulated fetch — replace with Supabase or your API call
  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }

    setLoading(true)

    const timeout = setTimeout(() => {
      const fake = [
        { id: 1, title: "Avocado Toast", type: "Recipe" },
        { id: 2, title: "Pantry Essentials", type: "Guide" },
        { id: 3, title: "Chicken Stir Fry", type: "Recipe" },
      ].filter((r) =>
        r.title.toLowerCase().includes(query.toLowerCase())
      )

      setResults(fake)
      setLoading(false)
    }, 400)

    return () => clearTimeout(timeout)
  }, [query])

  return (
    <div className="w-full h-full pt-2 pb-6">

      {/* Content */}
      <div className="mt-2">

        {/* Loading Spinner */}
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          </div>
        )}

{/* Empty State */}
{!loading && query.length === 0 && (
  <div className="flex items-center justify-center h-48 text-center">
    <div>
      <h2 className="text-lg font-semibold text-black">Find your favorites</h2>
      <p className="text-sm text-chef-grey">
        Start typing to search for any recipe.
      </p>
    </div>
  </div>
)}


        {/* No Results */}
        {!loading && query.length > 0 && results.length === 0 && (
          <div className="py-8 text-center text-neutral-400 text-sm">
            No results
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <ul className="divide-y divide-neutral-200 rounded-xl bg-neutral-50 overflow-hidden">
            {results.map((item) => (
              <li
                key={item.id}
                onClick={() => onSelect?.(item)}
                className="px-4 py-3 active:bg-neutral-100 transition-colors cursor-pointer"
              >
                <div className="font-medium text-black">{item.title}</div>
                <div className="text-xs text-neutral-500">{item.type}</div>
              </li>
            ))}
          </ul>
        )}

      </div>
    </div>
  )
}