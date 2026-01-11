import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
