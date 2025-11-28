import { useState } from "react"
import { useRouter } from "next/navigation"
import SearchView from "./SearchView"
import { motion, AnimatePresence } from "framer-motion"
import { User, Sparkle } from "lucide-react"

export default function SearchBar() {
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()

  const handleCancel = () => {
    setIsSearching(false)
  }

  return (
    <>
      <div
        className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10 p-4 w-full max-w-lg mx-auto"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 100%)",
        }}
      >
        <div className="flex items-center gap-3 mt-3 w-full">
          {/* Profile Button */}
          <button
            onClick={() => router.push("/profile")}
            className="w-[42px] h-[42px] rounded-full flex items-center justify-center flex-shrink-0 bg-white"
          >
            <User className="h-6 w-6 text-black" />
          </button>

          {/* Ask Input Area */}
          <motion.div
            className="relative flex flex-grow items-center bg-[#ffffff]/50 backdrop-blur-[4px] rounded-full px-4 py-2.5 text-white cursor-pointer"
            style={{ width: isSearching ? "81%" : "87%" }}
            animate={{
              width: isSearching ? "81%" : "87%",
            }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsSearching(true)}
          >
            {/* Removed Search Icon */}
            <span className="font-medium">Ask</span>

            {/* AI Toggle Button */}
            <button
              aria-label="AI Search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-transparent background-blur-[4px] rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{ padding: "6px" }}
            >
              <Sparkle
                className="w-6 h-6 transition-colors"
                fill="#FFFFFF"
                color="#FFFFFF"
              />
            </button>
          </motion.div>

          {/* Cancel Button */}
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

      {/* Search View Overlay */}
      {isSearching && <SearchView onCancel={handleCancel} />}
    </>
  )
}
