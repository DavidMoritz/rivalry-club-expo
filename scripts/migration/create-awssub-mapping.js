#!/usr/bin/env node

/**
 * CRITICAL: Create mapping between old and new Cognito awsSub values
 *
 * This script must run AFTER Cognito users are imported to production
 * It creates a mapping file used to update User table awsSub values
 */

const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');
const fs = require('fs');
const path = require('path');

const REGION = 'us-east-1';
const SANDBOX_USER_POOL_ID = 'us-east-1_nYamFUrp4'; // From amplify_outputs.json
const PRODUCTION_USER_POOL_ID = 'REPLACE_WITH_PRODUCTION_POOL_ID'; // From amplify_outputs.production.json
const BACKUP_DIR = path.join(__dirname, '../../data-backup');

const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });

/**
 * Get all users from a pool with their sub and email
 */
async function getUsersFromPool(userPoolId) {
  console.log(`📋 Fetching users from pool: ${userPoolId}`);

  let users = [];
  let paginationToken = undefined;

  try {
    do {
      const command = new ListUsersCommand({
        UserPoolId: userPoolId,
        PaginationToken: paginationToken
      });

      const response = await cognitoClient.send(command);

      const poolUsers = (response.Users || []).map(user => ({
        sub: user.Attributes?.find(a => a.Name === 'sub')?.Value,
        email: user.Attributes?.find(a => a.Name === 'email')?.Value,
        username: user.Username
      }));

      users = users.concat(poolUsers);
      paginationToken = response.PaginationToken;

    } while (paginationToken);

    console.log(`✅ Found ${users.length} users`);
    return users;

  } catch (error) {
    console.error(`❌ Error fetching users from ${userPoolId}:`, error.message);
    throw error;
  }
}

/**
 * Create mapping between old and new awsSub values
 */
function createMapping(sandboxUsers, productionUsers) {
  console.log('\n🔗 Creating awsSub mapping...');

  const mapping = {};
  const emailToOldSub = {};
  const emailToNewSub = {};

  // Index sandbox users by email
  sandboxUsers.forEach(user => {
    if (user.email && user.sub) {
      emailToOldSub[user.email.toLowerCase()] = user.sub;
    }
  });

  // Index production users by email
  productionUsers.forEach(user => {
    if (user.email && user.sub) {
      emailToNewSub[user.email.toLowerCase()] = user.sub;
    }
  });

  // Create mapping
  let matched = 0;
  let unmatched = 0;

  Object.keys(emailToOldSub).forEach(email => {
    const oldSub = emailToOldSub[email];
    const newSub = emailToNewSub[email];

    if (newSub) {
      mapping[oldSub] = {
        oldSub,
        newSub,
        email
      };
      console.log(`  ✅ ${email}: ${oldSub.substring(0, 8)}... → ${newSub.substring(0, 8)}...`);
      matched++;
    } else {
      console.log(`  ⚠️  ${email}: No matching production user (old sub: ${oldSub})`);
      unmatched++;
    }
  });

  console.log(`\n📊 Mapping results:`);
  console.log(`  ✅ Matched: ${matched} users`);
  console.log(`  ⚠️  Unmatched: ${unmatched} users`);

  return mapping;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Creating Cognito awsSub Mapping');
  console.log('='.repeat(60));
  console.log('⚠️  IMPORTANT: Run this AFTER importing Cognito users to production');
  console.log('='.repeat(60));

  try {
    // Get users from both pools
    console.log('\n📥 Step 1: Fetch users from sandbox pool...');
    const sandboxUsers = await getUsersFromPool(SANDBOX_USER_POOL_ID);

    console.log('\n📥 Step 2: Fetch users from production pool...');
    const productionUsers = await getUsersFromPool(PRODUCTION_USER_POOL_ID);

    // Create mapping
    console.log('\n🔗 Step 3: Create mapping...');
    const mapping = createMapping(sandboxUsers, productionUsers);

    if (Object.keys(mapping).length === 0) {
      console.error('\n❌ No users matched! Verify users were imported to production.');
      process.exit(1);
    }

    // Save mapping
    const mappingFile = path.join(BACKUP_DIR, 'awssub-mapping.json');
    fs.writeFileSync(mappingFile, JSON.stringify({
      createdAt: new Date().toISOString(),
      sandboxPoolId: SANDBOX_USER_POOL_ID,
      productionPoolId: PRODUCTION_USER_POOL_ID,
      mappingCount: Object.keys(mapping).length,
      mapping
    }, null, 2));

    console.log(`\n💾 Saved mapping to: awssub-mapping.json`);
    console.log(`\n✅ Mapping created successfully!`);
    console.log(`\n📌 Next steps:`);
    console.log(`   1. Review the mapping file`);
    console.log(`   2. Run import-production-data.js (it will use this mapping)`);

  } catch (error) {
    console.error('\n❌ Mapping failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
