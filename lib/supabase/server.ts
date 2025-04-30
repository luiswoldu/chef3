import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { type Recipe } from '@/types'
import { Database } from '@/types/supabase'

// Get server-side Supabase client
export function getServerSupabase() {
  const cookieStore = cookies()
  
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Fetch recipes that contain a specific ingredient
 */
export async function getRecipesByIngredient(ingredientName: string): Promise<Recipe[]> {
  const supabase = getServerSupabase()
  
  try {
    // First get the IDs of recipes that have matching ingredients
    const { data: matchingIngredients, error: ingredientError } = await supabase
      .from('ingredients')
      .select('recipe_id')
      .ilike('name', `%${ingredientName}%`)
    
    if (ingredientError) {
      console.error('Error fetching ingredients:', ingredientError)
      return []
    }
    
    if (!matchingIngredients || matchingIngredients.length === 0) {
      return []
    }
    
    // Extract recipe IDs from matching ingredients
    const recipeIds = matchingIngredients.map(item => item.recipe_id)
    
    // Then fetch the complete recipe data for those IDs
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select(`
        *,
        ingredients (*)
      `)
      .in('id', recipeIds)
    
    if (recipesError) {
      console.error('Error fetching recipes:', recipesError)
      return []
    }
    
    return recipes || []
  } catch (error) {
    console.error('Error fetching recipes by ingredient:', error)
    return []
  }
} 