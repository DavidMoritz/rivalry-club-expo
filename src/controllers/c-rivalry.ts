import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/data';
import { pick } from 'lodash';
import type { Schema } from '../../amplify/data/resource';

import { getMContest, MContest } from '../models/m-contest';
import { getMRivalry, MRivalry } from '../models/m-rivalry';

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

      // Convert Gen 2 LazyLoader data structures to our model format
      // In Gen 2, relationships are LazyLoaders - we need to resolve them
      const contestsArray: any[] = [];
      if (rivalryData.contests) {
        for await (const contest of rivalryData.contests) {
          contestsArray.push(contest);
        }
      }

      // If we have a currentContestId but it's not in the contests array, fetch it separately
      if (rivalryData.currentContestId) {
        const currentContestExists = contestsArray.some(
          (c) => c.id === rivalryData.currentContestId
        );
        if (!currentContestExists) {
          const { data: currentContestData, errors: contestErrors } =
            await getClient().models.Contest.get({ id: rivalryData.currentContestId });
          if (contestErrors) {
            console.error(
              '[useRivalryWithAllInfoQuery] Error fetching current contest:',
              contestErrors
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
        mRivalry.setMContests(contests as any);
        mRivalry.setMTierLists(tierLists as any);
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
        client.models.TierList.update({
          id: rivalry.tierListA.id,
          standing: rivalry.tierListA.standing
        }),
        client.models.TierList.update({
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
        client.models.TierSlot.update({ id, position })
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
    mutationFn: async () => {
      if (!rivalry?.currentContest) {
        throw new Error('No current contest');
      }

      // Store the current fighter IDs
      const currentTierSlotAId = rivalry.currentContest.tierSlotAId;
      const currentTierSlotBId = rivalry.currentContest.tierSlotBId;

      // Sample tier slot A until we get a different fighter
      let tierSlotA = rivalry?.tierListA?.sampleEligibleSlot();
      let attempts = 0;
      const maxAttempts = 100; // Safety limit

      while (tierSlotA && tierSlotA.id === currentTierSlotAId && attempts < maxAttempts) {
        tierSlotA = rivalry?.tierListA?.sampleEligibleSlot();
        attempts++;
      }

      // Sample tier slot B until we get a different fighter
      let tierSlotB = rivalry?.tierListB?.sampleEligibleSlot();
      attempts = 0;

      while (tierSlotB && tierSlotB.id === currentTierSlotBId && attempts < maxAttempts) {
        tierSlotB = rivalry?.tierListB?.sampleEligibleSlot();
        attempts++;
      }

      if (!(tierSlotA && tierSlotB)) {
        throw new Error('Unable to sample tier slots');
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
              client.models.TierSlot.update({ id, position })
            )
          : []),
        ...(tierListBPositions
          ? Object.values(tierListBPositions).map(({ id, position }) =>
              client.models.TierSlot.update({ id, position })
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
        client.models.TierList.update({
          id: rivalry.tierListA!.id,
          standing: rivalry.tierListA!.standing
        }),
        client.models.TierList.update({
          id: rivalry.tierListB!.id,
          standing: rivalry.tierListB!.standing
        })
      ]);

      if (resultA.errors || resultB.errors) {
        throw new Error('Failed to update tier lists after reversal');
      }

      // Reset the result and bias on the most recent contest (making it unresolved)
      const { data: resetContestData, errors: resetErrors } = await getClient().models.Contest.update({
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
          // Get the tier slots from the template tier list
          const { data: templateTierSlots } = await getClient().models.TierSlot.list({
            filter: { tierListId: { eq: templateTierList.id } }
          });

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
            // Fallback to fetching fighters and randomizing
            const { data: fighters, errors: fightersErrors } =
              await getClient().models.Fighter.list({
                filter: { gameId: { eq: gameId } }
              });

            if (fightersErrors || !fighters || fighters.length === 0) {
              throw new Error('Failed to fetch fighters');
            }

            const shuffledFighters = [...fighters].sort(() => Math.random() - 0.5);
            tierSlotData = shuffledFighters.map((fighter, index) => ({
              fighterId: fighter.id,
              position: index
            }));
            console.log(`[useCreateRivalryMutation] Randomized ${fighters.length} fighters`);
          }
        } else {
          // No template tier list found, fetch fighters and randomize
          const { data: fighters, errors: fightersErrors } =
            await getClient().models.Fighter.list({
              filter: { gameId: { eq: gameId } }
            });

          if (fightersErrors || !fighters || fighters.length === 0) {
            throw new Error('Failed to fetch fighters');
          }

          const shuffledFighters = [...fighters].sort(() => Math.random() - 0.5);
          tierSlotData = shuffledFighters.map((fighter, index) => ({
            fighterId: fighter.id,
            position: index
          }));
          console.log(`[useCreateRivalryMutation] Randomized ${fighters.length} fighters`);
        }
      } else {
        // No rivalry with contestCount > 2 found, fetch fighters and randomize
        const { data: fighters, errors: fightersErrors } = await getClient().models.Fighter.list({
          filter: { gameId: { eq: gameId } }
        });

        if (fightersErrors || !fighters || fighters.length === 0) {
          throw new Error('Failed to fetch fighters');
        }

        const shuffledFighters = [...fighters].sort(() => Math.random() - 0.5);
        tierSlotData = shuffledFighters.map((fighter, index) => ({
          fighterId: fighter.id,
          position: index
        }));
        console.log(`[useCreateRivalryMutation] Randomized ${fighters.length} fighters (no template found)`);
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
          client.models.TierSlot.create({
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

export const useAcceptRivalryMutation = ({ onSuccess, onError }: AcceptRivalryMutationProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rivalryId: string) => {
      if (!rivalryId) {
        throw new Error('Rivalry ID is required');
      }

      // First, get the rivalry details to know which users and game are involved
      const { data: rivalryData, errors: rivalryFetchErrors } = await getClient().models.Rivalry.get({
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
          // Get the tier slots from the template tier list
          const { data: templateTierSlots } = await getClient().models.TierSlot.list({
            filter: { tierListId: { eq: templateTierList.id } }
          });

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
            // Fallback to randomizing
            const shuffledFighters = [...fighters].sort(() => Math.random() - 0.5);
            tierSlotData = shuffledFighters.map((fighter, index) => ({
              fighterId: fighter.id,
              position: index
            }));
            console.log(`[useAcceptRivalryMutation] Randomized ${fighters.length} fighters`);
          }
        } else {
          // No template tier list found, randomize
          const shuffledFighters = [...fighters].sort(() => Math.random() - 0.5);
          tierSlotData = shuffledFighters.map((fighter, index) => ({
            fighterId: fighter.id,
            position: index
          }));
          console.log(`[useAcceptRivalryMutation] Randomized ${fighters.length} fighters`);
        }
      } else {
        // No rivalry with contestCount > 2 found, randomize
        const shuffledFighters = [...fighters].sort(() => Math.random() - 0.5);
        tierSlotData = shuffledFighters.map((fighter, index) => ({
          fighterId: fighter.id,
          position: index
        }));
        console.log(
          `[useAcceptRivalryMutation] Randomized ${fighters.length} fighters (no template found)`
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
          client.models.TierSlot.create({
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
