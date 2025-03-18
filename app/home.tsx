"use client"

import { useEffect, useState } from "react"
import Navigation from "@/components/Navigation"
import SearchBar from "@/components/SearchBar"
import RecipeCard from "@/components/RecipeCard"
import type { Recipe } from "@/types"
import { getAllRecipes } from "@/lib/db"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [testStatus, setTestStatus] = useState<string>("")
  const [debugInfo, setDebugInfo] = useState<any>(null)
  
  const testConnection = async () => {
    try {
      setTestStatus("Testing...")
      console.log("[DEBUG] Starting test connection...")
      console.log("[DEBUG] Supabase client state:", supabase)
      
      const recipes = await getAllRecipes()
      console.log("[DEBUG] getAllRecipes result:", recipes)
      setTestStatus(`Success! Found ${recipes.length} recipes`)
      
      // Also try direct query
      console.log("[DEBUG] Attempting direct query...")
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
      
      if (error) {
        console.error("[DEBUG] Direct query error:", error)
        setTestStatus(`Error with direct query: ${error.message}`)
        setDebugInfo({ type: 'query', error })
      } else {
        console.log("[DEBUG] Direct query result:", data)
        setTestStatus(`Success! Direct query found ${data?.length || 0} recipes`)
        setDebugInfo({ type: 'query', data })
      }
    } catch (error: any) {
      console.error("[DEBUG] Supabase test error:", error)
      console.error("[DEBUG] Error stack:", error.stack)
      setTestStatus(`Error: ${error?.message || 'Unknown error occurred'}`)
      setDebugInfo({ type: 'test', error: error?.message || 'Unknown error' })
    }
  }

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
        
        console.log("Loaded recipes:", allRecipes)
        setRecipes(allRecipes || [])
      } catch (error) {
        console.error("Error in loadRecipes:", error)
      }
    }

    loadRecipes()
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
        {debugInfo && (
          <div className="mt-2 bg-gray-100 p-2 rounded max-h-40 overflow-auto text-xs">
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
      <div className="relative w-full h-[56.4vh] bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-4xl font-bold mb-4">Discover Amazing Recipes</h1>
            <p className="text-lg text-gray-200">Find, save, and share your favorite recipes</p>
          </div>
        </div>
      </div>
      <SearchBar />
      <div className="flex-1 overflow-y-auto">
        <section className="py-4">
          <h2 className="text-xl font-semibold mb-2 px-4">Recents</h2>
          <div className="flex overflow-x-auto space-x-4 px-4 pb-4">
            {recipes && recipes.length > 0 ? (
              recipes.map((recipe: any) => (
                <div key={recipe.id} className="w-48 flex-shrink-0">
                  <RecipeCard 
                    id={recipe.id?.toString() || "0"} 
                    title={recipe.title || "Untitled Recipe"} 
                    image={recipe.image || ''}
                    cardType="thumbnail"
                  />
                </div>
              ))
            ) : (
              <div className="w-full text-center py-8 text-gray-500">
                No recipes found. Visit the <Link href="/test-recipes" className="text-blue-500 hover:underline">Recipe Tester</Link> to add recipes.
              </div>
            )}
          </div>
        </section>
        
        {recipes && recipes.length > 0 && (
          <section className="py-4">
            <h2 className="text-xl font-semibold mb-2 px-4">Uniquely Yours</h2>
            <div className="flex overflow-x-auto space-x-4 px-4 pb-4">
              {recipes.slice(0, 4).map((recipe: any) => (
                <div key={`unique-${recipe.id}`} className="w-48 flex-shrink-0">
                  <RecipeCard 
                    id={recipe.id.toString()} 
                    title={recipe.title} 
                    image={recipe.image || '/placeholder.svg'}
                    cardType="thumbnail"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {recipes && recipes.length > 0 && (
          <section className="py-4">
            <h2 className="text-xl font-semibold mb-2 px-4">All</h2>
            <div className="grid grid-cols-2 gap-4 px-4">
              {recipes.slice(0, 6).map((recipe: any) => (
                <RecipeCard 
                  key={`all-${recipe.id}`} 
                  id={recipe.id.toString()} 
                  title={recipe.title} 
                  image={recipe.image || '/placeholder.svg'}
                  cardType="square"
                />
              ))}
            </div>
          </section>
        )}
      </div>
      <Navigation />
    </div>
  )
}

