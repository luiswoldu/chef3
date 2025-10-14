"use client"

import { useState, useEffect, MouseEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { trackRecipeCardView, trackRecipeCardTap } from "@/lib/supabase/track"
import { showNotification } from '@/hooks/use-notification' // Add this import
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
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setIsAdded(false)
        return
      }

      // Check if this recipe is in the grocery_items table for this user
      // This works for both user recipes and featured recipes since we use recipe_id
      const { data, error } = await supabase
        .from('grocery_items')
        .select('*')
        .eq('recipe_id', id)
        .eq('user_id', user.id)
        .limit(1)
      
      if (error) {
        console.error('Error checking grocery items:', error)
        return
      }
      
      // If we got data back (array with length > 0), the recipe is in the shopping list
      setIsAdded(data && data.length > 0)
    } catch (error) {
      console.error('Error in checkIfAdded:', error)
    }
  }

  const addToCart = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error('User not authenticated:', userError)
        showNotification("Please log in to add items to cart")
        return
      }

      let recipeIngredients: any[] = []
      let recipeFound = false

      // First try to find recipe in user recipes table
      const { data: userRecipe, error: userRecipeError } = await supabase
        .from('recipes')
        .select(`
          *,
          ingredients (*)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single()
      
      if (!userRecipeError && userRecipe) {
        recipeIngredients = userRecipe.ingredients || []
        recipeFound = true
        console.log('Found user recipe with ingredients:', recipeIngredients.length)
      } else {
        // If not found in user recipes, try featured_library
        // First try by recipe_id, then by id (matching RecipeDetailClient logic)
        let { data: featuredRecipe, error: featuredRecipeError } = await supabase
          .from('featured_library')
          .select('*')
          .eq('recipe_id', id)
          .single()
        
        // If not found by recipe_id, try by id (in case it's a standalone featured recipe)
        if (featuredRecipeError && featuredRecipeError.code === 'PGRST116') {
          const { data: featuredById, error: featuredByIdError } = await supabase
            .from('featured_library')
            .select('*')
            .eq('id', id)
            .single()
          
          if (!featuredByIdError && featuredById) {
            featuredRecipe = featuredById
            featuredRecipeError = null
          }
        }
        
        if (!featuredRecipeError && featuredRecipe) {
          // For featured recipes, get ingredients from ingredients table
          // Use the correct recipe_id from the featured recipe data
          const ingredientRecipeId = featuredRecipe.recipe_id || featuredRecipe.id
          const { data: ingredientsData, error: ingredientsError } = await supabase
            .from('ingredients')
            .select('*')
            .eq('recipe_id', ingredientRecipeId)
          
          if (!ingredientsError && ingredientsData) {
            recipeIngredients = ingredientsData
            recipeFound = true
            console.log('Found featured recipe with ingredients:', recipeIngredients.length)
          }
        }
      }
      
      if (!recipeFound) {
        console.error('Recipe not found')
        showNotification("Recipe not found")
        return
      }
      
      if (!recipeIngredients || recipeIngredients.length === 0) {
        console.error('No ingredients found for this recipe')
        showNotification("No ingredients found for this recipe")
        return
      }
      
      // Insert ingredients as grocery items with user_id
      const groceryItems = recipeIngredients.map((ing: any) => ({
        user_id: user.id,
        name: ing.name,
        amount: ing.amount,
        aisle: "Other",
        purchased: false,
        recipe_id: Number(id),
        details: ing.details || "",
        created_at: new Date().toISOString()
      }))
      
      const { error } = await supabase
        .from('grocery_items')
        .insert(groceryItems)
      
      if (error) {
        console.error('Error adding to grocery items:', error)
        showNotification("Failed to add ingredients to cart")
        return
      }
      
      // Track recipe save
      supabase
        .from('recipe_interactions')
        .insert({
          user_id: user.id,
          recipe_id: id,
          interaction_type: 'save'
        })
        .then(() => {})
      
      setIsAdded(true)
      showNotification("Added to cart")
    } catch (error) {
      console.error('Error in addToCart:', error)
      showNotification("Failed to add ingredients to cart")
    }
  }

  const getCardStyles = () => {
    switch (cardType) {
      case 'hero':
        return 'w-full h-full'
      case 'thumbnail':
        return 'w-36 md:w-48 lg:w-48 aspect-[1/2]' // 2:1 aspect ratio for thumbnails
      case 'square':
        return 'max-w-sm aspect-square' // 1:1 aspect ratio for square cards
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
          priority={cardType === 'hero'} // Add priority for hero images (LCP optimization)
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
                ? 'text-[28px] tracking-[-0.04em] font-extrabold px-3 py-5' // controls hero title padding y 6 = 24px
                : cardType === 'thumbnail'
                ? 'text-base font-bold tracking-tight'
                : 'text-lg font-bold'
                } px-3 py-3 w-full`} // controls thumbnail text
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