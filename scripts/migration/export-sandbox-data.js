#!/usr/bin/env node

/**
 * Export all data from Amplify Gen 2 Sandbox DynamoDB tables
 * This script safely exports all records from all tables to JSON files
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');
const {
  CloudFormationClient,
  DescribeStackResourcesCommand,
} = require('@aws-sdk/client-cloudformation');
const fs = require('fs');
const path = require('path');

const REGION = 'us-east-1';
const BACKUP_DIR = path.join(__dirname, '../../data-backup');

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cfnClient = new CloudFormationClient({ region: REGION });

// Model names from your schema
const MODEL_NAMES = [
  'Game',
  'Fighter',
  'User',
  'Rivalry',
  'Contest',
  'TierList',
  'TierSlot',
];

// IMPORTANT: Also export the original Cognito backup for awsSub mapping
// This is needed to map old awsSub values to new ones after Cognito migration

/**
 * Find the sandbox CloudFormation stack
 */
async function findSandboxStack() {
  console.log('🔍 Searching for sandbox CloudFormation stack...');

  // The stack name pattern for sandbox is: amplify-{project}-{username}-sandbox-{id}
  const stackNamePattern = 'amplify-rivalryclubexpo-davidmoritz-sandbox';

  return 'amplify-rivalryclubexpo-davidmoritz-sandbox-68bbd7792c';
}

/**
 * Get DynamoDB table names from CloudFormation stack
 */
async function getTableNames(stackName) {
  console.log(`📋 Fetching table names from stack: ${stackName}`);

  try {
    const command = new DescribeStackResourcesCommand({
      StackName: stackName,
    });

    const response = await cfnClient.send(command);
    const tableNames = response.StackResources.filter(
      resource => resource.ResourceType === 'AWS::DynamoDB::Table'
    ).map(resource => resource.PhysicalResourceId);

    console.log(`✅ Found ${tableNames.length} DynamoDB tables`);
    return tableNames;
  } catch (error) {
    console.error('❌ Error fetching table names:', error.message);
    throw error;
  }
}

/**
 * Export all items from a DynamoDB table
 */
async function exportTable(tableName) {
  console.log(`\n📦 Exporting table: ${tableName}`);

  let items = [];
  let lastEvaluatedKey;
  let scanCount = 0;

  try {
    do {
      scanCount++;
      const params = {
        TableName: tableName,
        ExclusiveStartKey: lastEvaluatedKey,
      };

      const command = new ScanCommand(params);
      const response = await docClient.send(command);

      items = items.concat(response.Items || []);
      lastEvaluatedKey = response.LastEvaluatedKey;

      console.log(
        `  📊 Scan ${scanCount}: Retrieved ${response.Items?.length || 0} items (Total: ${items.length})`
      );

      // Add a small delay to avoid throttling
      if (lastEvaluatedKey) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } while (lastEvaluatedKey);

    console.log(`✅ Exported ${items.length} items from ${tableName}`);
    return items;
  } catch (error) {
    console.error(`❌ Error exporting ${tableName}:`, error.message);
    throw error;
  }
}

/**
 * Determine model name from table name
 */
function getModelNameFromTable(tableName) {
  for (const modelName of MODEL_NAMES) {
    if (tableName.includes(modelName)) {
      return modelName;
    }
  }
  return 'Unknown';
}

/**
 * Save data to JSON file
 */
function saveToFile(modelName, data, tableName) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${modelName}-${timestamp}.json`;
  const filepath = path.join(BACKUP_DIR, filename);

  const backupData = {
    modelName,
    tableName,
    exportDate: new Date().toISOString(),
    itemCount: data.length,
    items: data,
  };

  fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
  console.log(`💾 Saved to: ${filename}`);

  return filepath;
}

/**
 * Main export function
 */
async function main() {
  console.log('🚀 Starting Amplify Sandbox Data Export');
  console.log('='.repeat(60));

  // Ensure backup directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  try {
    // Find the sandbox stack
    const stackName = await findSandboxStack();

    // Get all table names
    const tableNames = await getTableNames(stackName);

    if (tableNames.length === 0) {
      console.log('⚠️  No tables found in the stack');
      return;
    }

    // Export each table
    const exportResults = [];
    for (const tableName of tableNames) {
      const modelName = getModelNameFromTable(tableName);
      const items = await exportTable(tableName);
      const filepath = saveToFile(modelName, items, tableName);

      exportResults.push({
        modelName,
        tableName,
        itemCount: items.length,
        filepath,
      });
    }

    // Create summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 EXPORT SUMMARY');
    console.log('='.repeat(60));

    let totalItems = 0;
    exportResults.forEach(result => {
      console.log(`${result.modelName}: ${result.itemCount} items`);
      totalItems += result.itemCount;
    });

    console.log('-'.repeat(60));
    console.log(
      `TOTAL: ${totalItems} items across ${exportResults.length} tables`
    );
    console.log(`\n✅ All data exported to: ${BACKUP_DIR}`);

    // Save summary file
    const summaryFile = path.join(BACKUP_DIR, 'export-summary.json');
    fs.writeFileSync(
      summaryFile,
      JSON.stringify(
        {
          exportDate: new Date().toISOString(),
          totalItems,
          totalTables: exportResults.length,
          results: exportResults,
        },
        null,
        2
      )
    );

    console.log('📄 Summary saved to: export-summary.json');
  } catch (error) {
    console.error('\n❌ Export failed:', error);
    process.exit(1);
  }
}

// Run the export
main().catch(console.error);
