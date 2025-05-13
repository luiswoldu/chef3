'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

interface Step5Props {
  onComplete: () => void;
  formData: {
    firstName: string;
    username: string;
    email: string;
    password: string;
  };
}

export default function Step5({ onComplete, formData }: Step5Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFinish = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Create the Auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError || !authData.user) {
        throw new Error(signUpError?.message || 'Failed to create account');
      }

      // 2. Insert profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            first_name: formData.firstName,
            username: formData.username,
            email: formData.email,
          },
        ]);

      if (profileError) {
        throw new Error(profileError.message);
      }

      // 3. Complete onboarding
      onComplete();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

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
        className="w-full max-w-sm flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
            Creating your account...
          </>
        ) : (
          'Complete Setup'
        )}
      </button>
    </div>
  );
} 