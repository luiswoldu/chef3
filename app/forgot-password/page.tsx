"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Loader2, Mail } from "lucide-react"
import { resetPassword } from "@/lib/auth"
import { showNotification } from "@/hooks/use-notification"
import Link from "next/link"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      showNotification("Please enter your email address")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      showNotification("Please enter a valid email address")
      return
    }

    setLoading(true)
    
    try {
      await resetPassword(email)
      setEmailSent(true)
    } catch (error: any) {
      console.error('Password reset error:', error)
      showNotification(error.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="flex flex-col items-center justify-start min-h-screen p-6 pt-24">
        <div className="absolute top-4 left-4">
          <button
            onClick={() => router.push("/login")}
            className="p-2 hover:bg-black/5 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-black/60" />
          </button>
        </div>
        
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#6CD401]/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-[#6CD401]" />
            </div>
          </div>
          
          <div>
            <h1 className="text-3xl font-extrabold tracking-tighter mb-4 text-black">
              Check your email
            </h1>
            <p className="text-black/60 mb-2">
              We've sent a password reset link to
            </p>
            <p className="text-black font-medium mb-6">
              {email}
            </p>
            <p className="text-black/60 text-sm">
              Click the link in the email to reset your password. The link will expire in 24 hours.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setEmailSent(false)}
              className="w-full bg-[#F7F7F7] text-black px-6 py-3 rounded-full hover:bg-gray-200 transition-colors text-lg font-medium"
            >
              Send to a different email
            </button>
            
            <p className="text-black/60 text-sm">
              Remember your password?{' '}
              <Link href="/login" className="text-[#6CD401] hover:underline font-medium">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-6 pt-24">
      <div className="absolute top-4 left-4">
        <button
          onClick={() => router.push("/login")}
          className="p-2 hover:bg-black/5 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-black/60" />
        </button>
      </div>
      
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter mb-0 text-black">
            Forgot password?
          </h1>
          <p className="text-black/60">Enter your email and we'll send you a link to reset your password.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-2xl bg-[#F7F7F7] text-black/30 placeholder:text-black/30 focus:text-black text-lg"
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6CD401] text-white px-6 py-3 rounded-full hover:bg-[#6CD401]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Sending...
              </>
            ) : (
              'Send reset link'
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-black/60">
            Remember your password?{' '}
            <Link href="/login" className="text-[#6CD401] hover:underline font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
