#!/usr/bin/env node

const {
  CognitoIdentityProviderClient,
  AdminConfirmSignUpCommand,
  AdminUpdateUserAttributesCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

// Get the Cognito User Pool ID
function getUserPoolId() {
  // User Pool ID for: amplifyAuthUserPool4BA7F805-YrqBpiHBdNe3
  const userPoolId = process.env.COGNITO_USER_POOL_ID || 'us-east-1_nYamFUrp4';
  return userPoolId;
}

async function confirmUser(username, password = 'qwerqwer') {
  const client = new CognitoIdentityProviderClient({ region: 'us-east-1' });
  const userPoolId = getUserPoolId();

  console.log('Confirming user...');
  console.log('='.repeat(50));
  console.log(`Username/Email: ${username}`);
  console.log(`User Pool ID: ${userPoolId}`);
  console.log('='.repeat(50));

  try {
    // Step 0: Get current user status
    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: userPoolId,
      Username: username,
    });

    const userResponse = await client.send(getUserCommand);
    console.log(`Current user status: ${userResponse.UserStatus}`);

    // Step 1: Set permanent password (this also confirms the user if in FORCE_CHANGE_PASSWORD state)
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: username,
      Password: password,
      Permanent: true,
    });

    await client.send(setPasswordCommand);
    console.log(`✓ Password set to permanent: ${password}`);

    // Step 2: Mark email as verified
    const updateAttributesCommand = new AdminUpdateUserAttributesCommand({
      UserPoolId: userPoolId,
      Username: username,
      UserAttributes: [
        {
          Name: 'email_verified',
          Value: 'true',
        },
      ],
    });

    await client.send(updateAttributesCommand);
    console.log('✓ Email marked as verified');

    // Step 3: Confirm sign-up if needed (in case user is UNCONFIRMED)
    if (userResponse.UserStatus === 'UNCONFIRMED') {
      const confirmCommand = new AdminConfirmSignUpCommand({
        UserPoolId: userPoolId,
        Username: username,
      });

      await client.send(confirmCommand);
      console.log('✓ User sign-up confirmed');
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ User confirmed successfully!');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('Error confirming user:', error.message);

    if (error.name === 'UserNotFoundException') {
      console.error(
        '\nUser not found. Check the username/email or user pool ID.'
      );
    } else if (error.name === 'NotAuthorizedException') {
      console.error('\nUser may already be confirmed.');
    }

    process.exit(1);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const username = args[0];
  let password = 'qwerqwer';

  // Parse optional --password flag
  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--password=')) {
      password = args[i].split('=')[1];
    }
  }

  if (!username) {
    console.error(
      'Usage: node confirm-user.js <username-or-email> [--password=Password]'
    );
    console.error('\nExample: node confirm-user.js test@example.com');
    console.error(
      'Example: node confirm-user.js 1418a4b8-f0c1-7098-1701-79f095e17e61'
    );
    console.error(
      'Example: node confirm-user.js test@example.com --password=mypass123'
    );
    process.exit(1);
  }

  await confirmUser(username, password);
}

main();
