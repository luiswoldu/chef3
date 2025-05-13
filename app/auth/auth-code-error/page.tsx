"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function AuthCodeError() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Authentication Error</h1>
        <p className="text-gray-600">
          There was a problem with the authentication process. This could be because:
        </p>
        <ul className="text-left list-disc list-inside text-gray-600 space-y-2">
          <li>The authentication link has expired</li>
          <li>The link was already used</li>
          <li>The link is invalid</li>
        </ul>
        <Button
          onClick={() => router.push("/")}
          className="w-full bg-[#FCD609] hover:bg-[#FCD609]/90 text-black"
        >
          Return to Login
        </Button>
      </div>
    </div>
  )
} 