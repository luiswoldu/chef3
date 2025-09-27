const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lxueztdlrxoystjehjay.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4dWV6dGRscnhveXN0amVoamF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NDk5MTYsImV4cCI6MjA3MjEyNTkxNn0.5XEG1f0_8vcwkEWvqSBTWcJmMlW_nUxWkC5eNhSzouo';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// The recipe ID we want to add ingredients to
// Change this to the ID from the output of add-minimal-recipe.js
const RECIPE_ID = 6; // Use the ID from the previous script output

async function addIngredients() {
  try {
    console.log(`Adding ingredients for recipe ID: ${RECIPE_ID}`);
    
    // First check the ingredients table structure
    const { data: ingredientStructure, error: structError } = await supabase
      .from('ingredients')
      .select('*')
      .limit(1);
    
    if (structError) {
      console.error('Error checking ingredient structure:', structError);
    } else {
      console.log('Ingredient table columns:', ingredientStructure && ingredientStructure.length > 0 
        ? Object.keys(ingredientStructure[0]) 
        : 'No sample data to examine');
    }
    
    // Try adding ingredients using 'ingredient' as column name (based on types file)
    const ingredients = [
      { recipe_id: RECIPE_ID, ingredient: "Flank steak", amount: "1 pound", details: "thinly sliced" },
      { recipe_id: RECIPE_ID, ingredient: "Vegetables", amount: "2 cups", details: "mixed" },
      { recipe_id: RECIPE_ID, ingredient: "Soy sauce", amount: "3 tbsp", details: "" },
      { recipe_id: RECIPE_ID, ingredient: "Rice", amount: "2 cups", details: "cooked" }
    ];
    
    const { data, error } = await supabase
      .from('ingredients')
      .insert(ingredients)
      .select();
    
    if (error) {
      console.error('Error adding ingredients:', error);
    } else {
      console.log('Ingredients added successfully:', data);
    }
  } catch (error) {
    console.error('Exception occurred:', error);
  }
}

// Run the function
addIngredients(); 