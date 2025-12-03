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
        console.log('[useAuthUser] No supabaseUserId yet, waiting...');
        setIsLoading(false);
        return;
      }

      try {
        console.log('[useAuthUser] Starting fetchOrCreateUser for:', supabaseUserId);
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
        console.log('[useAuthUser] Querying database for user with awsSub:', supabaseUserId);
        const listResult = await client.models.User.list({
          filter: {
            awsSub: {
              eq: supabaseUserId,
            },
          },
        });

        console.log('[useAuthUser] List result received');
        console.log('[useAuthUser] listResult.data:', listResult.data);
        console.log('[useAuthUser] listResult.errors:', listResult.errors);

        // AWS Amplify v6 returns { data: User[], errors: Error[] }
        const users = listResult.data;
        const queryErrors = listResult.errors;

        if (queryErrors && queryErrors.length > 0) {
          console.error('[useAuthUser] Query errors:', queryErrors);
          throw new Error(`Query failed: ${queryErrors[0].message}`);
        }

        console.log('[useAuthUser] Query returned', users?.length || 0, 'users');

        if (users && users.length > 0) {
          // User exists in database
          const foundUser = users[0];
          console.log('[useAuthUser] ✓ User found in database!');
          console.log('[useAuthUser]   - DynamoDB ID:', foundUser.id);
          console.log('[useAuthUser]   - Email:', foundUser.email);
          console.log('[useAuthUser]   - Name:', foundUser.firstName, foundUser.lastName);
          console.log('[useAuthUser]   - awsSub:', foundUser.awsSub);
          console.log('[useAuthUser]   - Role:', foundUser.role);
          setUser(foundUser as AuthUser);
        } else {
          // Create new user in database
          console.log('[useAuthUser] Creating new user with email:', email);

          const createResult = await client.models.User.create({
            email,
            awsSub: supabaseUserId, // Store Supabase user ID in awsSub field
            role: 0, // Default role
          });

          console.log('[useAuthUser] Create result:', JSON.stringify(createResult, null, 2));

          const newUser = createResult.data;
          const errors = createResult.errors;

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
  }, [supabaseUserId]);

  return {
    user,
    isLoading,
    error,
  };
}
