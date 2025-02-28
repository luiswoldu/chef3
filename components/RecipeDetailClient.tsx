'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Recipe } from '../lib/db'
import RecipeCard from './RecipeCard'
import { db } from '../lib/db'
import { supabase } from '../lib/supabaseClient'
import { useToast } from '@/hooks/use-toast'

interface RecipeDetailClientProps {
  id: string | number  // Allow for both string and number types
}

export default function RecipeDetailClient({ id }: RecipeDetailClientProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdded, setIsAdded] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function loadRecipe() {
      try {
        const recipeId = typeof id === 'string' ? Number.parseInt(id) : id;
        
        // Get recipe
        const { data: recipeData, error: recipeError } = await supabase
          .from('recipes')
          .select('*')
          .eq('id', recipeId)
          .single()
        
        if (recipeError) throw recipeError
        setRecipe(recipeData)
        
        // Check if recipe is in cart
        const { data: cartItems, error: cartError } = await supabase
          .from('grocery_items')
          .select('id')
          .eq('recipe_id', recipeId)
        
        if (cartError) throw cartError
        setIsAdded(cartItems.length > 0)
      } catch (error) {
        console.error('Loading error:', error)
        setError('Failed to load recipe.')
      } finally {
        setLoading(false)
      }
    }

    loadRecipe()
  }, [id])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>{error}</div>
  }

  if (!recipe) {
    return <div>Recipe not found</div>
  }

  return (
    <div className="flex flex-col min-h-screen">
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
      <button 
        onClick={async (e) => {
          e.preventDefault()
          e.stopPropagation()
          try {
            const recipeId = typeof id === 'string' ? Number.parseInt(id) : id
            const groceryItems = recipe.ingredients.map((ing) => ({
              name: ing.ingredient,
              amount: ing.amount,
              aisle: "Other",
              purchased: false,
              recipe_id: recipeId, // Note: Changed from recipeId to recipe_id to match Supabase schema
            }))
            
            const { error } = await supabase
              .from('grocery_items')
              .insert(groceryItems)
            
            if (error) throw error
            
            setIsAdded(true)
            toast({
              title: "Added to cart",
              description: "Ingredients have been added to your shopping list",
            })
          } catch (error) {
            console.error('Error adding to cart:', error)
            toast({
              title: "Error",
              description: "Failed to add ingredients to cart",
            })
          }
        }} 
        className="absolute top-4 right-4 z-20 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow duration-300"
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
      <div className="relative w-full h-[56.4vh]">
        <Image 
          src={recipe.image || "/placeholder.svg"} 
          alt={recipe.title} 
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
      </div>
      <div className="p-4">
        <div className="mb-2">
          <h1 className="text-2xl font-bold">{recipe.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {recipe.tags.map((tag) => (
            <span 
              key={tag} 
              className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-[#DFE0E1] text-gray-800"
            >
              {tag}
            </span>
          ))}
        </div>
        {recipe.caption ? (
          <p className="text-[15px] text-gray-600 mb-6 line-clamp-2">{recipe.caption}</p>
        ) : (
          <p className="text-[15px] text-gray-400 mb-6 italic">No caption provided.</p>
        )}
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Ingredients</h2>
          <div className="rounded-lg">
            {recipe.ingredients.map((ingredient, index) => (
              <div key={index} className="bg-white p-3 rounded-md shadow mb-2">
                <p className="font-medium">{ingredient.ingredient}</p>
                <p className="text-sm text-gray-600">
                  {ingredient.amount} {ingredient.details}
                </p>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">Steps</h2>
          <ol className="list-decimal list-inside space-y-4">
            {recipe.steps.map((step, index) => (
              <li key={index} className="pl-2">
                {step}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  )
} 