import { Recipe } from '@/types'
import { createClient } from '@/lib/supabase/client'

export async function fetchRecipeByName(name: string): Promise<Recipe | null> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        ingredients (*)
      `)
      .ilike('title', `%${name}%`)
      .single()
    
    if (error) {
      console.error('Error fetching recipe:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching recipe:', error)
    return null
  }
}

export async function fetchRecipeById(id: string): Promise<Recipe | null> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        ingredients (*)
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching recipe:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching recipe:', error)
    return null
  }
} 