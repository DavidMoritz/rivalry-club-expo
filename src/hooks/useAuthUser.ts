import { generateClient } from 'aws-amplify/data';
import { Hub } from 'aws-amplify/utils';
import { useEffect, useState } from 'react';

import type { Schema } from '../../amplify/data/resource';
import { getCurrentUser } from '../lib/amplify-auth';
import { getDisplayName, getOrCreateUserUuid, getStoredUuid } from '../lib/user-identity';

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
  // Check if there's a stored UUID from an anonymous user that's being linked
  // The user MUST have an anonymous account to reach the Profile/CreateAccount screen
  const storedUuid = await getStoredUuid();

  if (!storedUuid) {
    throw new Error('No stored user UUID found. User must start as anonymous before creating a Cognito account.');
  }

  // Fetch the existing user by their stored UUID
  const userResult = await client.models.User.get({ id: storedUuid });

  throwIfErrors(userResult.errors, 'Failed to fetch user');

  if (!userResult.data) {
    throw new Error(`User not found with UUID: ${storedUuid}`);
  }

  // This is the user that was just linked (or is being linked)
  // Return it regardless of awsSub value - it will be updated by CreateAccountModal
  return userResult.data as AuthUser;
}

/**
 * Handles the anonymous user flow
 */
async function fetchAnonymousUser(client: AmplifyClient): Promise<AuthUser> {
  const uuid = await getOrCreateUserUuid();

  const getResult = await client.models.User.get({ id: uuid });

  if (getResult.data) {
    return getResult.data as AuthUser;
  }

  // Create new anonymous user
  const displayName = await getDisplayName(uuid);
  const createResult = await client.models.User.create({
    id: uuid,
    email: `${displayName}@anonymous.local`,
    firstName: displayName,
    lastName: ' ',
    role: 9, // Anonymous user role
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
          getCurrentUser()
            .then(cognitoUser => setCognitoUserId(cognitoUser.userId))
            .catch(() => setCognitoUserId(null));
          break;
        case 'signedOut':
          setCognitoUserId(null);
          break;
        default:
          // Other auth events (e.g., tokenRefresh) don't require action
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
