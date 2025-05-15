"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navigation from "../../components/Navigation"
import { User, Settings, ArrowLeft, LogOut, Trash2 } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

export default function Profile() {
  const [userName, setUserName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadUserProfile()
  }, [])

  async function loadUserProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email ?? null)
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setUserName(profile.username || profile.full_name)
          setUserAvatar(profile.avatar_url)
        }
      } else {
        // Not logged in, redirect to login
        router.push('/login')
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      toast({
        title: "Error",
        description: "Failed to load profile information",
      })
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      toast({
        title: "Success",
        description: "Logged out successfully",
      })
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
      toast({
        title: "Error",
        description: "Failed to log out",
      })
    }
  }

  const handleDeleteAccount = async () => {
    // Show browser confirmation dialog
    const isConfirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    )

    if (!isConfirmed) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const response = await fetch('/api/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Error deleting account:", data)
        toast({
          title: "Error",
          description: `Failed: ${data.error}`,
        })
        return
      }

      // Sign out the user locally
      await supabase.auth.signOut()
      
      toast({
        title: "Success",
        description: "Account deleted successfully!",
      })
      
      router.push('/login')
    } catch (error) {
      console.error('Network or JSON error:', error)
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
      })
    }
  }

  const goBack = () => {
    router.back()
  }

  return (
    <div className="flex flex-col min-h-screen pb-[70px]">
      <div className="p-4">
        <button 
          onClick={goBack}
          className="flex items-center text-gray-600 mt-[42px] mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          <span>Back</span>
        </button>
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-[80px] h-[80px] rounded-full overflow-hidden mb-4">
            {userAvatar ? (
              <Image
                src={userAvatar}
                alt="User avatar"
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <User className="w-10 h-10 text-gray-400" />
              </div>
            )}
          </div>
          
          <h1 className="text-2xl font-bold">{userName || "User"}</h1>
          <p className="text-gray-600">{userEmail}</p>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="w-5 h-5 text-gray-600 mr-3" />
              <span>Account Settings</span>
            </div>
            <span className="text-gray-400">→</span>
          </div>
          
          <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center">
              <User className="w-5 h-5 text-gray-600 mr-3" />
              <span>Edit Profile</span>
            </div>
            <span className="text-gray-400">→</span>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full p-4 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center justify-between text-left"
          >
            <div className="flex items-center">
              <LogOut className="w-5 h-5 text-red-500 mr-3" />
              <span className="text-red-500">Logout</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>

          <button
            onClick={handleDeleteAccount}
            className="w-full p-4 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center justify-between text-left"
          >
            <div className="flex items-center">
              <Trash2 className="w-5 h-5 text-red-600 mr-3" />
              <span className="text-red-600">Delete Account</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>
        </div>
      </div>
      <Navigation />
    </div>
  )
} 