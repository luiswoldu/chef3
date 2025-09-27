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

  // Store taste preference as string directly
  const tastePreferenceValue = tastePreference || null;

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
