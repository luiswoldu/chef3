"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ArrowUp } from "lucide-react"
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
      <div className="flex flex-col items-center justify-center mt-10">
        <div className="w-full max-w-xs flex items-center gap-2">
          <Input
            type="text"
            placeholder="Paste Link"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-12 rounded-full bg-blue-50 border-blue-100 focus:border-blue-200 focus:ring-blue-200 text-gray-800 placeholder:text-gray-500"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleAddRecipe}
            disabled={loading}
            className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-500 text-white border-none hover:bg-blue-600"
          >
            <ArrowUp className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}

