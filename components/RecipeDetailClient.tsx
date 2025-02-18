'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Recipe } from '../lib/db'
import RecipeCard from './RecipeCard'
import { db } from '../lib/db'

interface RecipeDetailClientProps {
  id: string | number  // Allow for both string and number types
}

export default function RecipeDetailClient({ id }: RecipeDetailClientProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdded, setIsAdded] = useState(false)

  useEffect(() => {
    async function loadRecipe() {
      console.log('=== Debug Start ===');
      try {
        const recipeId = typeof id === 'string' ? Number.parseInt(id) : id;
        console.log('1. Attempting to load recipe with ID:', recipeId);

        // First check database state
        const dbState = await db.recipes.count();
        console.log('2. Number of recipes in database:', dbState);

        // Try to get all recipes
        const allRecipes = await db.recipes.toArray();
        console.log('3. First recipe in database:', allRecipes[0]);
        
        // Now get our specific recipe
        const data = await db.recipes.get(recipeId);
        console.log('4. Retrieved recipe:', data);
        console.log('5. Recipe caption:', data?.caption);
        
        setRecipe(data || null);
        
        // Check if recipe is already in cart
        const groceryItems = await db.groceryItems.where("recipeId").equals(recipeId).toArray();
        setIsAdded(groceryItems.length > 0);
      } catch (error) {
        console.error('Loading error:', error);
        setError('Failed to load recipe.');
      } finally {
        console.log('=== Debug End ===');
        setLoading(false);
      }
    }

    loadRecipe();
  }, [id]);

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
          e.preventDefault();
          e.stopPropagation();
          const groceryItems = recipe.ingredients.map((ing) => ({
            name: ing.ingredient,
            amount: ing.amount,
            aisle: "Other",
            purchased: false,
            recipeId: typeof id === 'string' ? Number.parseInt(id) : id,
          }));
          await db.groceryItems.bulkAdd(groceryItems);
          setIsAdded(true);
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