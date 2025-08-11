"use client"
import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Plus } from "lucide-react"

export default function Navigation() {
  const pathname = usePathname() ?? ""
  const router = useRouter()
  
  const handleAddRecipe = () => {
    router.push("/add-recipe") //
  }
  
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="container mx-auto flex justify-center items-center h-16 relative gap-x-5">
        {/* Home Tab */}
        <NavItem
          tab="home"
          label="Home"
          pathname={pathname}
        />
        
        {/* Import + Recipe Button */}
        <button
          onClick={handleAddRecipe}
          className="w-[42px] h-[42px] rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-r"
          style={{
            background: "linear-gradient(90deg, #6CD401 0%, #A6E964 100%)"
          }}>
          <Plus className="h-6 w-6 text-white"/>
        </button>
        
        {/* Cart Tab */}
        <NavItem
          tab="cart"
          label="Cart"
          pathname={pathname}
        />
      </div>
    </nav>
  )
}

function NavItem({
  tab,
  label,
  pathname
}: {
  tab: string
  label: string
  pathname: string
}) {
  const isActive =
    (tab === "home" && (pathname === "/" || pathname.startsWith("/recipe/"))) ||
    pathname.startsWith(`/${tab}`)
  
  const href = tab === "home" ? "/" : `/${tab}`
  
  return (
    <Link href={href} className="relative px-5 py-2">
      {isActive && (
        <motion.div
          layoutId="active-pill"
          className="absolute inset-0 bg-[#F7F7F7] rounded-full"
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
          isActive
            ? "text-black tracking-tight font-bold"
            : "text-gray-600 font-semibold"
        }`}
      >
        {label}
      </span>
    </Link>
  )
}