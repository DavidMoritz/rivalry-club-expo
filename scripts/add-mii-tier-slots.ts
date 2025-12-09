import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';

// Configure Amplify
Amplify.configure(outputs);

const client = generateClient<Schema>();

const tierListIds = [
  '6b7a39af-283e-466d-8804-998407e23222', // 48514be0-6301-11ee-a22d-169ccb685861
  '8bf3686a-d87b-4504-9cc9-2fff102a9871' // 48514879-6301-11ee-a22d-169ccb685861
];

const newFighters = [
  {
    fighterId: '483d2106-6301-11ee-a22d-169ccb685861', // Mii Gunner
    position: 85
  },
  {
    fighterId: '483d2187-6301-11ee-a22d-169ccb685861', // Mii Swordfighter
    position: 86
  }
];

async function addTierSlots() {
  console.log('Adding tier slots for Mii fighters...\n');

  for (const tierListId of tierListIds) {
    console.log(`Processing tier list: ${tierListId}`);

    for (const fighter of newFighters) {
      try {
        const { data, errors } = await client.models.TierSlot.create({
          tierListId,
          fighterId: fighter.fighterId,
          position: fighter.position,
          contestCount: 0,
          winCount: 0
        });

        if (errors) {
          console.error(`  ❌ Error creating tier slot at position ${fighter.position}:`, errors);
        } else {
          console.log(`  ✅ Created tier slot at position ${fighter.position} (ID: ${data?.id})`);
        }
      } catch (error) {
        console.error(`  ❌ Exception creating tier slot at position ${fighter.position}:`, error);
      }
    }

    console.log('');
  }

  console.log('Done!');
}

addTierSlots().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
