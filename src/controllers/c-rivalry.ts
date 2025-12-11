import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/data';
import { pick } from 'lodash';
import type { Schema } from '../../amplify/data/resource';

import { getMContest, MContest } from '../models/m-contest';
import { getMRivalry, MRivalry } from '../models/m-rivalry';
import { FIGHTER_COUNT } from '../models/m-tier-list';
import type { MTierList } from '../models/m-tier-list';

// Lazy client initialization to avoid crashes when Amplify isn't configured (e.g., Expo Go)
let client: ReturnType<typeof generateClient<Schema>> | null = null;

function getClient() {
  if (!client) {
    client = generateClient<Schema>();
  }

  return client;
}

const UPDATE_RIVALRY_KEYS = ['id', 'contestCount', 'currentContestId'];

interface RivalryQueryBaseProps {
  rivalry?: MRivalry | null;
}

interface ContestQueryBaseProps {
  contest?: MContest | null;
}

interface RivalryQueryProps extends RivalryQueryBaseProps {
  onSuccess?: (populatedRivalry: MRivalry) => void;
}

interface RivalryMutationProps extends RivalryQueryBaseProps {
  onSuccess?: () => void;
}

interface RivalryMutationWithContestProps extends RivalryQueryBaseProps {
  onSuccess?: (contest: MContest) => void;
}

interface TierListMutationProps extends RivalryQueryBaseProps {
  tierListSignifier: 'A' | 'B';
  onSuccess?: () => void;
}

interface UpdateContestMutationProps extends ContestQueryBaseProps {
  onSuccess?: () => void;
}

interface UpdateCurrentContestShuffleTierSlotsMutationProps extends RivalryQueryBaseProps {
  onSuccess?: (contest: MContest) => void;
}

interface CreateRivalryMutationProps {
  onSuccess?: (rivalry: MRivalry) => void;
  onError?: (error: Error) => void;
}

interface CreateRivalryParams {
  userAId: string;
  userBId: string;
  gameId: string;
}

interface AcceptRivalryMutationProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface PendingRivalriesQueryProps {
  userId?: string;
}

/** Helper Functions */

/**
 * Ensures a tier list has exactly FIGHTER_COUNT (86) tier slots.
 * If missing tier slots are detected, creates them with position: null.
 * This is a fail-safe to maintain data integrity.
 */
export async function ensureTierListIntegrity(
  tierList: MTierList,
  gameId: string
): Promise<boolean> {
  // Check if we have exactly FIGHTER_COUNT tier slots
  if (tierList.slots.length === FIGHTER_COUNT) {
    return false; // No changes needed
  }

  console.warn(
    `[ensureTierListIntegrity] TierList ${tierList.id} has ${tierList.slots.length} slots, expected ${FIGHTER_COUNT}. Checking DB...`
  );

  // Re-fetch tier list with tier slots from DB using the relationship (proper index usage)
  const { data: tierListData, errors: tierListErrors } = await getClient().models.TierList.get(
    { id: tierList.id },
    {
      selectionSet: ['id', 'tierSlots.*']
    }
  );

  if (tierListErrors || !tierListData) {
    console.error('[ensureTierListIntegrity] Failed to fetch tier list from DB');
    return false;
  }

  // Extract tier slots from the relationship
  const tierSlotsArray: any[] = [];
  if (tierListData.tierSlots) {
    for await (const tierSlot of tierListData.tierSlots) {
      tierSlotsArray.push(tierSlot);
    }
  }

  const tierSlots = tierSlotsArray;
  console.warn(`[ensureTierListIntegrity] DB confirms ${tierSlots.length} slots.`);

  // Fetch all fighters for the game to validate against
  const { data: fighters, errors: fightersErrors } = await getClient().models.Fighter.list({
    filter: { gameId: { eq: gameId } }
  });

  if (fightersErrors || !fighters || fighters.length === 0) {
    console.error('[ensureTierListIntegrity] Failed to fetch fighters');
    return false;
  }

  // STEP 1: Handle duplicates - group by fighterId and keep best slot
  const slotsByFighter = new Map<string, typeof tierSlots>();
  for (const slot of tierSlots) {
    const existing = slotsByFighter.get(slot.fighterId);
    if (!existing) {
      slotsByFighter.set(slot.fighterId, [slot]);
    } else {
      existing.push(slot);
    }
  }

  console.log(
    `[ensureTierListIntegrity] Grouped ${tierSlots.length} slots into ${slotsByFighter.size} unique fighters`
  );

  const slotsToDelete: string[] = [];
  const keptSlots = new Map<string, (typeof tierSlots)[0]>();

  for (const [fighterId, slots] of slotsByFighter) {
    if (slots.length === 1) {
      // No duplicates for this fighter
      keptSlots.set(fighterId, slots[0]);
    } else {
      // Duplicates found! Keep the one with a position, or highest contestCount
      console.warn(
        `[ensureTierListIntegrity] Found ${slots.length} duplicate slots for fighter ${fighterId}:`,
        slots.map((s) => ({ id: s.id, position: s.position, contestCount: s.contestCount }))
      );

      const slotWithPosition = slots.find((s) => s.position != null);
      const bestSlot =
        slotWithPosition ||
        slots.reduce((best, current) =>
          (current.contestCount || 0) > (best.contestCount || 0) ? current : best
        );

      keptSlots.set(fighterId, bestSlot);

      // Mark others for deletion
      for (const slot of slots) {
        if (slot.id !== bestSlot.id) {
          slotsToDelete.push(slot.id);
        }
      }
    }
  }

  // STEP 2: Delete duplicate slots
  if (slotsToDelete.length > 0) {
    console.log(
      `[ensureTierListIntegrity] Deleting ${slotsToDelete.length} duplicate tier slots...`
    );

    const deletePromises = slotsToDelete.map((id) =>
      getClient().models.TierSlot.delete({ id })
    );

    const deleteResults = await Promise.all(deletePromises);
    const deleteErrors = deleteResults.filter((r) => r.errors).flatMap((r) => r.errors);

    if (deleteErrors.length > 0) {
      console.error('[ensureTierListIntegrity] Failed to delete some duplicates:', deleteErrors);
      return false;
    }

    console.log(`[ensureTierListIntegrity] Successfully deleted ${slotsToDelete.length} duplicates`);
  }

  // STEP 3: Identify missing fighters
  const existingFighterIds = new Set(keptSlots.keys());
  const missingFighters = fighters.filter((f) => !existingFighterIds.has(f.id));

  console.log(
    `[ensureTierListIntegrity] Existing fighters: ${existingFighterIds.size}, Total fighters in game: ${fighters.length}, Missing: ${missingFighters.length}`
  );

  // STEP 4: Create missing tier slots
  if (missingFighters.length > 0) {
    console.log(
      `[ensureTierListIntegrity] Creating ${missingFighters.length} missing tier slots with position: null`
    );

    const createPromises = missingFighters.map((fighter) =>
      getClient().models.TierSlot.create({
        tierListId: tierList.id,
        fighterId: fighter.id,
        position: null,
        contestCount: 0,
        winCount: 0
      })
    );

    const results = await Promise.all(createPromises);
    const createErrors = results.filter((r) => r.errors).flatMap((r) => r.errors);

    if (createErrors.length > 0) {
      console.error('[ensureTierListIntegrity] Failed to create some tier slots:', createErrors);
      return false;
    }

    console.log(
      `[ensureTierListIntegrity] Successfully created ${missingFighters.length} tier slots`
    );
  }

  // STEP 5: Validate final count
  // keptSlots already excludes duplicates, so we don't subtract slotsToDelete
  const finalCount = keptSlots.size + missingFighters.length;

  console.log(
    `[ensureTierListIntegrity] Final calculation: keptSlots=${keptSlots.size}, missing=${missingFighters.length}, deleted=${slotsToDelete.length}, total=${finalCount}`
  );

  if (finalCount !== FIGHTER_COUNT) {
    console.error(
      `[ensureTierListIntegrity] Final count mismatch: ${finalCount} slots, expected ${FIGHTER_COUNT}`
    );
  }

  // Return true if we made any changes (deleted duplicates or created missing slots)
  return slotsToDelete.length > 0 || missingFighters.length > 0;
}

