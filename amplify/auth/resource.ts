import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 *
 * Note: Email verification is automatically disabled when autoVerifiedAttributes
 * is not specified. Users can sign in immediately after sign up.
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
  },
  accountRecovery: 'EMAIL_ONLY',
  multifactor: {
    mode: 'OFF',
  },
  // By not specifying autoVerifiedAttributes, email verification is disabled
  // This allows immediate sign-in after sign-up for faster development
});
