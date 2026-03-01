/**
 * Run with: npx ts-node scripts/reembed_all_recipes.ts
 */

import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"
import * as dotenv from 'dotenv'

// Load environment variables from .env.local file
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const openaiApiKey = process.env.OPENAI_API_KEY

// Validate env vars
if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
  console.error('❌ Missing required environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const openai = new OpenAI({ apiKey: openaiApiKey })

// Configuration
const BATCH_SIZE = 50 // Process 50 recipes at a time
const DELAY_BETWEEN_BATCHES = 2000 // 2 second delay between batches to avoid rate limits

// Helper to flatten structured ingredients
function flattenIngredients(ingredients: any): string {
  if (!ingredients) return ""
  
  if (typeof ingredients === 'object' && !Array.isArray(ingredients)) {
    const allIngredients: string[] = []
    for (const section of Object.values(ingredients)) {
      if (Array.isArray(section)) {
        allIngredients.push(...section)
      }
    }
    return allIngredients.join(", ")
  }
  
  if (Array.isArray(ingredients)) {
    return ingredients.join(", ")
  }
  
  return ""
}

// Create embedding text from recipe
function createEmbeddingText(recipe: any): string {
  const title = recipe.title || ""
  const caption = recipe.caption || ""
  const tags = recipe.tags ? (Array.isArray(recipe.tags) ? recipe.tags.join(", ") : recipe.tags) : ""
  const ingredientsText = flattenIngredients(recipe.ingredients)
  const steps = recipe.steps || ""
  
  const parts = []
  
  parts.push(`Title: ${title}`)
  if (caption) parts.push(`Caption: ${caption}`)
  if (tags) parts.push(`Tags: ${tags}`)
  if (ingredientsText) parts.push(`Ingredients: ${ingredientsText}`)
  if (steps) parts.push(`Instructions: ${steps}`)
  
  return parts.join("\n")
}

// Embed a single recipe
async function embedRecipe(recipe: any): Promise<boolean> {
  try {
    const embeddingText = createEmbeddingText(recipe)
    
    // Generate embedding
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: embeddingText,
    })
    
    const embedding = response.data[0].embedding
    
    // Store in Supabase
    const { error } = await supabase
      .from('recipe_embeddings')
      .upsert({
        recipe_id: recipe.id,
        content: embeddingText,
        embedding: embedding,
        metadata: {
          title: recipe.title,
          caption: recipe.caption,
          image: recipe.image,
          tags: recipe.tags
        }
      }, {
        onConflict: 'recipe_id'
      })
    
    if (error) {
      console.error(`❌ Recipe ${recipe.id} (${recipe.title}): ${error.message}`)
      return false
    }
    
    return true
  } catch (error) {
    console.error(`❌ Recipe ${recipe.id}: ${error}`)
    return false
  }
}

// Process a batch of recipes
async function processBatch(recipes: any[], batchNumber: number, totalBatches: number): Promise<{ success: number, failed: number }> {
  console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${recipes.length} recipes)`)
  
  let success = 0
  let failed = 0
  
  for (const recipe of recipes) {
    const result = await embedRecipe(recipe)
    if (result) {
      success++
      process.stdout.write('✅')
    } else {
      failed++
      process.stdout.write('❌')
    }
  }
  
  console.log(`\n✅ Success: ${success} | ❌ Failed: ${failed}`)
  
  return { success, failed }
}

// Sleep function
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Main function
async function main() {
  console.log("🚀 FULL RE-EMBEDDING SCRIPT")
  console.log("=" .repeat(80))
  console.log("")
  
  // Count total recipes
  const { count, error: countError } = await supabase
    .from('recipes')
    .select('*', { count: 'exact', head: true })
  
  if (countError) {
    console.error("Failed to count recipes:", countError)
    return
  }
  
  console.log(`📊 Total recipes to re-embed: ${count}`)
  console.log(`📦 Batch size: ${BATCH_SIZE}`)
  console.log(`⏱️  Delay between batches: ${DELAY_BETWEEN_BATCHES}ms`)
  console.log("")
  
  const totalBatches = Math.ceil((count || 0) / BATCH_SIZE)
  const estimatedTime = (totalBatches * DELAY_BETWEEN_BATCHES) / 1000 / 60
  
  console.log(`⏰ Estimated time: ~${estimatedTime.toFixed(1)} minutes (excluding API time)`)
  console.log(`💰 Estimated cost: ~$${((count || 0) * 0.0001).toFixed(2)} (at $0.0001 per embedding)`)
  console.log("")
  console.log("⚠️  WARNING: This will re-embed ALL recipes!")
  console.log("")
  console.log("=" .repeat(80))
  console.log("")
  
  // Ask for confirmation
  console.log("Starting in 5 seconds... (Press Ctrl+C to cancel)")
  await sleep(5000)
  
  console.log("\n🔄 Starting re-embedding process...\n")
  
  let totalSuccess = 0
  let totalFailed = 0
  let offset = 0
  
  // Process in batches
  for (let i = 0; i < totalBatches; i++) {
    // Fetch batch
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('id, title, caption, image, ingredients, tags, steps')
      .range(offset, offset + BATCH_SIZE - 1)
    
    if (error) {
      console.error(`❌ Failed to fetch batch ${i + 1}:`, error)
      continue
    }
    
    if (!recipes || recipes.length === 0) {
      console.log("No more recipes to process")
      break
    }
    
    // Process batch
    const { success, failed } = await processBatch(recipes, i + 1, totalBatches)
    totalSuccess += success
    totalFailed += failed
    
    offset += BATCH_SIZE
    
    // Progress update
    const progress = ((i + 1) / totalBatches * 100).toFixed(1)
    console.log(`📊 Overall progress: ${progress}% (${totalSuccess + totalFailed}/${count})`)
    
    // Delay between batches (except last batch)
    if (i < totalBatches - 1) {
      console.log(`⏸️  Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`)
      await sleep(DELAY_BETWEEN_BATCHES)
    }
  }
  
  // Final summary
  console.log("\n" + "=".repeat(80))
  console.log("\n✅ RE-EMBEDDING COMPLETE!\n")
  console.log(`📊 Total recipes processed: ${totalSuccess + totalFailed}`)
  console.log(`✅ Successfully embedded: ${totalSuccess}`)
  console.log(`❌ Failed: ${totalFailed}`)
  
  if (totalFailed > 0) {
    console.log(`\n⚠️  ${totalFailed} recipes failed. Check the logs above for details.`)
  }
  
  console.log("\n🎉 All done! Your recipes now have ingredients in their embeddings.")
  console.log("=" .repeat(80))
}

main().catch(console.error)