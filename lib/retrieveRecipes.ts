import { createClient } from '@supabase/supabase-js'
import { VectorStoreIndex, Document, Settings } from "llamaindex"
import { OpenAIEmbedding } from "@llamaindex/openai"

let index: VectorStoreIndex | null = null

export async function retrieveRecipes(query: string) {
  if (!index) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    Settings.embedModel = new OpenAIEmbedding({
        model: "text-embedding-ada-002", })

    const { data: recipes, error } = await supabaseAdmin.from("featured_library").select("*")

    if (error) throw error
    if (!recipes || recipes.length === 0) return []

    const documents = recipes.map((recipe) => {
      const tags = Array.isArray(recipe.tags) ? recipe.tags : []
      const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : []

      return new Document({
        id_: recipe.id,
        text: [
          `Title: ${recipe.title}`,
          recipe.caption ? `Caption: ${recipe.caption}` : "",
          tags.length ? `Tags: ${tags.join(", ")}` : "Tags:",
          recipe.steps
            ? `Instructions: ${recipe.steps}`
            : "", ingredients.length ? `Ingredient: ${ingredients.join(", ")}` : ""
        ]
          .filter(Boolean)
          .join("\n"),
        metadata: {
          id: recipe.id,
          title: recipe.title,
          caption: recipe.caption,
          tags,
          image: recipe.image,
        },
      })
    })

    index = await VectorStoreIndex.fromDocuments(documents)
  }

  const retriever = index.asRetriever({
    // top 4 most similar vectors are returned 
    similarityTopK: 4,
  })

  const results = await retriever.retrieve(query)

  return results.map((r) => ({   
    id: r.node.metadata.id,             
    title: r.node.metadata.title,
    caption: r.node.metadata.caption,
    image: r.node.metadata.image
}))
}
