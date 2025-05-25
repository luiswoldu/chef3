"use client"

import { useState, useEffect } from "react"
import Navigation from "../../components/Navigation"
import RecipeCard from "../../components/RecipeCard"
import { supabase } from "../../lib/supabase/client"
import type { Database } from "@/types/supabase"

type Recipe = Database['public']['Tables']['recipes']['Row']

const categories = ["All", "Breakfast", "Lunch", "Dessert"]

export default function Explore() {
  const [activeCategory, setActiveCategory] = useState(categories[0])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadRecipes() {
      setIsLoading(true)
      try {
        const { data: allRecipes, error } = await supabase
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
                recipe.tags?.includes(activeCategory)
              )

        // Sort recipes by creation date (newest first)
        filteredRecipes.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        // Remove the slice limitation - show all recipes
        setRecipes(filteredRecipes)
      } catch (error) {
        console.error("Error fetching recipes:", error)
        setRecipes([])
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
        ) : recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p>No recipes found</p>
            <p className="text-sm mt-2">Try a different category or add some recipes</p>
          </div>
        ) : (
          <div className="space-y-0.5 bg-gray-100">
            {/* Hero Card */}
            {recipes.length > 0 && (
              <RecipeCard
                id={recipes[0]?.id?.toString() ?? ""}
                title={recipes[0]?.title ?? ""}
                image={recipes[0]?.image ?? "/placeholder.svg"}
                isHero={true}
                showAddButton={true}
                cardType="hero"
                rounded="none"
              />
            )}

            {/* Render remaining recipes in repeating pattern groups */}
            {(() => {
              const remainingRecipes = recipes.slice(1)
              const groups = []
              let index = 0

              while (index < remainingRecipes.length) {
                // Group 1: 2x2 Grid (4 recipes)
                if (index < remainingRecipes.length) {
                  const groupRecipes = remainingRecipes.slice(index, index + 4)
                  if (groupRecipes.length > 0) {
                    groups.push(
                      <div key={`grid-${index}`} className="grid grid-cols-2 gap-0.5">
                        {groupRecipes.map((recipe) => (
                          <RecipeCard
                            key={recipe.id}
                            id={recipe.id?.toString() ?? ""}
                            title={recipe.title ?? ""}
                            image={recipe.image ?? "/placeholder.svg"}
                            showAddButton={true}
                            cardType="square"
                            rounded="none"
                          />
                        ))}
                      </div>
                    )
                  }
                  index += 4
                }

                // Group 2: Thumbnail + 2 Squares (3 recipes)
                if (index < remainingRecipes.length) {
                  const groupRecipes = remainingRecipes.slice(index, index + 3)
                  if (groupRecipes.length >= 3) {
                    groups.push(
                      <div key={`thumb-squares-${index}`} className="grid grid-cols-2 gap-0.5">
                        <div className="col-span-1">
                          <RecipeCard
                            id={groupRecipes[0]?.id?.toString() ?? ""}
                            title={groupRecipes[0]?.title ?? ""}
                            image={groupRecipes[0]?.image ?? "/placeholder.svg"}
                            showAddButton={true}
                            cardType="thumbnail"
                            rounded="none"
                          />
                        </div>
                        <div className="col-span-1 grid grid-rows-2 gap-0.5">
                          {groupRecipes.slice(1, 3).map((recipe) => (
                            <RecipeCard
                              key={recipe.id}
                              id={recipe.id?.toString() ?? ""}
                              title={recipe.title ?? ""}
                              image={recipe.image ?? "/placeholder.svg"}
                              showAddButton={true}
                              cardType="square"
                              rounded="none"
                            />
                          ))}
                        </div>
                      </div>
                    )
                    index += 3
                  } else if (groupRecipes.length > 0) {
                    // Handle remaining recipes as a simple grid if less than 3
                    groups.push(
                      <div key={`remaining-${index}`} className="grid grid-cols-2 gap-0.5">
                        {groupRecipes.map((recipe) => (
                          <RecipeCard
                            key={recipe.id}
                            id={recipe.id?.toString() ?? ""}
                            title={recipe.title ?? ""}
                            image={recipe.image ?? "/placeholder.svg"}
                            showAddButton={true}
                            cardType="square"
                            rounded="none"
                          />
                        ))}
                      </div>
                    )
                    break
                  }
                }

                // Group 3: 2 Squares + Thumbnail (3 recipes)
                if (index < remainingRecipes.length) {
                  const groupRecipes = remainingRecipes.slice(index, index + 3)
                  if (groupRecipes.length >= 3) {
                    groups.push(
                      <div key={`squares-thumb-${index}`} className="grid grid-cols-2 gap-0.5">
                        <div className="col-span-1 grid grid-rows-2 gap-0.5">
                          {groupRecipes.slice(0, 2).map((recipe) => (
                            <RecipeCard
                              key={recipe.id}
                              id={recipe.id?.toString() ?? ""}
                              title={recipe.title ?? ""}
                              image={recipe.image ?? "/placeholder.svg"}
                              showAddButton={true}
                              cardType="square"
                              rounded="none"
                            />
                          ))}
                        </div>
                        <div className="col-span-1">
                          <RecipeCard
                            id={groupRecipes[2]?.id?.toString() ?? ""}
                            title={groupRecipes[2]?.title ?? ""}
                            image={groupRecipes[2]?.image ?? "/placeholder.svg"}
                            showAddButton={true}
                            cardType="thumbnail"
                            rounded="none"
                          />
                        </div>
                      </div>
                    )
                    index += 3
                  } else if (groupRecipes.length > 0) {
                    // Handle remaining recipes as a simple grid if less than 3
                    groups.push(
                      <div key={`remaining-${index}`} className="grid grid-cols-2 gap-0.5">
                        {groupRecipes.map((recipe) => (
                          <RecipeCard
                            key={recipe.id}
                            id={recipe.id?.toString() ?? ""}
                            title={recipe.title ?? ""}
                            image={recipe.image ?? "/placeholder.svg"}
                            showAddButton={true}
                            cardType="square"
                            rounded="none"
                          />
                        ))}
                      </div>
                    )
                    break
                  }
                }
              }

              return groups
            })()}
          </div>
        )}
      </div>
      <Navigation />
    </div>
  )
}
