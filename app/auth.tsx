import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';

import { Auth } from '../src/components/screens/Auth';
import { supabase } from '../src/lib/supabase';

export default function AuthRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [authenticated, setAuthenticated] = useState(false);

  // Listen for auth state changes from Supabase
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuthenticated(true);
        // Navigate to rivalries once authenticated
        router.replace('/rivalries');
      }
    });

    // Subscribe to auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuthenticated(true);
        router.replace('/rivalries');
      } else {
        setAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <>
      <Auth onAuthSuccess={() => router.replace('/rivalries')} />
      <StatusBar style="light" />
    </>
  );
}
