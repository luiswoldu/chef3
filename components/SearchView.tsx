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
    // router.push("/")
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

  const hasResults = searchResults.recipes.length > 0

  return (
    <div className="fixed inset-0 bg-white z-50">
      <div className="flex flex-col h-full">
        {/* Search Header */}
        <div className="p-4 flex items-center mt-8">
          <div className="flex-1 flex items-center bg-chef-grey-calcium rounded-full px-4 py-2">
            {isSearching ? (
              <Loader className="w-5 h-5 text-black animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-black" />
            )}
            <input
              type="text"
              className="flex-1 bg-transparent text-black pl-3 focus:outline-none placeholder-chef-grey"
              placeholder="Search recipes"
              autoFocus
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            {searchQuery.trim() && (
              <button
                onClick={handleClear}
                className="ml-2 text-black"
                aria-label="Clear search"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <button
            onClick={handleCancel}
            className="text-black ml-3"
          >
            Cancel
          </button>
        </div>

        {/* Results Content */}
        <div className="flex-1 overflow-auto px-4 pb-4">
          {isSearching ? (
            <div className="flex justify-center items-center h-32">
              <Loader className="h-8 w-8 text-black animate-spin" />
            </div>
          ) : searchQuery.trim() ? (
            hasResults ? (
              <div className="space-y-8">
                {/* Recipes Section */}
                {searchResults.recipes.length > 0 && (
                  <div>
                    <div className="space-y-4">
                      {searchResults.recipes.map((recipe, idx) => (
                        <button
                          key={`recipe-${idx}`}
                          className="w-full flex items-center justify-between text-left p-3 bg-chef-grey-calcium rounded-xl hover:bg-gray-100"
                          onClick={() => handleItemClick(recipe)}
                        >
                          <div>
                            <h3 className="text-black text-lg leading-tight">{recipe.name}</h3>
                          </div>
                          <ChevronRight className="text-chef-grey-graphite h-5 w-5" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64">
                <p className="text-chef-grey-iron text-center">No results for "{searchQuery.trim()}"</p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-chef-grey-iron text-center">Type to search recipes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}