import { generateClient } from 'aws-amplify/data';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import type { Schema } from '../amplify/data/resource';

import { Auth } from '../src/components/screens/Auth';
import { getCurrentUser, isExpoGo } from '../src/lib/amplify-auth';

// Lazy client initialization to avoid crashes when Amplify isn't configured
let client: ReturnType<typeof generateClient<Schema>> | null = null;

function getClient() {
  if (!client) {
    client = generateClient<Schema>();
  }

  return client;
}

export default function AuthRoute() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  // Check if user has completed their profile and route accordingly
  const checkUserProfileAndNavigate = async (cognitoUserId: string) => {
    try {
      // In Expo Go, skip profile check and go directly to rivalries
      if (isExpoGo) {
        router.replace('/rivalries');

        return;
      }

      // Query for user by Cognito user ID
      const listResult = await getClient().models.User.list({
        filter: {
          awsSub: {
            eq: cognitoUserId,
          },
        },
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
