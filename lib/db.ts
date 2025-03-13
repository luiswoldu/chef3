import { supabase } from '@/lib/supabase/client'
import type { Recipe, Ingredient, GroceryItem } from '@/types'

export async function getAllRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      ingredients (*)
    `)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      ingredients (*)
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export async function getRecipeByName(name: string): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      ingredients (*)
    `)
    .ilike('title', `%${name}%`)
    .single()
  
  if (error) throw error
  return data
}

export async function createRecipe(recipe: Omit<Recipe, 'id'>): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .insert([recipe])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getGroceryItems(): Promise<GroceryItem[]> {
  const { data, error } = await supabase
    .from('grocery_items')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function addGroceryItems(items: Omit<GroceryItem, 'id'>[]): Promise<GroceryItem[]> {
  const { data, error } = await supabase
    .from('grocery_items')
    .insert(items)
    .select()
  
  if (error) throw error
  return data
}

export async function updateGroceryItem(id: number, purchased: boolean): Promise<void> {
  const { error } = await supabase
    .from('grocery_items')
    .update({ purchased })
    .eq('id', id)
  
  if (error) throw error
}