/** Queries */

export const useRivalryContestsQuery = ({
  rivalryId,
  limit = 100
}: {
  rivalryId?: string;
  limit?: number;
}) =>
  useQuery({
    enabled: !!rivalryId,
    queryKey: ['rivalryContests', rivalryId, limit],
    queryFn: async () => {
      const {
        data: contests,
        errors,
        nextToken
      } = await getClient().models.Contest.list({
        filter: { rivalryId: { eq: rivalryId } },
        limit
      });

      if (errors) {
        console.error('[useRivalryContestsQuery] GraphQL errors:', errors);
        throw new Error(errors[0]?.message || 'Failed to fetch contests');
      }

      return {
        contests: contests.map((c) => getMContest(c as any)),
        nextToken
      };
    }
  });

export const useRivalryWithAllInfoQuery = ({ rivalry, onSuccess }: RivalryQueryProps) =>
  useQuery({
    enabled: !!rivalry?.id,
    queryKey: ['rivalryId', rivalry?.id],
    queryFn: async () => {
      // Use Gen 2 client to fetch rivalry with related data
      const { data: rivalryData, errors } = await getClient().models.Rivalry.get(
        { id: rivalry?.id as string },
        {
          selectionSet: [
            'id',
            'userAId',
            'userBId',
            'gameId',
            'contestCount',
            'currentContestId',
            'createdAt',
            'updatedAt',
            'deletedAt',
            'hiddenByA',
            'hiddenByB',
            'contests.*',
            'tierLists.*',
            'tierLists.tierSlots.*'
          ]
        }
      );

      if (errors) {
        console.error('[useRivalryWithAllInfoQuery] GraphQL errors:', errors);
        throw new Error(errors[0]?.message || 'Failed to fetch rivalry');
      }

      if (!rivalryData) {
        throw new Error('Rivalry not found');
      }

      // Fetch the most recent contests using the GSI for better sorting
      // This ensures we get the actual most recent contests, not a random subset
      const { data: recentContests, errors: contestErrors } =
        await getClient().models.Contest.contestsByRivalryIdAndCreatedAt({
          rivalryId: rivalryData.id,
          sortDirection: 'DESC',
          limit: 50
        });

      if (contestErrors) {
        console.error('[useRivalryWithAllInfoQuery] Error fetching contests:', contestErrors);
      }

      const contestsArray = recentContests || [];

      // If we have a currentContestId but it's not in the contests array, fetch it separately
      if (rivalryData.currentContestId) {
        const currentContestExists = contestsArray.some(
          (c) => c.id === rivalryData.currentContestId
        );
        if (!currentContestExists) {
          const { data: currentContestData, errors: currentContestErrors } =
            await getClient().models.Contest.get({ id: rivalryData.currentContestId });
          if (currentContestErrors) {
            console.error(
              '[useRivalryWithAllInfoQuery] Error fetching current contest:',
              currentContestErrors
            );
          } else if (currentContestData) {
            contestsArray.unshift(currentContestData as any);
          }
        }
      }

      const contests = { items: contestsArray };

      const tierListsArray: any[] = [];
      if (rivalryData.tierLists) {
        for await (const tierListData of rivalryData.tierLists) {
          const tierSlotsArray: any[] = [];
          if (tierListData.tierSlots) {
            for await (const tierSlot of tierListData.tierSlots) {
              tierSlotsArray.push(tierSlot);
            }
          }
          tierListsArray.push({ ...tierListData, tierSlots: { items: tierSlotsArray } });
        }
      }
      const tierLists = { items: tierListsArray };

      if (tierLists.items.some(Boolean)) {
        // Update rivalry with fetched data
        const mRivalry = rivalry as MRivalry;
        mRivalry.userAId = rivalryData.userAId;
        mRivalry.userBId = rivalryData.userBId;
        mRivalry.gameId = rivalryData.gameId;
        mRivalry.contestCount = rivalryData.contestCount;
        mRivalry.currentContestId = rivalryData.currentContestId;
        mRivalry.hiddenByA = rivalryData.hiddenByA ?? false;
        mRivalry.hiddenByB = rivalryData.hiddenByB ?? false;
        mRivalry.setMContests(contests as any);
        mRivalry.setMTierLists(tierLists as any);

        // Fetch user data separately
        const { getMUser } = await import('../models/m-user');

        const { data: userAData } = await getClient().models.User.get({
          id: rivalryData.userAId
        });
        if (userAData) {
          mRivalry.userA = getMUser({ user: userAData as any });
        }

        const { data: userBData } = await getClient().models.User.get({
          id: rivalryData.userBId
        });
        if (userBData) {
          mRivalry.userB = getMUser({ user: userBData as any });
        }

        // FAIL-SAFE: Ensure tier lists have complete tier slots (86 per tier list)
        let needsRefresh = false;
        if (mRivalry.tierListA) {
          const madeChangesA = await ensureTierListIntegrity(
            mRivalry.tierListA,
            rivalryData.gameId
          );
          if (madeChangesA) {
            needsRefresh = true;
          }
        }
        if (mRivalry.tierListB) {
          const madeChangesB = await ensureTierListIntegrity(
            mRivalry.tierListB,
            rivalryData.gameId
          );
          if (madeChangesB) {
            needsRefresh = true;
          }
        }

        // If we made changes (deleted duplicates or created missing slots), re-fetch to get updated data
        if (needsRefresh) {
          console.log(
            '[useRivalryWithAllInfoQuery] Re-fetching rivalry after creating missing tier slots'
          );
          const { data: refreshedRivalry } = await getClient().models.Rivalry.get(
            { id: rivalry?.id as string },
            {
              selectionSet: ['tierLists.*', 'tierLists.tierSlots.*']
            }
          );

          if (refreshedRivalry?.tierLists) {
            const refreshedTierListsArray: any[] = [];
            for await (const tierListData of refreshedRivalry.tierLists) {
              const tierSlotsArray: any[] = [];
              if (tierListData.tierSlots) {
                for await (const tierSlot of tierListData.tierSlots) {
                  tierSlotsArray.push(tierSlot);
                }
              }
              refreshedTierListsArray.push({
                ...tierListData,
                tierSlots: { items: tierSlotsArray }
              });
            }
            mRivalry.setMTierLists({ items: refreshedTierListsArray } as any);
          }
        }

        onSuccess?.(mRivalry);
      } else {
        console.warn(
          '[useRivalryWithAllInfoQuery] Missing tier lists or contests - rivalry data incomplete'
        );
      }

      return rivalryData;
    }
  });

