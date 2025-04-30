const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uvluxhonljpmzdezzept.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2bHV4aG9ubGpwbXpkZXp6ZXB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3NjU4MTYsImV4cCI6MjA1NjM0MTgxNn0.AeEG5xaSLEIAbSd2GIHI9GxLrZiI4unJerprG2Ql4qY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Recipe data
const recipe = {
  title: "Beef Stir Fry",
  image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80",
  caption: "Delicious beef stir fry with vegetables and jasmine rice",
  tags: ["Lunch", "Meal Prep"],
  steps: [
    "Add the sliced beef, salt and pepper, garlic, ginger, soy sauce, egg, and corn starch to a bowl and mix until completely combined.",
    "Next, add 3 tablespoons of canola oil to a large wok over high heat.",
    "Once it begins to roll smoke add in the beef and immediately move it up the sides of the pan so that it doesn't clump, and all of the pieces can get cooked.",
    "Stir-fry for 2 to 3 minutes and set aside.",
    "Add 3 tablespoons of canola oil to wok and return it to the burner over high heat until it rolls smoke again.",
    "Add in the bell peppers, onions, mushrooms and green onions and stir fry for 1 to 2 minutes or until a light sear has been created.",
    "Add the broccoli and carrots to a separate large pot of boiling water and cook for 1 to 2 minutes.",
    "Pour the oyster sauce, sherry, sugar and soy sauce to the wok with stir fried vegetables and cook for 1 to 2 minutes stirring constantly.",
    "Add the boiled broccoli and carrots to the wok along with the cooked beef and mix until combined.",
    "Serve the beef stir fry with jasmine rice and add on optional garnishes of sliced green onions and sesame seeds."
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Ingredients data (to be added after recipe creation)
const ingredientsData = [
  { name: "Flank steak", amount: "1 pound", details: "thinly sliced" },
  { name: "Garlic", amount: "3 cloves", details: "finely minced" },
  { name: "Fresh ginger", amount: "1 teaspoon", details: "peeled, finely grated" },
  { name: "Soy sauce", amount: "6 tablespoons", details: "divided" },
  { name: "Egg", amount: "1", details: "large" },
  { name: "Corn starch", amount: "3 tablespoons", details: "" },
  { name: "Salt and pepper", amount: "to taste", details: "sea salt and fresh cracked" },
  { name: "Canola oil", amount: "6 tablespoons", details: "divided" },
  { name: "Red bell peppers", amount: "2", details: "seeded and thickly sliced" },
  { name: "Shiitake mushrooms", amount: "1 cup", details: "julienne" },
  { name: "Yellow onion", amount: "1/2", details: "peeled and thinly sliced" },
  { name: "Green onions", amount: "4", details: "cut into 2-inch pieces" },
  { name: "Broccoli", amount: "2 heads", details: "trimmed" },
  { name: "Carrots", amount: "1/2 cup", details: "matchstick" },
  { name: "Oyster sauce", amount: "3 tablespoons", details: "" },
  { name: "Dry sherry wine", amount: "2 tablespoons", details: "" },
  { name: "Sugar", amount: "1 tablespoon", details: "" },
  { name: "Jasmine rice", amount: "4 cups", details: "cooked" }
];

// Insert recipe and ingredients
async function addRecipe() {
  try {
    console.log('Inserting recipe...');
    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .insert([recipe])
      .select();
    
    if (recipeError) {
      console.error('Error inserting recipe:', recipeError);
      return;
    }
    
    console.log('Recipe added successfully:', recipeData);
    
    // Get the newly created recipe ID
    const recipeId = recipeData[0].id;
    
    // Add ingredients with the recipe ID
    console.log('Adding ingredients for recipe ID:', recipeId);
    const ingredientsToInsert = ingredientsData.map(ing => ({
      recipe_id: recipeId,
      name: ing.name,
      amount: ing.amount,
      details: ing.details
    }));
    
    const { data: ingredientsResult, error: ingredientsError } = await supabase
      .from('ingredients')
      .insert(ingredientsToInsert)
      .select();
    
    if (ingredientsError) {
      console.error('Error inserting ingredients:', ingredientsError);
    } else {
      console.log('Ingredients added successfully:', ingredientsResult);
    }
  } catch (error) {
    console.error('Exception occurred:', error);
  }
}

// Run the function
addRecipe(); 