import { Hub } from 'aws-amplify/utils';
import { generateClient } from 'aws-amplify/data';
import { useEffect, useState } from 'react';

import type { Schema } from '../../amplify/data/resource';
import { getCurrentUser } from '../lib/amplify-auth';
import { getOrCreateUserUuid, generateDisplayName } from '../lib/user-identity';

interface AuthUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: number;
  awsSub: string;
}

/**
 * Custom hook that manages user creation and retrieval.
 *
 * Flow:
 * 1. Anonymous users: Creates a user with a UUID stored in Keychain
 * 2. Cognito users: Gets the authenticated Cognito user and finds/creates their DB record
 * 3. Returns the User record
 */
export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [cognitoUserId, setCognitoUserId] = useState<string | null>(null);

  // Listen for auth changes from Cognito
  useEffect(() => {
    getCurrentUser()
      .then((user) => setCognitoUserId(user.userId))
      .catch(() => setCognitoUserId(null));

    const hubListener = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          getCurrentUser()
            .then((user) => setCognitoUserId(user.userId))
            .catch(() => setCognitoUserId(null));
          break;
        case 'signedOut':
          setCognitoUserId(null);
          break;
      }
    });

    return () => hubListener();
  }, []);

  useEffect(() => {
    async function fetchOrCreateUser() {
      try {
        setIsLoading(true);
        setError(null);

        const client = generateClient<Schema>();

        // Check if user is authenticated with Cognito
        if (cognitoUserId) {
          // COGNITO USER FLOW
          const currentUser = await getCurrentUser();
          const email = currentUser.signInDetails?.loginId || '';
          const awsSub = currentUser.userId;

          // Query for existing user by Cognito awsSub
          const listResult = await client.models.User.list({
            filter: {
              awsSub: {
                eq: awsSub
              }
            }
          });

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
              awsSub,
              role: 0 // Default role for Cognito users
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
        } else {
          // ANONYMOUS USER FLOW
          const uuid = await getOrCreateUserUuid();

          // Query for existing user by ID (the UUID)
          const getResult = await client.models.User.get({ id: uuid });

          if (getResult.data) {
            // User already exists
            setUser(getResult.data as AuthUser);
          } else {
            // Create new anonymous user
            const displayName = generateDisplayName(uuid);
            const createResult = await client.models.User.create({
              id: uuid,
              email: `${displayName}@anonymous.local`, // Placeholder email
              firstName: displayName,
              lastName: ' ', // Empty space as requested
              role: 9, // Anonymous user role
              awsSub: 'anonymous' // Placeholder awsSub
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
        }
      } catch (err) {
        console.error('[useAuthUser] Error:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrCreateUser();
  }, [cognitoUserId]);

  return {
    user,
    isLoading,
    error
  };
}
