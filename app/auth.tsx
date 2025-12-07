import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

import { Auth } from '../src/components/screens/Auth';
import { getCurrentUser } from '../src/lib/amplify-auth';

const client = generateClient<Schema>();

export default function AuthRoute() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  // Check if user has completed their profile and route accordingly
  const checkUserProfileAndNavigate = async (cognitoUserId: string) => {
    try {
      // Query for user by Cognito user ID
      const listResult = await client.models.User.list({
        filter: {
          awsSub: {
            eq: cognitoUserId
          }
        }
      });

      const users = listResult.data;

      if (users && users.length > 0) {
        const user = users[0];

        // If user doesn't have a first name, redirect to profile
        if (!user.firstName || user.firstName.trim() === '') {
          router.replace('/profile');
        } else {
          router.replace('/rivalries');
        }
      } else {
        // New user, needs to complete profile
        router.replace('/profile');
      }
    } catch (error) {
      console.error('[AuthRoute] Error checking user profile:', error);
      // Default to rivalries on error to avoid blocking user
      router.replace('/rivalries');
    }
  };

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  async function checkAuthStatus() {
    try {
      const user = await getCurrentUser();
      if (user?.userId) {
        setAuthenticated(true);
        await checkUserProfileAndNavigate(user.userId);
      }
    } catch (err) {
      // User not authenticated, stay on auth screen
      console.log('[AuthRoute] No current user');
      setAuthenticated(false);
    }
  }

  return (
    <>
      <Auth
        onAuthSuccess={async () => {
          try {
            const user = await getCurrentUser();
            if (user?.userId) {
              await checkUserProfileAndNavigate(user.userId);
            }
          } catch (err) {
            console.error('[AuthRoute] Error getting user after auth:', err);
            router.replace('/profile');
          }
        }}
      />
      <StatusBar style="light" />
    </>
  );
}
