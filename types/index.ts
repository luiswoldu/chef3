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
  user_id: string
  created_at: string
  updated_at: string
}

export interface GroceryItem {
  id: number
  created_at: string
  name: string | null
  quantity: string | null
  details: string | null
  purchased: boolean | null
  recipe_link: string | null
  amount?: string // Legacy field for compatibility
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