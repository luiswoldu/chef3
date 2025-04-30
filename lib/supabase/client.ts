import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uvluxhonljpmzdezzept.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2bHV4aG9ubGpwbXpkZXp6ZXB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3NjU4MTYsImV4cCI6MjA1NjM0MTgxNn0.AeEG5xaSLEIAbSd2GIHI9GxLrZiI4unJerprG2Ql4qY'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
export const getSupabaseClient = () => supabase 

export type SearchResults = {
  recipes: { id: number; title: string }[];
  ingredients: { id: number; name: string }[];
};

export async function fullTextSearch(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (!q) {
    return { recipes: [], ingredients: [] };
  }

  // Fire both queries in parallel
  const [recipeRes, ingredientRes] = await Promise.all([
    supabase
      .from('recipes')
      .select('id, title')
      .textSearch('title_tsv', q, {
        config: 'english',
        type: 'plain',    // you can also try 'websearch'
      }),

    supabase
      .from('ingredients')
      .select('id, name')
      .textSearch('name_tsv', q, {
        config: 'english',
        type: 'plain',
      }),
  ]);

  if (recipeRes.error) throw recipeRes.error;
  if (ingredientRes.error) throw ingredientRes.error;

  return {
    recipes: recipeRes.data,
    ingredients: ingredientRes.data,
  };
} 