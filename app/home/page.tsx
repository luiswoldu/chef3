"use client"

import { useEffect, useState } from "react"
import Navigation from "@/components/Navigation"
import SearchBar from "@/components/SearchBar"
import RecipeCard from "@/components/RecipeCard"
import type { Recipe } from "@/types"
import { supabase } from "@/lib/supabase/client"


export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([])
  const [heroRecipe, setHeroRecipe] = useState<Recipe | null>(null)


  
  useEffect(() => {
    // Fetch recipes
    async function loadRecipes() {
      try {
        const { data: allRecipes, error: fetchError } = await supabase
          .from('recipes')
          .select('*')
        
        if (fetchError) {
          console.error("Error fetching recipes:", fetchError)
          return
        }
        
        setRecipes(allRecipes as Recipe[] || [])
      } catch (error) {
        console.error("Error in loadRecipes:", error)
      }
    }

    loadRecipes()
  }, [])

  useEffect(() => {
    async function loadRecents() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
    
      const { data: recents, error } = await supabase
        .rpc("get_recent_recipes", { p_user_id: user.id, p_limit: 10 });
      if (error) return console.error(error);
      
      if (recents && recents.length > 0) {
        // Set the first recipe as hero recipe
        setHeroRecipe(recents[0] as Recipe);
        // Set the remaining 9 recipes for the Recents row
        setRecentRecipes(recents.slice(1) as Recipe[]);
      }
    }

    loadRecents();
  }, []);

  // Helper function to get random recipes for each section
  const getRandomRecipes = (count: number) => {
    if (!recipes || recipes.length === 0) return [];
    const shuffled = [...recipes].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  // Define sections with their titles
  const sections = [
    { title: "For You", recipes: getRandomRecipes(9) },
    { title: "Popular", recipes: getRandomRecipes(9) },
    { title: "Added Recipes", recipes: getRandomRecipes(9) },
    { title: "Summer Hits", recipes: getRandomRecipes(9) },
    { title: "How to", recipes: getRandomRecipes(9) },
    { title: "Untitled", recipes: getRandomRecipes(9) }
  ];

  return (
    <div className="flex flex-col min-h-screen pb-[70px]">
      <div className="relative w-full h-[56.4vh]">
        {heroRecipe ? (
          <RecipeCard
            id={heroRecipe.id?.toString() || "0"}
            title={heroRecipe.title || "Untitled Recipe"}
            image={heroRecipe.image || '/placeholder.svg'}
            isHero={true}
            showAddButton={true}
            cardType="hero"
            rounded="none"
          />
        ) : (
          <div className="w-full h-full bg-gray-700 animate-pulse rounded-md overflow-hidden">
            <div className="w-2/3 h-8 bg-gray-600 absolute bottom-6 left-6 rounded-md animate-shimmer"></div>
          </div>
        )}
      </div>
      <SearchBar />
      <div className="flex-1 overflow-y-auto">
        <section className="py-4">
          <h2 className="text-3xl tracking-tight font-bold mb-2 px-4">Recents</h2>
          <div className="flex overflow-x-auto space-x-2 px-4 pb-4">
            {recentRecipes && recentRecipes.length > 0 ? (
              recentRecipes.map((recipe: Recipe) => (
                <div key={recipe.id} className="w-48 flex-shrink-0">
                  <RecipeCard 
                    id={recipe.id?.toString() || "0"} 
                    title={recipe.title || "Untitled Recipe"} 
                    image={recipe.image || '/placeholder.svg'}
                    cardType="thumbnail"
                  />
                </div>
              ))
            ) : (
              <div className="flex space-x-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="w-48 h-40 flex-shrink-0 rounded-lg bg-gray-700 animate-pulse overflow-hidden">
                    <div className="w-2/3 h-4 bg-gray-600 absolute bottom-3 left-3 rounded-md animate-shimmer"></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Render all the new sections */}
        {sections.map((section, sectionIndex) => (
          <section key={section.title} className="py-4">
            <h2 className="text-3xl tracking-tight font-bold mb-2 px-4">{section.title}</h2>
            <div className="flex overflow-x-auto space-x-2 px-4 pb-4">
              {section.recipes && section.recipes.length > 0 ? (
                section.recipes.map((recipe: Recipe) => (
                  <div key={`${section.title}-${recipe.id}`} className="w-48 flex-shrink-0">
                    <RecipeCard 
                      id={recipe.id?.toString() || "0"} 
                      title={recipe.title || "Untitled Recipe"} 
                      image={recipe.image || '/placeholder.svg'}
                      cardType="thumbnail"
                    />
                  </div>
                ))
              ) : (
                <div className="flex space-x-4">
                  {[...Array(3)].map((_, index) => (
                    <div key={`${section.title}-skeleton-${index}`} className="w-48 h-40 flex-shrink-0 rounded-lg bg-gray-700 animate-pulse overflow-hidden">
                      <div className="w-2/3 h-4 bg-gray-600 absolute bottom-3 left-3 rounded-md animate-shimmer"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
      <Navigation />
    </div>
  )
} 