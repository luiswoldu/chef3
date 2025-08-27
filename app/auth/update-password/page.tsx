"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { updatePassword } from "@/lib/auth"
import { showNotification } from "@/hooks/use-notification"

export default function UpdatePassword() {
  const [newPassword, setNewPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Handle auth callback and check session
    async function checkSession() {
      try {
        const { supabase } = await import('@/lib/supabase/client')
        
        // Check for various token formats from password reset email
        const urlParams = new URLSearchParams(window.location.search)
        const token = urlParams.get('token')
        const accessToken = urlParams.get('access_token')
        const type = urlParams.get('type')
        
        if ((token || accessToken) && type === 'recovery') {
          // Handle password reset token
          const tokenToUse = token || accessToken
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenToUse,
            type: 'recovery'
          })
          if (error) {
            console.error('Error exchanging code:', error)
            showNotification("Invalid or expired reset link")
            router.push("/forgot-password")
            return
          }
          
          if (data.session) {
            setIsValidSession(true)
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname)
          } else {
            showNotification("Invalid or expired reset link")
            router.push("/forgot-password")
            return
          }
        } else {
          // Check existing session
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session) {
            setIsValidSession(true)
          } else {
            // No valid session, redirect to forgot password
            showNotification("Invalid or expired reset link")
            router.push("/forgot-password")
            return
          }
        }
      } catch (error) {
        console.error('Error checking session:', error)
        router.push("/forgot-password")
      } finally {
        setCheckingSession(false)
      }
    }

    checkSession()
  }, [router])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newPassword.trim()) {
      showNotification("Please enter a new password")
      return
    }

    setLoading(true)
    
    try {
      await updatePassword(newPassword)
      showNotification("Password updated successfully!")
      
      // Redirect to login after a brief delay
      setTimeout(() => {
        router.push('/login')
      }, 1500)
      
    } catch (error: any) {
      console.error('Password update error:', error)
      showNotification(error.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-[#6CD401]" />
      </div>
    )
  }

  if (!isValidSession) {
    return null // Will redirect
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-6 pt-24 bg-white">
      {/* Progress bar */}
      <div className="w-full max-w-md mb-16">
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div className="bg-[#6CD401] h-1 rounded-full" style={{ width: '100%' }}></div>
        </div>
      </div>
      
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter mb-0 text-black">
            Update password
          </h1>
        </div>

        <form className="space-y-6" onSubmit={handleUpdatePassword}>
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-2xl bg-[#F7F7F7] text-black placeholder:text-gray-400 focus:text-black text-lg border-0 focus:ring-0 focus:outline-none"
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading || !newPassword.trim()}
            className="w-full bg-[#6CD401] text-white px-6 py-3 rounded-full hover:bg-[#6CD401]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Updating...
              </>
            ) : (
              'Continue'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
