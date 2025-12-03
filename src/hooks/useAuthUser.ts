import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { generateClient } from 'aws-amplify/data';
import { useEffect, useState } from 'react';

import type { Schema } from '../../amplify/data/resource';

interface AuthUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: number;
  awsSub: string;
}

/**
 * Custom hook that manages user creation and retrieval after Cognito authentication.
 *
 * Flow:
 * 1. Gets the authenticated Cognito user from Amplify
 * 2. Queries the database for a User record matching the Cognito awsSub
 * 3. If no User exists, creates one with the Cognito user's email and awsSub
 * 4. Returns the User record
 */
export function useAuthUser() {
  const { user: amplifyUser } = useAuthenticator();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchOrCreateUser() {
      if (!amplifyUser?.username) {
        console.log('[useAuthUser] No amplifyUser.username yet, waiting...');
        setIsLoading(false);
        return;
      }

      try {
        console.log('[useAuthUser] Starting fetchOrCreateUser for:', amplifyUser.username);
        setIsLoading(true);
        setError(null);

        // Generate client inside the effect after Amplify is configured
        const client = generateClient<Schema>();

        // Query for existing user by Cognito awsSub
        console.log('[useAuthUser] Querying database for user with awsSub:', amplifyUser.username);
        const { data: users, errors: queryErrors } = await client.models.User.list({
          filter: {
            awsSub: {
              eq: amplifyUser.username,
            },
          },
        });

        if (queryErrors && queryErrors.length > 0) {
          console.error('[useAuthUser] Query errors:', queryErrors);
          throw new Error(`Query failed: ${queryErrors[0].message}`);
        }

        console.log('[useAuthUser] Query returned', users?.length || 0, 'users');

        if (users && users.length > 0) {
          // User exists in database
          console.log('[useAuthUser] User found in database:', users[0].id);
          setUser(users[0] as AuthUser);
        } else {
          // Create new user in database
          const email = amplifyUser.signInDetails?.loginId || '';
          console.log('[useAuthUser] Creating new user with email:', email);

          const { data: newUser, errors } = await client.models.User.create({
            email,
            awsSub: amplifyUser.username,
            role: 0, // Default role
          });

          if (errors && errors.length > 0) {
            console.error('[useAuthUser] Create user errors:', errors);
            throw new Error(`Failed to create user: ${errors[0].message}`);
          }

          if (newUser) {
            console.log('[useAuthUser] User created successfully:', newUser.id);
            setUser(newUser as AuthUser);
          } else {
            console.error('[useAuthUser] User creation returned no data');
            throw new Error('User creation returned no data');
          }
        }
      } catch (err) {
        console.error('[useAuthUser] Error in fetchOrCreateUser:', err);
        if (err instanceof Error) {
          console.error('[useAuthUser] Error message:', err.message);
          console.error('[useAuthUser] Error stack:', err.stack);
        }
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrCreateUser();
  }, [amplifyUser?.username, amplifyUser?.signInDetails?.loginId]);

  return {
    user,
    isLoading,
    error,
    amplifyUser,
  };
}
