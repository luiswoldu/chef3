import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Recipe data
    const recipeData = {
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
      ]
    };

    // Create recipe
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert([recipeData])
      .select();

    if (recipeError) {
      console.error('Error creating recipe:', recipeError);
      return NextResponse.json({ error: recipeError.message }, { status: 500 });
    }

    if (!recipe || recipe.length === 0) {
      return NextResponse.json({ error: 'Recipe creation failed' }, { status: 500 });
    }

    // Add ingredients
    const recipeId = recipe[0].id;
    const ingredientsData = [
      { recipe_id: recipeId, name: "Flank steak", amount: "1 pound", details: "thinly sliced" },
      { recipe_id: recipeId, name: "Garlic", amount: "3 cloves", details: "finely minced" },
      { recipe_id: recipeId, name: "Fresh ginger", amount: "1 teaspoon", details: "peeled, finely grated" },
      { recipe_id: recipeId, name: "Soy sauce", amount: "6 tablespoons", details: "divided" },
      { recipe_id: recipeId, name: "Egg", amount: "1", details: "large" },
      { recipe_id: recipeId, name: "Corn starch", amount: "3 tablespoons", details: "" },
      { recipe_id: recipeId, name: "Salt and pepper", amount: "to taste", details: "sea salt and fresh cracked" },
      { recipe_id: recipeId, name: "Canola oil", amount: "6 tablespoons", details: "divided" },
      { recipe_id: recipeId, name: "Red bell peppers", amount: "2", details: "seeded and thickly sliced" },
      { recipe_id: recipeId, name: "Shiitake mushrooms", amount: "1 cup", details: "julienne" },
      { recipe_id: recipeId, name: "Yellow onion", amount: "1/2", details: "peeled and thinly sliced" },
      { recipe_id: recipeId, name: "Green onions", amount: "4", details: "cut into 2-inch pieces" },
      { recipe_id: recipeId, name: "Broccoli", amount: "2 heads", details: "trimmed" },
      { recipe_id: recipeId, name: "Carrots", amount: "1/2 cup", details: "matchstick" },
      { recipe_id: recipeId, name: "Oyster sauce", amount: "3 tablespoons", details: "" },
      { recipe_id: recipeId, name: "Dry sherry wine", amount: "2 tablespoons", details: "" },
      { recipe_id: recipeId, name: "Sugar", amount: "1 tablespoon", details: "" },
      { recipe_id: recipeId, name: "Jasmine rice", amount: "4 cups", details: "cooked" }
    ];

    const { error: ingredientsError } = await supabase
      .from('ingredients')
      .insert(ingredientsData);

    if (ingredientsError) {
      console.error('Error adding ingredients:', ingredientsError);
      return NextResponse.json(
        { error: ingredientsError.message, recipeAdded: true, recipeId }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Recipe and ingredients added successfully',
      recipeId 
    });
  } catch (error: any) {
    console.error('Exception in add-test-recipe API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 