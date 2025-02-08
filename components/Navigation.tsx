"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 pb-[38px]">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {["home", "explore", "cart"].map((tab) => (
          <Link
            key={tab}
            href={`/${tab === "home" ? "" : tab}`}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              pathname === `/${tab === "home" ? "" : tab}`
                ? "bg-[#DFE0E1] text-gray-800"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Link>
        ))}
      </div>
    </nav>
  )
}

