"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn, checkOnboardingStatus, resendVerificationEmail, getResendCooldownTime } from "@/lib/auth"
import { showNotification } from "@/hooks/use-notification"
import Link from "next/link"
import { ChevronLeft, Loader2 } from "lucide-react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendLoading, setResendLoading] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const handleResendVerification = async () => {
    if (!email.trim()) {
      showNotification("Please enter your email address")
      return
    }

    setResendLoading(true)
    try {
      const result = await resendVerificationEmail(email)
      
      if (result.success) {
        showNotification("Verification email sent! Check your inbox.")
        setResendCooldown(60) // Start 60 second countdown
        
        // Clear any existing timer
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
        
        // Start countdown timer
        timerRef.current = setInterval(() => {
          setResendCooldown(prev => {
            if (prev <= 1) {
              if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
              }
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        showNotification(result.error || "Failed to send verification email")
        if (result.nextResendTime) {
          const remainingMs = result.nextResendTime.getTime() - Date.now()
          setResendCooldown(Math.ceil(remainingMs / 1000))
        }
      }
    } catch (error: any) {
      showNotification(error.message || "Failed to send verification email")
    } finally {
      setResendLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      showNotification("Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      const { user, session } = await signIn({ email, password })
      
      if (user && session) {
        // Check if user needs onboarding before redirecting
        try {
          const onboardingStatus = await checkOnboardingStatus(user.id)
          if (onboardingStatus.needsOnboarding) {
            router.push('/onboarding-profile')
            return
          }
        } catch (error) {
          // Continue to home if there's an error
        }
        
        showNotification("Welcome back!")
        router.push("/home")
      }
    } catch (error: any) {
      
      // Check if this is an email verification error
      if (error.message?.includes('Email not confirmed') || 
          error.message?.includes('email_not_confirmed') ||
          error.message?.includes('not confirmed') ||
          error.message?.includes('confirm')) {
        setShowEmailVerification(true)
        // Check cooldown status
        const cooldownStatus = getResendCooldownTime(email)
        setResendCooldown(cooldownStatus.remainingSeconds)
      } else {
        showNotification(error.message || "Failed to sign in. Please check your credentials.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-6 pt-24">
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
          <h1 className="text-3xl font-extrabold tracking-tighter mb-0 text-black">
            Welcome back
          </h1>
          <p className="text-black/60">Enter your details to log in.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSignIn}>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-2xl bg-[#F7F7F7] text-black placeholder:text-black/30 text-lg"
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-2xl bg-[#F7F7F7] text-black placeholder:text-black/30 text-lg"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6CD401] text-white px-6 py-3 rounded-full hover:bg-[#6CD401]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Logging in...
              </>
            ) : (
              "Log in"
            )}
          </button>
        </form>

        {/* Email Verification Prompt */}
        {showEmailVerification && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
            <h3 className="text-lg font-semibold text-black mb-2">
              Please verify your email
            </h3>
            <p className="text-black/70 mb-4">
              We sent a verification email to <strong>{email}</strong>. Please check your inbox and click the verification link.
            </p>
            
            <button
              onClick={handleResendVerification}
              disabled={resendLoading || resendCooldown > 0}
              className="w-full bg-[#6CD401] text-white px-4 py-2 rounded-full hover:bg-[#6CD401]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
            >
              {resendLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Sending...
                </>
              ) : resendCooldown > 0 ? (
                `Resend in ${resendCooldown}s`
              ) : (
                'Resend verification email'
              )}
            </button>
            
            <button
              onClick={() => setShowEmailVerification(false)}
              className="mt-2 text-black/60 hover:text-black transition-colors text-sm"
            >
              Try logging in again
            </button>
          </div>
        )}

        <div className="text-center">
          <p className="text-black/60">
            <Link href="/forgot-password" className="text-[#9F9F9F] hover:underline">
              Forgot password?
            </Link>
          </p>
          <p className="mt-2 text-black/60">
            <Link href="/signup" className="text-[#B2B2B2] hover:underline">
              No account yet? <span className="font-medium text-[#6CD401]">Sign Up</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}