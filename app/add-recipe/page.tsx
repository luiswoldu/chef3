"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { db, Recipe } from "../../lib/db"
import { useToast } from "../../hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function AddRecipe() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [title, setTitle] = useState("")
  const [image, setImage] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [steps, setSteps] = useState<string[]>([])

  const handleAddRecipe = async () => {
    setLoading(true)
    try {
      await db.recipes.add({
        title,
        image,
        tags,
        ingredients,
        steps,
      })
      toast({
        title: "Recipe Added",
        description: `You have successfully added "${title}".`,
      })
      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to add recipe. Please try again.",
        variant: "destructive",
      })
      console.error("Error adding recipe:", error)
    } finally {
      setLoading(false)
    }
  }

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
      <div className="flex flex-col items-center justify-center mt-10 space-y-6">
        <div className="w-full max-w-xs">
          <Input
            type="text"
            placeholder="Recipe Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-12 rounded-xl bg-blue-50 border-blue-100 focus:border-blue-200 focus:ring-blue-200 text-gray-800 placeholder:text-gray-500"
          />
        </div>
        <Button
          variant="outline"
          className="w-full max-w-xs h-12 rounded-full bg-white text-blue-500 border-none shadow-sm"
          onClick={handleAddRecipe}
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Recipe"}
        </Button>
      </div>
    </div>
  )
}

