'use client'

import { useEffect, useState, Fragment } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Dialog, Transition } from '@headlessui/react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Trash2, Loader } from 'lucide-react'
import Navigation from '@/components/Navigation'
import { supabase } from '@/lib/supabase/client'
import { showNotification } from '@/hooks/use-notification'
import type { Database } from '@/types/supabase'

interface RecipeIngredient {
  id: number;
  recipe_id: number;
  name: string;
  amount: string;
  details: string;
  created_at: string;
  updated_at: string;
}

type Recipe = Database['public']['Tables']['recipes']['Row'] & {
  ingredients?: RecipeIngredient[];
}

interface RecipeDetailClientProps {
  id: string | number
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
        setLoading(true)
        const recipeIdNumber = typeof id === 'string' ? parseInt(id) : id

        const { data: featuredRecipe } = await supabase
          .from('featured_library')
          .select('*')
          .eq('id', recipeIdNumber)
          .single()

        let recipeData = null

        if (featuredRecipe) {
          recipeData = {
            ...featuredRecipe,
            title: featuredRecipe.title && featuredRecipe.title.trim() !== '' 
              ? featuredRecipe.title 
              : featuredRecipe.searchable_title ?? '',
            ingredients: featuredRecipe.ingredients || [],
          }
        } else {
          const { data: userRecipe } = await supabase
            .from('recipes')
            .select('*')
            .eq('id', recipeIdNumber)
            .single()
          if (userRecipe) recipeData = { ...userRecipe, ingredients: userRecipe.ingredients || [] }
        }

        if (!recipeData) {
          setError('Recipe not found')
          return
        }

        setRecipe(recipeData)
      } catch (err) {
        console.error(err)
        setError('Failed to load recipe')
      } finally {
        setLoading(false)
      }
    }

    loadRecipe()
  }, [id])

  const handleDelete = async () => {
    try {
      const recipeId = typeof id === 'string' ? parseInt(id) : id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in to delete recipes')

      const { error: groceryError } = await supabase
        .from('grocery_items')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('user_id', user.id)
      if (groceryError) throw new Error('Failed to delete grocery items: ' + groceryError.message)

      const { error: ingredientsError } = await supabase
        .from('ingredients')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('user_id', user.id)
      if (ingredientsError) throw new Error('Failed to delete ingredients: ' + ingredientsError.message)

      const { error: recipeError } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId)
        .eq('user_id', user.id)
      if (recipeError) throw new Error('Failed to delete recipe: ' + recipeError.message)

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
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-10 w-10 animate-spin text-[#6CD401]" />
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center">
          <div>{error || "Recipe not found"}</div>
        </div>
        <Navigation />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 pb-20" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
        <Link href="/" className="absolute top-4 left-4 z-10 bg-white rounded-full p-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <button 
              onClick={async (e) => {
                e.preventDefault()
                e.stopPropagation()
                try {
                  const { data: { user }, error: userError } = await supabase.auth.getUser()
                  if (userError || !user) {
                    showNotification("Please log in to add items to cart")
                    return
                  }

                  const recipeIdNumber = typeof id === 'string' ? Number.parseInt(id) : id
                  const currentIngredients = recipe.ingredients?.filter(ing => ing.recipe_id === recipeIdNumber)
                  if (!currentIngredients || currentIngredients.length === 0) throw new Error('No ingredients found for this recipe')

                  const groceryItems = currentIngredients.map(ing => ({
                    user_id: user.id,
                    name: ing.name,
                    amount: ing.amount,
                    aisle: "Other",
                    purchased: false,
                    recipe_id: recipeIdNumber 
                  }))
                  
                  const { error } = await supabase.from('grocery_items').insert(groceryItems)
                  if (error) throw error

                  setIsAdded(true)
                  showNotification("Added to cart")
                } catch (error: any) {
                  console.error('Error adding to cart:', error?.message || error)
                  showNotification(error?.message || "Failed to add ingredients to cart")
                }
              }}
              className="bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow duration-300"
              aria-label={isAdded ? "Added to cart" : "Add to cart"}
            >
              {isAdded ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
            </button>
          )}
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
          <h1 className="text-2xl font-bold leading-[1.1] tracking-tight mb-3">{recipe.title}</h1>

          {/* Ingredients Section */}
          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Ingredients</h2>
            <div className="rounded-lg">
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                Array.isArray(recipe.ingredients) && recipe.ingredients.every(ing => typeof ing === 'string') ? (
                  recipe.ingredients.map((ingredientLine, index) => (
                    <div key={index} className="bg-white p-3 rounded-xl shadow-custom mb-2">
                      <p className="font-medium leading-tight tracking-tight">{ingredientLine}</p>
                    </div>
                  ))
                ) : (
                  recipe.ingredients.map((ingredient, index) => (
                    <div key={ingredient.id || index} className="bg-white p-3 rounded-xl shadow-custom mb-2">
                      <p className="font-medium leading-tight tracking-tight">{ingredient.name}</p>
                      <p className="text-sm text-[#9F9F9F]">{ingredient.amount}{ingredient.details ? ` ${ingredient.details}` : ''}</p>
                    </div>
                  ))
                )
              ) : (
                <div className="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-200">
                  <p className="text-gray-500 text-center italic">
                    Ingredient details not available for this recipe. Check the full recipe source for complete ingredient information.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Steps Section */}
          <section>
            <h2 className="text-2xl font-semibold">Steps</h2>
            <div className="space-y-1">
              {recipe.steps && recipe.steps.map((step, index) => (
                <div key={index} className="py-2 px-3 text-base font-regular tracking-tight leading-1.4">{step}</div>
              ))}
            </div>
          </section>
        </div>
      </div>

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
                      className="flex items-center gap-2 w-full py-2 text-red-600 hover:bg-red-50 rounded-md"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-5 w-5" /> Delete
                    </button>
                    <button 
                      className="mt-2 w-full py-2 bg-gray-200 rounded-full"
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
