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
  if (!isAmplifyConfigured) {
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

/**
 * Sign in an existing user
 */
export async function signIn(email: string, password: string) {
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
