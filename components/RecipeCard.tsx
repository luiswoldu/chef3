"use client"

import { useState, useEffect, MouseEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import type { Recipe } from "@/types"

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
  cardType: 'hero' | 'square' | 'thumbnail'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
}

export default function RecipeCard({
  id,
  title,
  image,
  isHero = false,
  backgroundColor = "#f3f4f6", // default gray-100
  showAddButton = true,
  cardType = 'square', // default to square if not specified
  rounded = 'lg', // default to rounded-lg
}: RecipeCardProps) {
  const [isAdded, setIsAdded] = useState(false)
  const imageSrc = image && image.trim() !== "" ? image : "/placeholder2.jpg"

  useEffect(() => {
    checkIfAdded()
    // Don't track views on mount - only track actual clicks
    // View tracking will be handled by RecipeDetailClient when recipe is actually viewed
  }, [id])

  const checkIfAdded = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // Check if this recipe is in the grocery_items table for this user
      const { data, error } = await supabase
        .from('grocery_items')
        .select('*')
        .eq('recipe_id', id)
        .eq('user_id', user.id)
        .single()
      
      if (error) {
        // If the error is that no rows were returned, it means the recipe is not in the shopping list
        if (error.code === 'PGRST116') {
          setIsAdded(false)
          return
        }
        console.error('Error checking grocery items:', error)
        return
      }
      
      // If we got data back, the recipe is in the shopping list
      setIsAdded(!!data)
    } catch (error) {
      console.error('Error in checkIfAdded:', error)
    }
  }

  const addToCart = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('You must be logged in to add items to cart')
        return
      }
      
      // Try to get recipe from user's recipes first
      const { data: userRecipe, error: userRecipeError } = await supabase
        .from('recipes')
        .select(`
          *,
          ingredients (*)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single()
      
      let recipe = null
      let ingredients = []
      
      if (userRecipeError && userRecipeError.code === 'PGRST116') {
        // Recipe not found in user recipes, try featured_library
        const { data: featuredRecipe, error: featuredRecipeError } = await supabase
          .from('featured_library')
          .select('*')
          .eq('recipe_id', id)
          .single()
        
        if (featuredRecipeError) {
          console.error('Recipe not found in either recipes or featured_library:', featuredRecipeError)
          return
        }
        
        recipe = featuredRecipe
        // Featured recipes have ingredients as JSONB
        ingredients = featuredRecipe.ingredients || []
      } else if (userRecipeError) {
        console.error('Error fetching user recipe:', userRecipeError)
        return
      } else {
        recipe = userRecipe
        ingredients = userRecipe.ingredients || []
      }
      
      if (!ingredients || ingredients.length === 0) {
        console.error('No ingredients found for this recipe')
        return
      }
      
      const groceryItems = ingredients.map((ing: any) => ({
        name: ing.name || ing.ingredient,
        amount: ing.amount,
        aisle: "Other",
        purchased: false,
        recipe_id: Number(id),
        user_id: user.id,
      }))
      
      const { error } = await supabase
        .from('grocery_items')
        .insert(groceryItems)
      
      if (error) {
        console.error('Error adding to grocery items:', error)
        return
      }
      
      setIsAdded(true)
    } catch (error) {
      console.error('Error in addToCart:', error)
    }
  }

  const getCardStyles = () => {
    switch (cardType) {
      case 'hero':
        return 'w-full h-full'
      case 'thumbnail':
        return 'w-36 md:w-48 lg:w-48 aspect-[1/2]'
      case 'square':
        return 'max-w-sm aspect-square'
      default:
        return 'max-w-sm aspect-square'
    }
  }

  const getRoundedClass = () => {
    switch (rounded) {
      case 'none':
        return 'rounded-none'
      case 'sm':
        return 'rounded-sm'
      case 'md':
        return 'rounded-md'
      case 'lg':
        return 'rounded-lg'
      case 'xl':
        return 'rounded-xl'
      case '2xl':
        return 'rounded-2xl'
      case '3xl':
        return 'rounded-3xl'
      case 'full':
        return 'rounded-full'
      default:
        return 'rounded-lg'
    }
  }

  return (
    <div
      className={`relative overflow-hidden ${getRoundedClass()} ${getCardStyles()}`}
      style={{ backgroundColor }}
    >
      <Link 
        href={`/recipe/${id}`} 
        className="block w-full h-full"
      >
        <Image
          src={imageSrc}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className={`object-cover transition-transform duration-300 ease-in-out transform hover:scale-105 ${
            cardType === 'thumbnail' ? 'object-center' : 'object-cover'
          }`}
          onError={(e) => {
            e.currentTarget.src = "/placeholder.png"
          }}
        />
        <div className="absolute inset-0 flex items-end justify-start">
          <h2 
            className={`text-white leading-[1.1] ${
              cardType === 'hero' 
                ? 'text-[28px] tracking-[-0.04em] font-extrabold px-3 py-5'
                : cardType === 'thumbnail'
                ? 'text-base font-bold tracking-tight'
                : 'text-lg font-bold'
                } px-3 py-3 w-full`}
            style={{ 
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)'
            }}
          >
            {title}
          </h2>
        </div>
      </Link>
      {showAddButton && (
        <button
          className={`absolute ${isHero ? 'bottom-4' : 'top-3'} right-3 bg-white rounded-full p-1 shadow-md hover:shadow-lg transition-shadow duration-300`}
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