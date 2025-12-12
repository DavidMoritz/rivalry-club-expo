/**
 * This file is a one-time use to fix the missing slots for the 2 mii fighters
 */

import { generateClient } from 'aws-amplify/data';
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';

Amplify.configure(outputs);
const client = generateClient();

async function fixInvalidPositions() {
  console.log('Fetching all TierSlots with position = 86...');
  console.log('Note: This will paginate through ALL records...\n');

  // Get ALL tier slots with position 86 (handle pagination)
  let invalidSlots: any[] = [];
  let nextToken: string | null | undefined = undefined;
  let pageCount = 0;

  do {
    pageCount++;
    console.log(`Fetching page ${pageCount}...`);

    const {
      data,
      errors,
      nextToken: token
    } = await client.models.TierSlot.list({
      filter: { position: { eq: 86 } },
      nextToken: nextToken as any
    });

    if (errors) {
      console.error('Error fetching slots:', errors);
      return;
    }

    if (data && data.length > 0) {
      invalidSlots.push(...data);
      console.log(`  Found ${data.length} slots on this page`);
    } else {
      console.log(`  No slots on this page`);
    }

    nextToken = token;
  } while (nextToken);

  console.log(`\nTotal found: ${invalidSlots.length} slots with position = 86`);

  if (invalidSlots.length === 0) {
    console.log('No slots to fix!');
    return;
  }

  // Show some details
  console.log('\nSlots to be updated:');
  invalidSlots.forEach((slot, idx) => {
    if (idx < 5) {
      // Show first 5
      console.log(`  - ID: ${slot.id}, Fighter: ${slot.fighterId}, TierList: ${slot.tierListId}`);
    }
  });
  if (invalidSlots.length > 5) {
    console.log(`  ... and ${invalidSlots.length - 5} more`);
  }

  // Update each slot to have position = null
  console.log('\nUpdating slots to position = null...');

  let successCount = 0;
  let failCount = 0;

  for (const slot of invalidSlots) {
    console.log(`Updating slot ${slot.id}...`);

    const { data, errors } = await client.models.TierSlot.update({
      id: slot.id,
      position: null
    });

    if (errors && errors.length > 0) {
      console.error(`  ❌ Failed:`, errors);
      failCount++;
    } else if (data) {
      console.log(`  ✅ Success - new position: ${data.position}`);
      successCount++;
    } else {
      console.warn(`  ⚠️  No data returned`);
      failCount++;
    }
  }

  console.log(`\nUpdate summary: ${successCount} succeeded, ${failCount} failed`);

  if (failCount > 0) {
    console.error('\n❌ Some updates failed - see errors above');
  } else {
    console.log(`\n✅ Successfully updated ${successCount} tier slots to position = null!`);
  }

  // Verify the fix
  console.log('\nVerifying...');
  let verifyCount = 0;
  let verifyNextToken: string | null | undefined = undefined;

  do {
    const { data, nextToken } = await client.models.TierSlot.list({
      filter: { position: { eq: 86 } },
      nextToken: verifyNextToken as any
    });

    if (data && data.length > 0) {
      verifyCount += data.length;
    }

    verifyNextToken = nextToken;
  } while (verifyNextToken);

  if (verifyCount > 0) {
    console.warn(`⚠️  Warning: Still found ${verifyCount} slots with position = 86`);
  } else {
    console.log('✅ Verification passed: No more slots with position = 86');
  }
}

fixInvalidPositions()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Script failed:', err);
    process.exit(1);
  });
