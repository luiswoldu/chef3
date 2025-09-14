"use client"

import { useState, useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import { Lock } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

// Component that uses useSearchParams
function PasswordUpdateForm() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [checked, setChecked] = useState(false)
  const [tokenVerified, setTokenVerified] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const verifyRecoveryToken = async () => {
      const accessToken = searchParams?.get("access_token")
      const refreshToken = searchParams?.get("refresh_token")
      const type = searchParams?.get("type")
      
      if (!accessToken || type !== "recovery") {
        setMessage("Invalid or missing recovery token. Please request a new password reset.")
        setTimeout(() => {
          router.replace("/login")
        }, 3000)
        return
      }
      
      try {
        // Set the session with the tokens from the URL
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ""
        })

        if (error) {
          throw error
        }

        if (data.user) {
          setTokenVerified(true)
          setMessage("")
        } else {
          throw new Error("No user found")
        }
      } catch (error) {
        console.error("Token verification error:", error)
        setMessage("Invalid or expired recovery token. Please request a new password reset.")
        setTimeout(() => {
          router.replace("/login")
        }, 3000)
        return
      }
      
      setChecked(true)
    }

    verifyRecoveryToken()
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage("")

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match")
      setIsSubmitting(false)
      return
    }

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters long")
      setIsSubmitting(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setMessage("Password updated successfully! Redirecting to login...")
      
      // Sign out the user after password update
      await supabase.auth.signOut()
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.replace("/login")
      }, 2000)
    } catch (error: any) {
      setMessage(error.message || "An error occurred while updating your password. Please try again.")
      console.error("Password update error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!checked) {
    return (
      <div className="mt-8 space-y-6">
        <p className="text-center text-gray-500">Verifying recovery token...</p>
      </div>
    )
  }

  if (!tokenVerified) {
    return (
      <div className="mt-8 space-y-6">
        <p className="text-center text-red-600">{message}</p>
      </div>
    )
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label htmlFor="newPassword" className="sr-only">
            New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="New password"
              minLength={6}
            />
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="sr-only">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Confirm password"
              minLength={6}
            />
          </div>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Updating..." : "Update password"}
        </button>
      </div>

      {message && (
        <p className={`mt-2 text-sm text-center ${
          message.includes("successfully") ? "text-green-600" : "text-red-600"
        }`}>
          {message}
        </p>
      )}
    </form>
  )
}

// Loading fallback for Suspense
function FormLoader() {
  return <div className="mt-8 space-y-6">
    <p className="text-center text-gray-500">Loading form...</p>
  </div>
}

export default function UpdatePassword() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Update your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter your new password below.
          </p>
        </div>

        <Suspense fallback={<FormLoader />}>
          <PasswordUpdateForm />
        </Suspense>
      </motion.div>
    </div>
  )
}