/** Mutations */

export const useCreateContestMutation = ({
  rivalry,
  onSuccess
}: RivalryMutationWithContestProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Sample eligible tier slots from both tier lists
      const tierSlotA = rivalry?.tierListA?.sampleEligibleSlot();
      const tierSlotB = rivalry?.tierListB?.sampleEligibleSlot();

      if (!(tierSlotA && tierSlotB)) {
        throw new Error('Unable to sample tier slots');
      }

      // Create contest using Gen 2 client
      const { data: contestData, errors } = await getClient().models.Contest.create({
        rivalryId: rivalry?.id as string,
        tierSlotAId: tierSlotA.id,
        tierSlotBId: tierSlotB.id,
        result: 0,
        bias: 0
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to create contest');
      }

      return getMContest(contestData as any);
    },
    onSuccess: (contest) => {
      queryClient.invalidateQueries({ queryKey: ['rivalryId', rivalry?.id] });
      onSuccess?.(contest);
    }
  });
};

export const useUpdateRivalryMutation = ({ rivalry }: RivalryMutationProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      overrides?: Partial<Pick<MRivalry, 'contestCount' | 'currentContestId'>>
    ) => {
      const updateInput = {
        ...pick(rivalry, UPDATE_RIVALRY_KEYS),
        ...overrides
      };
      const { data, errors } = await getClient().models.Rivalry.update(updateInput as any);

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to update rivalry');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rivalryId', rivalry?.id] });
    }
  });
};

export const useUpdateContestMutation = ({ rivalry, onSuccess }: RivalryMutationProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const contest = rivalry?.currentContest;

      if (!contest) {
        throw new Error('No current contest');
      }

      const { data, errors } = await getClient().models.Contest.update({
        id: contest.id,
        result: contest.result,
        bias: contest.bias
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to update contest');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rivalryId', rivalry?.id] });
      onSuccess?.();
    }
  });
};

export const useUpdateContestTierListsMutation = ({
  contest,
  onSuccess
}: UpdateContestMutationProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const rivalry = contest?.rivalry;

      if (!(rivalry?.tierListA && rivalry?.tierListB)) {
        throw new Error('Tier lists not found');
      }

      // Update both tier lists
      const [resultA, resultB] = await Promise.all([
        getClient().models.TierList.update({
          id: rivalry.tierListA.id,
          standing: rivalry.tierListA.standing
        }),
        getClient().models.TierList.update({
          id: rivalry.tierListB.id,
          standing: rivalry.tierListB.standing
        })
      ]);

      if (resultA.errors || resultB.errors) {
        throw new Error('Failed to update tier lists');
      }

      return { tierListA: resultA.data, tierListB: resultB.data };
    },
    onSuccess: () => {
      const rivalry = contest?.rivalry;
      queryClient.invalidateQueries({ queryKey: ['rivalryId', rivalry?.id] });
      onSuccess?.();
    }
  });
};

