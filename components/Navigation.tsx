"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Plus } from "lucide-react"

export default function Navigation() {
  const pathname = usePathname() ?? ""
  const router = useRouter()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="container mx-auto flex justify-center items-center h-16 gap-x-5">
        {/* Home */}
        <NavItem tab="home" label="Home" pathname={pathname} />

        {/* + Ask */}
        <button
          aria-label="Ask"
          onClick={() => router.push("/ask")}
          className="w-[42px] h-[42px] rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(90deg, #6CD401 0%, #A6E964 100%)",
          }}
        >
          <Plus className="h-6 w-6 text-white" />
        </button>

        {/* You → /profile */}
        <NavItem tab="profile" label="You" pathname={pathname} />
      </div>
    </nav>
  )
}

function NavItem({
  tab,
  label,
  pathname,
}: {
  tab: string
  label: string
  pathname: string
}) {
  const isActive =
    tab === "home"
      ? pathname === "/" || pathname.startsWith("/recipe/")
      : pathname.startsWith(`/${tab}`)

  const href = tab === "home" ? "/" : `/${tab}`

  return (
    <Link href={href} className="relative px-5 py-2">
      {isActive && (
        <motion.div
          layoutId="active-pill"
          className="absolute inset-0 bg-[#f7f7f7] rounded-full"
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 30,
          }}
        />
      )}

      <span
        className={`relative text-base ${
          isActive
            ? "text-black font-bold tracking-tight"
            : "text-chef-grey font-semibold"
        }`}
      >
        {label}
      </span>
    </Link>
  )
}
