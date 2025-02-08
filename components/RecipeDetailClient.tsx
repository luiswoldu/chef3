'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Recipe } from '../lib/db'
import RecipeCard from './RecipeCard'
import { db } from '../lib/db'

interface RecipeDetailClientProps {
  id: string
}

export default function RecipeDetailClient({ id }: RecipeDetailClientProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadRecipe() {
      try {
        const data = await db.recipes.get(Number.parseInt(id))
        setRecipe(data || null)
      } catch (error) {
        console.error('Failed to load recipe:', error)
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
      <div className="relative w-full aspect-video">
        <Image 
          src={recipe.image || "/placeholder.svg"} 
          alt={recipe.title} 
          fill
          style={{ objectFit: 'cover' }}
        />
      </div>
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold">{recipe.title}</h1>
          <RecipeCard 
            id={id} 
            title={recipe.title} 
            image={recipe.image} 
            showAddButton={true} 
          />
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {recipe.tags.map((tag) => (
            <span key={tag} className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">
              {tag}
            </span>
          ))}
        </div>
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Ingredients</h2>
          <div className="bg-gray-100 p-4 rounded-lg">
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