export const useUpdateTierSlotsMutation = ({
  rivalry,
  tierListSignifier,
  onSuccess
}: TierListMutationProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const tierList = tierListSignifier === 'A' ? rivalry?.tierListA : rivalry?.tierListB;

      if (!tierList) {
        throw new Error('Tier list not found');
      }

      const positionsPojo = tierList.getPositionsPojo();

      // Update all tier slots in parallel
      const updates = Object.values(positionsPojo).map(({ id, position }) =>
        getClient().models.TierSlot.update({ id, position })
      );

      const results = await Promise.all(updates);

      const errors = results.filter((r) => r.errors).flatMap((r) => r.errors);
      if (errors.length > 0) {
        throw new Error(errors[0]?.message || 'Failed to update tier slots');
      }

      return results.map((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rivalryId', rivalry?.id] });
      onSuccess?.();
    }
  });
};

export const useManuallyPositionTierSlotMutation = ({
  rivalry,
  tierListSignifier,
  onSuccess
}: TierListMutationProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tierSlotId,
      targetPosition
    }: {
      tierSlotId: string;
      targetPosition: number;
    }) => {
      const tierList = tierListSignifier === 'A' ? rivalry?.tierListA : rivalry?.tierListB;

      if (!tierList) {
        throw new Error('Tier list not found');
      }

      const tierSlot = tierList.slots.find((s) => s.id === tierSlotId);
      if (!tierSlot) {
        throw new Error('Tier slot not found');
      }

      // Position the fighter at the target position
      tierList.positionUnknownFighter(tierSlot, targetPosition);

      // Update all affected tier slots in database
      const positionsPojo = tierList.getPositionsPojo();
      const updates = Object.values(positionsPojo).map(({ id, position }) =>
        getClient().models.TierSlot.update({ id, position })
      );

      const results = await Promise.all(updates);
      const errors = results.filter((r) => r.errors).flatMap((r) => r.errors);

      if (errors.length > 0) {
        throw new Error(errors[0]?.message || 'Failed to update tier slots');
      }

      return results.map((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rivalryId', rivalry?.id] });
      onSuccess?.();
    }
  });
};

export const useUpdateCurrentContestShuffleTierSlotsMutation = ({
  rivalry,
  onSuccess
}: UpdateCurrentContestShuffleTierSlotsMutationProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slotToReshuffle?: 'A' | 'B') => {
      if (!rivalry?.currentContest) {
        throw new Error('No current contest');
      }

      // Store the current tier slots and their positions BEFORE resampling
      const oldTierSlotA = rivalry.currentContest.tierSlotA;
      const oldTierSlotB = rivalry.currentContest.tierSlotB;
      const oldPositionA = oldTierSlotA?.position;
      const oldPositionB = oldTierSlotB?.position;

      let tierSlotA = oldTierSlotA;
      let tierSlotB = oldTierSlotB;

      const tierSlotsToUpdate: Array<{ id: string; position: number }> = [];

      // Only resample the specified slot(s)
      if (!slotToReshuffle || slotToReshuffle === 'A') {
        // Sample tier slot A until we get a different fighter
        tierSlotA = rivalry?.tierListA?.sampleEligibleSlot();
        console.log('sampleEligibleSlot called for slot A');
        let attempts = 0;
        const maxAttempts = 100; // Safety limit

        while (tierSlotA && tierSlotA.id === oldTierSlotA?.id && attempts < maxAttempts) {
          tierSlotA = rivalry?.tierListA?.sampleEligibleSlot();
          attempts++;
        }

        // Move OLD slot to position 85 (bottom) with UP shifting
        // NEW slot keeps its current position (whatever it is, including null)
        if (oldTierSlotA && rivalry.tierListA) {
          rivalry.tierListA.positionFighterAtBottom(oldTierSlotA);
        }

        // Collect all affected tier slots from tierListA
        rivalry.tierListA?.slots.forEach((slot) => {
          if (slot.position !== null && slot.position !== undefined) {
            tierSlotsToUpdate.push({ id: slot.id, position: slot.position });
          }
        });
      }

      if (!slotToReshuffle || slotToReshuffle === 'B') {
        // Sample tier slot B until we get a different fighter
        tierSlotB = rivalry?.tierListB?.sampleEligibleSlot();
        console.log('sampleEligibleSlot called for slot B');
        let attempts = 0;
        const maxAttempts = 100; // Safety limit

        while (tierSlotB && tierSlotB.id === oldTierSlotB?.id && attempts < maxAttempts) {
          tierSlotB = rivalry?.tierListB?.sampleEligibleSlot();
          attempts++;
        }

        // Move OLD slot to position 85 (bottom) with UP shifting
        // NEW slot keeps its current position (whatever it is, including null)
        if (oldTierSlotB && rivalry.tierListB) {
          rivalry.tierListB.positionFighterAtBottom(oldTierSlotB);
        }

        // Collect all affected tier slots from tierListB
        rivalry.tierListB?.slots.forEach((slot) => {
          if (slot.position !== null && slot.position !== undefined) {
            tierSlotsToUpdate.push({ id: slot.id, position: slot.position });
          }
        });
      }

      if (!(tierSlotA && tierSlotB)) {
        throw new Error('Unable to sample tier slots');
      }

      // Persist position updates to database if any unknown fighters were positioned
      if (tierSlotsToUpdate.length > 0) {
        const tierSlotUpdatePromises = tierSlotsToUpdate.map(({ id, position }) =>
          getClient().models.TierSlot.update({ id, position })
        );

        const tierSlotResults = await Promise.all(tierSlotUpdatePromises);
        const tierSlotErrors = tierSlotResults.filter((r) => r.errors).flatMap((r) => r.errors);

        if (tierSlotErrors.length > 0) {
          console.error(
            '[useUpdateCurrentContestShuffleTierSlotsMutation] Failed to update tier slots:',
            tierSlotErrors
          );
          throw new Error('Failed to update tier slot positions');
        }
      }

      const { data, errors } = await getClient().models.Contest.update({
        id: rivalry.currentContest.id,
        tierSlotAId: tierSlotA.id,
        tierSlotBId: tierSlotB.id
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to update contest');
      }

      return getMContest(data as any);
    },
    onSuccess: (contest) => {
      queryClient.invalidateQueries({ queryKey: ['rivalryId', rivalry?.id] });
      onSuccess?.(contest);
    }
  });
};

