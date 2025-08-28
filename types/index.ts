export interface Ingredient {
  id: number
  recipe_id: number
  name: string
  amount: string
  details: string
  created_at: string
  updated_at: string
}

export interface Recipe {
  id: number
  title: string
  image: string
  ingredients: Ingredient[]
  steps: string[]
  tags: string[]
  caption: string
  created_at: string
  updated_at: string
}

export interface GroceryItem {
  id: number
  user_id: string
  name: string
  amount: string
  aisle: string
  purchased: boolean
  recipe_id: number
  created_at: string
  updated_at: string
}

export type UserRecipeInteraction = {
  user_id: string;
  recipe_id: string;
  last_viewed_at?: string | null;
  last_shared_at?: string | null;
  last_saved_at?: string | null;
  created_at?: string;
  updated_at?: string;
} 