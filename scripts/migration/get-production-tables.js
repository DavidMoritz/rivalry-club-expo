#!/usr/bin/env node

/**
 * Get production table names and create mapping file
 */

const { CloudFormationClient, DescribeStackResourcesCommand } = require('@aws-sdk/client-cloudformation');
const fs = require('fs');
const path = require('path');

const REGION = 'us-east-1';
const PRODUCTION_STACK_NAME = 'amplify-d2ij2nswvyg5v3-main-branch-b91023752b'; // Production CloudFormation stack
const BACKUP_DIR = path.join(__dirname, '../../data-backup');
const MODEL_NAMES = ['Game', 'Fighter', 'User', 'Rivalry', 'Contest', 'TierList', 'TierSlot'];

const cfnClient = new CloudFormationClient({ region: REGION });

async function getProductionTables() {
  console.log('🔍 Getting production table names...');
  console.log(`📋 Stack: ${PRODUCTION_STACK_NAME}`);

  if (PRODUCTION_STACK_NAME === 'REPLACE_WITH_PRODUCTION_STACK_NAME') {
    console.error('\n❌ ERROR: Please update PRODUCTION_STACK_NAME in this script!');
    console.error('   Get the stack name from AWS CloudFormation console');
    console.error('   Or run: aws cloudformation list-stacks --region us-east-1');
    process.exit(1);
  }

  try {
    const command = new DescribeStackResourcesCommand({
      StackName: PRODUCTION_STACK_NAME
    });

    const response = await cfnClient.send(command);
    const tableNames = response.StackResources
      .filter(resource => resource.ResourceType === 'AWS::DynamoDB::Table')
      .map(resource => resource.PhysicalResourceId);

    console.log(`✅ Found ${tableNames.length} tables`);

    // Create mapping
    const mapping = {};
    MODEL_NAMES.forEach(modelName => {
      const table = tableNames.find(t => t.includes(modelName));
      if (table) {
        mapping[modelName] = table;
        console.log(`  ${modelName} → ${table}`);
      } else {
        console.log(`  ⚠️  ${modelName} → NOT FOUND`);
      }
    });

    // Save mapping
    const mappingFile = path.join(BACKUP_DIR, 'table-mapping.json');
    fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2));
    console.log(`\n💾 Saved mapping to: table-mapping.json`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

getProductionTables().catch(console.error);
