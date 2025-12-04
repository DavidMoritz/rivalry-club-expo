#!/usr/bin/env node

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const USER_TABLE = 'User-eufbm2g2krhd3kvltqwnkdayb4-NONE';

async function scanTable(tableName) {
  console.log(`Scanning ${tableName}...`);
  const items = [];
  let lastEvaluatedKey = null;

  do {
    const scanParams = {
      TableName: tableName,
    };

    if (lastEvaluatedKey) {
      scanParams.ExclusiveStartKey = lastEvaluatedKey;
    }

    const command = new ScanCommand(scanParams);
    const response = await docClient.send(command);

    if (response.Items && response.Items.length > 0) {
      items.push(...response.Items);
    }

    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return items;
}

async function fixMissingAwsSub() {
  console.log('Fixing users with missing awsSub...');
  console.log('='.repeat(50));

  try {
    const users = await scanTable(USER_TABLE);
    console.log(`Found ${users.length} total users`);

    const usersWithoutAwsSub = users.filter(u => !u.awsSub);
    console.log(`Users without awsSub: ${usersWithoutAwsSub.length}`);

    for (const user of usersWithoutAwsSub) {
      console.log(`\nUpdating user ${user.id.substring(0, 8)} (${user.email})...`);

      // Set awsSub to a placeholder value (we'll use their user ID)
      const updateCmd = new UpdateCommand({
        TableName: USER_TABLE,
        Key: { id: user.id },
        UpdateExpression: 'SET awsSub = :awsSub',
        ExpressionAttributeValues: {
          ':awsSub': `placeholder-${user.id}`
        }
      });

      await docClient.send(updateCmd);
      console.log('  ✓ Set awsSub to placeholder value');
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✓ Fixed ${usersWithoutAwsSub.length} users`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixMissingAwsSub();
