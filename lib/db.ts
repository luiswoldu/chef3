import Dexie, { type Table } from "dexie"

export interface Ingredient {
  ingredient: string
  amount: string
  details: string
}

export interface Recipe {
  id?: number
  title: string
  image: string
  ingredients: Ingredient[]
  steps: string[]
  tags: string[]
  caption: string
}

export interface GroceryItem {
  id?: number
  name: string
  amount: string
  aisle: string
  purchased: boolean
  recipeId: number
}

class Chef3Database extends Dexie {
  recipes!: Table<Recipe, number>
  groceryItems!: Table<GroceryItem, number>

  constructor() {
    super("Chef3Database")
    this.version(4).stores({
      recipes: "++id, title, *tags, caption",
      groceryItems: "++id, name, aisle, purchased, recipeId",
    })

    this.recipes = this.table("recipes")
    this.groceryItems = this.table("groceryItems")
  }
}

export const db = new Chef3Database()

export async function seedDatabase() {
  try {
    await db.recipes.clear()
    const recipes: Recipe[] = [
      {
        id: 1,
        title: "Beef Stir Fry",
        image: "/placeholder.jpg",
        ingredients: [
          { amount: "1 pound", ingredient: "flank steak", details: "thinly sliced" },
          { amount: "3 cloves", ingredient: "garlic", details: "finely minced" },
          { amount: "1 teaspoon", ingredient: "fresh ginger", details: "peeled and finely grated" },
          { amount: "3 tablespoons", ingredient: "soy sauce", details: "" },
          { amount: "1", ingredient: "large egg", details: "" },
          { amount: "3 tablespoons", ingredient: "corn starch", details: "" },
          { amount: "to taste", ingredient: "sea salt and fresh cracked pepper", details: "" },
          { amount: "6 tablespoons", ingredient: "canola oil", details: "divided" },
          { amount: "2", ingredient: "red bell peppers", details: "seeded and thickly sliced" },
          { amount: "1 cup", ingredient: "shiitake mushrooms", details: "julienne" },
          { amount: "1/2", ingredient: "yellow onion", details: "peeled and thinly sliced" },
          { amount: "4", ingredient: "green onions", details: 'cut into 2" long pieces' },
          { amount: "2 heads", ingredient: "broccoli", details: "trimmed" },
          { amount: "1/2 cup", ingredient: "carrots", details: "matchstick" },
          { amount: "3 tablespoons", ingredient: "oyster sauce", details: "" },
          { amount: "2 tablespoons", ingredient: "dry sherry wine", details: "" },
          { amount: "1 tablespoon", ingredient: "sugar", details: "" },
          { amount: "4 cups", ingredient: "jasmine rice", details: "cooked" },
        ],
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
          "Serve the beef stir fry with jasmine rice and add on optional garnishes of sliced green onions and sesame seeds.",
        ],
        tags: ["Lunch", "Meal Prep"],
        caption: "If you want a delicious weeknight meal for the family, then this amazing beef stir fry loaded with vegetables and a homemade sauce comes together in under 30 minutes.",
      },
      {
        id: 2,
        title: "Garlic Chili Scorched Rice",
        image: "/placeholder3.jpg",
        ingredients: [
          { amount: "2 cups", ingredient: "rice", details: "cooked" },
          { amount: "3-4 tbsp", ingredient: "butter or oil", details: "of choice" },
          { amount: "2-3 tbsp", ingredient: "garlic chili oil", details: "" },
          { amount: "1 cup", ingredient: "arugula", details: "" },
        ],
        steps: [
          "Reduce heat to medium and cook undisturbed until the bottom is golden brown and crispy. This may take 20-30 minutes. Monitor the rice closely and adjust the heat as needed to prevent burning.",
          "While the rice is searing, heat another skillet over medium-high heat. Add a little oil or butter. Crack the egg into the skillet and cook until the white is set but the yolk is still runny.",
          "Carefully flip the rice in the cast iron skillet so the crispy side is up.",
          "Top with the over-easy egg, garlic chili oil, and arugula.",
          "Serve immediately.",
        ],
        tags: ["Breakfast"],
        caption: "If you want a delicious weeknight meal for the family",
      },
      {
        id: 3,
        title: "Chopped Bacon Egg & Cheese Bagel",
        image: "/placeholder4.jpg",
        ingredients: [
          { amount: "4 strips", ingredient: "bacon", details: "" },
          { amount: "3", ingredient: "eggs", details: "" },
          { amount: "2 tablespoons", ingredient: "milk", details: "" },
          { amount: "to taste", ingredient: "Kosher salt", details: "" },
          { amount: "as needed", ingredient: "Cooking spray", details: "" },
          { amount: "3 slices", ingredient: "American cheese", details: "" },
          { amount: "1", ingredient: "scallion", details: "thinly sliced" },
          { amount: "to taste", ingredient: "Everything bagel seasoning", details: "" },
          { amount: "2", ingredient: "everything bagels", details: "toasted" },
          { amount: "to taste", ingredient: "Sriracha", details: "" },
          { amount: "1", ingredient: "avocado", details: "thinly sliced" },
        ],
        steps: [
          "Preheat oven to 400F. Lay bacon strips on a foil lined baking sheet and bake for 20-30 minutes, until cooked through but not too crispy. When cooked, lay on a paper towel-lined plate.",
          "Crack the eggs into a small bowl, then add milk and a hearty pinch of kosher salt. Whisk very well.",
          "Heat cooking spray in a small nonstick pan over medium heat. Add in the egg mixture and scramble the eggs until almost fully set, but still slightly soft. Set aside.",
          "On a large cutting board, lay down the cooked eggs and top them with the American cheese. Then lay down the cooked bacon, and scallions. Sprinkle on a good amount of everything bagel seasoning, then use a large knife to chop all the ingredients. Once chopped and combined, taste for seasoning.",
          "Split up the mixture into two, then place it onto the bagels. Drizzle sriracha on top of each egg mixture, then lay on the sliced avocado. Season the avocado with more everything bagel seasoning, close the bagel sandwiches, and enjoy!",
        ],
        tags: ["Breakfast"],
        caption: "If you want a delicious weeknight meal for the family",
      },
    ]
    
    console.log('Seeding recipe with caption:', recipes[0].caption)
    await db.recipes.bulkAdd(recipes)
    
  } catch (error) {
    console.error("Failed to seed database:", error)
  }
}

// Force immediate seeding
seedDatabase()

