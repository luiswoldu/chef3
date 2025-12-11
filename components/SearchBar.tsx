import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { User, Sparkle } from "lucide-react"
import { sfSparkle } from "@bradleyhodges/sfsymbols";
import { SFIcon } from "@bradleyhodges/sfsymbols-react";

export default function SearchBar() {
  const router = useRouter()

  const openAskPage = () => {
    router.push("/ask")
  }

  return (
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
          onClick={openAskPage}
          className="relative flex flex-grow items-center bg-[#ffffff]/50 backdrop-blur-[4px] rounded-full px-4 py-2.5 text-white cursor-pointer select-none"
          initial={false}
        >
          <span className="font-medium">Ask</span>

          {/* AI Sparkle Indicator */}
          <button
            aria-label="AI Search"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-transparent rounded-full flex items-center justify-center transition-transform"
            style={{ padding: "6px" }}
            onClick={openAskPage}
          >
      <SFIcon icon={sfSparkle}
              className="w-4 h-4 transition-colors"
              fill="#FFFFFF"
              color="#FFFFFF"
            />
          </button>
        </motion.div>
      </div>
    </div>
  )
}