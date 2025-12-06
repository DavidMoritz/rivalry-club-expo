#!/usr/bin/env node

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true
  }
});

// Source tables (old app - staging environment from 2023)
const SOURCE_SUFFIX = '-zgox4hnry5aeblka7pk4mzmqle-staging';

// Target tables (new sandbox - created Dec 4, 2025)
const TARGET_SUFFIX = '-eufbm2g2krhd3kvltqwnkdayb4-NONE';

const TIER_LIST_SOURCE = `TierList${SOURCE_SUFFIX}`;
const TIER_LIST_TARGET = `TierList${TARGET_SUFFIX}`;
const TIER_SLOT_SOURCE = `TierSlot${SOURCE_SUFFIX}`;
const TIER_SLOT_TARGET = `TierSlot${TARGET_SUFFIX}`;

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
        TableName: tableName
      };

      if (lastEvaluatedKey) {
        scanParams.ExclusiveStartKey = lastEvaluatedKey;
      }

      const command = new ScanCommand(scanParams);
      const response = await docClient.send(command);

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
          Item: item
        }
      }))
    };

    const command = new BatchWriteCommand({
      RequestItems: requestItems
    });

    await docClient.send(command);
    console.log(`  Written ${Math.min(i + BATCH_SIZE, items.length)}/${items.length} items`);
  }

  console.log(`  ✓ Complete`);
}

async function main() {
  console.log('TierList & TierSlot Restoration Script');
  console.log('='.repeat(50));

  try {
    // Step 1: Get existing TierLists from target (the 2 we want to preserve)
    console.log('\nStep 1: Scanning existing TierLists in target...');
    const existingTierLists = await scanTable(TIER_LIST_TARGET);
    console.log(`Found ${existingTierLists.length} existing TierLists to preserve`);

    const existingTierListIds = new Set(existingTierLists.map(tl => tl.id));
    console.log('Existing TierList IDs:', Array.from(existingTierListIds));

    // Step 2: Get existing TierSlots from target (associated with the 2 TierLists)
    console.log('\nStep 2: Scanning existing TierSlots in target...');
    const existingTierSlots = await scanTable(TIER_SLOT_TARGET);
    console.log(`Found ${existingTierSlots.length} existing TierSlots to preserve`);

    const existingTierSlotIds = new Set(existingTierSlots.map(ts => ts.id));
    console.log(`Preserving ${existingTierSlotIds.size} TierSlot IDs`);

    // Step 3: Get all TierLists from source
    console.log('\nStep 3: Scanning TierLists from source (staging)...');
    const sourceTierLists = await scanTable(TIER_LIST_SOURCE);
    console.log(`Found ${sourceTierLists.length} TierLists in source`);

    // Filter out TierLists that already exist in target
    const tierListsToRestore = sourceTierLists.filter(tl => !existingTierListIds.has(tl.id));
    console.log(`${tierListsToRestore.length} TierLists to restore (excluding existing)`);

    // Step 4: Get all TierSlots from source
    console.log('\nStep 4: Scanning TierSlots from source (staging)...');
    const sourceTierSlots = await scanTable(TIER_SLOT_SOURCE);
    console.log(`Found ${sourceTierSlots.length} TierSlots in source`);

    // Filter out TierSlots that already exist in target
    const tierSlotsToRestore = sourceTierSlots.filter(ts => !existingTierSlotIds.has(ts.id));
    console.log(`${tierSlotsToRestore.length} TierSlots to restore (excluding existing)`);

    // Step 5: Write TierLists to target
    console.log('\n' + '='.repeat(50));
    console.log('Step 5: Restoring TierLists...');
    console.log('='.repeat(50));
    await batchWrite(TIER_LIST_TARGET, tierListsToRestore);

    // Step 6: Write TierSlots to target
    console.log('\n' + '='.repeat(50));
    console.log('Step 6: Restoring TierSlots...');
    console.log('='.repeat(50));
    await batchWrite(TIER_SLOT_TARGET, tierSlotsToRestore);

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('Restoration Summary:');
    console.log('='.repeat(50));
    console.log(`TierLists preserved: ${existingTierLists.length}`);
    console.log(`TierLists restored: ${tierListsToRestore.length}`);
    console.log(`Total TierLists: ${existingTierLists.length + tierListsToRestore.length}`);
    console.log('');
    console.log(`TierSlots preserved: ${existingTierSlots.length}`);
    console.log(`TierSlots restored: ${tierSlotsToRestore.length}`);
    console.log(`Total TierSlots: ${existingTierSlots.length + tierSlotsToRestore.length}`);
    console.log('='.repeat(50));
    console.log('✓ Restoration complete!');
  } catch (error) {
    console.error('✗ Restoration failed:', error);
    process.exit(1);
  }
}

main();
