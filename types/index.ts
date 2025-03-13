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
  name: string
  amount: string
  aisle: string
  purchased: boolean
  recipe_id: number
  created_at: string
  updated_at: string
} 