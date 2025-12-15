# Anonymous-to-Authenticated User Pattern

## Overview

This document describes the pattern for allowing users to start using an Expo + TypeScript + Amplify Gen 2 app immediately as anonymous users, then optionally create a full account later. The key benefit is frictionless onboarding - users can start using the app without signing up, and all their data persists when they later create an account.

## Architecture

### User Flow

1. **First Launch**: User opens app → Anonymous user created automatically with UUID stored in device Keychain/AsyncStorage
2. **Using App**: User creates data (rivalries, tier lists, etc.) tied to their anonymous user record
3. **Optional Account Creation**: User chooses "Create Account" → Enters email/password → Existing anonymous user is **updated** (not replaced) with Cognito awsSub
4. **Future Sessions**: User signs in → App fetches their existing user record with all historical data intact

### Key Principle

**One user, one database record, one UUID.** Never create duplicate users. The device's stored UUID is the source of truth for identity.

## Implementation

### 1. Database Schema

Your Amplify Gen 2 User model should include:

```graphql
type User @model {
  id: ID!
  email: String!
  firstName: String
  lastName: String
  role: Int!           # 0 = Cognito user, 9 = anonymous user, 13 = NPC, etc.
  awsSub: String!      # Cognito user ID, or "anonymous" for anonymous users
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  deletedAt: AWSDateTime
}
```

### 2. User Identity Management (`src/lib/user-identity.ts`)

Create utilities to manage the device-stored UUID:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getItemAsync, setItemAsync, deleteItemAsync } from 'expo-secure-store';

const UUID_KEYCHAIN_KEY = 'yourAppUserUuid';
const UUID_STORAGE_KEY = 'userUuid';

export function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function generateDisplayName(uuid: string): string {
  const shortId = uuid.replace(/-/g, '').substring(0, 5);
  return `Player_${shortId}`;
}

export async function getOrCreateUserUuid(): Promise<string> {
  // Try AsyncStorage first (faster)
  let uuid = await AsyncStorage.getItem(UUID_STORAGE_KEY);
  if (uuid) return uuid;

  // Try Keychain (persists across reinstalls)
  uuid = await getItemAsync(UUID_KEYCHAIN_KEY);
  if (uuid) {
    await AsyncStorage.setItem(UUID_STORAGE_KEY, uuid);
    return uuid;
  }

  // Generate new UUID
  uuid = generateUuid();
  await Promise.all([
    setItemAsync(UUID_KEYCHAIN_KEY, uuid),
    AsyncStorage.setItem(UUID_STORAGE_KEY, uuid),
  ]);

  return uuid;
}

export async function getStoredUuid(): Promise<string | null> {
  let uuid = await AsyncStorage.getItem(UUID_STORAGE_KEY);
  if (uuid) return uuid;

  uuid = await getItemAsync(UUID_KEYCHAIN_KEY);
  if (uuid) {
    await AsyncStorage.setItem(UUID_STORAGE_KEY, uuid);
    return uuid;
  }

  return null;
}

export async function clearStoredUuid(): Promise<void> {
  await Promise.all([
    deleteItemAsync(UUID_KEYCHAIN_KEY),
    AsyncStorage.removeItem(UUID_STORAGE_KEY),
  ]);
}
```

### 3. Authentication Hook (`src/hooks/useAuthUser.ts`)

**CRITICAL**: This hook handles both anonymous and Cognito users. The key insight is that when a Cognito user is detected, we **must** fetch by stored UUID, not by awsSub, to avoid race conditions.

```typescript
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

function throwIfErrors(errors: { message: string }[] | null | undefined, prefix: string): void {
  if (errors && errors.length > 0) {
    throw new Error(`${prefix}: ${errors[0].message}`);
  }
}

async function fetchCognitoUser(client: AmplifyClient): Promise<AuthUser> {
  // CRITICAL: Fetch by stored UUID, not by awsSub
  // This prevents duplicate user creation during account linking
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

  return { user, isLoading, error };
}
```

### 4. Amplify Auth Wrapper (`src/lib/amplify-auth.ts`)

Simple wrapper around Amplify auth functions:

```typescript
import {
  signUp as amplifySignUp,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  confirmSignUp as amplifyConfirmSignUp,
  getCurrentUser as amplifyGetCurrentUser,
} from 'aws-amplify/auth';

