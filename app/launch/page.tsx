"use client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function Launch() {
  const router = useRouter()

  const handleLogin = () => {
    router.push("/login")
  }

  const handleSignUp = () => {
    router.push("/signup")
  }

  const handleSkip = () => {
    router.push("/home")
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-6 pt-9 bg-white">
      <div className="w-full max-w-md space-y-8">
        <p className="text-3xl text-[#98E14D] font-black tracking-tighter text-center mb-24">Hands</p>
        <div className="space-y-5">
          <h1 className="text-5xl font-black text-black tracking-tighter leading-none">Dinner, sorted.</h1>
          <h2 className="text-3xl font-extrabold text-black tracking-tighter leading-none">Organize recipes, find inspiration, and shop like a pro.</h2>
        </div>
        <div className="flex flex-col space-y-4 mt-10">
          <Button
            onClick={handleLogin}
            className="w-full bg-[#6CD401] text-white py-6 text-lg rounded-full hover:bg-[#6CD401]/90"
          >
            Log in
          </Button>
          <Button
            onClick={handleSignUp}
            className="w-full py-6 text-lg text-black rounded-full bg-[#F7F7F7] hover:bg-[#F7F7F7]/90"
          >
            Sign up
          </Button>
          {/*
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="w-full py-4 text-lg text-gray-500 hover:text-gray-700 rounded-full"
          >
            Skip
          </Button>
          */}
        </div>
      </div>
    </div>
  )
}