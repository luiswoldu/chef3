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
  const [ingredients, setIngredients] = useState<string[]>([])
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
    <div className="min-h-screen bg-black p-4">
      <Link href="/" className="absolute top-4 left-4 z-10 bg-white rounded-full p-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Link>

      <div className="fixed top-[355px] bottom-[405px] left-0 right-0 flex items-center justify-center px-4">
        <div className="relative w-[224px]">
          <Input
            type="text"
            placeholder="Paste Link"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-[54px] rounded-full bg-[#409CFF] border-[#409CFF] focus:border-[#409CFF] focus:ring-[#409CFF] text-white placeholder:text-white text-center pr-12 text-xl placeholder:text-xl placeholder:font-normal"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleAddRecipe}
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white text-[#409CFF] border-none hover:bg-white/90"
          >
            <ArrowUp className="h-5 w-5 stroke-[3]" />
          </Button>
        </div>
      </div>
    </div>
  )
}

