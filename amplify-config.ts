/**
 * Amplify Configuration Loader
 *
 * Automatically loads the correct Amplify config based on the environment:
 * - Development/Testing: amplify_outputs.sandbox.json (sandbox database)
 * - Production builds: amplify_outputs.json (production database, set by EAS prebuild)
 */

// @ts-ignore - TypeScript doesn't know which file we're importing
import productionOutputs from './amplify_outputs.json';
// @ts-ignore - TypeScript doesn't know which file we're importing
import sandboxOutputs from './amplify_outputs.sandbox.json';

// Use sandbox in development, production in builds
const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';

const outputs = isDevelopment ? sandboxOutputs : productionOutputs;

// Log which environment we're using
if (isDevelopment) {
  console.log('[Amplify Config] Using SANDBOX database');
} else {
  console.log('[Amplify Config] Using PRODUCTION database');
}

export default outputs;
