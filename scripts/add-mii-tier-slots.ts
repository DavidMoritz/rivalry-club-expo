import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import outputs from '../amplify_outputs.json' with { type: 'json' };

// Configure Amplify
Amplify.configure(outputs);

const client = generateClient<Schema>();

const tierListIds = [
  '48516859-6301-11ee-a22d-169ccb685861',
  '485168cb-6301-11ee-a22d-169ccb685861',
  '48516ba7-6301-11ee-a22d-169ccb685861',
  '48516c2c-6301-11ee-a22d-169ccb685861',
  '48515a20-6301-11ee-a22d-169ccb685861',
  '485159ab-6301-11ee-a22d-169ccb685861',
  '4851619d-6301-11ee-a22d-169ccb685861',
  '48516127-6301-11ee-a22d-169ccb685861',
  '48514fee-6301-11ee-a22d-169ccb685861',
  '4851507e-6301-11ee-a22d-169ccb685861',
  '48516f00-6301-11ee-a22d-169ccb685861',
  '48516f7f-6301-11ee-a22d-169ccb685861',
  '48515de4-6301-11ee-a22d-169ccb685861',
  '48515d71-6301-11ee-a22d-169ccb685861',
  '485165ab-6301-11ee-a22d-169ccb685861',
  '4851661f-6301-11ee-a22d-169ccb685861',
  '48516775-6301-11ee-a22d-169ccb685861',
  '485167e9-6301-11ee-a22d-169ccb685861',
  '48514be0-6301-11ee-a22d-169ccb685861',
  '48514879-6301-11ee-a22d-169ccb685861',
  '48516d40-6301-11ee-a22d-169ccb685861',
  '48516cb3-6301-11ee-a22d-169ccb685861',
  '4851546e-6301-11ee-a22d-169ccb685861',
  '485153f3-6301-11ee-a22d-169ccb685861',
  '485162f5-6301-11ee-a22d-169ccb685861',
  '48516368-6301-11ee-a22d-169ccb685861',
  '48516700-6301-11ee-a22d-169ccb685861',
  '48516690-6301-11ee-a22d-169ccb685861',
  '485163da-6301-11ee-a22d-169ccb685861',
  '4851644d-6301-11ee-a22d-169ccb685861',
  '485164be-6301-11ee-a22d-169ccb685861',
  '48516537-6301-11ee-a22d-169ccb685861',
  '6b7a39af-283e-466d-8804-998407e23222',
  '8bf3686a-d87b-4504-9cc9-2fff102a9871',
];

const newFighters = [
  {
    fighterId: '483d2106-6301-11ee-a22d-169ccb685861', // Mii Gunner
    position: 85,
  },
  {
    fighterId: '483d2187-6301-11ee-a22d-169ccb685861', // Mii Swordfighter
    position: 86,
  },
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
          winCount: 0,
        });

        if (errors) {
          console.error(
            `  ❌ Error creating tier slot at position ${fighter.position}:`,
            errors
          );
        } else {
          console.log(
            `  ✅ Created tier slot at position ${fighter.position} (ID: ${data?.id})`
          );
        }
      } catch (error) {
        console.error(
          `  ❌ Exception creating tier slot at position ${fighter.position}:`,
          error
        );
      }
    }

    console.log('');
  }

  console.log('Done!');
}

addTierSlots().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
