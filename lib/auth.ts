import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

export interface AuthError extends Error {
  message: string
}

export interface SignUpData {
  email: string
  password: string
  firstName: string
  username: string
}

export interface LoginData {
  email: string
  password: string
}

export interface ResendEmailResult {
  success: boolean
  error?: string
  canResend: boolean
  nextResendTime?: Date
}

// Sign up new user with email verification
export async function signUp({ email, password, firstName, username }: SignUpData) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      // Handle specific signup errors
      if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
        throw new Error('An account with this email already exists. Please try signing in instead.')
      }
      throw error
    }

    // Supabase returns success even for existing emails (for security)
    // But if the user already exists and is confirmed, data.user will be null
    // If user exists but is not confirmed, data.user will exist but data.session will be null
    if (!data.user && !data.session) {
      // User already exists and is confirmed - Supabase silently ignores duplicate signups
      throw new Error('An account with this email already exists. Please try signing in instead.')
    }

    // Store signup data in localStorage to use after email verification
    if (data.user) {
      localStorage.setItem(`signup_data_${data.user.id}`, JSON.stringify({
        firstName,
        username,
        email
      }))
    }

    return {
      user: data.user,
      session: data.session,
      needsEmailVerification: !data.session && data.user,
      signupData: { firstName, username, email }
    }
  } catch (error) {
    throw new Error((error as AuthError).message || 'Failed to create account')
  }
}

// Sign in existing user
export async function signIn({ email, password }: LoginData) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    return {
      user: data.user,
      session: data.session
    }
  } catch (error) {
    throw new Error((error as AuthError).message || 'Failed to sign in')
  }
}

// Sign out user
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    throw new Error((error as AuthError).message || 'Failed to sign out')
  }
}

