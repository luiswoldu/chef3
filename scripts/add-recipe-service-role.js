const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key if available
// WARNING: In a real app, never expose service role keys in client-side code
// This script is for server-side use only
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uvluxhonljpmzdezzept.supabase.co';

// Try to use a service role key if available, else fall back to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2bHV4aG9ubGpwbXpkZXp6ZXB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3NjU4MTYsImV4cCI6MjA1NjM0MTgxNn0.AeEG5xaSLEIAbSd2GIHI9GxLrZiI4unJerprG2Ql4qY';

// Create supabase client with specified key
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  }
});

// Recipe data
const recipe = {
  title: "Beef Stir Fry",
  image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80",
  caption: "Delicious beef stir fry with vegetables and jasmine rice",
  tags: ["Lunch", "Meal Prep"],
  steps: [
    "Mix beef with garlic, ginger, soy sauce, egg, and corn starch", 
    "Stir-fry beef in hot oil", 
    "Stir-fry vegetables separately", 
    "Combine everything with sauce", 
    "Serve with rice"
  ]
};

// Add recipe function
async function addRecipe() {
  try {
    console.log('Inserting recipe with service role...');
    
    // Check if we're using service role or anon key
    console.log(`Using key type: ${supabaseKey === process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anonymous'}`);
    
    const { data, error } = await supabase
      .from('recipes')
      .insert([recipe])
      .select();
    
    if (error) {
      console.error('Error inserting recipe:', error);
      return;
    }
    
    console.log('Recipe added successfully:', data);
    
    if (data && data.length > 0) {
      const recipeId = data[0].id;
      console.log('Adding minimal ingredients set...');
      
      // Add just a few key ingredients
      const ingredients = [
        { recipe_id: recipeId, name: "Flank steak", amount: "1 pound", details: "thinly sliced" },
        { recipe_id: recipeId, name: "Vegetables", amount: "2 cups", details: "mixed" },
        { recipe_id: recipeId, name: "Soy sauce", amount: "3 tbsp", details: "" },
        { recipe_id: recipeId, name: "Rice", amount: "2 cups", details: "cooked" }
      ];
      
      const { data: ingData, error: ingError } = await supabase
        .from('ingredients')
        .insert(ingredients)
        .select();
      
      if (ingError) {
        console.error('Error adding ingredients:', ingError);
      } else {
        console.log('Ingredients added successfully:', ingData);
      }
    }
  } catch (error) {
    console.error('Exception occurred:', error);
  }
}

// Run the function
addRecipe(); 