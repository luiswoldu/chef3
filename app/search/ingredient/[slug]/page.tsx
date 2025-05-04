import { getRecipesByIngredient } from '@/lib/supabase/server'
import RecipeCard from '@/components/RecipeCard'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const decodedIngredient = decodeURIComponent(resolvedParams.slug)
  const recipes = await getRecipesByIngredient(decodedIngredient)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link
          href="/search"
          className="mr-2 p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-white" />
        </Link>
        <h1 className="text-2xl font-bold text-white">
          Recipes with <span className="text-green-400">{decodedIngredient}</span>
        </h1>
      </div>
      
      {recipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              id={recipe.id.toString()}
              title={recipe.title}
              image={recipe.image || ''}
              cardType="square"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center mt-12 py-10 px-4 bg-zinc-900/50 rounded-lg">
          <p className="text-gray-400 text-center text-lg mb-6">
            No recipes found with "{decodedIngredient}"
          </p>
          <Link 
            href="/"
            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors"
          >
            Back to Home
          </Link>
        </div>
      )}
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  return {
    title: `Recipes with ${decodeURIComponent(resolvedParams.slug)} | Chef3`,
    description: `Find recipes that include ${decodeURIComponent(resolvedParams.slug)}`,
  }
} 