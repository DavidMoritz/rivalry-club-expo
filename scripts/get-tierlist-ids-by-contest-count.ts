import {
  DynamoDBClient,
  ExecuteStatementCommand,
} from '@aws-sdk/client-dynamodb';
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json' with { type: 'json' };

// Configure Amplify
Amplify.configure(outputs);

// Extract AWS config from Amplify outputs
const awsConfig = outputs.data;
const region = awsConfig.aws_region;

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({ region });

const RIVALRY_TABLE = 'Rivalry-eufbm2g2krhd3kvltqwnkdayb4-NONE';
const TIERLIST_TABLE = 'TierList-eufbm2g2krhd3kvltqwnkdayb4-NONE';

async function getTierListIdsByContestCount() {
  console.log('Fetching rivalries with contestCount > 300...\n');

  // Step 1: Query rivalries with contestCount > 300 and deletedAt is null
  const rivalryQuery = `
    SELECT id
    FROM "${RIVALRY_TABLE}"
    WHERE contestCount > 300
      AND attribute_not_exists(deletedAt)
  `;

  try {
    const rivalryCommand = new ExecuteStatementCommand({
      Statement: rivalryQuery,
    });

    const rivalryResponse = await dynamoClient.send(rivalryCommand);
    const rivalries = rivalryResponse.Items || [];

    console.log(
      `Found ${rivalries.length} rivalries with contestCount > 300\n`
    );

    if (rivalries.length === 0) {
      console.log('No rivalries found matching criteria.');
      return;
    }

    // Extract rivalry IDs
    const rivalryIds = rivalries.map(item => item.id.S);
    console.log('Rivalry IDs:', rivalryIds);
    console.log('\nFetching tier lists for these rivalries...\n');

    // Step 2: Get all tier lists for these rivalries
    const allTierListIds: string[] = [];

    for (const rivalryId of rivalryIds) {
      const tierListQuery = `
        SELECT id
        FROM "${TIERLIST_TABLE}"
        WHERE rivalryId = '${rivalryId}'
          AND attribute_not_exists(deletedAt)
      `;

      const tierListCommand = new ExecuteStatementCommand({
        Statement: tierListQuery,
      });

      const tierListResponse = await dynamoClient.send(tierListCommand);
      const tierLists = tierListResponse.Items || [];

      tierLists.forEach(item => {
        const tierListId = item.id.S;
        if (tierListId) {
          allTierListIds.push(tierListId);
          console.log(`  ✓ ${tierListId} (rivalryId: ${rivalryId})`);
        }
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log(`Total TierList IDs found: ${allTierListIds.length}`);
    console.log('='.repeat(80));
    console.log('\nTierList IDs:');
    allTierListIds.forEach(id => console.log(`  - ${id}`));

    return allTierListIds;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}

getTierListIdsByContestCount().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
