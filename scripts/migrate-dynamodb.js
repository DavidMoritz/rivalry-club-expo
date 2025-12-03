#!/usr/bin/env node

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

// Source tables (old app - staging environment from 2023)
const SOURCE_SUFFIX = '-zgox4hnry5aeblka7pk4mzmqle-staging';

// Target tables (new sandbox - created Dec 2, 2025)
const TARGET_SUFFIX = '-5wxxiyf36rgj7ei2vwaeni3vnm-NONE';

const TABLE_MAPPINGS = {
  Game: {
    source: `Game${SOURCE_SUFFIX}`,
    target: `Game${TARGET_SUFFIX}`,
  },
  Fighter: {
    source: `Fighter${SOURCE_SUFFIX}`,
    target: `Fighter${TARGET_SUFFIX}`,
  },
  User: {
    source: `User${SOURCE_SUFFIX}`,
    target: `User${TARGET_SUFFIX}`,
  },
  Rivalry: {
    source: `Rivalry${SOURCE_SUFFIX}`,
    target: `Rivalry${TARGET_SUFFIX}`,
  },
  Contest: {
    source: `Contest${SOURCE_SUFFIX}`,
    target: `Contest${TARGET_SUFFIX}`,
  },
  TierList: {
    source: `TierList${SOURCE_SUFFIX}`,
    target: `TierList${TARGET_SUFFIX}`,
  },
  TierSlot: {
    source: `TierSlot${SOURCE_SUFFIX}`,
    target: `TierSlot${TARGET_SUFFIX}`,
  },
};

async function verifyTables() {
  console.log('Verifying table mappings...');

  for (const [modelName, mapping] of Object.entries(TABLE_MAPPINGS)) {
    console.log(`  ${modelName}:`);
    console.log(`    Source: ${mapping.source}`);
    console.log(`    Target: ${mapping.target}`);
  }

  console.log('\nAll tables mapped successfully!');
}

async function scanTable(tableName) {
  console.log(`Scanning ${tableName}...`);
  const items = [];
  let lastEvaluatedKey = null;
  let scanCount = 0;

  try {
    do {
      scanCount++;
      console.log(`  Scan iteration ${scanCount}...`);

      const scanParams = {
        TableName: tableName,
      };

      if (lastEvaluatedKey) {
        scanParams.ExclusiveStartKey = lastEvaluatedKey;
      }

      console.log(`  Creating ScanCommand with params:`, JSON.stringify(scanParams, null, 2));

      const command = new ScanCommand(scanParams);

      console.log(`  Sending scan command...`);

      const response = await docClient.send(command);

      console.log(`  Got response`);

      console.log(`  Response Items: ${response.Items?.length || 0}`);

      if (response.Items && response.Items.length > 0) {
        items.push(...response.Items);
      }

      lastEvaluatedKey = response.LastEvaluatedKey;
      console.log(`  Total so far: ${items.length} items`);
    } while (lastEvaluatedKey);

    console.log(`✓ Scan complete: ${items.length} total items`);

    return items;
  } catch (error) {
    console.error(`✗ Error scanning ${tableName}:`, error.message);
    throw error;
  }
}

async function batchWrite(tableName, items) {
  if (items.length === 0) {
    console.log(`  No items to write to ${tableName}`);

    return;
  }

  console.log(`\nWriting ${items.length} items to ${tableName}...`);

  // DynamoDB BatchWrite can handle max 25 items at a time
  const BATCH_SIZE = 25;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);

    const requestItems = {
      [tableName]: batch.map((item) => ({
        PutRequest: {
          Item: item,
        },
      })),
    };

    const command = new BatchWriteCommand({
      RequestItems: requestItems,
    });

    await docClient.send(command);
    console.log(`  Written ${Math.min(i + BATCH_SIZE, items.length)}/${items.length} items`);
  }

  console.log(`  ✓ Complete`);
}

async function migrateTable(modelName) {
  const mapping = TABLE_MAPPINGS[modelName];

  if (!mapping.target) {
    console.log(`\nSkipping ${modelName} (no target table found)`);

    return;
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Migrating ${modelName}`);
  console.log(`  From: ${mapping.source}`);
  console.log(`  To:   ${mapping.target}`);
  console.log(`${'='.repeat(50)}`);

  try {
    const items = await scanTable(mapping.source);
    await batchWrite(mapping.target, items);
    console.log(`✓ ${modelName} migration complete`);
  } catch (error) {
    console.error(`✗ Error migrating ${modelName}:`, error.message);
  }
}

async function main() {
  console.log('DynamoDB Migration Script');
  console.log('='.repeat(50));

  try {
    await verifyTables();

    // Migrate in order to respect foreign key relationships
    const migrationOrder = ['Game', 'Fighter', 'User', 'Rivalry', 'TierList', 'Contest', 'TierSlot'];

    for (const modelName of migrationOrder) {
      await migrateTable(modelName);
    }

    console.log('\n' + '='.repeat(50));
    console.log('Migration complete!');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
