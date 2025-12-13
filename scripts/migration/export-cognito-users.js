#!/usr/bin/env node

/**
 * Export Cognito users from sandbox user pool
 */

const {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} = require('@aws-sdk/client-cognito-identity-provider');
const fs = require('fs');
const path = require('path');

const REGION = 'us-east-1';
const USER_POOL_ID = 'us-east-1_nYamFUrp4'; // Sandbox pool
const BACKUP_DIR = path.join(__dirname, '../../data-backup');

const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });

async function exportUsers() {
  console.log('🚀 Starting Cognito User Export');
  console.log('='.repeat(60));
  console.log(`👥 Exporting users from pool: ${USER_POOL_ID}`);

  let users = [];
  let paginationToken;

  try {
    do {
      const command = new ListUsersCommand({
        UserPoolId: USER_POOL_ID,
        PaginationToken: paginationToken,
      });

      const response = await cognitoClient.send(command);
      users = users.concat(response.Users || []);
      paginationToken = response.PaginationToken;

      console.log(
        `  📊 Retrieved ${response.Users?.length || 0} users (Total: ${users.length})`
      );
    } while (paginationToken);

    console.log(`✅ Exported ${users.length} users`);

    // Save to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `cognito-users-${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);

    const backupData = {
      userPoolId: USER_POOL_ID,
      exportDate: new Date().toISOString(),
      userCount: users.length,
      users: users.map(user => ({
        username: user.Username,
        email: user.Attributes?.find(a => a.Name === 'email')?.Value,
        emailVerified:
          user.Attributes?.find(a => a.Name === 'email_verified')?.Value ===
          'true',
        enabled: user.Enabled,
        userStatus: user.UserStatus,
        userCreateDate: user.UserCreateDate,
        attributes: user.Attributes,
      })),
    };

    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
    console.log(`💾 Saved to: ${filename}`);
  } catch (error) {
    console.error('❌ Error exporting users:', error);
    throw error;
  }
}

exportUsers().catch(console.error);
