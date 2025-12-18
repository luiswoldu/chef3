import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import type { Recipe } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
export const getSupabaseClient = () => supabase

export async function fullTextSearch(query: string): Promise<{ recipes: Recipe[]; ingredients: any[] }> {
  const q = query.trim()
  if (!q) return { recipes: [], ingredients: [] }

  const { data: featuredData, error: featuredError } = await supabase
    .from('featured_library')
    .select('*')
    .or(`title.ilike.%${q}%,caption.ilike.%${q}%`)
  if (featuredError) console.error('Supabase featured_library search error:', featuredError)

  const { data: userData, error: userError } = await supabase
    .from('recipes')
    .select('*')
    .or(`title.ilike.%${q}%,caption.ilike.%${q}%`)
  if (userError) console.error('Supabase user recipes search error:', userError)

  const allData = [...(featuredData || []), ...(userData || [])]

  const recipes: Recipe[] = allData.map((r: any) => ({
    id: r.id,
    title: r.title || '',
    image: r.image || '',
    caption: r.caption || '',
    ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
    steps: Array.isArray(r.steps) ? r.steps : [],
    tags: Array.isArray(r.tags) ? r.tags : [],
    user_id: r.user_id || '',
    created_at: r.created_at,
    updated_at: r.updated_at || '',
  }))

  return { recipes, ingredients: [] }
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
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
  if (signUpError) throw signUpError;

  const user = signUpData.user
  if (!user) throw new Error('No user returned from signUp')

  const tastePreferenceValue = tastePreference || null
  const { error: profileError } = await supabase
    .from('Users')
    .insert({
      id: user.id,
      first_name: firstName,
      username: username,
      email: user.email,
      taste_preference: tastePreferenceValue,
      created_at: new Date().toISOString()
    })
  if (profileError) throw profileError

  return user
}
