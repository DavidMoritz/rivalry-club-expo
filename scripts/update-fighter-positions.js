#!/usr/bin/env node

/**
 * Script to update Fighter gamePosition values from cached game-query.json
 * Updates both production and sandbox databases
 *
 * Usage:
 *   node scripts/update-fighter-positions.js                 # Dry run (preview changes)
 *   node scripts/update-fighter-positions.js --apply         # Apply changes to both environments
 *   node scripts/update-fighter-positions.js --sandbox       # Apply changes to sandbox only
 *   node scripts/update-fighter-positions.js --production    # Apply changes to production only
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = !args.includes('--apply') && !args.includes('--sandbox') && !args.includes('--production');
const SANDBOX_ONLY = args.includes('--sandbox');
const PRODUCTION_ONLY = args.includes('--production');
const BOTH_ENVS = args.includes('--apply');

// Configuration
const GAME_QUERY_PATH = path.join(__dirname, '../assets/cache/game-query.json');
const PROD_CONFIG_PATH = path.join(__dirname, '../amplify_outputs.production.json');
const SANDBOX_CONFIG_PATH = path.join(__dirname, '../data-backup/amplify_outputs.sandbox.backup.json');

// GraphQL mutation to update a fighter
const UPDATE_FIGHTER_MUTATION = `
  mutation UpdateFighter($input: UpdateFighterInput!) {
    updateFighter(input: $input) {
      id
      name
      gamePosition
    }
  }
`;

/**
 * Make a GraphQL request
 */
async function makeGraphQLRequest(url, apiKey, query, variables) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL Error: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
}

/**
 * Update a single fighter's gamePosition
 */
async function updateFighter(url, apiKey, fighterId, gamePosition) {
  if (DRY_RUN) {
    // In dry-run mode, just return a mock response
    return {
      updateFighter: {
        id: fighterId,
        name: 'DRY RUN',
        gamePosition: gamePosition,
      },
    };
  }

  const variables = {
    input: {
      id: fighterId,
      gamePosition: gamePosition,
    },
  };

  return makeGraphQLRequest(url, apiKey, UPDATE_FIGHTER_MUTATION, variables);
}

/**
 * Update all fighters in an environment
 */
async function updateEnvironment(envName, url, apiKey, fighters) {
  console.log(`\n=== ${DRY_RUN ? 'Preview' : 'Updating'} ${envName} environment ===`);
  console.log(`API URL: ${url}`);
  console.log(`Total fighters to update: ${fighters.length}`);
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  } else {
    console.log('');
  }

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < fighters.length; i++) {
    const fighter = fighters[i];

    try {
      await updateFighter(url, apiKey, fighter.id, fighter.gamePosition);
      successCount++;
      const prefix = DRY_RUN ? '○' : '✓';
      console.log(`${prefix} [${i + 1}/${fighters.length}] ${DRY_RUN ? 'Would update' : 'Updated'} ${fighter.name} (ID: ${fighter.id}) → gamePosition: ${fighter.gamePosition}`);
    } catch (error) {
      errorCount++;
      console.error(`✗ [${i + 1}/${fighters.length}] Failed to update ${fighter.name} (ID: ${fighter.id}): ${error.message}`);
    }

    // Add a small delay to avoid rate limiting (skip in dry-run mode)
    if (!DRY_RUN) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`\n${envName} Summary:`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`  Total: ${fighters.length}`);
}

/**
 * Main function
 */
async function main() {
  console.log('Fighter gamePosition Update Script');
  console.log('===================================');
  if (DRY_RUN) {
    console.log('MODE: DRY RUN (preview only)');
    console.log('To apply changes, run: node scripts/update-fighter-positions.js --apply\n');
  } else if (SANDBOX_ONLY) {
    console.log('MODE: APPLY to SANDBOX only\n');
  } else if (PRODUCTION_ONLY) {
    console.log('MODE: APPLY to PRODUCTION only\n');
  } else if (BOTH_ENVS) {
    console.log('MODE: APPLY to BOTH environments\n');
  }

  // Read game query JSON
  console.log('Reading game-query.json...');
  const gameQueryData = JSON.parse(fs.readFileSync(GAME_QUERY_PATH, 'utf8'));

  // Extract fighters
  const games = gameQueryData.data.listGames.items;
  if (games.length === 0) {
    console.error('No games found in game-query.json');
    process.exit(1);
  }

  const fighters = games[0].fighters.items;
  console.log(`Found ${fighters.length} fighters to update\n`);

  // Read configuration files
  console.log('Reading configuration files...');

  // Update environments based on flags
  if (PRODUCTION_ONLY || BOTH_ENVS || DRY_RUN) {
    const prodConfig = JSON.parse(fs.readFileSync(PROD_CONFIG_PATH, 'utf8'));
    await updateEnvironment(
      'Production',
      prodConfig.data.url,
      prodConfig.data.api_key,
      fighters
    );
  }

  if (SANDBOX_ONLY || BOTH_ENVS || DRY_RUN) {
    const sandboxConfig = JSON.parse(fs.readFileSync(SANDBOX_CONFIG_PATH, 'utf8'));
    await updateEnvironment(
      'Sandbox',
      sandboxConfig.data.url,
      sandboxConfig.data.api_key,
      fighters
    );
  }

  if (DRY_RUN) {
    console.log('\n✅ Dry run completed! No changes were made.');
    console.log('To apply these changes, run: node scripts/update-fighter-positions.js --apply');
  } else {
    console.log('\n✅ All updates completed!');
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
