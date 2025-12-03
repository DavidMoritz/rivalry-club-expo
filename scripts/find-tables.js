#!/usr/bin/env node

const { DynamoDBClient, ListTablesCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });

async function findRecentTables() {
  const listCommand = new ListTablesCommand({});
  const { TableNames } = await client.send(listCommand);

  console.log(`Found ${TableNames.length} tables total\n`);

  const tableDetails = [];

  for (const tableName of TableNames) {
    try {
      const describeCommand = new DescribeTableCommand({ TableName: tableName });
      const { Table } = await client.send(describeCommand);

      tableDetails.push({
        name: tableName,
        created: Table.CreationDateTime,
        arn: Table.TableArn,
      });
    } catch (err) {
      console.error(`Error describing ${tableName}:`, err.message);
    }
  }

  // Sort by creation date, newest first
  tableDetails.sort((a, b) => b.created - a.created);

  console.log('Recent tables (last 20):');
  console.log('='.repeat(80));

  for (let i = 0; i < Math.min(20, tableDetails.length); i++) {
    const table = tableDetails[i];
    console.log(`${table.created.toISOString()}: ${table.name}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('\nTables matching Game/Fighter/User/etc:');
  console.log('='.repeat(80));

  const modelTables = tableDetails.filter((t) =>
    t.name.match(/^(Game|Fighter|User|Rivalry|Contest|TierList|TierSlot)-/)
  );

  for (const table of modelTables) {
    console.log(`${table.created.toISOString()}: ${table.name}`);
  }
}

findRecentTables().catch(console.error);