export const useDeleteMostRecentContestMutation = ({
  rivalry,
  onSuccess
}: RivalryMutationProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!rivalry) {
        throw new Error('No rivalry provided');
      }

      // Current contest is at index 0, most recent resolved contest is at index 1
      const currentContest = rivalry.mContests[0];
      const mostRecentContest = rivalry.mContests[1];

      if (!currentContest || !mostRecentContest) {
        throw new Error('No contests to delete');
      }

      if (!mostRecentContest.result) {
        throw new Error('Cannot delete unresolved contest');
      }

      // Reverse the standings using the bias
      rivalry.reverseStanding(mostRecentContest);

      // Reverse the tier slot position adjustments (opposite of what was done when resolving)
      // When resolving: tierListA adjusts by (result * STEPS_PER_STOCK * -1)
      // When undoing: reverse that, so adjust by (result * STEPS_PER_STOCK)
      const STEPS_PER_STOCK = 3;

      // Pass the actual POSITION values, not indices
      rivalry.tierListA?.adjustTierSlotPositionBySteps(
        mostRecentContest.tierSlotA?.position as number,
        (mostRecentContest.result as number) * STEPS_PER_STOCK
      );
      rivalry.tierListB?.adjustTierSlotPositionBySteps(
        mostRecentContest.tierSlotB?.position as number,
        (mostRecentContest.result as number) * STEPS_PER_STOCK * -1
      );

      // Get the updated tier slot positions
      const tierListAPositions = rivalry.tierListA?.getPositionsPojo();
      const tierListBPositions = rivalry.tierListB?.getPositionsPojo();

      // Update tier slots in parallel
      const tierSlotUpdates = [
        ...(tierListAPositions
          ? Object.values(tierListAPositions).map(({ id, position }) =>
              getClient().models.TierSlot.update({ id, position })
            )
          : []),
        ...(tierListBPositions
          ? Object.values(tierListBPositions).map(({ id, position }) =>
              getClient().models.TierSlot.update({ id, position })
            )
          : [])
      ];

      const tierSlotResults = await Promise.all(tierSlotUpdates);
      const tierSlotErrors = tierSlotResults.filter((r) => r.errors).flatMap((r) => r.errors);

      if (tierSlotErrors.length > 0) {
        throw new Error(tierSlotErrors[0]?.message || 'Failed to update tier slots');
      }

      // Update both tier lists with reversed standings
      const [resultA, resultB] = await Promise.all([
        getClient().models.TierList.update({
          id: rivalry.tierListA!.id,
          standing: rivalry.tierListA!.standing
        }),
        getClient().models.TierList.update({
          id: rivalry.tierListB!.id,
          standing: rivalry.tierListB!.standing
        })
      ]);

      if (resultA.errors || resultB.errors) {
        throw new Error('Failed to update tier lists after reversal');
      }

      // Reset the result and bias on the most recent contest (making it unresolved)
      const { data: resetContestData, errors: resetErrors } =
        await getClient().models.Contest.update({
          id: mostRecentContest.id,
          result: 0,
          bias: 0
        });

      if (resetErrors) {
        throw new Error(resetErrors[0]?.message || 'Failed to reset contest');
      }

      // Update rivalry to point to the undone contest as the current contest
      const { errors: rivalryUpdateErrors } = await getClient().models.Rivalry.update({
        id: rivalry.id,
        currentContestId: mostRecentContest.id,
        contestCount: Math.max((rivalry.contestCount || 0) - 1, 0)
      });

      if (rivalryUpdateErrors) {
        throw new Error(rivalryUpdateErrors[0]?.message || 'Failed to update rivalry');
      }

      // Delete the old current contest
      const { errors: deleteErrors } = await getClient().models.Contest.delete({
        id: currentContest.id
      });

      if (deleteErrors) {
        throw new Error(deleteErrors[0]?.message || 'Failed to delete contest');
      }

      return resetContestData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rivalryId', rivalry?.id] });
      onSuccess?.();
    }
  });
};

export const usePendingRivalriesQuery = ({ userId }: PendingRivalriesQueryProps) => {
  return useQuery({
    queryKey: ['pendingRivalries', userId],
    queryFn: async () => {
      if (!userId) return { awaitingAcceptance: [], initiated: [] };

      // Fetch rivalries where user is UserB and rivalry is not accepted
      const { data: awaitingAcceptanceData } = await getClient().models.Rivalry.list({
        filter: {
          userBId: { eq: userId },
          accepted: { eq: false }
        },
        selectionSet: [
          'id',
          'userAId',
          'userBId',
          'gameId',
          'contestCount',
          'currentContestId',
          'accepted',
          'createdAt',
          'updatedAt',
          'deletedAt'
        ]
      });

      // Fetch rivalries where user is UserA and rivalry is not accepted
      const { data: initiatedData } = await getClient().models.Rivalry.list({
        filter: {
          userAId: { eq: userId },
          accepted: { eq: false }
        },
        selectionSet: [
          'id',
          'userAId',
          'userBId',
          'gameId',
          'contestCount',
          'currentContestId',
          'accepted',
          'createdAt',
          'updatedAt',
          'deletedAt'
        ]
      });

      return {
        awaitingAcceptance: (awaitingAcceptanceData || []).map((r) =>
          getMRivalry({ rivalry: r as any })
        ),
        initiated: (initiatedData || []).map((r) => getMRivalry({ rivalry: r as any }))
      };
    },
    enabled: !!userId
  });
};

