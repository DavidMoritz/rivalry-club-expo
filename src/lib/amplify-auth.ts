import Constants from 'expo-constants';
import { Amplify } from 'aws-amplify';
import {
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  getCurrentUser as authGetCurrentUser,
  updatePassword as authUpdatePassword,
  confirmSignUp as authConfirmSignUp,
  type SignInInput,
  type SignUpInput,
} from 'aws-amplify/auth';

import outputs from '../../amplify_outputs.json';

/**
 * Check if running in Expo Go (development mode without native modules)
 */
export const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Dev users configuration
 */
interface DevUser {
  email: string;
  awsSub: string;
  firstName?: string;
  lastName?: string;
}

interface DevUsersConfig {
  users: DevUser[];
}

let devUsersConfig: DevUsersConfig | null = null;

/**
 * Load dev users from local config file
 */
function getDevUsers(): DevUser[] {
  if (!devUsersConfig) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      devUsersConfig = require('./dev/dev-users.json') as DevUsersConfig;
    } catch (err) {
      console.warn('[Auth] dev-users.json not found, using defaults');
      devUsersConfig = {
        users: [
          {
            email: 'dev@expo.go',
            awsSub: 'expo-go-dev-user',
            firstName: 'Dev',
            lastName: 'User',
          },
        ],
      };
    }
  }

  return devUsersConfig.users;
}

/**
 * Find dev user by email
 */
export function findDevUserByEmail(email: string): DevUser | undefined {
  const users = getDevUsers();

  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

/**
 * Get default dev user
 */
export function getDefaultDevUser(): DevUser {
  const users = getDevUsers();

  return users[0] || {
    email: 'dev@expo.go',
    awsSub: 'expo-go-dev-user',
    firstName: 'Dev',
    lastName: 'User',
  };
}

/**
 * Lazy initialization flag to ensure Amplify is only configured once
 * and only when auth is actually needed (not at module load time).
 */
let isAmplifyConfigured = false;

/**
 * Ensures Amplify is configured before any auth operations.
 * This lazy initialization prevents TurboModule crashes by deferring
 * configuration until the app is fully initialized.
 */
function ensureAmplifyConfigured() {
  if (!isAmplifyConfigured && !isExpoGo) {
    Amplify.configure(outputs);
    isAmplifyConfigured = true;
  }
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(email: string, password: string) {
  ensureAmplifyConfigured();

  const signUpInput: SignUpInput = {
    username: email,
    password,
    options: {
      userAttributes: {
        email,
      },
    },
  };

  return authSignUp(signUpInput);
}

/**
 * Confirm sign up with verification code
 */
export async function confirmSignUp(email: string, code: string) {
  ensureAmplifyConfigured();

  return authConfirmSignUp({
    username: email,
    confirmationCode: code,
  });
}

// Store the current dev user email for Expo Go mode
let currentDevUserEmail: string | null = null;

/**
 * Sign in an existing user
 */
export async function signIn(email: string, password: string) {
  // Bypass auth in Expo Go - just return mock success
  if (isExpoGo) {
    currentDevUserEmail = email;
    console.log('[Auth] Expo Go sign in with email:', email);

    return { isSignedIn: true, nextStep: { signInStep: 'DONE' } };
  }

  ensureAmplifyConfigured();

  const signInInput: SignInInput = {
    username: email,
    password,
  };

  return authSignIn(signInInput);
}

/**
 * Sign out the current user
 */
export async function signOut() {
  ensureAmplifyConfigured();

  return authSignOut();
}

/**
 * Get the currently authenticated user
 */
export async function getCurrentUser() {
  // Bypass auth in Expo Go - return mock user based on signed-in email
  if (isExpoGo) {
    const email = currentDevUserEmail || 'dev@expo.go';
    const devUser = findDevUserByEmail(email) || getDefaultDevUser();

    console.log('[Auth] Expo Go getCurrentUser:', devUser);

    return {
      userId: devUser.awsSub,
      username: devUser.email,
      signInDetails: {
        loginId: devUser.email,
      },
    };
  }

  ensureAmplifyConfigured();

  return authGetCurrentUser();
}

/**
 * Update the current user's password
 */
export async function updatePassword(oldPassword: string, newPassword: string) {
  ensureAmplifyConfigured();

  return authUpdatePassword({
    oldPassword,
    newPassword,
  });
}
