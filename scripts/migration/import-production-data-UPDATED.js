#!/usr/bin/env node

/**
 * Import data from backup files to production DynamoDB tables
 *
 * CRITICAL: This script handles awsSub mapping for User table!
 * It will update User.awsSub values to match new Cognito subs
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
const fs = require('fs');
const path = require('path');

const REGION = 'us-east-1';
const BACKUP_DIR = path.join(__dirname, '../../data-backup');
const BATCH_SIZE = 25; // DynamoDB BatchWriteItem limit

const dynamoClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

/**
 * Load table name mappings
 */
function loadTableMappings() {
  const mappingFile = path.join(BACKUP_DIR, 'table-mapping.json');
  if (!fs.existsSync(mappingFile)) {
    throw new Error('table-mapping.json not found. Run get-production-tables.js first.');
  }
  return JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
}

/**
 * Load awsSub mappings (old sub → new sub)
 * CRITICAL: This is needed for User table migration
 */
function loadAwsSubMappings() {
  const mappingFile = path.join(BACKUP_DIR, 'awssub-mapping.json');
  if (!fs.existsSync(mappingFile)) {
    console.warn('⚠️  WARNING: awssub-mapping.json not found!');
    console.warn('   User table awsSub values will NOT be updated.');
    console.warn('   Run create-awssub-mapping.js first!');
    return null;
  }

  const data = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
  console.log(`✅ Loaded awsSub mapping for ${data.mappingCount} users`);
  return data.mapping;
}

/**
 * Find the most recent backup file for a model
 */
function findBackupFile(modelName) {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith(`${modelName}-`) && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error(`No backup file found for ${modelName}`);
  }

  return path.join(BACKUP_DIR, files[0]);
}

/**
 * Transform User items to use new awsSub values
 */
function transformUserItems(items, awsSubMapping) {
  if (!awsSubMapping) {
    console.warn('  ⚠️  No awsSub mapping available - importing without transformation');
    return items;
  }

  let updated = 0;
  let notFound = 0;

  const transformedItems = items.map(item => {
    const oldSub = item.awsSub;
    const mappingEntry = awsSubMapping[oldSub];

    if (mappingEntry && mappingEntry.newSub) {
      updated++;
      return {
        ...item,
        awsSub: mappingEntry.newSub // Replace with new Cognito sub
      };
    } else {
      notFound++;
      console.warn(`  ⚠️  No mapping found for awsSub: ${oldSub} (email: ${item.email})`);
      return item; // Keep original (might cause auth issues!)
    }
  });

  console.log(`  🔄 Transformed ${updated} User records with new awsSub values`);
  if (notFound > 0) {
    console.warn(`  ⚠️  ${notFound} User records kept old awsSub (no mapping found)`);
  }

  return transformedItems;
}

/**
 * Import items in batches
 */
async function importBatch(tableName, items) {
  const putRequests = items.map(item => ({
    PutRequest: { Item: item }
  }));

  const command = new BatchWriteCommand({
    RequestItems: {
      [tableName]: putRequests
    }
  });

  return await docClient.send(command);
}

/**
 * Import all items for a model
 */
async function importModel(modelName, tableName, awsSubMapping) {
  console.log(`\n📦 Importing ${modelName} data...`);

  const backupFile = findBackupFile(modelName);
  const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
  let items = backup.items;

  console.log(`  📄 Loaded ${items.length} items from backup`);

  // CRITICAL: Transform User table items to use new awsSub values
  if (modelName === 'User') {
    console.log(`  🔑 Transforming User records with new Cognito awsSub values...`);
    items = transformUserItems(items, awsSubMapping);
  }

  let imported = 0;
  let batchNum = 0;

  // Process in batches of 25 (DynamoDB limit)
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    batchNum++;
    const batch = items.slice(i, i + BATCH_SIZE);

    try {
      await importBatch(tableName, batch);
      imported += batch.length;
      console.log(`  ✅ Batch ${batchNum}: Imported ${batch.length} items (${imported}/${items.length})`);

      // Small delay to avoid throttling
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`  ❌ Error in batch ${batchNum}:`, error.message);

      // Log the problematic batch for debugging
      console.error('  Problematic items:', JSON.stringify(batch.slice(0, 2), null, 2));
      throw error;
    }
  }

  console.log(`✅ Imported ${imported} items to ${tableName}`);
  return imported;
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Starting Data Import to Production');
  console.log('='.repeat(60));
  console.log('⚠️  CRITICAL: Cognito users must be imported FIRST!');
  console.log('='.repeat(60));

  try {
    // Load mappings
    console.log('\n📋 Loading table mappings...');
    const tableMappings = loadTableMappings();

    console.log('📋 Loading awsSub mappings...');
    const awsSubMapping = loadAwsSubMappings();

    if (!awsSubMapping) {
      console.log('\n⚠️  WARNING: Proceeding without awsSub mapping!');
      console.log('   This may cause authentication issues for users.');
      console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Import each model IN SPECIFIC ORDER
    // CRITICAL: User table must be imported early (after Game/Fighter, before Rivalry)
    const results = {};
    const modelOrder = [
      'Game',      // No dependencies
      'Fighter',   // Depends on Game
      'User',      // No dependencies (but awsSub must be updated!)
      'Rivalry',   // Depends on User and Game
      'TierList',  // Depends on Rivalry and User
      'TierSlot',  // Depends on TierList and Fighter
      'Contest'    // Depends on Rivalry and TierSlots
    ];

    for (const modelName of modelOrder) {
      const tableName = tableMappings[modelName];
      if (!tableName) {
        console.log(`⚠️  Skipping ${modelName} (no table mapping)`);
        continue;
      }

      const count = await importModel(modelName, tableName, awsSubMapping);
      results[modelName] = count;
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(60));

    let totalItems = 0;
    Object.entries(results).forEach(([model, count]) => {
      console.log(`${model}: ${count} items ✅`);
      totalItems += count;
    });

    console.log('-'.repeat(60));
    console.log(`TOTAL: ${totalItems} items imported successfully ✅`);

    // Final warnings
    if (!awsSubMapping) {
      console.log('\n⚠️  WARNING: awsSub values were NOT updated!');
      console.log('   Users may not be able to authenticate.');
      console.log('   Fix: Run create-awssub-mapping.js and re-import User table');
    }

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

main().catch(console.error);
