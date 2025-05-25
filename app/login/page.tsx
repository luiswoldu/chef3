"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { showNotification } from "@/hooks/use-notification"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      showNotification("Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      if (data?.user) {
        showNotification("Welcome back!")
        router.push("/home")
      }
    } catch (error: any) {
      console.error("Error signing in:", error)
      showNotification(error.message || "Failed to sign in. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="absolute top-4 left-4">
        <button
          onClick={() => router.push("/")}
          className="p-2 hover:bg-black/5 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-black/60" />
        </button>
      </div>
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter mb-2 text-black">
            Welcome back
          </h1>
          <p className="text-black/60">Enter your credentials to access your account</p>
        </div>

        <form className="space-y-6" onSubmit={handleSignIn}>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-2xl bg-[#F7F7F7] text-black/30 placeholder:text-black/30 focus:text-black text-lg"
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-2xl bg-[#F7F7F7] text-black/30 placeholder:text-black/30 focus:text-black text-lg"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors text-lg font-medium"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="text-center">
          <p className="text-black/60">
            <Link href="/reset-password" className="text-primary hover:underline">
              Forgot password?
            </Link>
          </p>
          <p className="mt-2 text-black/60">
            <Link href="/onboarding" className="text-primary hover:underline">
              No account yet? Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 