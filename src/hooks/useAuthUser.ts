import { generateClient } from 'aws-amplify/data';
import { useEffect, useState } from 'react';

import type { Schema } from '../../amplify/data/resource';
import { supabase } from '../lib/supabase';

interface AuthUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: number;
  awsSub: string;
}

/**
 * Custom hook that manages user creation and retrieval after Supabase authentication.
 *
 * Flow:
 * 1. Gets the authenticated Supabase user
 * 2. Queries the AppSync database for a User record matching the Supabase user ID
 * 3. If no User exists, creates one with the Supabase user's email and ID
 * 4. Returns the User record
 */
export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);

  // Listen for auth changes from Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUserId(session?.user?.id || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchOrCreateUser() {
      if (!supabaseUserId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Get Supabase user email
        const {
          data: { user: supabaseUser },
        } = await supabase.auth.getUser();
        const email = supabaseUser?.email || '';

        // Generate AppSync client
        const client = generateClient<Schema>();

        // Query for existing user by Supabase user ID (stored in awsSub field)
        const listResult = await client.models.User.list({
          filter: {
            awsSub: {
              eq: supabaseUserId,
            },
          },
        });

        // AWS Amplify v6 returns { data: User[], errors: Error[] }
        const users = listResult.data;
        const queryErrors = listResult.errors;

        if (queryErrors && queryErrors.length > 0) {
          throw new Error(`Query failed: ${queryErrors[0].message}`);
        }

        if (users && users.length > 0) {
          // User exists in database
          const foundUser = users[0];
          setUser(foundUser as AuthUser);
        } else {
          // Create new user in database
          const createResult = await client.models.User.create({
            email,
            awsSub: supabaseUserId, // Store Supabase user ID in awsSub field
            role: 0, // Default role
          });

          const newUser = createResult.data;
          const errors = createResult.errors;

          if (errors && errors.length > 0) {
            throw new Error(`Failed to create user: ${errors[0].message}`);
          }

          if (newUser) {
            setUser(newUser as AuthUser);
          } else {
            throw new Error('User creation returned no data');
          }
        }
      } catch (err) {
        console.error('[useAuthUser] Error:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrCreateUser();
  }, [supabaseUserId]);

  return {
    user,
    isLoading,
    error,
  };
}
