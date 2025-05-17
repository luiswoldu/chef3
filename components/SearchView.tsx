"use client"

import { ChevronRight, Loader, Search, X } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { fullTextSearch } from "@/lib/supabase/client"

interface SearchItem {
  id: string
  name: string
  category: string
  type: string  // used for routing; e.g. 'recipe' or 'ingredient'
}

interface SearchViewProps {
  onCancel: () => void
}

export default function SearchView({ onCancel }: SearchViewProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<{
    recipes: SearchItem[],
    ingredients: SearchItem[]
  }>({
    recipes: [],
    ingredients: []
  })

  // Debounced full-text search with a shorter timeout
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults({ recipes: [], ingredients: [] })
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      try {
        const { recipes, ingredients } = await fullTextSearch(searchQuery)
        
        setSearchResults({
          recipes: recipes.map(r => ({ 
            id: r.id.toString(), 
            name: r.title, 
            category: 'Recipe', 
            type: 'recipe' 
          })),
          ingredients: ingredients.map(i => ({ 
            id: i.id.toString(), 
            name: i.name, 
            category: 'Ingredient', 
            type: 'ingredients' 
          }))
        })
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setIsSearching(false)
      }
    }, 200) // Reduced from 300ms to 200ms for faster feedback

    return () => clearTimeout(handler)
  }, [searchQuery])

  const handleSearch = async (query: string) => {
    if (!query.trim()) return

    try {
      router.push(`/search?q=${encodeURIComponent(query)}`)
    } catch (error) {
      console.error('Error navigating to search:', error)
    }
  }

  const handleClear = () => {
    setSearchQuery('')
  }

  const handleCancel = () => {
    onCancel()
    router.push("/")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      handleSearch(searchQuery.trim())
    }
  }

  const handleItemClick = (item: SearchItem) => {
    router.push(`/${item.type}/${item.id}`)
  }

  const hasResults = searchResults.recipes.length > 0 || searchResults.ingredients.length > 0

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="flex flex-col h-full">
        {/* Search Header */}
        <div className="p-4 flex items-center mt-8">
          <div className="flex-1 flex items-center bg-[#ffffff]/50 backdrop-blur-[4px] rounded-full px-4 py-2">
            {isSearching ? (
              <Loader className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-white" />
            )}
            <input
              type="text"
              className="flex-1 bg-transparent text-white pl-3 focus:outline-none placeholder-white"
              placeholder="Search recipes or ingredients"
              autoFocus
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            {searchQuery.trim() && (
              <button
                onClick={handleClear}
                className="ml-2 text-white"
                aria-label="Clear search"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <button
            onClick={handleCancel}
            className="text-white ml-3"
          >
            Cancel
          </button>
        </div>

        {/* Results Content */}
        <div className="flex-1 overflow-auto px-4 pb-4">
          {isSearching ? (
            <div className="flex justify-center items-center h-32">
              <Loader className="h-8 w-8 text-white animate-spin" />
            </div>
          ) : searchQuery.trim() ? (
            hasResults ? (
              <div className="space-y-8">
                {/* Ingredients Section */}
                {searchResults.ingredients.length > 0 && (
                  <div>
                    <h2 className="text-white text-xl font-semibold mb-4">Ingredients</h2>
                    <div className="space-y-4">
                      {searchResults.ingredients.map((ingredient, idx) => (
                        <Link
                          key={`ingredient-${idx}`}
                          href={`/search/ingredient/${encodeURIComponent(ingredient.name)}`}
                          className="w-full flex items-center justify-between text-left p-3 bg-zinc-900/50 rounded-lg hover:bg-zinc-800/50 block"
                        >
                          <div>
                            <h3 className="text-white text-lg">{ingredient.name}</h3>
                          </div>
                          <ChevronRight className="text-gray-400 h-5 w-5" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recipes Section */}
                {searchResults.recipes.length > 0 && (
                  <div>
                    <h2 className="text-white text-xl font-semibold mb-4">Recipes</h2>
                    <div className="space-y-4">
                      {searchResults.recipes.map((recipe, idx) => (
                        <button
                          key={`recipe-${idx}`}
                          className="w-full flex items-center justify-between text-left p-3 bg-zinc-900/50 rounded-lg hover:bg-zinc-800/50"
                          onClick={() => handleItemClick(recipe)}
                        >
                          <div>
                            <h3 className="text-white text-lg">{recipe.name}</h3>
                          </div>
                          <ChevronRight className="text-gray-400 h-5 w-5" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64">
                <p className="text-gray-400 text-center">No results for "{searchQuery.trim()}"</p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-gray-400 text-center">Type to search recipes and ingredients</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
