#!/usr/bin/env node

/**
 * Script to reset all user passwords in Cognito production user pool
 *
 * Usage: node scripts/reset-cognito-passwords.js
 *
 * Requirements:
 * - AWS credentials configured (via ~/.aws/credentials or environment variables)
 * - Appropriate IAM permissions for Cognito operations
 */

const {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminSetUserPasswordCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

// Configuration
const USER_POOL_ID = 'us-east-1_8f6RCLauy'; // From amplify_outputs.production.json
const REGION = 'us-east-1';
const NEW_PASSWORD = 'qwerqwer';
const PERMANENT = true;

// Initialize Cognito client
const client = new CognitoIdentityProviderClient({ region: REGION });

/**
 * List all users in the user pool
 */
async function listAllUsers() {
  console.log(`\nListing all users in user pool: ${USER_POOL_ID}`);

  const users = [];
  let paginationToken = null;

  do {
    const command = new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Limit: 60,
      ...(paginationToken && { PaginationToken: paginationToken }),
    });

    const response = await client.send(command);

    if (response.Users) {
      users.push(...response.Users);
    }

    paginationToken = response.PaginationToken;
  } while (paginationToken);

  console.log(`Found ${users.length} users\n`);
  return users;
}

/**
 * Update a single user's password
 */
async function updateUserPassword(username) {
  const command = new AdminSetUserPasswordCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
    Password: NEW_PASSWORD,
    Permanent: PERMANENT,
  });

  try {
    await client.send(command);
    console.log(`✓ Updated password for: ${username}`);
    return { success: true, username };
  } catch (error) {
    console.error(
      `✗ Failed to update password for ${username}:`,
      error.message
    );
    return { success: false, username, error: error.message };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('========================================');
  console.log('Cognito Password Reset Script');
  console.log('========================================');
  console.log(`User Pool: ${USER_POOL_ID}`);
  console.log(`Region: ${REGION}`);
  console.log(`New Password: ${NEW_PASSWORD}`);
  console.log(`Permanent: ${PERMANENT}`);
  console.log('========================================\n');

  try {
    // List all users
    const users = await listAllUsers();

    if (users.length === 0) {
      console.log('No users found in the user pool.');
      return;
    }

    // Display users to be updated
    console.log('Users to be updated:');
    users.forEach((user, index) => {
      const email =
        user.Attributes?.find(attr => attr.Name === 'email')?.Value || 'N/A';
      console.log(`  ${index + 1}. ${user.Username} (${email})`);
    });
    console.log('');

    // Confirm before proceeding
    console.log(
      '⚠️  WARNING: This will update passwords for ALL users listed above!'
    );
    console.log(
      'Press Ctrl+C to cancel, or the script will continue in 3 seconds...\n'
    );

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Update passwords
    console.log('Updating passwords...\n');
    const results = await Promise.all(
      users.map(user => updateUserPassword(user.Username))
    );

    // Summary
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log('\n========================================');
    console.log('Summary');
    console.log('========================================');
    console.log(`Total users: ${users.length}`);
    console.log(`Successfully updated: ${successCount}`);
    console.log(`Failed: ${failureCount}`);
    console.log('========================================\n');

    if (failureCount > 0) {
      console.log('Failed users:');
      results
        .filter(r => !r.success)
        .forEach(r => console.log(`  - ${r.username}: ${r.error}`));
      console.log('');
    }
  } catch (error) {
    console.error('\n❌ Error executing script:', error);
    process.exit(1);
  }
}

// Run the script
main();
