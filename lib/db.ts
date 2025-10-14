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
  // Validate that the recipe has steps
  if (!recipe.steps || recipe.steps.length === 0) {
    throw new Error('Recipe must have at least one step')
  }
  
  // Ensure steps is an array of strings
  const validatedRecipe = {
    ...recipe,
    steps: recipe.steps.filter(step => step && step.trim().length > 0)
  }
  
  if (validatedRecipe.steps.length === 0) {
    throw new Error('Recipe must have at least one valid step')
  }
  
  const { data, error } = await supabase
    .from('recipes')
    .insert([validatedRecipe])
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

export async function searchRecipesFullText(query: string): Promise<Recipe[]> {
  return []
}

// Helper function to validate and sanitize recipe data before import
export function validateRecipeForImport(recipeData: any): {
  isValid: boolean;
  errors: string[];
  sanitizedRecipe?: Omit<Recipe, 'id'>;
} {
  const errors: string[] = [];
  
  // Check required fields
  if (!recipeData.title || typeof recipeData.title !== 'string' || recipeData.title.trim().length === 0) {
    errors.push('Recipe must have a valid title');
  }
  
  if (!recipeData.user_id || typeof recipeData.user_id !== 'string') {
    errors.push('Recipe must have a valid user_id');
  }
  
  // Validate steps array
  if (!recipeData.steps || !Array.isArray(recipeData.steps)) {
    errors.push('Recipe must have steps as an array');
  } else {
    const validSteps = recipeData.steps.filter((step: any) => 
      typeof step === 'string' && step.trim().length > 0
    );
    
    if (validSteps.length === 0) {
      errors.push('Recipe must have at least one valid step');
    }
  }
  
  // Validate tags (optional but must be array if present)
  if (recipeData.tags && !Array.isArray(recipeData.tags)) {
    errors.push('Recipe tags must be an array');
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  // Create sanitized recipe object
  const sanitizedRecipe: Omit<Recipe, 'id'> = {
    title: recipeData.title.trim(),
    image: recipeData.image || '',
    caption: recipeData.caption || '',
    steps: recipeData.steps.filter((step: any) => 
      typeof step === 'string' && step.trim().length > 0
    ),
    tags: Array.isArray(recipeData.tags) ? recipeData.tags : [],
    user_id: recipeData.user_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ingredients: [] // Will be added separately
  };
  
  return { isValid: true, errors: [], sanitizedRecipe };
}

// Enhanced createRecipe function that uses validation
export async function createValidatedRecipe(recipeData: any): Promise<Recipe> {
  const validation = validateRecipeForImport(recipeData);
  
  if (!validation.isValid || !validation.sanitizedRecipe) {
    throw new Error(`Recipe validation failed: ${validation.errors.join(', ')}`);
  }
  
  return createRecipe(validation.sanitizedRecipe);
}
