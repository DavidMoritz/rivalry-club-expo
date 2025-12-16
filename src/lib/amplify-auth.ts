import {
  confirmResetPassword as authConfirmResetPassword,
  confirmSignUp as authConfirmSignUp,
  deleteUser as authDeleteUser,
  getCurrentUser as authGetCurrentUser,
  resetPassword as authResetPassword,
  signIn as authSignIn,
  signOut as authSignOut,
  signUp as authSignUp,
  updatePassword as authUpdatePassword,
  type SignInInput,
  type SignUpInput,
} from 'aws-amplify/auth';
import Constants from 'expo-constants';

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
    } catch (_err) {
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

  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

/**
 * Get default dev user
 */
export function getDefaultDevUser(): DevUser {
  const users = getDevUsers();

  return (
    users[0] || {
      email: 'dev@expo.go',
      awsSub: 'expo-go-dev-user',
      firstName: 'Dev',
      lastName: 'User',
    }
  );
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(email: string, password: string) {
  // Amplify is configured in app/_layout.tsx after component mount
  // No need for configuration here

  const signUpInput: SignUpInput = {
    username: email,
    password,
    options: {
      userAttributes: {
        email,
      },
    },
  };

  return await authSignUp(signUpInput);
}

/**
 * Confirm sign up with verification code
 */
export async function confirmSignUp(email: string, code: string) {
  return await authConfirmSignUp({
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

    return { isSignedIn: true, nextStep: { signInStep: 'DONE' } };
  }

  const signInInput: SignInInput = {
    username: email,
    password,
  };

  return await authSignIn(signInInput);
}

/**
 * Sign out the current user
 */
export async function signOut() {
  return await authSignOut();
}

/**
 * Get the currently authenticated user
 */
export async function getCurrentUser() {
  // Bypass auth in Expo Go - return mock user based on signed-in email
  if (isExpoGo) {
    // Require explicit sign-in in Expo Go - don't auto-select first user
    if (!currentDevUserEmail) {
      throw new Error('Not signed in');
    }

    const devUser = findDevUserByEmail(currentDevUserEmail);

    if (!devUser) {
      throw new Error('Dev user not found');
    }

    return {
      userId: devUser.awsSub,
      username: devUser.email,
      signInDetails: {
        loginId: devUser.email,
      },
    };
  }

  return await authGetCurrentUser();
}

/**
 * Update the current user's password
 */
export async function updatePassword(oldPassword: string, newPassword: string) {
  return await authUpdatePassword({
    oldPassword,
    newPassword,
  });
}

/**
 * Request a password reset for a user
 */
export async function resetPassword(email: string) {
  return await authResetPassword({
    username: email,
  });
}

/**
 * Confirm password reset with code
 */
export async function confirmResetPassword(
  email: string,
  code: string,
  newPassword: string
) {
  return await authConfirmResetPassword({
    username: email,
    confirmationCode: code,
    newPassword,
  });
}

/**
 * Delete the currently authenticated user from Cognito
 */
export async function deleteUser() {
  // Bypass in Expo Go
  if (isExpoGo) {
    currentDevUserEmail = null;
    return;
  }

  return await authDeleteUser();
}
