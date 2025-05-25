"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navigation from "../../components/Navigation"
import { type GroceryItem } from "@/types/index"
import { Plus, User } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"
import { showNotification } from "@/hooks/use-notification"
import Image from "next/image"

export default function Cart() {
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([])
  const [newItem, setNewItem] = useState("")
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadGroceryItems()
    loadUserAvatar()
  }, [])

  const handleProfileClick = () => {
    router.push('/profile')
  }

  async function loadUserAvatar() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single()
        
        if (profile?.avatar_url) {
          setUserAvatar(profile.avatar_url)
        }
      }
    } catch (error) {
      console.error('Error loading user avatar:', error)
    }
  }

  async function loadGroceryItems() {
    try {
      const { data, error } = await supabase
        .from('grocery_items')
        .select('*')
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
    if (newItem.trim()) {
      try {
        const { error } = await supabase
          .from('grocery_items')
          .insert([{
            name: newItem,
            amount: "",
            aisle: "Other",
            purchased: false,
          }])
        
        if (error) throw error
        
        setNewItem("")
        loadGroceryItems()
        showNotification("Item added")
      } catch (error) {
        console.error('Error adding item:', error)
        showNotification("Failed to add item")
      }
    }
  }

  async function togglePurchased(id: number) {
    const item = groceryItems.find((item) => item.id === id)
    if (item) {
      try {
        const { error } = await supabase
          .from('grocery_items')
          .update({ purchased: !item.purchased })
          .eq('id', id)
        
        if (error) throw error
        loadGroceryItems()
      } catch (error) {
        console.error('Error updating item:', error)
        showNotification("Failed to update item")
      }
    }
  }

  async function clearList() {
    try {
      const { error } = await supabase
        .from('grocery_items')
        .delete()
        .neq('id', 0)
      
      if (error) throw error
      loadGroceryItems()
      showNotification("Shopping list cleared")
    } catch (error) {
      console.error('Error clearing list:', error)
      showNotification("Failed to clear shopping list")
    }
  }

  const groupedItems = groceryItems.reduce(
    (acc, item) => {
      if (!acc[item.aisle]) {
        acc[item.aisle] = []
      }
      acc[item.aisle].push(item)
      return acc
    },
    {} as Record<string, GroceryItem[]>,
  )

  return (
    <div className="flex flex-col min-h-screen pb-[70px]">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4 pr-2">
          <h1 className="text-3xl font-bold pt-[42px]">Shopping List</h1>
          <div 
            className="w-[34px] h-[34px] rounded-full overflow-hidden mt-[42px] cursor-pointer bg-gray-200 flex items-center justify-center" 
            onClick={handleProfileClick}
          >
            {userAvatar ? (
              <Image
                src={userAvatar}
                alt="User avatar"
                width={34}
                height={34}
                className="object-cover w-full h-full"
              />
            ) : (
              <User className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </div>
        <form onSubmit={addItem} className="relative mb-4">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="New grocery item"
            className="w-full p-2 pl-4 pr-12 border rounded-full focus:outline-none placeholder:text-[#9F9F9F]"
          />
          <button type="submit" className={`absolute top-1/2 right-2 transform -translate-y-1/2 flex items-center justify-center rounded-full p-1 border border-[#DFE0E1] bg-transparent`}>
            <Plus className={`w-6 h-6 ${newItem.trim() ? 'text-black' : 'text-[#B2B2B2]'}`} />
          </button>
        </form>
        <button 
          onClick={clearList} 
          className="text-[#8A8A8A] text-sm mb-4"
        >
          Clear all items
        </button>
      </div>
      <div className="flex-grow overflow-auto">
        {Object.entries(groupedItems).map(([aisle, items]) => (
          <div key={aisle} className="mb-4">
            <h2 className="text-lg font-semibold mb-2 px-4">{aisle}</h2>
            <ul>
              {items.map((item) => (
                <li key={item.id} className="flex items-center py-2 px-4">
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
        ))}
      </div>
      <Navigation />
    </div>
  )
}

