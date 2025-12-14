#!/usr/bin/env node

/**
 * Verify migration was successful
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');
const {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} = require('@aws-sdk/client-cognito-identity-provider');
const fs = require('fs');
const path = require('path');

const REGION = 'us-east-1';
const BACKUP_DIR = path.join(__dirname, '../../data-backup');
const PRODUCTION_USER_POOL_ID = 'REPLACE_WITH_PRODUCTION_POOL_ID'; // From amplify_outputs.production.json

const dynamoClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });

async function verifyTable(modelName, tableName, expectedCount) {
  try {
    let totalCount = 0;
    let lastEvaluatedKey;

    // Paginate through all results
    do {
      const command = new ScanCommand({
        TableName: tableName,
        Select: 'COUNT',
        ExclusiveStartKey: lastEvaluatedKey,
      });

      const response = await docClient.send(command);
      totalCount += response.Count || 0;
      lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    const actualCount = totalCount;

    if (actualCount === expectedCount) {
      console.log(`✅ ${modelName}: ${actualCount} items (matches backup)`);
      return true;
    }
    console.log(
      `❌ ${modelName}: ${actualCount} items (expected ${expectedCount})`
    );
    return false;
  } catch (error) {
    console.error(`❌ ${modelName}: Error - ${error.message}`);
    return false;
  }
}

async function verifyAwsSubMapping() {
  console.log('\n🔍 Verifying awsSub Mapping...');

  if (PRODUCTION_USER_POOL_ID === 'REPLACE_WITH_PRODUCTION_POOL_ID') {
    console.log(
      '⚠️  Skipping awsSub verification (PRODUCTION_USER_POOL_ID not set)'
    );
    return;
  }

  try {
    // Load awsSub mapping
    const mappingFile = path.join(BACKUP_DIR, 'awssub-mapping.json');
    if (!fs.existsSync(mappingFile)) {
      console.log('⚠️  awssub-mapping.json not found, skipping verification');
      return;
    }

    const mappingData = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
    const mapping = mappingData.mapping;

    // Load table mapping to get User table name
    const tableMappingFile = path.join(BACKUP_DIR, 'table-mapping.json');
    const tableMapping = JSON.parse(fs.readFileSync(tableMappingFile, 'utf8'));
    const userTableName = tableMapping['User'];

    if (!userTableName) {
      console.log('⚠️  User table not found in mapping');
      return;
    }

    // Get a sample user from DynamoDB
    const scanCommand = new ScanCommand({
      TableName: userTableName,
      Limit: 1,
    });
    const scanResponse = await docClient.send(scanCommand);

    if (!scanResponse.Items || scanResponse.Items.length === 0) {
      console.log('⚠️  No users found in User table');
      return;
    }

    const sampleUser = scanResponse.Items[0];
    const userEmail = sampleUser.email;
    const dbAwsSub = sampleUser.awsSub;

    console.log(`  Checking user: ${userEmail}`);
    console.log(`  DB awsSub: ${dbAwsSub?.substring(0, 12)}...`);

    // Get the same user from Cognito
    const cognitoCommand = new ListUsersCommand({
      UserPoolId: PRODUCTION_USER_POOL_ID,
      Filter: `email = "${userEmail}"`,
    });
    const cognitoResponse = await cognitoClient.send(cognitoCommand);

    if (!cognitoResponse.Users || cognitoResponse.Users.length === 0) {
      console.log('  ❌ User not found in Cognito');
      return;
    }

    const cognitoUser = cognitoResponse.Users[0];
    const cognitoSub = cognitoUser.Attributes?.find(
      a => a.Name === 'sub'
    )?.Value;

    console.log(`  Cognito sub: ${cognitoSub?.substring(0, 12)}...`);

    if (dbAwsSub === cognitoSub) {
      console.log('  ✅ awsSub values MATCH - Authentication will work!');
    } else {
      console.log(
        '  ❌ awsSub values DO NOT MATCH - Authentication will FAIL!'
      );
      console.log(
        '  Action required: Re-run create-awssub-mapping.js and import User table again'
      );
    }
  } catch (error) {
    console.error('  ❌ Error verifying awsSub:', error.message);
  }
}

async function main() {
  console.log('🔍 Verifying Migration');
  console.log('='.repeat(60));

  const mappingFile = path.join(BACKUP_DIR, 'table-mapping.json');
  const summaryFile = path.join(BACKUP_DIR, 'export-summary.json');

  if (!fs.existsSync(mappingFile)) {
    console.error('❌ table-mapping.json not found');
    process.exit(1);
  }

  if (!fs.existsSync(summaryFile)) {
    console.error('❌ export-summary.json not found');
    process.exit(1);
  }

  const tableMappings = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
  const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));

  let allPassed = true;

  for (const result of summary.results) {
    const tableName = tableMappings[result.modelName];
    if (!tableName) continue;

    const passed = await verifyTable(
      result.modelName,
      tableName,
      result.itemCount
    );
    if (!passed) allPassed = false;
  }

  // Verify awsSub mapping
  await verifyAwsSubMapping();

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ ALL TABLE COUNTS PASSED');
    console.log('\n📌 Next steps:');
    console.log(
      '   1. Test application authentication (sign in with test user)'
    );
    console.log('   2. Verify data loads correctly in the app');
    console.log('   3. Update amplify_outputs.json to use production');
  } else {
    console.log('❌ VERIFICATION FAILED - Check errors above');
    process.exit(1);
  }
}

main().catch(console.error);
