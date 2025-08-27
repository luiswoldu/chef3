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
      .ilike('title', `${q}%`),

    supabase
      .from('ingredients')
      .select('id, name')
      .ilike('name', `${q}%`),
  ]);

  if (recipeRes.error) throw recipeRes.error;
  if (ingredientRes.error) throw ingredientRes.error;

  return {
    recipes: recipeRes.data,
    ingredients: ingredientRes.data,
  };
}

export async function signUpAndOnboard({ 
  email, 
  password, 
  firstName, 
  username,
  tastePreference
}: {
  email: string;
  password: string;
  firstName: string;
  username: string;
  tastePreference?: string;
}) {
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (signUpError) throw signUpError;

  const user = signUpData.user;
  if (!user) throw new Error('No user returned from signUp');

  // Map taste preference strings to integers
  const tasteMap: { [key: string]: number } = {
    'sweet,indulgent': 1,
    'savoury,healthy': 2, 
    'sweet,healthy': 3,
    'savoury,indulgent': 4
  };
  
  const tastePreferenceValue = tastePreference ? tasteMap[tastePreference] || null : null;

  const { error: profileError } = await supabase
    .from('Users')
    .insert({
      id: user.id,
      first_name: firstName,
      username: username,
      email: user.email,
      taste_preference: tastePreferenceValue,
      created_at: new Date().toISOString()
    });

  if (profileError) throw profileError;

  return user;
}
