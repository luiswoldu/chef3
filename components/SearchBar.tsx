"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import SearchView from "./SearchView"
import { motion, AnimatePresence } from "framer-motion"
import { Plus } from "lucide-react"

export default function SearchBar() {
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()

  const handleCancel = () => {
    setIsSearching(false)
  }

  const handleAddRecipe = () => {
    router.push("/add-recipe")
  }

  return (
    <>
      <div className="absolute top-0 left-0 right-0 z-10 p-4 backdrop-blur-[10px]">
        <div className="flex items-center gap-3">
          <button
            onClick={handleAddRecipe}
            className="w-[42px] h-[42px] bg-green-500 rounded-full flex items-center justify-center flex-shrink-0"
          >
            <Plus className="h-6 w-6 text-white" />
          </button>
          <motion.div
            className="flex items-center bg-[#333333] bg-opacity-80 rounded-full px-4 py-2 text-gray-400 cursor-pointer"
            style={{ width: isSearching ? "81%" : "87%" }}
            animate={{
              width: isSearching ? "81%" : "87%",
            }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsSearching(true)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="pl-3">Search</span>
          </motion.div>
          <AnimatePresence>
            {isSearching && (
              <motion.button
                className="text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={handleCancel}
              >
                Cancel
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
      {isSearching && <SearchView onCancel={handleCancel} />}
    </>
  )
}

