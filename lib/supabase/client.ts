import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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

  // Only search recipes, not ingredients
  const { data: recipeRes, error: recipeError } = await supabase
    .from('recipes')
    .select('id, title')
    .ilike('title', `%${q}%`); // Changed to include matches anywhere in title

  if (recipeError) throw recipeError;

  return {
    recipes: recipeRes || [],
    ingredients: [], // Always return empty ingredients array
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
