'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

interface Step6Props {
  onComplete: () => void;
  formData: {
    firstName: string;
    username: string;
    email: string;
    password: string;
    tastePreference: string;
  };
}

export default function Step6({ onComplete, formData }: Step6Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create the Auth user and send confirmation email
      // Don't create the profile yet - we'll do that after email verification
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            username: formData.username,
            taste_preference: formData.tastePreference,
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
        }
      });

      if (signUpError) throw signUpError;
      if (!authData.user?.id) throw new Error('No user ID returned from signup');

      // Show success message - don't try to sign in or create profile here
      setEmailSent(true);
      
    } catch (err) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="flex flex-col items-center space-y-6 p-6">
        <h2 className="text-2xl font-bold text-gray-900">Check your email!</h2>
        <p className="text-gray-600 text-center">
          We've sent a confirmation link to {formData.email}. Please click the link to verify your email address and complete your registration.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      <h2 className="text-2xl font-bold text-gray-900">Ready to start cooking?</h2>
      <p className="text-gray-600 text-center">
        Your account is about to be created. Click below to finish setup and start exploring recipes!
      </p>

      {error && (
        <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={handleFinish}
        disabled={loading}
        className="w-full max-w-sm flex items-center justify-center px-6 py-3 bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
            Creating your account...
          </>
        ) : (
          'Complete'
        )}
      </button>
    </div>
  );
} 