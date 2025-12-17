'use client';

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Loader2} from "lucide-react"
import { getCurrentUser, createUserProfile, checkOnboardingStatus, getAndClearSignupData, createTasteProfile } from "@/lib/auth"
import { createTasteVectors } from "@/lib/taste-vectorization"
import { showNotification } from "@/hooks/use-notification"

export default function Page() {
  const router = useRouter();

  // UI states
  const [step, setStep] = useState('tastePreference');
  const [selectedTaste, setSelectedTaste] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Data states
  const [user, setUser] = useState<any>(null);
  const [firstName, setFirstName] = useState('');
  const [username, setUsername] = useState('');

  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    async function auth() {
      try {
        // 1. Check whether user logged in
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);

        // 3. Check onboarding status for returning users
        const status = await checkOnboardingStatus(currentUser.id);

        if (!status.needsOnboarding) {
          router.push('/home');
          return;
        } 
        
        const signupData = getAndClearSignupData(currentUser.id);

        if (signupData) {
          setFirstName(signupData.firstName);
          setUsername(signupData.username);
          setStep('tastePreference');
        } else {
          setStep('tastePreference');
        }

      } catch (err) {
        console.error(err);
        showNotification("Error loading onboarding. Please try again.");
        router.push('/login');
      }
    }

    auth();
  }, [router]);

  const handleCompleteOnboarding = async () => {
    if (!selectedTaste) return;

    setSubmitting(true);

    try {
      console.log(username);
      await createUserProfile({
        userId: user.id,
        firstName,
        username: username || ' ',
        email: user.email
      })

      const vectors = await createTasteVectors(selectedTaste);

      await createTasteProfile(user.id, selectedTaste, vectors)
      console.log("Taste Profile Creation Success!");

      showNotification("Welcome to Hands!");
      setTimeout(() => router.push('/home'), 1500);

    } catch (err: any) {
      console.error(err);
      showNotification(err.message || "Failed to complete onboarding");
    } finally {
      setSubmitting(false);
    }
  };


  if (step === 'tastePreference') {
    return (
      <div className="flex flex-col items-center justify-start min-h-screen p-6 pt-24">

        <div className="absolute top-4 left-4">
          <button
            onClick={() => setStep('tastePreference')} 
            className="p-2 hover:bg-black/5 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-black/60" />
          </button>
        </div>

        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tighter leading-none mb-2 text-black">
              What should we know about you?
            </h1>
            <p className="text-base tracking-tight text-black/60 mb-8 leading-normal">
              For best results, tell us what your favorite meals are and what you don’t like
            </p>
          </div>

          <input
            type="text"
            value={selectedTaste}
            onChange={(e) => setSelectedTaste(e.target.value)}
            placeholder="I love spicy food, prefer vegetarian options..."
            className="w-full h-14 px-6 rounded-full bg-gray-100 text-base text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-[#6CD401]"
          />

          <button
            onClick={handleCompleteOnboarding}
            disabled={!selectedTaste || submitting}
            className={`w-full px-6 py-3 rounded-full disabled:opacity-50 transition-colors text-lg font-medium flex items-center justify-center ${
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
              'Complete'
            )}
          </button>

          <div className="flex gap-2 mt-8 overflow-x-auto pb-4">
            {[
              "I eat anything and everything except celery",
              "My favorite food is pizza, extra pineapple",
              "My kids love asian food, my daughter’s vegetarian",
              "I don't like Irish stew and I'm not crazy about cod",
              "I really love a tuna melt",
              "I don’t eat octopus ‘cause they’re super smart",
              "I love soup. Chicken tortilla soup.",
              "Love thai food, like noodle dishes like ramen",
              "I don’t like dill. I can’t stand dill",
              "big arugula salad, and I love it on top of pizza",
              "I do love lemon chicken with vegetables",
              "Couldn’t live without sushi"
            ].map((text, index) => (
              <div
                key={index}
                className="bg-[#F7F7F7] rounded-2xl flex items-center justify-center text-base leading-none text-black/80 px-4 relative flex-shrink-0"
                style={{ height: '6rem', width: '10.875rem' }}
              >
                {text}
                <button
                  onClick={() => setSelectedTaste(text)}
                  className="absolute bottom-2 right-2 p-1 hover:bg-black/5 rounded transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-black/60"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M7 17L17 7M17 7H7M17 7V17"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
