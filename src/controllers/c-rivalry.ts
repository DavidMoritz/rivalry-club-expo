import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/data';
import { pick } from 'lodash';
import type { Schema } from '../../amplify/data/resource';

import { getMContest, MContest } from '../models/m-contest';
import { getMRivalry, MRivalry } from '../models/m-rivalry';

const client = generateClient<Schema>();

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
  rivalryId: string;
  onSuccess?: () => void;
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
      } = await client.models.Contest.list({
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
      const { data: rivalryData, errors } = await client.models.Rivalry.get(
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
            await client.models.Contest.get({ id: rivalryData.currentContestId });
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
      const { data: contestData, errors } = await client.models.Contest.create({
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
      const { data, errors } = await client.models.Rivalry.update(updateInput as any);

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

      const { data, errors } = await client.models.Contest.update({
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

      const { data, errors } = await client.models.Contest.update({
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

      // Find the most recent contest (should NOT be the current contest)
      const mostRecentContest = rivalry.mContests[1];

      if (!mostRecentContest) {
        throw new Error('No contests to delete');
      }

      if (!mostRecentContest.result) {
        throw new Error('Cannot delete unresolved contest');
      }

      // Reverse the standings using the bias
      rivalry.reverseStanding(mostRecentContest);

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

      // Delete the contest
      const { errors: deleteErrors } = await client.models.Contest.delete({
        id: mostRecentContest.id
      });

      if (deleteErrors) {
        throw new Error(deleteErrors[0]?.message || 'Failed to delete contest');
      }

      // Update rivalry to decrement contest count
      const { errors: rivalryErrors } = await client.models.Rivalry.update({
        id: rivalry.id,
        contestCount: Math.max((rivalry.contestCount || 0) - 1, 0)
      });

      if (rivalryErrors) {
        throw new Error(rivalryErrors[0]?.message || 'Failed to update rivalry');
      }

      return mostRecentContest;
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
      const { data: awaitingAcceptanceData } = await client.models.Rivalry.list({
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
      const { data: initiatedData } = await client.models.Rivalry.list({
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
      console.log('[useCreateRivalryMutation] Creating rivalry:', { userAId, userBId, gameId });

      // Create the rivalry
      const { data: rivalryData, errors: rivalryErrors } = await client.models.Rivalry.create({
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

      console.log('[useCreateRivalryMutation] Rivalry created:', rivalryData?.id);

      // Fetch the game's fighters to create tier lists
      const { data: fighters, errors: fightersErrors } = await client.models.Fighter.list({
        filter: { gameId: { eq: gameId } }
      });

      if (fightersErrors) {
        console.error('[useCreateRivalryMutation] Fighters fetch errors:', fightersErrors);
        throw new Error('Failed to fetch fighters');
      }

      if (!fighters || fighters.length === 0) {
        console.error('[useCreateRivalryMutation] No fighters found for game:', gameId);
        throw new Error('No fighters found for this game');
      }

      console.log('[useCreateRivalryMutation] Found fighters:', fighters.length);

      // Create tier lists for both users
      const [tierListAResult, tierListBResult] = await Promise.all([
        client.models.TierList.create({
          rivalryId: rivalryData!.id,
          userId: userAId,
          standing: 0
        }),
        client.models.TierList.create({
          rivalryId: rivalryData!.id,
          userId: userBId,
          standing: 0
        })
      ]);

      if (tierListAResult.errors || tierListBResult.errors) {
        console.error('[useCreateRivalryMutation] Tier list creation errors:', {
          tierListA: tierListAResult.errors,
          tierListB: tierListBResult.errors
        });
        throw new Error('Failed to create tier lists');
      }

      console.log('[useCreateRivalryMutation] Tier lists created');

      // Create tier slots for both users
      const tierSlotPromises = fighters.flatMap((fighter, index) => [
        client.models.TierSlot.create({
          tierListId: tierListAResult.data!.id,
          fighterId: fighter.id,
          position: index,
          contestCount: 0,
          winCount: 0
        }),
        client.models.TierSlot.create({
          tierListId: tierListBResult.data!.id,
          fighterId: fighter.id,
          position: index,
          contestCount: 0,
          winCount: 0
        })
      ]);

      const tierSlotResults = await Promise.all(tierSlotPromises);
      const tierSlotErrors = tierSlotResults.filter((r) => r.errors).flatMap((r) => r.errors);

      if (tierSlotErrors.length > 0) {
        console.error('[useCreateRivalryMutation] Tier slot creation errors:', tierSlotErrors);
        throw new Error('Failed to create tier slots');
      }

      console.log('[useCreateRivalryMutation] Tier slots created:', tierSlotResults.length);

      return getMRivalry({ rivalry: rivalryData as any });
    },
    onSuccess: (rivalry, variables) => {
      console.log('[useCreateRivalryMutation] Success callback');
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

export const useAcceptRivalryMutation = ({ rivalryId, onSuccess }: AcceptRivalryMutationProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // First, get the rivalry details to know which users and game are involved
      const { data: rivalryData, errors: rivalryFetchErrors } = await client.models.Rivalry.get({
        id: rivalryId
      });

      if (rivalryFetchErrors || !rivalryData) {
        throw new Error(rivalryFetchErrors?.[0]?.message || 'Failed to fetch rivalry');
      }

      const { userAId, userBId, gameId } = rivalryData;

      // Fetch fighters for the game
      const { data: fighters, errors: fightersErrors } = await client.models.Fighter.list({
        filter: { gameId: { eq: gameId } }
      });

      if (fightersErrors || !fighters || fighters.length === 0) {
        throw new Error('Failed to fetch fighters for game');
      }

      // Helper function to get user's most recent tier list
      const getMostRecentTierList = async (userId: string) => {
        const { data: tierLists } = await client.models.TierList.tierListsByUserIdAndUpdatedAt({
          userId,
          sortDirection: 'DESC',
          limit: 1
        });

        return tierLists?.[0];
      };

      // Helper function to create tier list with tier slots
      const createTierListWithSlots = async (userId: string, sourceTierList?: any) => {
        // Create the tier list with standing = 0
        const { data: newTierList, errors: tierListErrors } = await client.models.TierList.create({
          rivalryId,
          userId,
          standing: 0
        });

        if (tierListErrors || !newTierList) {
          throw new Error(`Failed to create tier list for user ${userId}`);
        }

        let tierSlotPromises;

        if (sourceTierList) {
          // Duplicate the source tier list's tier slots
          // First, fetch the source tier slots
          const { data: sourceTierSlots } = await client.models.TierSlot.list({
            filter: { tierListId: { eq: sourceTierList.id } }
          });

          if (!sourceTierSlots || sourceTierSlots.length === 0) {
            // Fallback to random if source has no tier slots
            tierSlotPromises = fighters.map((fighter, index) =>
              client.models.TierSlot.create({
                tierListId: newTierList.id,
                fighterId: fighter.id,
                position: index,
                contestCount: 0,
                winCount: 0
              })
            );
          } else {
            // Create tier slots matching the source positions
            tierSlotPromises = sourceTierSlots.map((slot) =>
              client.models.TierSlot.create({
                tierListId: newTierList.id,
                fighterId: slot.fighterId,
                position: slot.position,
                contestCount: 0,
                winCount: 0
              })
            );
          }
        } else {
          // Create randomized tier slots
          const shuffledFighters = [...fighters].sort(() => Math.random() - 0.5);
          tierSlotPromises = shuffledFighters.map((fighter, index) =>
            client.models.TierSlot.create({
              tierListId: newTierList.id,
              fighterId: fighter.id,
              position: index,
              contestCount: 0,
              winCount: 0
            })
          );
        }

        const tierSlotResults = await Promise.all(tierSlotPromises);
        const tierSlotErrors = tierSlotResults.filter((r) => r.errors).flatMap((r) => r.errors);

        if (tierSlotErrors.length > 0) {
          throw new Error(`Failed to create tier slots for user ${userId}`);
        }

        return newTierList;
      };

      // Get most recent tier lists for both users
      const [recentTierListA, recentTierListB] = await Promise.all([
        getMostRecentTierList(userAId),
        getMostRecentTierList(userBId)
      ]);

      // Create tier lists for both users
      await Promise.all([
        createTierListWithSlots(userAId, recentTierListA),
        createTierListWithSlots(userBId, recentTierListB)
      ]);

      // Finally, accept the rivalry
      const { data, errors } = await client.models.Rivalry.update({
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
    }
  });
};
