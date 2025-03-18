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
          name: string
          amount: string
          aisle: string
          purchased: boolean
          recipe_id: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          amount?: string
          aisle?: string
          purchased?: boolean
          recipe_id?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          amount?: string
          aisle?: string
          purchased?: boolean
          recipe_id?: number
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