export const useCreateRivalryMutation = ({
  onSuccess,
  onError
}: CreateRivalryMutationProps = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userAId, userBId, gameId }: CreateRivalryParams) => {
      // Create the rivalry
      const { data: rivalryData, errors: rivalryErrors } = await getClient().models.Rivalry.create({
        userAId,
        userBId,
        gameId,
        contestCount: 0,
        accepted: false
      });

      if (rivalryErrors) {
        console.error('[useCreateRivalryMutation] Rivalry creation errors:', rivalryErrors);
        throw new Error(rivalryErrors[0]?.message || 'Failed to create rivalry');
      }

      // Find the initiator's rivalry with the highest contestCount > 100
      const { data: userRivalries } = await getClient().models.Rivalry.list({
        filter: {
          or: [{ userAId: { eq: userAId } }, { userBId: { eq: userAId } }],
          accepted: { eq: true }
        }
      });

      // Sort by contestCount descending and find the first one with contestCount > 100
      const templateRivalry = userRivalries
        ?.filter((r) => (r.contestCount || 0) > 100)
        .sort((a, b) => (b.contestCount || 0) - (a.contestCount || 0))[0];

      let tierSlotData: Array<{ fighterId: string; position: number }>;

      if (templateRivalry) {
        // Find the user's tier list in the template rivalry
        const { data: tierLists } = await getClient().models.TierList.list({
          filter: {
            rivalryId: { eq: templateRivalry.id },
            userId: { eq: userAId }
          }
        });

        const templateTierList = tierLists?.[0];

        if (templateTierList) {
          // Get the tier slots from the template tier list using the relationship
          const { data: tierListData } = await getClient().models.TierList.get(
            { id: templateTierList.id },
            { selectionSet: ['id', 'tierSlots.*'] }
          );

          const templateTierSlotsArray: any[] = [];
          if (tierListData?.tierSlots) {
            for await (const tierSlot of tierListData.tierSlots) {
              templateTierSlotsArray.push(tierSlot);
            }
          }

          const templateTierSlots = templateTierSlotsArray;

          if (templateTierSlots && templateTierSlots.length > 0) {
            // Use the template tier slots
            tierSlotData = templateTierSlots.map((slot) => ({
              fighterId: slot.fighterId,
              position: slot.position
            }));
            console.log(
              `[useCreateRivalryMutation] Using template from rivalry ${templateRivalry.id} with ${templateTierSlots.length} fighters`
            );
          } else {
            // Fallback to fetching fighters with null positions
            const { data: fighters, errors: fightersErrors } =
              await getClient().models.Fighter.list({
                filter: { gameId: { eq: gameId } }
              });

            if (fightersErrors || !fighters || fighters.length === 0) {
              throw new Error('Failed to fetch fighters');
            }

            tierSlotData = fighters.map((fighter) => ({
              fighterId: fighter.id,
              position: null
            }));
            console.log(
              `[useCreateRivalryMutation] Created ${fighters.length} fighters with null positions`
            );
          }
        } else {
          // No template tier list found, fetch fighters with null positions
          const { data: fighters, errors: fightersErrors } = await getClient().models.Fighter.list({
            filter: { gameId: { eq: gameId } }
          });

          if (fightersErrors || !fighters || fighters.length === 0) {
            throw new Error('Failed to fetch fighters');
          }

          tierSlotData = fighters.map((fighter) => ({
            fighterId: fighter.id,
            position: null
          }));
          console.log(
            `[useCreateRivalryMutation] Created ${fighters.length} fighters with null positions`
          );
        }
      } else {
        // No rivalry with contestCount > 2 found, fetch fighters with null positions
        const { data: fighters, errors: fightersErrors } = await getClient().models.Fighter.list({
          filter: { gameId: { eq: gameId } }
        });

        if (fightersErrors || !fighters || fighters.length === 0) {
          throw new Error('Failed to fetch fighters');
        }

        tierSlotData = fighters.map((fighter) => ({
          fighterId: fighter.id,
          position: null
        }));
        console.log(
          `[useCreateRivalryMutation] Created ${fighters.length} fighters with null positions (no template found)`
        );
      }

      // Create tier list for userA (initiator) only
      const { data: tierListAData, errors: tierListAErrors } =
        await getClient().models.TierList.create({
          rivalryId: rivalryData!.id,
          userId: userAId,
          standing: 0
        });

      if (tierListAErrors || !tierListAData) {
        console.error('[useCreateRivalryMutation] Tier list creation errors:', tierListAErrors);
        throw new Error('Failed to create tier list for userA');
      }

      // Create tier slots for userA in batches
      const BATCH_SIZE = 10;
      const allTierSlotErrors: any[] = [];

      for (let i = 0; i < tierSlotData.length; i += BATCH_SIZE) {
        const batch = tierSlotData.slice(i, i + BATCH_SIZE);
        const tierSlotPromises = batch.map((slot) =>
          getClient().models.TierSlot.create({
            tierListId: tierListAData.id,
            fighterId: slot.fighterId,
            position: slot.position,
            contestCount: 0,
            winCount: 0
          })
        );

        const tierSlotResults = await Promise.all(tierSlotPromises);
        const tierSlotErrors = tierSlotResults.filter((r) => r.errors).flatMap((r) => r.errors);
        allTierSlotErrors.push(...tierSlotErrors);

        console.log(
          `[useCreateRivalryMutation] Created tier slots batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(tierSlotData.length / BATCH_SIZE)}`
        );
      }

      if (allTierSlotErrors.length > 0) {
        console.error('[useCreateRivalryMutation] Tier slot creation errors:', allTierSlotErrors);
        throw new Error(
          `Failed to create ${allTierSlotErrors.length} tier slots out of ${tierSlotData.length} total`
        );
      }

      // FAIL-SAFE: Verify tier list has all 86 tier slots (in case of partial batch failures)
      // Load the tier list to check integrity
      const { data: tierListWithSlots } = await getClient().models.TierList.get(
        { id: tierListAData.id },
        { selectionSet: ['*', 'tierSlots.*'] }
      );

      if (tierListWithSlots) {
        const { getMTierList } = await import('../models/m-tier-list');
        const mTierList = getMTierList(tierListWithSlots as any);

        // Check and fix any missing slots
        await ensureTierListIntegrity(mTierList, gameId);
      }

      return getMRivalry({ rivalry: rivalryData as any });
    },
    onSuccess: (rivalry, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pendingRivalries', variables.userAId] });
      queryClient.invalidateQueries({ queryKey: ['usersByAwsSub'] });
      onSuccess?.(rivalry);
    },
    onError: (error: Error) => {
      console.error('[useCreateRivalryMutation] Error callback:', error);
      onError?.(error);
    }
  });
};

