export interface Recipe {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  ingredients: Ingredient[];
  steps: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  created_at?: string;
} 