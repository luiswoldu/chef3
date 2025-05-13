"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"

// Define the tabs for the respective app pages
const tabs = ["home", "explore", "cart"]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="container mx-auto flex justify-around items-center h-16 relative">
        {tabs.map((tab) => {
          const isActive =
            (pathname === "/" && tab === "home") ||
            pathname?.includes(tab)

          return (
            <Link
              key={tab}
              href={tab === "home" ? "/" : `/${tab}`}
              className="relative px-7 py-2.5"
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-gray-100 rounded-full"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30
                  }}
                />
              )}
              <span
                className={`relative text-base ${
                  isActive ? "text-gray-900 tracking-tight font-bold" : "text-gray-600 font-semibold"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