export const signUp = amplifySignUp;
export const signIn = amplifySignIn;
export const signOut = amplifySignOut;
export const confirmSignUp = amplifyConfirmSignUp;
export const getCurrentUser = amplifyGetCurrentUser;
```

### 5. Create Account Modal (`src/components/screens/CreateAccountModal.tsx`)

Modal for creating a Cognito account and linking it to the existing anonymous user:

```typescript
import { generateClient } from 'aws-amplify/data';
import { useState } from 'react';
import { ActivityIndicator, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { Schema } from '../../../amplify/data/resource';
import { confirmSignUp, getCurrentUser, signIn, signUp } from '../../lib/amplify-auth';

interface CreateAccountModalProps {
  visible: boolean;
  currentUserId: string; // The anonymous user's UUID
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateAccountModal({
  visible,
  currentUserId,
  onClose,
  onSuccess,
}: CreateAccountModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await signUp(email.trim(), password.trim());

      if (result.nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setNeedsVerification(true);
        setError(null);
      } else {
        await linkAccountToCognito();
      }
    } catch (err: unknown) {
      console.error('[CreateAccountModal] Sign up error:', err);
      const caughtError = err as Error & { name?: string };

      if (caughtError.name === 'UsernameExistsException') {
        setError('An account with this email already exists');
      } else if (caughtError.name === 'InvalidPasswordException') {
        setError('Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols');
      } else {
        setError(caughtError?.message || 'Sign up failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode() {
    setError(null);
    setLoading(true);

    try {
      await confirmSignUp(email.trim(), verificationCode.trim());
      await signIn(email.trim(), password.trim());
      await linkAccountToCognito();
    } catch (err: unknown) {
      console.error('[CreateAccountModal] Verification error:', err);
      const caughtError = err as Error & { name?: string };

      if (caughtError.name === 'CodeMismatchException') {
        setError('Invalid verification code');
      } else if (caughtError.name === 'ExpiredCodeException') {
        setError('Verification code has expired. Please try again.');
      } else {
        setError(caughtError?.message || 'Verification failed. Please try again.');
      }
      setLoading(false);
    }
  }

  async function linkAccountToCognito() {
    try {
      const cognitoUser = await getCurrentUser();
      const cognitoAwsSub = cognitoUser.userId;

      const client = generateClient<Schema>();

      // Update the existing anonymous user to link with Cognito
      await client.models.User.update({
        id: currentUserId, // Use the stored UUID
        awsSub: cognitoAwsSub,
        email: email.trim(),
        role: 1, // Regular user role
      });

      onSuccess();
    } catch (err: unknown) {
      console.error('[CreateAccountModal] Link error:', err);
      const caughtError = err as Error;
      setError(caughtError?.message || 'Failed to link account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Render your modal UI here with email/password inputs and verification code input
  return (
    <Modal visible={visible} animationType="slide">
      {/* Your UI implementation */}
    </Modal>
  );
}
```

## Critical Bug to Avoid

### The Race Condition

When `signIn()` is called after email verification, it **immediately** fires the Hub 'signedIn' event. This triggers `useAuthUser` to re-fetch the user. If you query by `awsSub` at this point, you won't find the user yet (the update hasn't completed), and you'll create a duplicate.

**Solution**: In `fetchCognitoUser()`, always fetch by the stored UUID first, not by awsSub. This ensures you get the existing anonymous user that's being linked.

### What NOT to Do

```typescript
// ❌ WRONG - Creates duplicate users
async function fetchCognitoUser(client: AmplifyClient): Promise<AuthUser> {
  const currentUser = await getCurrentUser();
  const awsSub = currentUser.userId;

  // Query by awsSub - will be empty during linking!
  const listResult = await client.models.User.list({
    filter: { awsSub: { eq: awsSub } },
  });

  if (!listResult.data || listResult.data.length === 0) {
    // Creates a NEW user - now you have a duplicate!
    return await client.models.User.create({...});
  }

  return listResult.data[0];
}
```

### What TO Do

```typescript
// ✅ CORRECT - Fetches existing anonymous user by UUID
async function fetchCognitoUser(client: AmplifyClient): Promise<AuthUser> {
  const storedUuid = await getStoredUuid();

  if (!storedUuid) {
    throw new Error('No stored UUID found');
  }

  // Fetch by UUID - always finds the existing anonymous user
  const userResult = await client.models.User.get({ id: storedUuid });

  return userResult.data as AuthUser;
}
```

## Testing Checklist

1. ✅ Fresh install → Anonymous user created with UUID stored locally
2. ✅ Create data (tied to anonymous user)
3. ✅ Create account → Existing user updated (check DB: only ONE record)
4. ✅ Verify awsSub updated from "anonymous" to Cognito userId
5. ✅ Verify role updated from 9 to 1
6. ✅ Verify email updated to real email
7. ✅ Verify all existing data still belongs to the user (no orphaned records)
8. ✅ Sign out and sign back in → Same user record loaded
9. ✅ Check DB: NO duplicate users with same awsSub

## Dependencies

```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "^1.x.x",
    "expo-secure-store": "^12.x.x",
    "aws-amplify": "^6.x.x"
  }
}
```

## Summary

This pattern provides frictionless onboarding while preserving all user data when they choose to create an account. The key insights are:

1. **Device-stored UUID is the source of truth** for user identity
2. **Always fetch by UUID** when a Cognito user is detected (not by awsSub)
3. **Update, never create** when linking accounts
4. **One user, one record** - no duplicates

This pattern has been battle-tested in Rivalry Club and prevents the race condition that causes duplicate user records.
