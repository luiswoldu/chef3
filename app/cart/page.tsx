"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navigation from "../../components/Navigation"
import { type GroceryItem } from "@/types/index"
import { Plus, User, Trash2, Loader } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { showNotification } from "@/hooks/use-notification"
import Image from "next/image"

export default function Cart() {
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([])
  const [newItem, setNewItem] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  // const [userAvatar, setUserAvatar] = useState<string | null>(null)
  // const [sortState, setSortState] = useState<'default' | 'loading' | 'sorted'>('default')
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
      const { data, error } = await supabase
        .from('grocery_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      setGroceryItems(sortItems(data || []))
    } catch (error) {
      console.error('Error loading grocery items:', error)
      showNotification("Failed to load shopping list")
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

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (newItem.trim() && currentUser) {
      try {
        const { error } = await supabase
          .from('grocery_items')
          .insert([{
            name: newItem,
            amount: "",
            details: "",
            aisle: "",
            purchased: false,
            user_id: currentUser.id,
            created_at: new Date().toISOString()
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
        .eq('user_id', currentUser.id) // Delete all items for this user
      
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
        
        <div className="flex items-center justify-end pr-1">
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
      <div className="flex-grow overflow-auto">
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
      </div>
      <Navigation />
    </div>
  )
}