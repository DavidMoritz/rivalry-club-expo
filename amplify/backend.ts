import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';

/**
 * @see https://docs.amplify.aws/gen2/build-a-backend/
 */
export const backend = defineBackend({
  auth,
  data,
});
