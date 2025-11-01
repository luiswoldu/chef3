'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { checkOnboardingStatus } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Verifying your email...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuth() {
      try {
        console.log('Auth callback started');
        
        // Check if searchParams is available
        if (!searchParams) {
          console.error('Search parameters not available');
          throw new Error('Search parameters not available');
        }

        // First, handle the auth callback with the URL parameters
        const code = searchParams.get('code');
        const error_param = searchParams.get('error');
        const error_description = searchParams.get('error_description');
        
        console.log('URL params:', { code: !!code, error_param, error_description });
        
        // Check for error parameters first
        if (error_param) {
          throw new Error(error_description || error_param);
        }
        
        if (!code) {
          // If no code but no error either, user might have clicked verification link without params
          // Redirect to login instead of showing error
          console.log('No verification code, redirecting to login');
          router.push('/login');
          return;
        }

        setStatus('Verifying your account...');
        console.log('Exchanging code for session');
        
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        console.log('Exchange result:', { 
          hasData: !!data, 
          hasSession: !!data?.session, 
          hasUser: !!data?.user,
          error: exchangeError 
        });

        if (exchangeError) {
          console.error('Exchange error:', exchangeError);
          throw exchangeError;
        }

        if (!data.session || !data.user) {
          throw new Error('Email verification failed - no valid session created');
        }

        const session = data.session;
        console.log('Session established for user:', session.user.id);
        setStatus('Email verified! Setting up your account...');

        // For new users after email verification, always redirect to onboarding
        // The onboarding-profile page will handle checking existing profile data
        setStatus('Redirecting to complete your profile...');
        
        // Shorter delay for better UX
        setTimeout(() => {
          console.log('Redirecting to onboarding-profile');
          router.push('/onboarding-profile');
        }, 500);
        
      } catch (err) {
        console.error('Auth callback error:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        console.error('Error details:', errorMessage);
        setError(errorMessage);
        
        // Redirect to login after error with more info
        setTimeout(() => {
          console.log('Redirecting to login due to error');
          router.push(`/login?error=${encodeURIComponent(errorMessage)}`);
        }, 3000);
      }
    }

    handleAuth();
  }, [router, searchParams]);


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