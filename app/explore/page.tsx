"use client"

import { useState, useEffect } from "react"
import Navigation from "../../components/Navigation"
import RecipeCard from "../../components/RecipeCard"
import { db, type Recipe } from "../../lib/db"

const categories = ["All", "Breakfast", "Lunch", "Dessert"]

export default function Explore() {
  const [activeCategory, setActiveCategory] = useState(categories[0])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadRecipes() {
      setIsLoading(true)
      try {
        const allRecipes = await db.recipes.toArray()
        // If "All" is selected or no recipes exist, create array of 15 items
        let filteredRecipes = activeCategory === "All" 
          ? allRecipes
          : allRecipes.filter(recipe => recipe.tags.includes(activeCategory))

        // Ensure we always have 15 cards by padding with empty recipes if needed
        const emptyRecipe: Recipe = {
          id: 0,
          title: "Add New Recipe",
          image: "/placeholder.svg",
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
                activeCategory === category ? "bg-[#DFE0E1] text-gray-800" : "bg-gray-100 text-gray-700"
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
          <div className="grid grid-cols-2 gap-0.5 bg-gray-100">
            {recipes.length > 0 ? (
              recipes.map((recipe, index) => (
                <div 
                  key={recipe.id} 
                  className={index === 0 ? "col-span-2" : ""}
                >
                  <RecipeCard
                    id={recipe.id?.toString() ?? ""}
                    title={recipe.title}
                    image={recipe.image}
                    isHero={index === 0}
                    backgroundColor={getBackgroundColor(index)}
                    showAddButton={true}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-2 flex justify-center items-center h-40">
                <p>No recipes found for {activeCategory}</p>
              </div>
            )}
          </div>
        )}
      </div>
      <Navigation />
    </div>
  )
}

function getBackgroundColor(index: number): string {
  if (index === 0) return "rgb(255, 138, 138)" // Coral for hero
  
  const colors = [
    "rgb(255, 182, 255)", // Pink
    "rgb(138, 138, 255)", // Purple
    "rgb(138, 255, 255)", // Mint
    "rgb(255, 182, 138)", // Light coral
  ]
  return colors[(index - 1) % colors.length]
}

