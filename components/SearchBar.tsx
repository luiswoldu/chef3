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
      <div className="absolute top-0 left-0 right-0 z-10 p-4" style={{
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 100%)'
      }}>
        <div className="flex items-center gap-3 mt-6 w-full max-w-[488px] mx-auto">
          <button
            onClick={handleAddRecipe}
            className="w-[42px] h-[42px] rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-r"
            style={{ background: "linear-gradient(90deg, #A6E964 0%, #6CD401 100%)" }}
          >
            <Plus className="h-6 w-6 text-white" />
          </button>
          <motion.div
            className="flex flex-grow items-center bg-[#ffffff]/50 backdrop-blur-[4px] rounded-full px-4 py-2 text-white cursor-pointer"
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
            <span className="pl-3 font-medium">Search</span>
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

