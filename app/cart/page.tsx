"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navigation from "../../components/Navigation"
import { type GroceryItem } from "@/types/index"
import { Plus, User, Trash2, Loader } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { showNotification } from "@/hooks/use-notification"

// New interfaces for recipe data
interface RecipeInfo {
  id: number
  title: string
  image: string | null
}

export default function Cart() {
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([])
  const [recipes, setRecipes] = useState<RecipeInfo[]>([])
  const [newItem, setNewItem] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({}) // Track image loading by recipe ID
  const [groupByRecipe, setGroupByRecipe] = useState(true)
  const router = useRouter()

  useEffect(() => {
    initializeUser()
    // loadUserAvatar()
  }, [])

  async function initializeUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        console.error('Error getting user:', error)
        // Don't redirect on error, just log it
        return
      }
      
      if (!user) {
        // Only redirect if we're sure there's no user
        console.log('No user found, redirecting to login')
        router.push('/login')
        return
      }
      
      console.log('User found:', user.id)
      setCurrentUser(user)
      loadGroceryItems(user.id)
    } catch (error) {
      console.error('Error initializing user:', error)
      // Don't redirect on catch, might be temporary network issue
    }
  }

  // const handleProfileClick = () => {
  //   router.push('/profile')
  // }

  // async function loadUserAvatar() {
  //   try {
  //     const { data: { user } } = await supabase.auth.getUser()
  //     if (user) {
  //       const { data: profile } = await supabase
  //         .from('profiles')
  //         .select('avatar_url')
  //         .eq('id', user.id)
  //         .single()
  //       
  //       if (profile?.avatar_url) {
  //         setUserAvatar(profile.avatar_url)
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error loading user avatar:', error)
  //   }
  // }

  async function loadGroceryItems(userId: string) {
    try {
      setLoading(true)
      
      // Load grocery items with recipe_id
      const { data: groceryData, error: groceryError } = await supabase
        .from('grocery_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      
      if (groceryError) throw groceryError
      
      // Get unique recipe IDs from grocery items
      const recipeIds = Array.from(new Set(
        groceryData
          ?.filter(item => item.recipe_id !== null)
          .map(item => item.recipe_id)
      ))
      
      // Load recipe data for those IDs
      if (recipeIds.length > 0) {
        const { data: recipeData, error: recipeError } = await supabase
          .from('recipes')
          .select('id, title, image')
          .in('id', recipeIds as number[])
        
        if (recipeError) throw recipeError
        
        // Initialize image loading state for each recipe with an image
        const imageLoadingState: Record<number, boolean> = {}
        recipeData?.forEach(recipe => {
          if (recipe.image) {
            imageLoadingState[recipe.id] = true
          }
        })
        setImageLoading(imageLoadingState)
        
        setRecipes(recipeData || [])
        console.log("Loaded recipes:", recipeData?.length || 0)
      }
      
      setGroceryItems(sortItems(groceryData || []))
    } catch (error) {
      console.error('Error loading grocery items:', error)
      showNotification("Failed to load shopping list")
    } finally {
      setLoading(false)
    }
  }

  function sortItems(items: GroceryItem[]) {
    return items.sort((a, b) => {
      if (a.purchased === b.purchased) {
        return 0
      }
      return a.purchased ? 1 : -1
    })
  }

  function groupItemsByRecipe(items: GroceryItem[]) {
    const grouped: Record<string, GroceryItem[]> = {
      'unassigned': []
    }
    
    items.forEach(item => {
      if (item.recipe_id) {
        const key = `recipe-${item.recipe_id}`
        if (!grouped[key]) {
          grouped[key] = []
        }
        grouped[key].push(item)
      } else {
        grouped['unassigned'].push(item)
      }
    })
    
    return grouped
  }

  function getRecipeInfo(recipeId: number) {
    return recipes.find(r => r.id === recipeId) || null
  }

  // Handle image load events
  const handleImageLoad = (recipeId: number) => {
    console.log(`✅ Image loaded successfully for recipe ID: ${recipeId}`)
    setImageLoading(prev => ({
      ...prev,
      [recipeId]: false
    }))
  }

  // Handle image error events  
  const handleImageError = (recipeId: number) => {
    console.error(`❌ Image failed to load for recipe ID: ${recipeId}`)
    setImageLoading(prev => ({
      ...prev,
      [recipeId]: false
    }))
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (newItem.trim() && currentUser) {
      try {
        const { error } = await supabase
          .from('grocery_items')
          .insert([{
            user_id: currentUser.id,
            name: newItem,
            amount: "",
            purchased: false,
          }])
        
        if (error) throw error
        
        setNewItem("")
        loadGroceryItems(currentUser.id)
        showNotification("Item added")
      } catch (error) {
        console.error('Error adding item:', error)
        showNotification("Failed to add item")
      }
    }
  }

  async function togglePurchased(id: number) {
    const item = groceryItems.find((item) => item.id === id)
    if (item && currentUser) {
      try {
        const { error } = await supabase
          .from('grocery_items')
          .update({ purchased: !item.purchased })
          .eq('id', id)
          .eq('user_id', currentUser.id)
        
        if (error) throw error
        loadGroceryItems(currentUser.id)
      } catch (error) {
        console.error('Error updating item:', error)
        showNotification("Failed to update item")
      }
    }
  }

  async function clearList() {
    if (!currentUser) return
    
    try {
      const { error } = await supabase
        .from('grocery_items')
        .delete()
        .eq('user_id', currentUser.id)
      
      if (error) throw error
      loadGroceryItems(currentUser.id)
      showNotification("Shopping list cleared")
    } catch (error) {
      console.error('Error clearing list:', error)
      showNotification("Failed to clear shopping list")
    }
  }

  // const handleSort = async () => {
  //   setSortState('loading')
  //   
  //   // Simulate sorting process - replace with actual logic later
  //   setTimeout(() => {
  //     setSortState('sorted')
  //   }, 2000)
  // }

  return (
    <div className="flex flex-col min-h-screen pb-[70px]">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4 pr-1.5">
          <h1 className="text-3xl font-bold pt-2 tracking-tight">Shopping List</h1>
          {/* Profile avatar commented out - will be relocated */}
          {/* <div 
        className="w-[34px] h-[34px] mt-1.5 rounded-full border border-[#F4F4F4] overflow-hidden  cursor-pointer bg-[#FFFFFF] flex items-center justify-center"
onClick={handleProfileClick}
          >
            <Image
              src={userAvatar || "/avatar.png"}
              alt="User avatar"
              width={34}
              height={34}
              className="object-cover w-full h-full"
            />
          </div> */}
        </div>
        <form onSubmit={addItem} className="relative mb-4">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="New grocery item"
            className="w-full p-2 pl-4 pr-12 border rounded-full focus:outline-none placeholder:text-[#9F9F9F]"
          />
          <button type="submit" className={`absolute top-1/2 right-1.5 transform -translate-y-1/2 flex items-center justify-center rounded-full p-1 border border-[#DFE0E1] bg-transparent`}>
            <Plus className={`w-6 h-6 ${newItem.trim() ? 'text-black' : 'text-[#B2B2B2]'}`} />
          </button>
        </form>
        
        <div className="flex items-center justify-between pr-1 mb-2">
          <button 
            onClick={() => setGroupByRecipe(!groupByRecipe)}
            className="px-4 py-1 rounded-full text-sm border border-gray-200"
            aria-label="Toggle grouping"
          >
            {groupByRecipe ? "Show All Items" : "Group by Recipe"}
          </button>

          <button 
            onClick={clearList}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Clear all items"
          >
            <Trash2 className="w-6 h-6 text-[#9f9f9f]" />
          </button>
          
          {/* Sort button commented out for simplification */}
          {/* <button 
            onClick={handleSort}
            disabled={sortState === 'loading'}
            className={`px-8 py-2 rounded-full text-base font-semibold transition-colors ${
              sortState === 'default' 
                ? 'bg-[#F7F7F7] text-[#58575C] hover:bg-gray-200' 
                : sortState === 'loading'
                ? 'bg-[#F7F7F7] text-[#58575C] cursor-not-allowed'
                : 'bg-[#6CD401]/10 text-[#6ED308]'
            }`}
          >
            <div className="flex items-center gap-2">
              {sortState === 'loading' && <Loader className="w-4 h-4 animate-spin" />}
              <span>
                {sortState === 'default' ? 'Sort' : sortState === 'loading' ? 'Sort' : 'Sorted'}
              </span>
            </div>
          </button> */}
        </div>
      </div>
      
      {/* Shopping list content */}
      <div className="flex-grow overflow-auto">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {groupByRecipe ? (
              // Grouped view with recipe images
              <div className="space-y-6">
                {Object.entries(groupItemsByRecipe(groceryItems)).map(([key, items]) => {
                  const isRecipe = key.startsWith('recipe-')
                  const recipeId = isRecipe ? Number(key.replace('recipe-', '')) : null
                  const recipe = recipeId ? getRecipeInfo(recipeId) : null
                  
                  return (
                    <div key={key} className={`${isRecipe ? 'bg-gray-50 rounded-t-3xl pb-3' : ''}`}>
                      {/* Recipe header with image */}
                      {isRecipe && recipe && (
                        <div className="mb-2">
                          {recipe.image ? (
                            <div className="relative w-full overflow-hidden px-4">
                              <div className="relative w-full h-[68px] overflow-hidden rounded-3xl">
                                {imageLoading[recipe.id] && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                    <Loader className="h-8 w-8 animate-spin text-gray-400" />
                                  </div>
                                )}
                                <img 
                                  src={recipe.image} 
                                  alt={recipe.title}
                                  className="w-full h-full object-cover" 
                                  onLoad={() => handleImageLoad(recipe.id)}
                                  onError={() => handleImageError(recipe.id)}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="h-4"></div>
                          )}
                          <h3 className="font-bold text-lg px-4 py-2">{recipe.title}</h3>
                        </div>
                      )}
                      
                      {/* Group title if not a recipe */}
                      {!isRecipe && items.length > 0 && (
                        <h3 className="font-medium text-gray-500 px-4 pb-1">
                          Other Items
                        </h3>
                      )}
                      
                      {/* Item list */}
                      <ul>
                        {items.map((item) => (
                          <li key={item.id} className={`flex items-center py-1 px-4 ${isRecipe ? 'border-l-4 border-[#6CD401]' : ''}`}>
                            <button
                              onClick={() => item.id && togglePurchased(item.id)}
                              className={`w-[38px] h-[38px] rounded-full mr-4 flex-shrink-0 flex items-center justify-center border-2 ${
                                item.purchased ? "bg-[#6CD401] border-[#6CD401]" : "border-gray-300"
                              }`}
                            >
                              {item.purchased && (
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            <div className={item.purchased ? "line-through text-gray-500" : ""}>
                              <p className="font-medium">{item.name}</p>
                              {item.amount && <p className="text-sm text-gray-600">{item.amount}</p>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            ) : (
              // Original flat view
              <ul>
                {groceryItems.map((item) => (
                  <li key={item.id} className="flex items-center py-1 px-4">
                    <button
                      onClick={() => item.id && togglePurchased(item.id)}
                      className={`w-[38px] h-[38px] rounded-full mr-4 flex-shrink-0 flex items-center justify-center border-2 ${
                        item.purchased ? "bg-[#6CD401] border-[#6CD401]" : "border-gray-300"
                      }`}
                    >
                      {item.purchased && (
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <div className={item.purchased ? "line-through text-gray-500" : ""}>
                      <p className="font-medium">{item.name}</p>
                      {item.amount && <p className="text-sm text-gray-600">{item.amount}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
      <Navigation />
    </div>
  )
}