"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Loader2, Mail } from "lucide-react"
import { signUp, resendVerificationEmail, getResendCooldownTime } from "@/lib/auth"
import { showNotification } from "@/hooks/use-notification"
import Link from "next/link"

interface FormData {
  firstName: string
  username: string
  email: string
  password: string
  confirmPassword: string
}

export default function SignUp() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'verification'>('form')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const router = useRouter()

  // Countdown timer for resend button
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (step === 'verification' && resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown(prev => {
          if (prev <= 1) {
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [step, resendCountdown])

  // Check initial resend cooldown when moving to verification step
  useEffect(() => {
    if (step === 'verification' && formData.email) {
      const { canResend, remainingSeconds } = getResendCooldownTime(formData.email)
      if (!canResend) {
        setResendCountdown(remainingSeconds)
      }
    }
  }, [step, formData.email])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      showNotification("Please enter your first name")
      return false
    }
    
    if (!formData.username.trim()) {
      showNotification("Please enter a username")
      return false
    }

    if (!formData.email.trim()) {
      showNotification("Please enter your email")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      showNotification("Please enter a valid email address")
      return false
    }

    if (formData.password.length < 6) {
      showNotification("Password must be at least 6 characters")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      showNotification("Passwords don't match")
      return false
    }

    return true
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    
    try {
      const result = await signUp({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        username: formData.username
      })

      if (result.needsEmailVerification) {
        setStep('verification')
        // Set initial cooldown
        const { remainingSeconds } = getResendCooldownTime(formData.email)
        setResendCountdown(remainingSeconds)
      } else {
        // User is automatically logged in (email confirmation disabled)
        showNotification("Account created successfully!")
        router.push('/onboarding-profile')
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      showNotification(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const handleResendEmail = async () => {
    setResendLoading(true)
    
    try {
      const result = await resendVerificationEmail(formData.email)
      
      if (result.success) {
        showNotification("Verification email sent!")
        setResendCountdown(60) // Start 60 second countdown
      } else {
        showNotification(result.error || "Failed to resend email")
        if (!result.canResend && result.nextResendTime) {
          const now = new Date()
          const remainingSeconds = Math.ceil((result.nextResendTime.getTime() - now.getTime()) / 1000)
          setResendCountdown(remainingSeconds)
        }
      }
    } catch (error: any) {
      showNotification(error.message || "Failed to resend email")
    } finally {
      setResendLoading(false)
    }
  }

  if (step === 'verification') {
    return (
      <div className="flex flex-col items-center justify-start min-h-screen p-6 pt-24">
        <div className="absolute top-4 left-4">
          <button
            onClick={() => setStep('form')}
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
              We've sent a verification link to
            </p>
            <p className="text-black font-medium mb-6">
              {formData.email}
            </p>
            <p className="text-black/60 text-sm">
              Click the link in the email to verify your account and complete your registration.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleResendEmail}
              disabled={resendLoading || resendCountdown > 0}
              className="w-full bg-[#F7F7F7] text-black px-6 py-3 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium flex items-center justify-center"
            >
              {resendLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Sending...
                </>
              ) : resendCountdown > 0 ? (
                `Resend email (${resendCountdown}s)`
              ) : (
                'Resend verification email'
              )}
            </button>
            
            <p className="text-black/60 text-sm">
              Already verified?{' '}
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
          onClick={() => router.push("/")}
          className="p-2 hover:bg-black/5 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-black/60" />
        </button>
      </div>
      
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter mb-0 text-black">
            Create your account
          </h1>
          <p className="text-black/60">Enter your details to get started.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSignUp}>
          <div className="space-y-4">
            <input
              type="text"
              name="firstName"
              placeholder="First name"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 rounded-2xl bg-[#F7F7F7] text-black placeholder:text-black/30 text-lg"
              disabled={loading}
            />
            
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 rounded-2xl bg-[#F7F7F7] text-black placeholder:text-black/30 text-lg"
              disabled={loading}
            />
            
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 rounded-2xl bg-[#F7F7F7] text-black placeholder:text-black/30 text-lg"
              disabled={loading}
            />
            
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 rounded-2xl bg-[#F7F7F7] text-black placeholder:text-black/30 text-lg"
              disabled={loading}
            />
            
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
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
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-black/60">
            Already have an account?{' '}
            <Link href="/login" className="text-[#6CD401] hover:underline font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}