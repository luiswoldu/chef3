const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uvluxhonljpmzdezzept.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2bHV4aG9ubGpwbXpkZXp6ZXB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3NjU4MTYsImV4cCI6MjA1NjM0MTgxNn0.AeEG5xaSLEIAbSd2GIHI9GxLrZiI4unJerprG2Ql4qY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getSchema() {
  try {
    console.log('Getting recipes schema...');
    
    // Get recipes structure
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('*')
      .limit(1);
    
    if (recipesError) {
      console.error('Error fetching recipes:', recipesError);
    } else {
      console.log('Recipes structure:', recipes);
      if (recipes && recipes.length > 0) {
        console.log('Recipe keys:', Object.keys(recipes[0]));
      } else {
        console.log('No recipes found to show structure');
      }
    }
    
    // Get ingredients structure
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('ingredients')
      .select('*')
      .limit(1);
    
    if (ingredientsError) {
      console.error('Error fetching ingredients:', ingredientsError);
    } else {
      console.log('Ingredients structure:', ingredients);
      if (ingredients && ingredients.length > 0) {
        console.log('Ingredient keys:', Object.keys(ingredients[0]));
      } else {
        console.log('No ingredients found to show structure');
      }
    }
  } catch (error) {
    console.error('Exception occurred:', error);
  }
}

// Run the function
getSchema(); 