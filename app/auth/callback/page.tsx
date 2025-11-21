'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const [status, setStatus] = useState('Verifying your email...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuth() {
      try {        
        // parse hash fragment (parameters after #)
        // supabase sends tokens in the URL hash for email verification
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // extracts the Supabase tokens from URL hash
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');
        const error_param = hashParams.get('error');
        const error_description = hashParams.get('error_description');
               
        // check for error parameters first
        if (error_param) {
          throw new Error(error_description || error_param);
        }
        
        // verify we have the required tokens
        if (!access_token || !refresh_token) {
          console.log('No verification tokens, redirecting to login');
          router.push('/login');
          return;
        }
        
        // start process of passing the tokens to supabase to set the session
        setStatus('Verifying your account...');
        
        // Set the session using the tokens from the hash
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }

        if (!data.session) {
          throw new Error('No session found after email verification');
        }

        const session = data.session;
        console.log('Session established for user:', session.user.id);
        setStatus('Email verified! Setting up your account...');

        // Redirect to onboarding-profile
        setStatus('Redirecting to complete your profile...');
        
        setTimeout(() => {
          router.push('/onboarding-profile');
        }, 500);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        
        setTimeout(() => {
          router.push(`/login?error=${encodeURIComponent(errorMessage)}`);
        }, 3000);
      }
    }

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        {error ? (
          <>
            <h2 className="text-2xl font-bold mb-4 text-red-600">Verification Failed</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-gray-600">Redirecting to login page...</p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">{status}</h2>
            <p className="text-gray-600">Please wait while we complete your registration.</p>
          </>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <div className="flex items-center justify-center mb-4">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Loading...</h2>
        <p className="text-gray-600">Please wait while we process your request.</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}