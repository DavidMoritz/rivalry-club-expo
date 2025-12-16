import { useQueryClient } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/data';
import { Hub } from 'aws-amplify/utils';
import { useEffect, useState } from 'react';

import type { Schema } from '../../amplify/data/resource';
import { getCurrentUser } from '../lib/amplify-auth';
import { clearStoredUuid, getDisplayName, getOrCreateUserUuid, getStoredUuid, updateStoredUuid } from '../lib/user-identity';

interface AuthUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: number;
  awsSub: string;
}

type AmplifyClient = ReturnType<typeof generateClient<Schema>>;

/**
 * Throws an error if the result contains errors
 */
function throwIfErrors(
  errors: { message: string }[] | null | undefined,
  prefix: string
): void {
  if (errors && errors.length > 0) {
    throw new Error(`${prefix}: ${errors[0].message}`);
  }
}

/**
 * Handles the Cognito authenticated user flow
 */
async function fetchCognitoUser(client: AmplifyClient): Promise<AuthUser> {
  // Get the Cognito user's awsSub
  const cognitoUser = await getCurrentUser();
  const cognitoAwsSub = cognitoUser.userId;

  // Search for existing user by Cognito awsSub
  const listResult = await client.models.User.list({
    filter: {
      awsSub: {
        eq: cognitoAwsSub,
      },
    },
  });

  throwIfErrors(listResult.errors, 'Failed to search for user by awsSub');

  const existingUsers = listResult.data;

  if (existingUsers && existingUsers.length > 0) {
    // Found user with this Cognito account - update stored UUID to match
    const existingUser = existingUsers[0];
    await updateStoredUuid(existingUser.id);
    return existingUser as AuthUser;
  }

  // No user found with this awsSub - use current stored UUID (or create anonymous user)
  const storedUuid = await getStoredUuid();

  if (storedUuid) {
    // Fetch the user by stored UUID
    const userResult = await client.models.User.get({ id: storedUuid });

    if (userResult.data) return userResult.data as AuthUser;
  }

  // No stored UUID or user not found - create new anonymous user
  return await fetchAnonymousUser(client);
}

const ANONYMOUS_USER_ROLE = 9;

/**
 * Handles the anonymous user flow
 */
async function fetchAnonymousUser(client: AmplifyClient): Promise<AuthUser> {
  const uuid = await getOrCreateUserUuid();

  const getResult = await client.models.User.get({ id: uuid });

  if (getResult.data) return getResult.data as AuthUser;

  // Create new anonymous user
  const displayName = await getDisplayName(uuid);
  const createResult = await client.models.User.create({
    id: uuid,
    email: `${displayName}@anonymous.local`,
    firstName: displayName,
    lastName: ' ',
    role: ANONYMOUS_USER_ROLE,
    awsSub: 'anonymous',
  });

  throwIfErrors(createResult.errors, 'Failed to create user');

  if (!createResult.data) {
    throw new Error('User creation returned no data');
  }

  return createResult.data as AuthUser;
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
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [cognitoUserId, setCognitoUserId] = useState<string | null>(null);

  // Listen for auth changes from Cognito
  useEffect(() => {
    getCurrentUser()
      .then(cognitoUser => setCognitoUserId(cognitoUser.userId))
      .catch(() => setCognitoUserId(null));

    const hubListener = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          // Invalidate all queries to force refetch with new user data
          queryClient.invalidateQueries();
          getCurrentUser()
            .then(cognitoUser => setCognitoUserId(cognitoUser.userId))
            .catch(() => setCognitoUserId(null));
          break;
        case 'signedOut':
          // Clear stored UUID to prevent showing old user's data
          clearStoredUuid().catch(err => console.error('[useAuthUser] Error clearing UUID:', err));
          // Invalidate all queries to clear cached data
          queryClient.invalidateQueries();
          setCognitoUserId(null);
          break;
        default:
          // Other auth events (e.g., tokenRefresh) don't require action
          break;
      }
    });

    return () => hubListener();
  }, [queryClient]);

  useEffect(() => {
    async function fetchOrCreateUser() {
      try {
        setIsLoading(true);
        setError(null);

        const client = generateClient<Schema>();
        const authUser = cognitoUserId
          ? await fetchCognitoUser(client)
          : await fetchAnonymousUser(client);

        setUser(authUser);
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
    error,
  };
}
