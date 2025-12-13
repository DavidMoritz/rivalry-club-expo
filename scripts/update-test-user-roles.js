const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = 'User-eufbm2g2krhd3kvltqwnkdayb4-NONE';
const OLD_ROLE = 0;
const NEW_ROLE = 13;

// Create DynamoDB client
const client = new DynamoDBClient({ region: 'us-east-1' }); // Update region if needed
const docClient = DynamoDBDocumentClient.from(client);

async function updateTestUserRoles() {
  try {
    console.log(
      `Scanning table ${TABLE_NAME} for users with role = ${OLD_ROLE}...`
    );

    // Scan for users with role = 0
    const scanParams = {
      TableName: TABLE_NAME,
      FilterExpression: '#role = :oldRole',
      ExpressionAttributeNames: {
        '#role': 'role',
      },
      ExpressionAttributeValues: {
        ':oldRole': OLD_ROLE,
      },
    };

    const scanResult = await docClient.send(new ScanCommand(scanParams));
    const users = scanResult.Items || [];

    console.log(`Found ${users.length} users with role = ${OLD_ROLE}`);

    if (users.length === 0) {
      console.log('No users to update.');
      return;
    }

    // Update each user
    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        const updateParams = {
          TableName: TABLE_NAME,
          Key: {
            id: user.id,
          },
          UpdateExpression: 'SET #role = :newRole',
          ExpressionAttributeNames: {
            '#role': 'role',
          },
          ExpressionAttributeValues: {
            ':newRole': NEW_ROLE,
          },
        };

        await docClient.send(new UpdateCommand(updateParams));
        successCount++;
        console.log(
          `✓ Updated user ${user.id} (${user.email || 'no email'}) to role = ${NEW_ROLE}`
        );
      } catch (error) {
        errorCount++;
        console.error(`✗ Failed to update user ${user.id}:`, error.message);
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Total users found: ${users.length}`);
    console.log(`Successfully updated: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateTestUserRoles();
