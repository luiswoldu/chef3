"use client"

import { ChevronRight, Loader2, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

interface SearchItem {
  name: string
  category: string
  type: string
}

interface SearchViewProps {
  onCancel: () => void
}

export default function SearchView({ onCancel }: SearchViewProps) {
  const router = useRouter()
  const [recentSearches, setRecentSearches] = useState<SearchItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchingInProgress, setSearchingInProgress] = useState(false)

  useEffect(() => {
    const fetchRecentSearches = async () => {
      try {
        const { data, error } = await supabase
          .from('search_history')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(4)

        if (error) {
          console.error('Error fetching recent searches:', error)
          return
        }

        if (data) {
          setRecentSearches(data)
        }
      } catch (error) {
        console.error('Error in fetchRecentSearches:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecentSearches()
  }, [])

  const handleSearch = async (query: string) => {
    if (!query.trim()) return
    
    try {
      setSearchingInProgress(true)
      
      // Save the search to history
      await supabase
        .from('search_history')
        .insert([
          { 
            name: query,
            category: 'Search',
            type: 'Query',
            created_at: new Date().toISOString()
          }
        ])

      // Navigate to search results
      router.push(`/search?q=${encodeURIComponent(query)}`)
    } catch (error) {
      console.error('Error saving search:', error)
      // Still navigate even if saving fails
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
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

  const handleSearchButtonClick = () => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery.trim())
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="flex flex-col h-full">
        {/* Search Header */}
        <div className="p-4 flex items-center mt-8">
          <div className="flex-1 flex items-center bg-[#ffffff]/50 backdrop-blur-[4px] rounded-full px-4 py-2">
            {searchingInProgress ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
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
              disabled={searchingInProgress}
            />
            {searchQuery.trim() && !searchingInProgress && (
              <button
                onClick={handleSearchButtonClick}
                className="ml-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm"
              >
                Search
              </button>
            )}
          </div>
          <button 
            onClick={handleCancel} 
            className="text-white ml-3"
            disabled={searchingInProgress}
          >
            Cancel
          </button>
        </div>

        {/* Recent Searches */}
        <div className="flex-1 overflow-auto px-4">
          <h2 className="text-white text-4xl font-bold mb-6">Recent</h2>
          {isLoading ? (
            <div className="space-y-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="w-full flex items-center justify-between text-left animate-pulse">
                  <div className="w-3/4">
                    <div className="h-6 bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 w-6 bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : recentSearches.length > 0 ? (
            <div className="space-y-6">
              {recentSearches.map((item, index) => (
                <button
                  key={index}
                  className="w-full flex items-center justify-between text-left"
                  onClick={() => handleSearch(item.name)}
                  disabled={searchingInProgress}
                >
                  <div>
                    <h3 className="text-white text-xl mb-1">{item.name}</h3>
                    <p className="text-gray-400">
                      {item.category} • {item.type}
                    </p>
                  </div>
                  <ChevronRight className="text-gray-400 h-6 w-6" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No recent searches</p>
          )}
        </div>
      </div>
    </div>
  )
}

