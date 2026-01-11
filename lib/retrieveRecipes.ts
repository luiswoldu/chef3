import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lxueztdlrxoystjehjay.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4dWV6dGRscnhveXN0amVoamF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NDk5MTYsImV4cCI6MjA3MjEyNTkxNn0.5XEG1f0_8vcwkEWvqSBTWcJmMlW_nUxWkC5eNhSzouo';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export async function retrieveRecipes(query: string) {
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: query,
  })

  const queryEmbedding = embeddingResponse.data[0].embedding

  const { data, error } = await supabase.rpc("match_recipes", {
    query_embedding: queryEmbedding,
    match_count: 4,
  })

  if (error) throw error
  if (!data) return []

  console.log(data);

  return data.map((r: { recipe_id: any; metadata: { title: any; caption: any; image: any } }) => ({
    id: r.recipe_id,
    title: r.metadata.title,
    caption: r.metadata.caption,
    image: r.metadata.image,
  }))
}
