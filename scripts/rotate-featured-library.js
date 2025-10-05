#!/usr/bin/env node

/**
 * Featured Library Rotation Script
 * 
 * This script rotates the featured_library table to show fresh recipes to new users
 * Run this periodically (e.g., weekly) to cycle through the curated collection
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function rotateFeaturedLibrary() {
  try {
    console.log('Starting featured library rotation...')

    // Get all recipes from featured_library
    const { data: allFeaturedRecipes, error: fetchError } = await supabase
      .from('featured_library')
      .select('*')

    if (fetchError) {
      throw new Error(`Failed to fetch featured recipes: ${fetchError.message}`)
    }

    if (!allFeaturedRecipes || allFeaturedRecipes.length === 0) {
      console.log('No featured recipes found in featured_library table.')
      return
    }

    console.log(`Found ${allFeaturedRecipes.length} total featured recipes`)

    // Clear current featured library
    const { error: clearError } = await supabase
      .from('featured_library')
      .delete()
      .gte('id', 0)

    if (clearError) {
      throw new Error(`Failed to clear featured library: ${clearError.message}`)
    }

    console.log('Cleared existing featured library')

    // Shuffle and select recipes for this rotation (6-8 recipes for variety)
    const shuffled = allFeaturedRecipes.sort(() => 0.5 - Math.random())
    const recipesToShow = Math.min(8, shuffled.length)
    const selectedRecipes = shuffled.slice(0, recipesToShow)

    // Remove id and timestamps, let database generate new ones
    const recipesToInsert = selectedRecipes.map(recipe => {
      const { id, created_at, updated_at, ...recipeData } = recipe
      return {
        ...recipeData,
        created_at: new Date().toISOString()
      }
    })

    // Insert the rotated selection
    const { data, error: insertError } = await supabase
      .from('featured_library')
      .insert(recipesToInsert)
      .select()

    if (insertError) {
      throw new Error(`Failed to insert rotated recipes: ${insertError.message}`)
    }

    console.log(`Successfully rotated featured library with ${data.length} recipes:`)
    data.forEach((recipe, index) => {
      console.log(`   ${index + 1}. ${recipe.title}`)
    })

    console.log('Featured library rotation completed successfully!')

  } catch (error) {
    console.error('Error rotating featured library:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  rotateFeaturedLibrary()
}

module.exports = { rotateFeaturedLibrary }
