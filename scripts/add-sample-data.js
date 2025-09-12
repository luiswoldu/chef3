const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with credentials from .env.local
const supabaseUrl = 'https://lxueztdlrxoystjehjay.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4dWV6dGRscnhveXN0amVoamF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NDk5MTYsImV4cCI6MjA3MjEyNTkxNn0.5XEG1f0_8vcwkEWvqSBTWcJmMlW_nUxWkC5eNhSzouo';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Sample recipes data that matches the MasterRecipes table structure
const sampleRecipes = [
  {
    title: "Classic Beef Stir Fry",
    caption: "Delicious beef stir fry with vegetables and jasmine rice",
    ingredient_name: "Beef, Bell Peppers, Soy Sauce, Rice",
    ingredient_quantity: "1 lb, 2 cups, 3 tbsp, 2 cups",
    ingredient_details: "thinly sliced, mixed colors, dark soy, cooked jasmine",
    steps: "Heat oil in wok. Add beef and stir-fry for 3 minutes. Add vegetables and cook 2 minutes. Add sauce and serve with rice.",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80",
    popularity: 4.5,
    tags: "Asian, Quick, Dinner",
    created_at: new Date().toISOString()
  },
  {
    title: "Mediterranean Pasta Salad",
    caption: "Fresh pasta salad with Mediterranean flavors",
    ingredient_name: "Pasta, Tomatoes, Olives, Feta",
    ingredient_quantity: "2 cups, 1 cup, 1/2 cup, 1/2 cup",
    ingredient_details: "penne, cherry, kalamata, crumbled",
    steps: "Cook pasta. Mix with vegetables, olives, and feta. Dress with olive oil and herbs.",
    image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=80",
    popularity: 4.2,
    tags: "Mediterranean, Salad, Vegetarian",
    created_at: new Date().toISOString()
  },
  {
    title: "Chicken Teriyaki Bowl",
    caption: "Japanese-inspired chicken bowl with steamed rice",
    ingredient_name: "Chicken, Teriyaki Sauce, Rice, Broccoli",
    ingredient_quantity: "1 lb, 1/4 cup, 2 cups, 1 cup",
    ingredient_details: "boneless thighs, homemade, jasmine, steamed",
    steps: "Marinate chicken in teriyaki. Grill chicken. Steam broccoli. Serve over rice with extra sauce.",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80",
    popularity: 4.7,
    tags: "Japanese, Healthy, Rice Bowl",
    created_at: new Date().toISOString()
  },
  {
    title: "Veggie Breakfast Burrito",
    caption: "Hearty vegetarian breakfast burrito with eggs and beans",
    ingredient_name: "Eggs, Black Beans, Cheese, Tortilla",
    ingredient_quantity: "3, 1/2 cup, 1/4 cup, 1 large",
    ingredient_details: "scrambled, cooked, shredded cheddar, flour",
    steps: "Scramble eggs. Warm beans. Assemble burrito with eggs, beans, cheese. Roll and serve.",
    image: "https://images.unsplash.com/photo-1551782450-17144efb9c50?auto=format&fit=crop&w=1200&q=80",
    popularity: 4.0,
    tags: "Breakfast, Vegetarian, Mexican",
    created_at: new Date().toISOString()
  },
  {
    title: "Creamy Mushroom Risotto",
    caption: "Rich and creamy risotto with wild mushrooms",
    ingredient_name: "Arborio Rice, Mushrooms, Parmesan, Broth",
    ingredient_quantity: "1 cup, 2 cups, 1/2 cup, 4 cups",
    ingredient_details: "arborio, mixed wild, grated, warm vegetable",
    steps: "Sauté mushrooms. Toast rice. Add broth gradually while stirring. Finish with parmesan and butter.",
    image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=1200&q=80",
    popularity: 4.3,
    tags: "Italian, Vegetarian, Creamy",
    created_at: new Date().toISOString()
  }
];

async function addSampleData() {
  try {
    console.log('Adding sample recipes to MasterRecipes table...');
    
    const { data, error } = await supabase
      .from('MasterRecipes')
      .insert(sampleRecipes)
      .select();
    
    if (error) {
      console.error('Error adding sample recipes:', error);
      return;
    }
    
    console.log('Successfully added', data.length, 'sample recipes:');
    data.forEach(recipe => {
      console.log(`- ${recipe.title} (ID: ${recipe.id})`);
    });
    
  } catch (error) {
    console.error('Exception occurred:', error);
  }
}

// Run the function
addSampleData();
