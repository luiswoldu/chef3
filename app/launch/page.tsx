"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function Launch() {
  const router = useRouter()

  const handleLogin = () => {
    router.push("/login")
  }

  const handleSignUp = () => {
    router.push("/onboarding")
  }

  const handleSkip = () => {
    router.push("/home")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-white">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-extrabold text-black tracking-tight">Start your week.</h1>
          <h2 className="text-3xl font-bold text-black tracking-tight leading-none">Plan meals, find new recipes and save time cooking.</h2>
        </div>

        <div className="flex flex-col space-y-4 mt-12">
          <Button
            onClick={handleSignUp}
            className="w-full bg-black text-white py-6 text-lg rounded-full"
          >
            Sign up
          </Button>
          <Button
            onClick={handleLogin}
            className="w-full py-6 text-lg text-black rounded-full bg-[#F7F7F7] hover:bg-[#F7F7F7]/90"
          >
            Log in
          </Button>
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="w-full py-4 text-lg text-gray-500 hover:text-gray-700 rounded-full"
          >
            Skip
          </Button>
        </div>
      </div>
    </div>
  )
} 