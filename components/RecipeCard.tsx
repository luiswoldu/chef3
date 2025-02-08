"use client"

import { useState, useEffect, MouseEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { db, type GroceryItem, Recipe } from "../lib/db"

interface Ingredient {
  ingredient: string
  amount: string
}

interface RecipeCardProps {
  id: string
  title: string
  image: string
  isHero?: boolean
  backgroundColor?: string
  showAddButton?: boolean
}

export default function RecipeCard({
  id,
  title,
  image,
  isHero = false,
  backgroundColor = "#f3f4f6", // default gray-100
  showAddButton = true,
}: RecipeCardProps) {
  const [isAdded, setIsAdded] = useState(false)

  useEffect(() => {
    checkIfAdded()
  }, [])

  const checkIfAdded = async () => {
    const recipe = await db.recipes.get(Number.parseInt(id))
    if (recipe) {
      const groceryItems = await db.groceryItems.where("recipeId").equals(Number.parseInt(id)).toArray()
      setIsAdded(groceryItems.length > 0)
    }
  }

  const addToCart = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const recipe = await db.recipes.get(Number.parseInt(id))
    if (recipe) {
      const groceryItems: GroceryItem[] = recipe.ingredients.map((ing: Ingredient) => ({
        name: ing.ingredient,
        amount: ing.amount,
        aisle: "Other",
        purchased: false,
        recipeId: Number.parseInt(id),
      }))
      await db.groceryItems.bulkAdd(groceryItems)
      setIsAdded(true)
    }
  }

  return (
    <Link href={`/recipes/${id}`}>
      <div className={`relative ${isHero ? "w-full h-full" : "w-full aspect-[3/4]"}`} style={{ backgroundColor }}>
        <Image src={image || "/placeholder.svg"} alt={title} layout="fill" objectFit="cover" />
        <div className="absolute inset-0 bg-black bg-opacity-30" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-bold text-lg">{title}</h3>
        </div>
        {showAddButton && (
          <button className="absolute top-4 right-4 bg-white rounded-full p-1" onClick={addToCart}>
            {isAdded ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            )}
          </button>
        )}
      </div>
    </Link>
  )
}

