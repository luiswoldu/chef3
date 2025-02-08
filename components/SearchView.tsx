"use client"

import { ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

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

  // This would typically come from a database or local storage
  const recentSearches: SearchItem[] = [
    { name: "Cilantro", category: "Ingredient", type: "Herb" },
    { name: "Red chili pepper", category: "Ingredient", type: "Spice" },
    { name: "Soybeans", category: "Ingredient", type: "Protein" },
    { name: "Mango", category: "Ingredient", type: "Fruit" },
  ]

  const handleSearch = (query: string) => {
    // Implement search logic here
    router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  const handleCancel = () => {
    onCancel()
    router.push("/")
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="flex flex-col h-full">
        {/* Search Header */}
        <div className="p-4 flex items-center">
          <div className="flex-1 flex items-center bg-[#333333] rounded-full px-4 py-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              className="flex-1 bg-transparent text-white pl-3 focus:outline-none"
              placeholder="Search"
              autoFocus
            />
          </div>
          <button onClick={handleCancel} className="text-white text-lg">
            Cancel
          </button>
        </div>

        {/* Recent Searches */}
        <div className="flex-1 overflow-auto px-4">
          <h2 className="text-white text-4xl font-bold mb-6">Recent</h2>
          <div className="space-y-6">
            {recentSearches.map((item, index) => (
              <button
                key={index}
                className="w-full flex items-center justify-between text-left"
                onClick={() => handleSearch(item.name)}
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
        </div>
      </div>
    </div>
  )
}