export const useCreateNpcRivalryMutation = ({
  onSuccess,
  onError
}: CreateRivalryMutationProps = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userAId, userBId, gameId }: CreateRivalryParams) => {
      // Create the rivalry with accepted = true for NPCs
      const { data: rivalryData, errors: rivalryErrors } = await getClient().models.Rivalry.create({
        userAId,
        userBId,
        gameId,
        contestCount: 0,
        accepted: true // Auto-accept for NPCs
      });

      if (rivalryErrors) {
        console.error('[useCreateNpcRivalryMutation] Rivalry creation errors:', rivalryErrors);
        throw new Error(rivalryErrors[0]?.message || 'Failed to create NPC rivalry');
      }

      // Fetch all fighters for the game
      const { data: fighters, errors: fightersErrors } = await getClient().models.Fighter.list({
        filter: { gameId: { eq: gameId } }
      });

      if (fightersErrors || !fighters || fighters.length === 0) {
        throw new Error('Failed to fetch fighters');
      }

      // Create tier slot data for userA with null positions
      const tierSlotDataA = fighters.map((fighter) => ({
        fighterId: fighter.id,
        position: null
      }));

      // Create tier slot data for userB (NPC) with null positions
      const tierSlotDataB = fighters.map((fighter) => ({
        fighterId: fighter.id,
        position: null
      }));

      // Create tier list for userA
      const { data: tierListAData, errors: tierListAErrors } =
        await getClient().models.TierList.create({
          rivalryId: rivalryData!.id,
          userId: userAId,
          standing: 0
        });

      if (tierListAErrors || !tierListAData) {
        throw new Error('Failed to create tier list for userA');
      }

      // Create tier list for userB (NPC)
      const { data: tierListBData, errors: tierListBErrors } =
        await getClient().models.TierList.create({
          rivalryId: rivalryData!.id,
          userId: userBId,
          standing: 0
        });

      if (tierListBErrors || !tierListBData) {
        throw new Error('Failed to create tier list for userB');
      }

      // Create tier slots for both users in batches
      const BATCH_SIZE = 10;
      const allTierSlotErrors: any[] = [];

      // Create tier slots for userA
      for (let i = 0; i < tierSlotDataA.length; i += BATCH_SIZE) {
        const batch = tierSlotDataA.slice(i, i + BATCH_SIZE);
        const tierSlotPromises = batch.map((slot) =>
          getClient().models.TierSlot.create({
            tierListId: tierListAData.id,
            fighterId: slot.fighterId,
            position: slot.position,
            contestCount: 0,
            winCount: 0
          })
        );

        const tierSlotResults = await Promise.all(tierSlotPromises);
        const tierSlotErrors = tierSlotResults.filter((r) => r.errors).flatMap((r) => r.errors);
        allTierSlotErrors.push(...tierSlotErrors);
      }

      // Create tier slots for userB (NPC)
      for (let i = 0; i < tierSlotDataB.length; i += BATCH_SIZE) {
        const batch = tierSlotDataB.slice(i, i + BATCH_SIZE);
        const tierSlotPromises = batch.map((slot) =>
          getClient().models.TierSlot.create({
            tierListId: tierListBData.id,
            fighterId: slot.fighterId,
            position: slot.position,
            contestCount: 0,
            winCount: 0
          })
        );

        const tierSlotResults = await Promise.all(tierSlotPromises);
        const tierSlotErrors = tierSlotResults.filter((r) => r.errors).flatMap((r) => r.errors);
        allTierSlotErrors.push(...tierSlotErrors);
      }

      if (allTierSlotErrors.length > 0) {
        console.error(
          '[useCreateNpcRivalryMutation] Tier slot creation errors:',
          allTierSlotErrors
        );
        throw new Error(`Failed to create ${allTierSlotErrors.length} tier slots`);
      }

      return getMRivalry({ rivalry: rivalryData as any });
    },
    onSuccess: (rivalry, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pendingRivalries', variables.userAId] });
      queryClient.invalidateQueries({ queryKey: ['usersByAwsSub'] });
      onSuccess?.(rivalry);
    },
    onError: (error: Error) => {
      console.error('[useCreateNpcRivalryMutation] Error callback:', error);
      onError?.(error);
    }
  });
};

