"use client"

import { useState, useEffect, MouseEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { db, type GroceryItem, Recipe } from "../lib/db"

interface Ingredient {
  ingredient: string
  amount: string
  details: string
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
  const imageSrc = image && image.trim() !== "" ? image : "/placeholder2.jpg"

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
    <div
      className={`relative overflow-hidden ${isHero ? "w-full h-full" : "max-w-sm aspect-[9/16]"}`}
      style={{ backgroundColor }}
    >
      <Link href={`/recipes/${id}`} className="block w-full h-full">
      <Image
      src={imageSrc}
      alt={title}
     fill
     sizes="(max-width: 768px) 100vw, 50vw"
     className="object-cover transition-transform duration-300 ease-in-out transform hover:scale-105"
     onError={(e) => {
    e.currentTarget.src = "/placeholder.png"
  }}
/>
        <div className="absolute inset-0 flex items-end justify-start">
          <h2 
            className="text-white text-lg font-bold px-4 py-3 w-full" 
            style={{ 
              textShadow: '0px 0px 5px rgba(0, 0, 0, 0.7)',
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)'
            }}
          >
            {title}
          </h2>
        </div>
      </Link>
      {showAddButton && (
        <button
          className="absolute top-4 right-4 bg-white rounded-full p-1 shadow-md hover:shadow-lg transition-shadow duration-300"
          onClick={addToCart}
          aria-label={isAdded ? "Added to cart" : "Add to cart"}
        >
          {isAdded ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-green-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-700"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          )}
        </button>
      )}
    </div>
  )
}

