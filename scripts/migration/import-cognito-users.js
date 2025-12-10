#!/usr/bin/env node

/**
 * Import Cognito users to production user pool
 */

const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');
const fs = require('fs');
const path = require('path');

const REGION = 'us-east-1';
const PRODUCTION_USER_POOL_ID = 'us-east-1_8f6RCLauy'; // Production User Pool
const BACKUP_DIR = path.join(__dirname, '../../data-backup');

const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });

/**
 * Find the most recent Cognito backup file
 */
function findCognitoBackup() {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('cognito-users-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error('No Cognito backup file found');
  }

  return path.join(BACKUP_DIR, files[0]);
}

/**
 * Create a user in the production pool
 */
async function createUser(user) {
  try {
    // Create user
    const createCommand = new AdminCreateUserCommand({
      UserPoolId: PRODUCTION_USER_POOL_ID,
      Username: user.email,
      UserAttributes: user.attributes,
      MessageAction: 'SUPPRESS' // Don't send welcome email
    });

    await cognitoClient.send(createCommand);

    // Set permanent password (using default password - users should change it)
    // WARNING: In production, you should implement proper password reset flow
    try {
      const passwordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: PRODUCTION_USER_POOL_ID,
        Username: user.email,
        Password: '12345678', // Default password - users should change
        Permanent: true
      });
      await cognitoClient.send(passwordCommand);
    } catch (pwError) {
      console.log(`  ⚠️  Could not set password for ${user.email}: ${pwError.message}`);
    }

    console.log(`  ✅ Created: ${user.email}`);

  } catch (error) {
    if (error.name === 'UsernameExistsException') {
      console.log(`  ⚠️  Already exists: ${user.email}`);
    } else {
      console.error(`  ❌ Error creating ${user.email}:`, error.message);
      throw error;
    }
  }
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Starting Cognito User Import');
  console.log('='.repeat(60));
  console.log(`👥 Importing to pool: ${PRODUCTION_USER_POOL_ID}`);

  if (PRODUCTION_USER_POOL_ID === 'REPLACE_WITH_PRODUCTION_POOL_ID') {
    console.error('\n❌ ERROR: Please update PRODUCTION_USER_POOL_ID in this script!');
    console.error('   Get the value from amplify_outputs.production.json');
    process.exit(1);
  }

  try {
    const backupFile = findCognitoBackup();
    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    console.log(`📄 Loaded ${backup.userCount} users from backup`);

    for (let i = 0; i < backup.users.length; i++) {
      console.log(`\n👤 User ${i + 1}/${backup.userCount}: ${backup.users[i].email}`);
      await createUser(backup.users[i]);

      // Small delay to avoid throttling
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Imported ${backup.userCount} users successfully`);
    console.log('\n⚠️  NOTE: All users have default password: 12345678');
    console.log('   Users should change their password on first login');

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
