"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Loader2, Check } from "lucide-react"
import { getCurrentUser, createUserProfile, checkOnboardingStatus, getAndClearSignupData } from "@/lib/auth"
import { showNotification } from "@/hooks/use-notification"
import Image from "next/image"

export default function OnboardingProfile() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'firstName' | 'tastePreference' | 'complete'>('firstName')
  const [firstName, setFirstName] = useState('')
  const [username, setUsername] = useState('')
  const [selectedTaste, setSelectedTaste] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const tasteOptions = [
    { id: 'sweet,indulgent', label: 'Cereal with milk', image: '/onboarding-option1.jpg' },
    { id: 'savoury,healthy', label: 'Avocado toast', image: '/onboarding-option2.jpg' },
    { id: 'sweet,healthy', label: 'Yogurt & Berries', image: '/onboarding-option3.jpg' },
    { id: 'savoury,indulgent', label: 'Breakfast burrito', image: '/onboarding-option4.jpg' }
  ]

  useEffect(() => {
    async function checkAuth() {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push('/login')
          return
        }
        
        setUser(currentUser)
        
        // Try to get stored signup data first
        let signupData = null
        try {
          signupData = getAndClearSignupData(currentUser.id)
        } catch (jsonError) {
          showNotification('Error loading signup data. Proceeding with manual setup.')
        }
        
        if (signupData) {
          // User just signed up and verified email - skip to taste preference
          setFirstName(signupData.firstName)
          setUsername(signupData.username)
          setStep('tastePreference') // Skip first name, go straight to breakfast
        } else {
          // Check what onboarding steps are needed for existing users
          const status = await checkOnboardingStatus(currentUser.id)
          
          if (!status.needsOnboarding) {
            // Already completed onboarding
            router.push('/home')
            return
          }
          
          // Determine which step to show
          if (!status.hasFirstName) {
            setStep('firstName')
          } else if (!status.hasTastePreference) {
            setStep('tastePreference')
          } else {
            setStep('complete')
          }
        }
        
      } catch (error) {
        console.error('Error checking auth:', error)
        showNotification('Error loading profile. Please try again.')
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleFirstNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!firstName.trim()) {
      showNotification("Please enter your first name")
      return
    }
    
    setStep('tastePreference')
  }

  const handleTasteSelection = (tasteId: string) => {
    setSelectedTaste(tasteId)
  }

  const handleCompleteOnboarding = async () => {
    if (!selectedTaste) {
      showNotification("Please select your breakfast preference")
      return
    }

    setSubmitting(true)
    
    try {
      await createUserProfile({
        userId: user.id,
        firstName,
        username: username || '',
        email: user.email,
        tastePreference: selectedTaste
      })

      showNotification("Welcome to Hands!")
      setStep('complete')
      
      // Redirect to home after a brief delay
      setTimeout(() => {
        router.push('/home')
      }, 1500)
      
    } catch (error: any) {
      console.error('Profile creation error:', error)
      showNotification(error.message || 'Failed to complete profile setup')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-[#6CD401]" />
      </div>
    )
  }

  if (step === 'complete') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#6CD401]/10 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-[#6CD401]" />
            </div>
          </div>
          
          <div>
            <h1 className="text-3xl font-extrabold tracking-tighter mb-4 text-black">
              You're all set!
            </h1>
            <p className="text-black/60">
              Welcome to Hands, {firstName}! Let's start discovering amazing recipes.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'tastePreference') {
    return (
      <div className="flex flex-col items-center justify-start min-h-screen p-6 pt-24">
        <div className="absolute top-4 left-4">
          <button
            onClick={() => setStep('firstName')}
            className="p-2 hover:bg-black/5 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-black/60" />
          </button>
        </div>
        
        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tighter leading-none mb-2 text-black">
              What's your go-to breakfast?
            </h1>
            <p className="text-base tracking-tight text-black/60 mb-8">
              Your choice will help us understand your taste.  
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-8">
            {tasteOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleTasteSelection(option.id)}
                className={`h-32 rounded-2xl transition-all duration-200 relative overflow-hidden ${
                  selectedTaste === option.id ? 'border-4 border-[#6CD401]' : 'border-4 border-transparent'
                }`}
              >
                <div className="absolute inset-0">
                  <Image
                    src={option.image}
                    alt={option.label}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
                {selectedTaste === option.id && (
                  <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                    <Check size={16} className="text-[#6CD401]" />
                  </div>
                )}
              </button>
            ))}
          </div>
          
          <button
            onClick={handleCompleteOnboarding}
            disabled={!selectedTaste || submitting}
            className={`w-full px-6 py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium flex items-center justify-center ${
              selectedTaste 
                ? 'bg-[#6CD401] text-white hover:bg-[#6CD401]/90' 
                : 'bg-[#F7F7F7] text-gray-700 hover:bg-gray-200'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Setting up your profile...
              </>
            ) : (
              'Complete setup'
            )}
          </button>
        </div>
      </div>
    )
  }

  // First name step
  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-6 pt-24">
      <div className="absolute top-4 left-4">
        <button
          onClick={() => router.push('/home')}
          className="p-2 hover:bg-black/5 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-black/60" />
        </button>
      </div>
      
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter mb-0 text-black">
            What's your first name?
          </h1>
          <p className="text-black/60">Help us personalize your experience.</p>
        </div>

        <form className="space-y-6" onSubmit={handleFirstNameSubmit}>
          <input
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-2xl bg-[#F7F7F7] text-black/30 placeholder:text-black/30 focus:text-black text-lg"
          />

          <button
            type="submit"
            className="w-full bg-[#6CD401] text-white px-6 py-3 rounded-full hover:bg-[#6CD401]/90 transition-colors text-lg font-medium"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  )
}
