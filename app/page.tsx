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
  const router = useRouter()

  useEffect(() => {
    console.log('App loading - checking auth...', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    })
    
    // Set loading to false immediately to prevent infinite loading
    setLoading(false)
    
    // Try to get session with a timeout
    const sessionTimeout = setTimeout(() => {
      console.log('Session check timed out, showing launch screen')
      setSession(null)
    }, 3000)
    
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        clearTimeout(sessionTimeout)
        console.log('Initial session check:', session ? 'User found' : 'No user', error)
        setSession(session)
        
        if (session) {
          console.log('Redirecting to /home')
          router.push("/home")
        }
      })
      .catch((error) => {
        clearTimeout(sessionTimeout)
        console.error('Session check error:', error)
        setSession(null)
      })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state change:', _event, session ? 'User found' : 'No user')
      setSession(session)
      if (session) {
        router.push("/home")
      }
    })

    return () => {
      clearTimeout(sessionTimeout)
      subscription.unsubscribe()
    }
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-10 w-10 animate-spin text-[#6CD401]" />
      </div>
    )
  }

  // Show Launch screen if not authenticated
  return <Launch />
} 