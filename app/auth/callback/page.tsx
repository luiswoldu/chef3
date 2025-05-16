'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    async function handleAuth() {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        router.push('/login?error=Authentication failed');
        return;
      }

      // Check if profile already exists (may have been created during signup)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .single();

      // If profile doesn't exist, create it
      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: session.user.id,
            first_name: session.user.user_metadata.first_name,
            username: session.user.user_metadata.username,
            email: session.user.email,
          }]);

        if (profileError) {
          router.push('/login?error=Profile creation failed');
          return;
        }
      }

      router.push('/home');
    }

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Confirming your email...</h2>
        <p className="text-gray-600">Please wait while we complete your registration.</p>
      </div>
    </div>
  );
} 