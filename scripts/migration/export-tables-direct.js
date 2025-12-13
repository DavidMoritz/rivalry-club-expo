#!/usr/bin/env node

/**
 * Direct export of DynamoDB tables using explicit table names
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');
const fs = require('fs');
const path = require('path');

const REGION = 'us-east-1';
const BACKUP_DIR = path.join(__dirname, '../../data-backup');

// Use the API ID we found: eufbm2g2krhd3kvltqwnkdayb4
const API_ID = 'eufbm2g2krhd3kvltqwnkdayb4';
const ENV_SUFFIX = 'NONE';

const dynamoClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLES = {
  Game: `Game-${API_ID}-${ENV_SUFFIX}`,
  Fighter: `Fighter-${API_ID}-${ENV_SUFFIX}`,
  User: `User-${API_ID}-${ENV_SUFFIX}`,
  Rivalry: `Rivalry-${API_ID}-${ENV_SUFFIX}`,
  Contest: `Contest-${API_ID}-${ENV_SUFFIX}`,
  TierList: `TierList-${API_ID}-${ENV_SUFFIX}`,
  TierSlot: `TierSlot-${API_ID}-${ENV_SUFFIX}`,
};

async function exportTable(modelName, tableName) {
  console.log(`\n📦 Exporting ${modelName} from: ${tableName}`);

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

      if (lastEvaluatedKey) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } while (lastEvaluatedKey);

    console.log(`✅ Exported ${items.length} items from ${modelName}`);
    return items;
  } catch (error) {
    console.error(`❌ Error exporting ${modelName}:`, error.message);
    throw error;
  }
}

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

async function main() {
  console.log('🚀 Starting DynamoDB Data Export');
  console.log('='.repeat(60));
  console.log(`📋 API ID: ${API_ID}`);
  console.log(`📋 Environment: ${ENV_SUFFIX}`);
  console.log('='.repeat(60));

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  try {
    const exportResults = [];

    for (const [modelName, tableName] of Object.entries(TABLES)) {
      const items = await exportTable(modelName, tableName);
      const filepath = saveToFile(modelName, items, tableName);

      exportResults.push({
        modelName,
        tableName,
        itemCount: items.length,
        filepath,
      });
    }

    // Summary
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
          apiId: API_ID,
          environment: ENV_SUFFIX,
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

main().catch(console.error);
