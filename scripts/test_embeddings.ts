/**
 * Tests: 1485, 2779 (new), 3445 (new)
 * Run with: npx ts-node scripts/test_embeddings.ts
 */

import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"
import * as dotenv from 'dotenv'

// Load environment variables from .env.local file
dotenv.config({ path: '.env.local' })

// Debug: Check if env vars loaded
console.log('Environment variables check:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Loaded' : '❌ Missing')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Loaded' : '❌ Missing')
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Loaded' : '❌ Missing')
console.log('')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const openaiApiKey = process.env.OPENAI_API_KEY

// Validate env vars
if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
  console.error('❌ Missing required environment variables!')
  console.error('Make sure .env.local contains:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  console.error('- OPENAI_API_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const openai = new OpenAI({ apiKey: openaiApiKey })

// Helper to flatten structured ingredients
function flattenIngredients(ingredients: any): string {
  if (!ingredients) return ""
  
  // Handle structured format: {"Dough": [...], "Sauce": [...]}
  if (typeof ingredients === 'object' && !Array.isArray(ingredients)) {
    const allIngredients: string[] = []
    for (const section of Object.values(ingredients)) {
      if (Array.isArray(section)) {
        allIngredients.push(...section)
      }
    }
    return allIngredients.join(", ")
  }
  
  // Handle array format: ["1 cup flour", "2 eggs"]
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
  
  // Build comprehensive text
  const parts = []
  
  parts.push(`Title: ${title}`)
  if (caption) parts.push(`Caption: ${caption}`)
  if (tags) parts.push(`Tags: ${tags}`)
  if (ingredientsText) parts.push(`Ingredients: ${ingredientsText}`)
  if (steps) parts.push(`Instructions: ${steps}`)
  
  return parts.join("\n")
}

// Check if recipe exists in embeddings table
async function checkEmbeddingExists(recipeId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('recipe_embeddings')
    .select('recipe_id')
    .eq('recipe_id', recipeId)
    .single()
  
  return !error && data !== null
}

// Embed a single recipe
async function embedRecipe(recipe: any) {
  try {
    const embeddingText = createEmbeddingText(recipe)
    
    console.log(`\n📝 Recipe ID: ${recipe.id}`)
    console.log(`📝 Title: ${recipe.title}`)
    console.log(`📄 Text length: ${embeddingText.length} chars`)
    console.log(`\n📄 Embedding text preview:`)
    console.log('='.repeat(80))
    console.log(embeddingText.substring(0, 400) + '...')
    console.log('='.repeat(80))
    
    // Check if ingredients are included
    if (recipe.ingredients) {
      console.log(`\n✅ Recipe has ingredients in database`)
      const ingredientsText = flattenIngredients(recipe.ingredients)
      if (ingredientsText) {
        console.log(`✅ Ingredients successfully extracted: "${ingredientsText.substring(0, 100)}..."`)
      } else {
        console.log(`⚠️  Ingredients field exists but is empty/null`)
      }
    } else {
      console.log(`\n❌ Recipe missing ingredients field in database`)
    }
    
    // Generate embedding
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: embeddingText,
    })
    
    const embedding = response.data[0].embedding
    console.log(`\n✅ Generated embedding (${embedding.length} dimensions)`)
    
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
      console.error(`❌ Failed to store in Supabase:`, error)
      return false
    }
    
    console.log(`💾 Stored in database`)
    return true
  } catch (error) {
    console.error(`❌ Failed to embed recipe ${recipe.id}:`, error)
    return false
  }
}

// Main function
async function main() {
  console.log("🧪 TESTING EMBEDDINGS ON SPECIFIC RECIPES\n")
  console.log("="  .repeat(80))
  
  const testRecipeIds = [1485, 2779, 3445]
  
  console.log(`\n📋 Testing ${testRecipeIds.length} recipes: ${testRecipeIds.join(', ')}\n`)
  
  // Check which ones already have embeddings
  console.log("🔍 Checking existing embeddings...\n")
  for (const id of testRecipeIds) {
    const exists = await checkEmbeddingExists(id)
    console.log(`  Recipe ${id}: ${exists ? '✅ Already embedded (will re-embed)' : '🆕 New (first time embedding)'}`)
  }
  
  console.log("\n" + "=".repeat(80))
  
  // Fetch the recipes
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, title, caption, image, ingredients, tags, steps')
    .in('id', testRecipeIds)
    .order('id', { ascending: true })
  
  if (error) {
    console.error("Failed to fetch recipes:", error)
    return
  }
  
  if (!recipes || recipes.length === 0) {
    console.log("No recipes found!")
    return
  }
  
  console.log(`\n📊 Found ${recipes.length} recipes\n`)
  
  // Check if all requested recipes were found
  const foundIds = recipes.map(r => r.id)
  const missingIds = testRecipeIds.filter(id => !foundIds.includes(id))
  
  if (missingIds.length > 0) {
    console.log(`⚠️  Warning: ${missingIds.length} recipe(s) not found in database: ${missingIds.join(', ')}\n`)
  }
  
  console.log("=".repeat(80))
  
  // Embed each recipe
  let success = 0
  let failed = 0
  
  for (const recipe of recipes) {
    const result = await embedRecipe(recipe)
    if (result) {
      success++
    } else {
      failed++
    }
    console.log("\n" + "=".repeat(80))
  }
  
  // Final summary
  console.log(`\n✅ TESTING COMPLETE!`)
  console.log(`\n📊 Results:`)
  console.log(`  ✅ Successfully embedded: ${success}`)
  console.log(`  ❌ Failed: ${failed}`)
  console.log(`  📝 Total processed: ${recipes.length}`)
  
  if (success === recipes.length) {
    console.log(`\n🎉 All test recipes embedded successfully!`)
    console.log(`   Ready to run the full re-embedding script.`)
  }
  
  console.log("\n" + "=".repeat(80))
}

main().catch(console.error)