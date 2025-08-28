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
      profiles: {
        Row: {
          id: string
          first_name: string | null
          username: string | null
          email: string
          taste_preference: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          username?: string | null
          email: string
          taste_preference?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          username?: string | null
          email?: string
          taste_preference?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      recipes: {
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
      ingredients: {
        Row: {
          id: number
          recipe_id: number
          name: string
          amount: string
          details: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          recipe_id: number
          name: string
          amount?: string
          details?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          recipe_id?: number
          name?: string
          amount?: string
          details?: string
          created_at?: string
          updated_at?: string
        }
      }
      grocery_items: {
        Row: {
          id: number
          user_id: string
          name: string
          amount: string
          aisle: string
          purchased: boolean
          recipe_id: number
          details: string
          created_at: string
          updated_at: string
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
          recipe_id: string
          last_viewed_at: string | null
          last_shared_at: string | null
          last_saved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          recipe_id: string
          last_viewed_at?: string | null
          last_shared_at?: string | null
          last_saved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          recipe_id?: string
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
