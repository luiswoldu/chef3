import { X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type ChatHistoryProps = {
  isOpen: boolean
  onClose: () => void
}

export default function ChatHistory({ isOpen, onClose }: ChatHistoryProps) {
  const chatHistory = [
    { id: 1, title: "Pasta recipes with tomatoes" },
    { id: 2, title: "Vegan dessert ideas" },
    { id: 3, title: "Quick breakfast options" },
    { id: 4, title: "Mexican dinner recipes" },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-40"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 h-[70vh] bg-white shadow-2xl z-50 flex flex-col rounded-t-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <h2 className="text-lg font-semibold">Chats</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto p-4">
              {chatHistory.length === 0 ? (
                <p className="text-center text-gray-500 mt-8">
                  No chat history yet
                </p>
              ) : (
                <div className="space-y-2">
                  {chatHistory.map((chat) => (
                    <button
                      key={chat.id}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <p className="text-sm font-medium line-clamp-2">
                        {chat.title}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}