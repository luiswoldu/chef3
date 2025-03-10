"use client"

import { useState, useEffect } from "react"
import Navigation from "../../components/Navigation"
import RecipeCard from "../../components/RecipeCard"
import { db, type Recipe } from "../../lib/db" // make sure db is your Supabase client instance

const categories = ["All", "Breakfast", "Lunch", "Dessert"]

export default function Explore() {
  const [activeCategory, setActiveCategory] = useState(categories[0])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadRecipes() {
      setIsLoading(true)
      try {
        // Supabase query: adjust the query to match your schema
        const { data: allRecipes, error } = await db
          .from("recipes")
          .select("*")
        if (error) throw error

        // Ensure allRecipes is defined (could be null if no data)
        const recipesData: Recipe[] = allRecipes || []

        // Filter recipes based on activeCategory
        let filteredRecipes =
          activeCategory === "All"
            ? recipesData
            : recipesData.filter((recipe) =>
                recipe.tags.includes(activeCategory)
              )

        // Ensure we always have 15 cards by padding with empty recipes if needed
        const emptyRecipe: Recipe = {
          id: 0,
          title: "Recipe",
          image: "/placeholder.svg",
          caption: "",
          tags: [],
          ingredients: [],
          steps: []
        }

        while (filteredRecipes.length < 15) {
          filteredRecipes.push({
            ...emptyRecipe,
            id: -filteredRecipes.length // Use negative IDs for empty cards
          })
        }

        filteredRecipes = filteredRecipes
          .slice(0, 15) // Limit to 15 recipes
          .sort((a, b) => (a.id ?? 0) - (b.id ?? 0))

        setRecipes(filteredRecipes)
      } catch (error) {
        console.error("Error fetching recipes:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadRecipes()
  }, [activeCategory])

  return (
    <div className="flex flex-col min-h-screen pb-[70px]">
      <div className="p-4 bg-white sticky top-0 z-10">
        <div className="flex space-x-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                activeCategory === category
                  ? "bg-[#DFE0E1] text-gray-800"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-grow overflow-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <p>Loading...</p>
          </div>
        ) : (
          <div className="space-y-0.5 bg-gray-100">
            {/* Hero Card */}
            {recipes.length > 0 && (
              <RecipeCard
                id={recipes[0].id?.toString() ?? ""}
                title={recipes[0].title}
                image={recipes[0].image}
                isHero={true}
                showAddButton={true}
                cardType="hero"
              />
            )}

            {/* Group 1: 2x2 Grid */}
            <div className="grid grid-cols-2 gap-0.5">
              {recipes.slice(1, 5).map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  id={recipe.id?.toString() ?? ""}
                  title={recipe.title}
                  image={recipe.image}
                  showAddButton={true}
                  cardType="square"
                />
              ))}
            </div>

            {/* Group 2: Thumbnail + 2 Squares */}
            <div className="grid grid-cols-2 gap-0.5">
              <div className="col-span-1">
                <RecipeCard
                  id={recipes[5].id?.toString() ?? ""}
                  title={recipes[5].title}
                  image={recipes[5].image}
                  showAddButton={true}
                  cardType="thumbnail"
                />
              </div>
              <div className="col-span-1 grid grid-rows-2 gap-0.5">
                {recipes.slice(6, 8).map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    id={recipe.id?.toString() ?? ""}
                    title={recipe.title}
                    image={recipe.image}
                    showAddButton={true}
                    cardType="square"
                  />
                ))}
              </div>
            </div>

            {/* Group 1 Repeated: 2x2 Grid */}
            <div className="grid grid-cols-2 gap-0.5">
              {recipes.slice(8, 12).map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  id={recipe.id?.toString() ?? ""}
                  title={recipe.title}
                  image={recipe.image}
                  showAddButton={true}
                  cardType="square"
                />
              ))}
            </div>

            {/* Group 3: 2 Squares + Thumbnail */}
            <div className="grid grid-cols-2 gap-0.5">
              <div className="col-span-1 grid grid-rows-2 gap-0.5">
                {recipes.slice(12, 14).map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    id={recipe.id?.toString() ?? ""}
                    title={recipe.title}
                    image={recipe.image}
                    showAddButton={true}
                    cardType="square"
                  />
                ))}
              </div>
              <div className="col-span-1">
                <RecipeCard
                  id={recipes[14].id?.toString() ?? ""}
                  title={recipes[14].title}
                  image={recipes[14].image}
                  showAddButton={true}
                  cardType="thumbnail"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      <Navigation />
    </div>
  )
}
