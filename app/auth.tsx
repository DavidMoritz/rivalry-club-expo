import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

import { Auth } from '../src/components/screens/Auth';
import { supabase } from '../src/lib/supabase';

const client = generateClient<Schema>();

export default function AuthRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [authenticated, setAuthenticated] = useState(false);

  // Check if user has completed their profile and route accordingly
  const checkUserProfileAndNavigate = async (supabaseUserId: string) => {
    try {
      // Query for user by Supabase user ID
      const listResult = await client.models.User.list({
        filter: {
          awsSub: {
            eq: supabaseUserId
          }
        }
      });

      const users = listResult.data;

      if (users && users.length > 0) {
        const user = users[0];

        // If user doesn't have a first name, redirect to profile
        if (!user.firstName || user.firstName.trim() === '') {
          console.log('[AuthRoute] User has no name, redirecting to profile');
          router.replace('/profile');
        } else {
          console.log('[AuthRoute] User profile complete, redirecting to rivalries');
          router.replace('/rivalries');
        }
      } else {
        // New user, needs to complete profile
        console.log('[AuthRoute] New user, redirecting to profile');
        router.replace('/profile');
      }
    } catch (error) {
      console.error('[AuthRoute] Error checking user profile:', error);
      // Default to rivalries on error to avoid blocking user
      router.replace('/rivalries');
    }
  };

  // Listen for auth state changes from Supabase
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthenticated(true);
        checkUserProfileAndNavigate(session.user.id);
      }
    });

    // Subscribe to auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthenticated(true);
        checkUserProfileAndNavigate(session.user.id);
      } else {
        setAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <>
      <Auth
        onAuthSuccess={async () => {
          const {
            data: { session }
          } = await supabase.auth.getSession();
          if (session?.user) {
            await checkUserProfileAndNavigate(session.user.id);
          }
        }}
      />
      <StatusBar style="light" />
    </>
  );
}
