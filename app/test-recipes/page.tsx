'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

export default function TestRecipesPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recipeCount, setRecipeCount] = useState<number | null>(null)
  const [allTables, setAllTables] = useState<string[]>([])
  const [recipesList, setRecipesList] = useState<any[]>([])
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [newRecipe, setNewRecipe] = useState({ 
    title: 'Garlic Chilli Scorched Rice',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=1000&auto=format&fit=crop',
    caption: 'Delicious Korean-inspired rice dish with a crispy bottom and spicy garlic flavors',
    tags: ['Korean', 'Spicy', 'Rice Dish'],
    steps: ['Cook rice according to package instructions', 'Mix with garlic and chili sauce', 'Press into hot pan and let bottom get crispy', 'Serve hot with toppings'],
    ingredients: []
  })

  useEffect(() => {
    async function checkSupabaseConnection() {
      try {
        // Check connection
        const { data: tableData, error: tableError } = await supabase
          .from('recipes')
          .select('count(*)', { count: 'exact' })
        
        if (tableError) {
          console.error('Error checking table:', tableError)
          setError(`Supabase connection error: ${tableError.message}`)
          setDebugInfo({ type: 'connection', error: tableError })
          return
        }
        
        setRecipeCount(tableData[0]?.count || 0)
        
        // List all tables
        const { data: tablesData, error: tablesError } = await supabase
          .rpc('get_tables')
          .select('*')
        
        if (tablesError && tablesError.message !== 'function get_tables() does not exist') {
          console.error('Error listing tables:', tablesError)
          setAllTables(['Error listing tables'])
        } else if (tablesError) {
          // Function doesn't exist, try another approach
          setAllTables(['Could not list tables - function not available'])
        } else {
          setAllTables(tablesData.map((t: any) => t.name))
        }
        
        // Try to list all recipes
        const { data: recipes, error: recipesError } = await supabase
          .from('recipes')
          .select('*')
        
        if (recipesError) {
          console.error('Error listing recipes:', recipesError)
          setDebugInfo({ type: 'listing', error: recipesError })
        } else {
          setRecipesList(recipes || [])
        }
      } catch (err: any) {
        console.error('Unexpected error:', err)
        setError(`Unexpected error: ${err.message}`)
        setDebugInfo({ type: 'unexpected', error: err })
      } finally {
        setLoading(false)
      }
    }
    
    checkSupabaseConnection()
  }, [])
  
  const handleAddRecipe = async () => {
    try {
      setLoading(true)
      
      // Insert new recipe
      const { data, error } = await supabase
        .from('recipes')
        .insert([{
          id: 2, // Force ID to be 2
          title: newRecipe.title,
          image: newRecipe.image,
          caption: newRecipe.caption,
          tags: newRecipe.tags,
          steps: newRecipe.steps,
          ingredients: newRecipe.ingredients
        }])
        .select()
      
      if (error) {
        console.error('Error adding recipe:', error)
        setError(`Error adding recipe: ${error.message}`)
        setDebugInfo({ type: 'insert', error })
        return
      }
      
      console.log('Recipe added:', data)
      
      // Refresh data
      const { data: refreshData, error: refreshError } = await supabase
        .from('recipes')
        .select('*')
      
      if (refreshError) {
        console.error('Error refreshing data:', refreshError)
      } else {
        setRecipesList(refreshData || [])
        setRecipeCount((refreshData || []).length)
      }
    } catch (err: any) {
      console.error('Unexpected error adding recipe:', err)
      setError(`Unexpected error adding recipe: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Testing Supabase Connection...</h1>
        <div className="animate-pulse p-4 bg-gray-100 rounded-lg flex justify-center">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Database Info</h2>
          <p className="mb-2"><span className="font-medium">Recipe Count:</span> {recipeCount !== null ? recipeCount : 'Unknown'}</p>
          
          <h3 className="font-medium mt-4 mb-2">Available Tables:</h3>
          {allTables.length > 0 ? (
            <ul className="list-disc pl-5">
              {allTables.map((table, i) => (
                <li key={i}>{table}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No tables found or unable to list tables</p>
          )}
          
          <h3 className="font-medium mt-4 mb-2">Recipes:</h3>
          {recipesList.length > 0 ? (
            <div className="overflow-auto max-h-60">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-2 py-1 border bg-gray-50 text-left">ID</th>
                    <th className="px-2 py-1 border bg-gray-50 text-left">Title</th>
                  </tr>
                </thead>
                <tbody>
                  {recipesList.map((recipe) => (
                    <tr key={recipe.id}>
                      <td className="px-2 py-1 border">{recipe.id}</td>
                      <td className="px-2 py-1 border">{recipe.title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No recipes found</p>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Add Recipe</h2>
          <p className="mb-4">Add the Garlic Chilli Scorched Rice recipe to your database.</p>
          
          <button
            onClick={handleAddRecipe}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Recipe'}
          </button>
          
          <div className="mt-4">
            <h3 className="font-medium mb-2">Recipe Preview:</h3>
            <div className="bg-gray-50 p-3 rounded">
              <p><span className="font-medium">Title:</span> {newRecipe.title}</p>
              <p><span className="font-medium">Tags:</span> {newRecipe.tags.join(', ')}</p>
              <p><span className="font-medium">Caption:</span> {newRecipe.caption}</p>
            </div>
          </div>
        </div>
      </div>
      
      {debugInfo && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Debug Information</h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
            <pre className="text-sm">{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        </div>
      )}
      
      <div className="mt-6 flex justify-center">
        <Link href="/" className="text-blue-500 hover:underline">
          Return to Home
        </Link>
      </div>
    </div>
  )
} 