import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)

import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,  
  process.env.SUPABASE_SERVICE_ROLE_KEY 
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function run() {
  console.log("Fetching recipes...");

  const { data: recipes, error } = await supabase
    .from("featured_library")
    .select("*");

  if (error) throw error;
  if (!recipes || recipes.length === 0) {
    console.log("No recipes found.");
    return;
  }

  for (const recipe of recipes) {
    const content = [
      `Title: ${recipe.title}`,
      recipe.caption && `Caption: ${recipe.caption}`,
      recipe.tags?.length && `Tags: ${recipe.tags.join(", ")}`,
      recipe.ingredients?.length &&
        `Ingredients: ${recipe.ingredients.join(", ")}`,
      recipe.steps && `Instructions: ${recipe.steps}`,
    ]
      .filter(Boolean)
      .join("\n");

    console.log(`Embedding recipe: ${recipe.title}`);

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: content,
    });

    const embedding = embeddingResponse.data[0].embedding;

    const { error: upsertError } = await supabase
      .from("recipe_embeddings")
      .upsert({
        recipe_id: recipe.id,
        content,
        embedding,
        metadata: {
          title: recipe.title,
          caption: recipe.caption,
          image: recipe.image,
          tags: recipe.tags,
        },
      });

    if (upsertError) {
      console.error(
        `Failed to embed recipe ${recipe.id}:`,
        upsertError.message
      );
    }
  }

  console.log("Embedding complete");
}

// 5️⃣ Run
run().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});