"use client"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
        <p className="text-3xl text-[#98E14D] font-black tracking-tighter text-center mb-14">Hands</p>
        
        <div className="space-y-5">
          <h1 className="text-5xl font-black text-black tracking-tighter leading-none">
            Your kitchen <br className="lg:hidden" />co-pilot.
          </h1> 
          <h2 className="text-3xl font-extrabold text-black tracking-tighter leading-none">
            Organize recipes, find inspiration, and shop like a pro.
          </h2>
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
        </div>
        
        <div className="px-6 py-6 text-center text-sm text-black/30">
          By continuing, you agree to our{" "}
          <Link href="/terms-of-use" className="text-black underline">
            Terms
          </Link>{" "}
          and have read our{" "}
          <Link href="/privacy" className="text-black underline">
            Privacy Policy
          </Link>
          .
        </div>
      </div>
    </div>
  )
}