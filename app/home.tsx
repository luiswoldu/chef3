"use client"

import { useEffect, useState } from "react"
import Navigation from "@/components/Navigation"
import SearchBar from "@/components/SearchBar"
import RecipeCard from "@/components/RecipeCard"
import { Recipe } from "@/types"
import { getAllRecipes } from "@/lib/db"

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [testStatus, setTestStatus] = useState<string>("")
  
  const testConnection = async () => {
    try {
      setTestStatus("Testing...")
      const recipes = await getAllRecipes()
      console.log("Supabase test result:", recipes)
      setTestStatus(`Success! Found ${recipes.length} recipes`)
    } catch (error: any) {
      console.error("Supabase test error:", error)
      setTestStatus(`Error: ${error?.message || 'Unknown error occurred'}`)
    }
  }

  useEffect(() => {
    getAllRecipes().then(setRecipes).catch(console.error)
  }, [])

  return (
    <div className="flex flex-col min-h-screen pb-[70px]">
      <div className="fixed top-4 right-4 z-50">
        <button 
          onClick={testConnection}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Test Supabase
        </button>
        {testStatus && (
          <div className={`mt-2 p-2 rounded ${
            testStatus.includes("Success") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            {testStatus}
          </div>
        )}
      </div>
      <div className="relative w-full h-[56.4vh]">
        <RecipeCard 
          id="1" 
          title="Beef Stir Fry" 
          image={recipes && recipes[0]?.image || '/placeholder.jpg'}
          isHero
          cardType="hero"
        />
      </div>
      <SearchBar />
      <div className="flex-1 overflow-y-auto">
        <section className="py-4">
          <h2 className="text-xl font-semibold mb-2 px-4">Recents</h2>
          <div className="flex overflow-x-auto space-x-4 px-4 pb-4">
            {recipes && recipes.slice(1, 5).map((recipe: Recipe) => (
              <div key={recipe.id} className="w-48 flex-shrink-0">
                <RecipeCard 
                  id={recipe.id?.toString() || "2"} 
                  title={recipe.title} 
                  image={recipe.image}
                  cardType="thumbnail"
                />
              </div>
            ))}
          </div>
        </section>
        <section className="py-4">
          <h2 className="text-xl font-semibold mb-2 px-4">Uniquely Yours</h2>
          <div className="flex overflow-x-auto space-x-4 px-4 pb-4">
            {[6, 7, 8, 9].map(id => (
              <div key={id} className="w-48 flex-shrink-0">
                <RecipeCard 
                  id={id.toString()} 
                  title={`Recipe ${id}`} 
                  image="/placeholder.svg"
                  cardType="thumbnail"
                />
              </div>
            ))}
          </div>
        </section>
        <section className="py-4">
          <h2 className="text-xl font-semibold mb-2 px-4">All</h2>
          <div className="grid grid-cols-2 gap-4 px-4">
            {[10, 11, 12, 13, 14, 15].map(id => (
              <RecipeCard 
                key={id} 
                id={id.toString()} 
                title={`Recipe ${id}`} 
                image="/placeholder.svg"
                cardType="square"
              />
            ))}
          </div>
        </section>
      </div>
      <Navigation />
    </div>
  )
}

