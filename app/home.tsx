"use client"

import { useEffect } from "react"
import Navigation from "../components/Navigation"
import SearchBar from "../components/SearchBar"
import RecipeCard from "../components/RecipeCard"
import { seedDatabase, db, Recipe } from "../lib/db"
import { useLiveQuery } from "dexie-react-hooks"

export default function HomePage() {
  useEffect(() => {
    seedDatabase().catch(error => {
      console.error("Seeding error:", error);
    });
  }, []);

  const recipes = useLiveQuery(() => db.recipes.toArray(), [])

  return (
    <div className="flex flex-col min-h-screen pb-[70px]">
      <div className="relative h-[56.4vh]">
        <RecipeCard id="1" title="Beef Stir Fry" image="/placeholder.jpg" isHero />
        <SearchBar />
      </div>
      <div className="flex-1 overflow-y-auto">
        <section className="py-4">
          <h2 className="text-xl font-semibold mb-2 px-4">Recents</h2>
          <div className="flex overflow-x-auto space-x-4 px-4 pb-4">
            {recipes && recipes.slice(1, 5).map((recipe: Recipe) => (
              <div key={recipe.id} className="w-48 flex-shrink-0">
                <RecipeCard id={recipe.id?.toString() || "2"} title={recipe.title} image={recipe.image} />
              </div>
            ))}
          </div>
        </section>
        <section className="py-4">
          <h2 className="text-xl font-semibold mb-2 px-4">Uniquely Yours</h2>
          <div className="flex overflow-x-auto space-x-4 px-4 pb-4">
            {[6, 7, 8, 9].map(id => (
              <div key={id} className="w-48 flex-shrink-0">
                <RecipeCard id={id.toString()} title={`Recipe ${id}`} image="/placeholder.svg" />
              </div>
            ))}
          </div>
        </section>
        <section className="py-4">
          <h2 className="text-xl font-semibold mb-2 px-4">All</h2>
          <div className="grid grid-cols-2 gap-4 px-4">
            {[10, 11, 12, 13, 14, 15].map(id => (
              <RecipeCard key={id} id={id.toString()} title={`Recipe ${id}`} image="/placeholder.svg" />
            ))}
          </div>
        </section>
      </div>
      <Navigation />
    </div>
  )
}

