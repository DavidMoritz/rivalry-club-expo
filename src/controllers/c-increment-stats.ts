import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

// Lazy client initialization to avoid crashes when Amplify isn't configured
let client: ReturnType<typeof generateClient<Schema>> | null = null;

function getClient() {
  if (!client) client = generateClient<Schema>();
  return client;
}

/**
 * Atomically increments TierSlot contestCount and optionally winCount
 * Uses DynamoDB's ADD operation for race-condition-free increments
 */
export async function incrementTierSlotStats(tierSlotId: string, won: boolean) {
  try {
    const { data, errors } = await getClient().mutations.incrementTierSlotStats({
      tierSlotId,
      won,
    });

    if (errors) {
      console.error('[incrementTierSlotStats] GraphQL errors:', errors);
      throw new Error(
        errors[0]?.message || 'Failed to increment tier slot stats'
      );
    }

    return data;
  } catch (error) {
    console.error('[incrementTierSlotStats] Exception thrown:', error);
    throw error;
  }
}

/**
 * Atomically increments Fighter contestCount and optionally winCount
 * Uses DynamoDB's ADD operation for race-condition-free increments
 */
export async function incrementFighterStats(fighterId: string, won: boolean) {
  try {
    const { data, errors } = await getClient().mutations.incrementFighterStats({
      fighterId,
      won,
    });

    if (errors) {
      console.error('[incrementFighterStats] GraphQL errors:', errors);
      throw new Error(
        errors[0]?.message || 'Failed to increment fighter stats'
      );
    }

    return data;
  } catch (error) {
    console.error('[incrementFighterStats] Exception thrown:', error);
    throw error;
  }
}