// Send password reset email
export async function resetPassword(email: string) {
  try {
    // Supabase handles email validation internally
    // If the email doesn't exist in auth.users, Supabase won't send an email
    // but will still return success for security reasons
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`
    })
    
    if (error) throw error
    
    // Always show success message for security - don't reveal if email exists
  } catch (error) {
    throw new Error((error as AuthError).message || 'Failed to send reset email')
  }
}

// Update password (called from reset password page)
export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    if (error) throw error
  } catch (error) {
    throw new Error((error as AuthError).message || 'Failed to update password')
  }
}

// Resend verification email with rate limiting
export async function resendVerificationEmail(email: string): Promise<ResendEmailResult> {
  const RESEND_COOLDOWN = 60000 // 1 minute in milliseconds
  const STORAGE_KEY = `email_resend_${email}`
  
  try {
    // Check rate limiting
    const lastSentStr = localStorage.getItem(STORAGE_KEY)
    if (lastSentStr) {
      const lastSent = new Date(lastSentStr)
      const now = new Date()
      const timeDiff = now.getTime() - lastSent.getTime()
      
      if (timeDiff < RESEND_COOLDOWN) {
        const nextResendTime = new Date(lastSent.getTime() + RESEND_COOLDOWN)
        return {
          success: false,
          error: `Please wait ${Math.ceil((RESEND_COOLDOWN - timeDiff) / 1000)} seconds before requesting another email`,
          canResend: false,
          nextResendTime
        }
      }
    }

    // Attempt to resend
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error

    // Update rate limiting timestamp
    localStorage.setItem(STORAGE_KEY, new Date().toISOString())
    
    return {
      success: true,
      canResend: true
    }
  } catch (error) {
    return {
      success: false,
      error: (error as AuthError).message || 'Failed to resend verification email',
      canResend: true
    }
  }
}

// Get current user session
export async function getCurrentUser() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user || null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Get user profile from database with timeout
export async function getUserProfile(userId: string): Promise<Profile | null> {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Profile query timeout')), 5000)
    )
    
    const queryPromise = supabase
      .from('Users')
      .select('*')
      .eq('id', userId)
      .single()
    
    const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('relation "public.Users" does not exist')) {
        // Profile doesn't exist or table doesn't exist
        console.log('Users table does not exist or user not found')
        return null
      }
      throw error
    }

    return data
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

// Create user profile
export async function createUserProfile({
  userId,
  firstName,
  username,
  email,
  tastePreference
}: {
  userId: string
  firstName: string
  username?: string
  email: string
  tastePreference?: string
}) {
  try {
    
    // Map taste preference strings to integers for database storage
    const tasteMap: { [key: string]: number } = {
      'sweet,indulgent': 1,      // Cereal with milk
      'savoury,healthy': 2,      // Avocado toast  
      'sweet,healthy': 3,        // Yogurt & Berries
      'savoury,indulgent': 4     // Breakfast burrito
    }
    
    const tastePreferenceValue = tastePreference ? tasteMap[tastePreference] || null : null
    
    const { data, error } = await supabase
      .from('Users')
      .insert({
        id: userId,
        first_name: firstName,
        username: username || null,
        email,
        taste_preference: tastePreferenceValue,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      // If profile already exists, try to update it instead
      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        return await updateUserProfile(userId, {
          first_name: firstName,
          username: username || null,
          taste_preference: tastePreferenceValue as any
        })
      }
      throw error
    }

    return data
  } catch (error) {
    throw new Error((error as AuthError).message || 'Failed to create user profile')
  }
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'first_name' | 'username' | 'taste_preference'>>
) {
  try {
    // Convert taste preference to integer if it exists
    const updatedData = { ...updates }
    if (updatedData.taste_preference && typeof updatedData.taste_preference === 'string') {
      updatedData.taste_preference = parseInt(updatedData.taste_preference) as any
    }
    
    const { data, error } = await supabase
      .from('Users')
      .update(updatedData)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    throw new Error((error as AuthError).message || 'Failed to update user profile')
  }
}

// Check if user needs onboarding (profile incomplete) with fast fallback
export async function checkOnboardingStatus(userId: string): Promise<{
  needsOnboarding: boolean
  hasFirstName: boolean
  hasTastePreference: boolean
}> {
  try {
    
    // Add overall timeout for the entire check
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Onboarding check timeout')), 3000)
    )
    
    const checkPromise = (async () => {
      const profile = await getUserProfile(userId)
      
      if (!profile) {
        return {
          needsOnboarding: true,
          hasFirstName: false,
          hasTastePreference: false
        }
      }

      const hasFirstName = Boolean(profile.first_name?.trim())
      const hasTastePreference = Boolean(profile.taste_preference !== null && profile.taste_preference !== undefined && profile.taste_preference.trim().length > 0)      
      return {
        needsOnboarding: !hasFirstName || !hasTastePreference,
        hasFirstName,
        hasTastePreference
      }
    })()
    
    return await Promise.race([checkPromise, timeoutPromise]) as any
    
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    // If there's any error (including timeout), assume user needs onboarding
    return {
      needsOnboarding: true,
      hasFirstName: false,
      hasTastePreference: false
    }
  }
}

// Get stored signup data and clear it
export function getAndClearSignupData(userId: string): { firstName: string; username: string; email: string } | null {
  const STORAGE_KEY = `signup_data_${userId}`
  
  try {
    const dataStr = localStorage.getItem(STORAGE_KEY)
    
    if (!dataStr) {
      return null
    }
    
    const data = JSON.parse(dataStr)
    
    // Validate the data structure
    if (!data || typeof data !== 'object') {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    
    localStorage.removeItem(STORAGE_KEY) // Clear after reading
    return data
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY) // Clear corrupted data
    return null
  }
}

// Calculate remaining time for resend cooldown
export function getResendCooldownTime(email: string): { canResend: boolean; remainingSeconds: number } {
  const RESEND_COOLDOWN = 60000 // 1 minute
  const STORAGE_KEY = `email_resend_${email}`
  
  const lastSentStr = localStorage.getItem(STORAGE_KEY)
  if (!lastSentStr) {
    return { canResend: true, remainingSeconds: 0 }
  }

  const lastSent = new Date(lastSentStr)
  const now = new Date()
  const timeDiff = now.getTime() - lastSent.getTime()
  
  if (timeDiff >= RESEND_COOLDOWN) {
    return { canResend: true, remainingSeconds: 0 }
  }

  const remainingSeconds = Math.ceil((RESEND_COOLDOWN - timeDiff) / 1000)
  return { canResend: false, remainingSeconds }
}
