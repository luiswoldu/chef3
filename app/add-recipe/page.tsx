"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { db, Recipe } from "../../lib/db"
import { fetchRecipeByName } from "@/lib/api"
import { useToast } from "../../hooks/use-toast"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AddRecipe() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  return (
    <div className="min-h-screen bg-white p-4">
      {/* Header */}
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-gray-600">
          <ChevronLeft className="h-5 w-5" />
          <span className="ml-1">Back</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center mt-20">
        <Button
          variant="outline"
          className="w-full max-w-xs h-12 rounded-full bg-white text-blue-500 border-none shadow-sm"
          onClick={() => {/* Handle paste link */}}
          disabled={loading}
        >
          Paste Link
        </Button>
      </div>
    </div>
  )
}

