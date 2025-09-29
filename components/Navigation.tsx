"use client"
import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Fragment, useState } from "react"
import { Dialog, Transition } from "@headlessui/react"
import AddRecipePanel from "./AddRecipePanel"

export default function Navigation() {
  const pathname = usePathname() ?? ""
  const router = useRouter()

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  
  const handleAddRecipe = () => {
    router.push("/add-recipe") //
  }
  
  return (
    <>
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
            aria-label="Add recipe"
            onClick={() => setIsSheetOpen(true)}
            className="w-[42px] h-[42px] rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-r"
            style={{ background: "linear-gradient(90deg, #6CD401 0%, #A6E964 100%)" }}
          >
            <Plus className="h-6 w-6 text-white" />
        </button>
        
        {/* Cart Tab */}
        <NavItem
          tab="cart"
          label="Cart"
          pathname={pathname}
        />
      </div>
    </nav>
    <Transition.Root show={isSheetOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setIsSheetOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4"
                enterTo="opacity-100 translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-4"
              >
                <Dialog.Panel className="w-full transform rounded-t-2xl bg-white p-0 text-left align-middle shadow-xl transition-all">
                  {/* embedded=true: panel will render inline expanded UI (no duplicate fixed sheet) */}
                  <AddRecipePanel onClose={() => setIsSheetOpen(false)} embedded={true} />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
      </>
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
          className="absolute inset-0 bg-[#f7f7f7] rounded-full"
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