"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { checkOnboardingStatus } from "@/lib/auth"
import { Session } from "@supabase/supabase-js"
import Launch from "./launch/page"
import { Loader } from "lucide-react"

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
      setInitialLoad(false)
      
      // If session exists, redirect to home page
      // Home page will handle onboarding check if needed
      if (session) {
        router.push("/home")
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      
      // Redirect to home page when signed in
      if (session) {
        router.push("/home")
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (loading || initialLoad) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-10 w-10 animate-spin text-[#6CD401]" />
      </div>
    )
  }

  // Only show Launch screen if we're sure there's no session
  if (!session) {
    return <Launch />
  }

  // This shouldn't render, but just in case
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader className="h-10 w-10 animate-spin text-[#6CD401]" />
    </div>
  )
} 