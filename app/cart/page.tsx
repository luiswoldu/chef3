"use client"

import { useState, useEffect } from "react"
import Navigation from "../../components/Navigation"
import { db, type GroceryItem } from "../../lib/db"
import { Plus } from "lucide-react"

export default function Cart() {
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([])
  const [newItem, setNewItem] = useState("")

  useEffect(() => {
    loadGroceryItems()
  }, [])

  async function loadGroceryItems() {
    const items = await db.groceryItems.toArray()
    setGroceryItems(sortItems(items))
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
      await db.groceryItems.add({
        name: newItem,
        amount: "",
        aisle: "Other",
        purchased: false,
      })
      setNewItem("")
      loadGroceryItems()
    }
  }

  async function togglePurchased(id: number) {
    const item = groceryItems.find((item) => item.id === id)
    if (item) {
      await db.groceryItems.update(id, { purchased: !item.purchased })
      loadGroceryItems()
    }
  }

  async function clearList() {
    await db.groceryItems.clear()
    loadGroceryItems()
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
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold pt-[42px]">Shopping Cart</h1>
          <button onClick={clearList} className="text-red-500 pt-[42px]">
            Clear
          </button>
        </div>
        <form onSubmit={addItem} className="relative mb-4">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Eggs, milk, bread"
            className="w-full p-2 pl-4 pr-12 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="absolute top-1/2 right-2 transform -translate-y-1/2 flex items-center justify-center bg-[#89cff0] text-white rounded-full p-1">
            <Plus className="w-6 h-6" />
          </button>
        </form>
      </div>
      <div className="flex-grow overflow-auto">
        {Object.entries(groupedItems).map(([aisle, items]) => (
          <div key={aisle} className="mb-4">
            <h2 className="text-lg font-semibold mb-2 px-4">{aisle}</h2>
            <ul>
              {items.map((item) => (
                <li key={item.id} className="flex items-start p-4 border-b">
                  <button
                    onClick={() => item.id && togglePurchased(item.id)}
                    className={`w-[38px] h-[38px] rounded-full mr-4 flex-shrink-0 flex items-center justify-center border-2 ${
                      item.purchased ? "bg-green-500 border-green-500" : "border-gray-300"
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