export const useAcceptRivalryMutation = ({ onSuccess, onError }: AcceptRivalryMutationProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rivalryId: string) => {
      if (!rivalryId) {
        throw new Error('Rivalry ID is required');
      }

      // First, get the rivalry details to know which users and game are involved
      const { data: rivalryData, errors: rivalryFetchErrors } =
        await getClient().models.Rivalry.get({
          id: rivalryId
        });

      if (rivalryFetchErrors || !rivalryData) {
        throw new Error(rivalryFetchErrors?.[0]?.message || 'Failed to fetch rivalry');
      }

      const { userBId, gameId } = rivalryData;

      // Fetch fighters for the game
      const { data: fighters, errors: fightersErrors } = await getClient().models.Fighter.list({
        filter: { gameId: { eq: gameId } }
      });

      if (fightersErrors || !fighters || fighters.length === 0) {
        throw new Error('Failed to fetch fighters for game');
      }

      // Find the accepter's rivalry with the highest contestCount > 100
      const { data: userBRivalries } = await getClient().models.Rivalry.list({
        filter: {
          or: [{ userAId: { eq: userBId } }, { userBId: { eq: userBId } }],
          accepted: { eq: true }
        }
      });

      // Sort by contestCount descending and find the first one with contestCount > 100
      const templateRivalry = userBRivalries
        ?.filter((r) => (r.contestCount || 0) > 100)
        .sort((a, b) => (b.contestCount || 0) - (a.contestCount || 0))[0];

      let tierSlotData: Array<{ fighterId: string; position: number }>;

      if (templateRivalry) {
        // Find the user's tier list in the template rivalry
        const { data: tierLists } = await getClient().models.TierList.list({
          filter: {
            rivalryId: { eq: templateRivalry.id },
            userId: { eq: userBId }
          }
        });

        const templateTierList = tierLists?.[0];

        if (templateTierList) {
          // Get the tier slots from the template tier list using the relationship
          const { data: tierListData } = await getClient().models.TierList.get(
            { id: templateTierList.id },
            { selectionSet: ['id', 'tierSlots.*'] }
          );

          const templateTierSlotsArray: any[] = [];
          if (tierListData?.tierSlots) {
            for await (const tierSlot of tierListData.tierSlots) {
              templateTierSlotsArray.push(tierSlot);
            }
          }

          const templateTierSlots = templateTierSlotsArray;

          if (templateTierSlots && templateTierSlots.length > 0) {
            // Use the template tier slots
            tierSlotData = templateTierSlots.map((slot) => ({
              fighterId: slot.fighterId,
              position: slot.position
            }));
            console.log(
              `[useAcceptRivalryMutation] Using template from rivalry ${templateRivalry.id} with ${templateTierSlots.length} fighters`
            );
          } else {
            // Fallback to null positions
            tierSlotData = fighters.map((fighter) => ({
              fighterId: fighter.id,
              position: null
            }));
            console.log(
              `[useAcceptRivalryMutation] Created ${fighters.length} fighters with null positions`
            );
          }
        } else {
          // No template tier list found, use null positions
          tierSlotData = fighters.map((fighter) => ({
            fighterId: fighter.id,
            position: null
          }));
          console.log(
            `[useAcceptRivalryMutation] Created ${fighters.length} fighters with null positions`
          );
        }
      } else {
        // No rivalry with contestCount > 2 found, use null positions
        tierSlotData = fighters.map((fighter) => ({
          fighterId: fighter.id,
          position: null
        }));
        console.log(
          `[useAcceptRivalryMutation] Created ${fighters.length} fighters with null positions (no template found)`
        );
      }

      // Create tier list for userB (accepter) only
      const { data: tierListBData, errors: tierListBErrors } =
        await getClient().models.TierList.create({
          rivalryId,
          userId: userBId,
          standing: 0
        });

      if (tierListBErrors || !tierListBData) {
        throw new Error('Failed to create tier list for userB');
      }

      // Create tier slots for userB in batches
      const BATCH_SIZE = 10;
      const allTierSlotErrors: any[] = [];

      for (let i = 0; i < tierSlotData.length; i += BATCH_SIZE) {
        const batch = tierSlotData.slice(i, i + BATCH_SIZE);
        const tierSlotPromises = batch.map((slot) =>
          getClient().models.TierSlot.create({
            tierListId: tierListBData.id,
            fighterId: slot.fighterId,
            position: slot.position,
            contestCount: 0,
            winCount: 0
          })
        );

        const tierSlotResults = await Promise.all(tierSlotPromises);
        const tierSlotErrors = tierSlotResults.filter((r) => r.errors).flatMap((r) => r.errors);
        allTierSlotErrors.push(...tierSlotErrors);

        console.log(
          `[useAcceptRivalryMutation] Created tier slots batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(tierSlotData.length / BATCH_SIZE)} for userB`
        );
      }

      if (allTierSlotErrors.length > 0) {
        throw new Error(
          `Failed to create ${allTierSlotErrors.length} tier slots out of ${tierSlotData.length} total for userB`
        );
      }

      // FAIL-SAFE: Verify tier list has all 86 tier slots (in case of partial batch failures)
      // Load the tier list to check integrity
      const { data: tierListWithSlots } = await getClient().models.TierList.get(
        { id: tierListBData.id },
        { selectionSet: ['*', 'tierSlots.*'] }
      );

      if (tierListWithSlots) {
        const { getMTierList } = await import('../models/m-tier-list');
        const mTierList = getMTierList(tierListWithSlots as any);

        // Check and fix any missing slots
        await ensureTierListIntegrity(mTierList, gameId);
      }

      // Finally, accept the rivalry
      const { data, errors } = await getClient().models.Rivalry.update({
        id: rivalryId,
        accepted: true
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to accept rivalry');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingRivalries'] });
      queryClient.invalidateQueries({ queryKey: ['usersByAwsSub'] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('[useAcceptRivalryMutation] Mutation failed:', error);
      onError?.(error);
    }
  });
};

interface HideRivalryMutationProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useHideRivalryMutation = ({ onSuccess, onError }: HideRivalryMutationProps = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      rivalryId,
      userId,
      isUserA,
      hidden
    }: {
      rivalryId: string;
      userId: string;
      isUserA: boolean;
      hidden: boolean;
    }) => {
      if (!rivalryId) {
        throw new Error('Rivalry ID is required');
      }

      const updateField = isUserA ? { hiddenByA: hidden } : { hiddenByB: hidden };

      const { data, errors } = await getClient().models.Rivalry.update({
        id: rivalryId,
        ...updateField
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to update rivalry visibility');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersByAwsSub'] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('[useHideRivalryMutation] Mutation failed:', error);
      onError?.(error);
    }
  });
};
