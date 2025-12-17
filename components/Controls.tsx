"use client"

import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export function Back() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      className="
        h-11 w-11 flex items-center justify-center
        rounded-full shadow-lg bg-white" 
    >
      <ChevronLeft className="h-8 w-8" />
    </button>
  )
}

export default function Controls() {
  return (
    <div className="flex items-center gap-2">
      <Back />
    </div>
  )
}