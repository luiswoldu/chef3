"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

// Define the tabs for the respective app pages
const tabs = ["home", "explore", "cart"]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="container mx-auto flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const isActive =
            (pathname === "/" && tab === "home") ||
            pathname?.includes(tab)

          return (
            <Link
              key={tab}
              href={tab === "home" ? "/" : `/${tab}`}
              className={`flex flex-col items-center px-4 py-2 text-sm transition-colors ${
                isActive ? "text-blue-500 font-semibold" : "text-gray-500"
              }`}
            >
              <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

