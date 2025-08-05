'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import type { Database } from '@/types/supabase'
import RecipeCard from './RecipeCard'
import { supabase } from '@/lib/supabase/client'
import { showNotification } from '@/hooks/use-notification'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Edit2, Trash2 } from 'lucide-react'
import Navigation from '@/components/Navigation' // Add this import

// Define ingredient interface that matches what we get from the database
interface RecipeIngredient {
  id: number;
  recipe_id: number;
  name: string;
  amount: string;
  details: string;
  created_at: string;
  updated_at: string;
}

// Use the database types
type Recipe = Database['public']['Tables']['recipes']['Row'] & {
  ingredients?: RecipeIngredient[];
}

interface RecipeDetailClientProps {
  id: string | number  // Allow for both string and number types
}

export default function RecipeDetailClient({ id }: RecipeDetailClientProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdded, setIsAdded] = useState(false)
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadRecipe() {
      try {
        const recipeId = typeof id === 'string' ? Number.parseInt(id) : id;
        
        // Get recipe
        const { data: recipeData, error: recipeError } = await supabase
          .from('recipes')
          .select(`
            *,
            ingredients (*)
          `)
          .eq('id', recipeId)
          .single()
        
        if (recipeError) {
          if (recipeError.code === 'PGRST116') {
            setError('Recipe not found')
            setRecipe(null)
          } else {
            throw recipeError
          }
          return
        }
        
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

  const handleDelete = async () => {
    try {
      const recipeId = typeof id === 'string' ? parseInt(id) : id

      // First delete grocery items
      const { error: groceryError } = await supabase
        .from('grocery_items')
        .delete()
        .eq('recipe_id', recipeId)

      if (groceryError) {
        throw new Error('Failed to delete grocery items: ' + groceryError.message)
      }

      // Then delete ingredients
      const { error: ingredientsError } = await supabase
        .from('ingredients')
        .delete()
        .eq('recipe_id', recipeId)

      if (ingredientsError) {
        throw new Error('Failed to delete ingredients: ' + ingredientsError.message)
      }

      // Finally delete the recipe
      const { error: recipeError } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId)

      if (recipeError) {
        throw new Error('Failed to delete recipe: ' + recipeError.message)
      }

      showNotification("Recipe deleted successfully")
      
      router.push('/')
    } catch (error) {
      console.error('Error in deletion process:', error)
      showNotification(error instanceof Error ? error.message : "Failed to delete recipe")
    } finally {
      setIsOptionsOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center">
          <div>Loading...</div>
        </div>
        <Navigation />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center">
          <div>{error}</div>
        </div>
        <Navigation />
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center">
          <div>Recipe not found</div>
        </div>
        <Navigation />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main content with bottom padding to account for tab bar */}
      <div className="flex-1 pb-20" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
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
        <div className="absolute top-4 right-4 z-20 flex gap-[0.75rem]">
          <button
            onClick={() => setIsOptionsOpen(true)}
            className="rounded-full p-2 backdrop-blur-[4px] bg-white/20 hover:bg-white/30 transition-all duration-300"
            aria-label="More options"
          >
            <MoreHorizontal className="h-6 w-6 text-white" />
          </button>
          <button 
            onClick={async (e) => {
              e.preventDefault()
              e.stopPropagation()
              try {
                const recipeId = typeof id === 'string' ? Number.parseInt(id) : id
                
                if (!recipe.ingredients || recipe.ingredients.length === 0) {
                  throw new Error('No ingredients found for this recipe')
                }
                
                const groceryItems = recipe.ingredients.map((ing: RecipeIngredient) => ({
                  name: ing.name,
                  amount: ing.amount,
                  aisle: "Other",
                  purchased: false,
                  recipe_id: recipeId,
                }))
                
                const { error } = await supabase
                  .from('grocery_items')
                  .insert(groceryItems)
                
                if (error) throw error
                
                setIsAdded(true)
                showNotification("Added to cart")
              } catch (error) {
                console.error('Error adding to cart:', error)
                showNotification("Failed to add ingredients to cart")
              }
            }} 
            className="bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow duration-300"
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
        </div>
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
            {recipe.tags && recipe.tags.map((tag: string, i: number) => {
              let tagClass = '';
              let tagStyle = {};
              if (i === 0) {
                tagClass = 'bg-[#6CD401] text-white';
              } else if (i === 1) {
                tagClass = 'text-white';
                tagStyle = { backgroundColor: '#98E14D' };
              } else {
                tagClass = 'text-[#6ED308]';
                tagStyle = { backgroundColor: '#F0FBE5' };
              }
              return (
                <span
                  key={`${tag}-${i}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${tagClass}`}
                  style={tagStyle}
                >
                  {tag}
                </span>
              );
            })}
          </div>
          {recipe.caption ? (
            <div className="relative mb-6">
              <p className={`text-[15px] text-gray-600 ${isExpanded ? '' : 'line-clamp-2'}`}>
                {recipe.caption}
              </p>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-[15px] font-medium text-gray-500 hover:text-gray-700 absolute bottom-0 right-0 pl-12 bg-gradient-to-l from-white via-white to-transparent"
              >
                {isExpanded ? 'Less' : 'More'}
              </button>
            </div>
          ) : (
            <p className="text-[15px] text-gray-400 mb-6 italic">No caption provided.</p>
          )}
          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Ingredients</h2>
            <div className="rounded-lg">
              {recipe.ingredients && recipe.ingredients.map((ingredient: RecipeIngredient, index: number) => (
                <div key={ingredient.id || index} className="bg-white p-3 rounded-xl shadow-custom mb-2">
                  <p className="font-medium">{ingredient.name}</p>
                  <p className="text-sm text-gray-600">
                    {ingredient.amount} {ingredient.details}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-2xl font-semibold mb-2">Steps</h2>
            <ol className="list-decimal list-inside space-y-1">
              {recipe.steps && recipe.steps.map((step: string, index: number) => (
                <li key={index} className="py-2 text-lg font-medium tracking-tight leading-normal">
                  {step}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      {/* Tab Bar Navigation */}
      <Navigation />

      <Transition.Root show={isOptionsOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setIsOptionsOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4"
                enterTo="opacity-100 translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-4"
              >
                <Dialog.Panel className="w-full transform rounded-t-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="space-y-4">
                    <button 
                      className="flex items-center gap-2 w-full py-2 hover:bg-gray-100 rounded-md"
                      onClick={() => {
                        router.push(`/recipes/${id}/edit`)
                        setIsOptionsOpen(false)
                      }}
                    >
                      <Edit2 className="h-5 w-5" /> Edit
                    </button>
                    <button
                      className="flex items-center gap-2 w-full py-2 text-red-600 hover:bg-red-50 rounded-md"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-5 w-5" /> Delete
                    </button>
                    <button 
                      className="mt-2 w-full py-2 bg-gray-200 rounded-md"
                      onClick={() => setIsOptionsOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  )
}