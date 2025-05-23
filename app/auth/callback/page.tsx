'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Verifying your email...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuth() {
      try {
        if (!searchParams) {
          throw new Error('No search parameters found');
        }
        // First, handle the auth callback with the URL parameters
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(
          searchParams.get('code') || ''
        );

        if (exchangeError) {
          throw exchangeError;
        }

        if (!data.session) {
          throw new Error('No session found after email verification');
        }

        const session = data.session;
        setStatus('Email verified! Setting up your profile...');

        // Check if profile already exists
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single();

        if (profileCheckError && profileCheckError.code !== 'PGRST116') {
          // If it's not the "row not found" error, it's a real error
          console.error('Profile check error:', profileCheckError);
          throw new Error('Failed to check existing profile');
        }

        // Only create profile if it doesn't exist
        if (!existingProfile) {
          const profileData = {
            id: session.user.id,
            first_name: session.user.user_metadata?.first_name || '',
            username: session.user.user_metadata?.username || '',
            email: session.user.email || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { error: profileError } = await supabase
            .from('profiles')
            .insert([profileData]);

          if (profileError) {
            console.error('Profile creation error:', profileError);
            throw new Error(`Failed to create profile: ${profileError.message}`);
          }
        }

        setStatus('Success! Redirecting to home...');
        
        // Short delay before redirect for better UX
        setTimeout(() => {
          router.push('/home');
        }, 1000);
        
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        
        // Redirect to login after error
        setTimeout(() => {
          router.push('/login?error=Authentication failed');
        }, 3000);
      }
    }

    // Only run if we have searchParams and the necessary URL parameters
    if (searchParams?.get('code')) {
      handleAuth();
    } else {
      setError('Invalid verification link');
      setTimeout(() => {
        router.push('/login?error=Invalid verification link');
      }, 3000);
    }
  }, [router, searchParams]);

  // Prevent navigation away from the auth callback page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = () => {
      window.history.pushState(null, '', window.location.href);
    };

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

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