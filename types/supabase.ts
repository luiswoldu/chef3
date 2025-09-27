export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      Users: {
        Row: {
          id: string
          first_name: string | null
          username: string | null
          email: string
          taste_preference: string | null
          created_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          username?: string | null
          email: string
          taste_preference?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          username?: string | null
          email?: string
          taste_preference?: string | null
          created_at?: string
        }
      }
      MasterRecipes: {
        Row: {
          id: number
          title: string
          image: string
          ingredients: any[] // This will be joined from another table
          steps: string[]
          tags: string[]
          caption: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          title: string
          image?: string
          steps?: string[]
          tags?: string[]
          caption?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          title?: string
          image?: string
          steps?: string[]
          tags?: string[]
          caption?: string
          created_at?: string
          updated_at?: string
        }
      }
      UserRecipes: {
        Row: {
          id: number
          title: string
          caption: string | null
          ingredients: string | null
          steps: string
          image: string
          popularity: number | null
          tags: string | null
          created_at: string
          ingredient_name: string | null
          ingredient_quantity: string | null
          ingredient_details: string | null
        }
        Insert: {
          id?: number
          title: string
          caption?: string | null
          ingredients?: string | null
          steps: string
          image: string
          popularity?: number | null
          tags?: string | null
          created_at?: string
          ingredient_name?: string | null
          ingredient_quantity?: string | null
          ingredient_details?: string | null
        }
        Update: {
          id?: number
          title?: string
          caption?: string | null
          ingredients?: string | null
          steps?: string
          image?: string
          popularity?: number | null
          tags?: string | null
          created_at?: string
          ingredient_name?: string | null
          ingredient_quantity?: string | null
          ingredient_details?: string | null
        }
      }
      ShoppingList: {
        Row: {
          id: number
          created_at: string
          name: string | null
          quantity: string | null
          details: string | null
          purchased: boolean | null
          recipe_link: string | null
        }
        Insert: {
          id?: number
          user_id: string
          name: string
          amount?: string
          aisle?: string
          purchased?: boolean
          recipe_id?: number
          details?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          name?: string
          amount?: string
          aisle?: string
          purchased?: boolean
          recipe_id?: number
          details?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_recipe_interactions: {
        Row: {
          user_id: string
          recipe_id: number
          last_viewed_at: string | null
          last_shared_at: string | null
          last_saved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          recipe_id: number
          last_viewed_at?: string | null
          last_shared_at?: string | null
          last_saved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          recipe_id?: number
          last_viewed_at?: string | null
          last_shared_at?: string | null
          last_saved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
