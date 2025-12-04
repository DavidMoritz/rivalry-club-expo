import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/data';
import { pick } from 'lodash';
import type { Schema } from '../../amplify/data/resource';

import { getMContest, MContest } from '../models/m-contest';
import { MRivalry } from '../models/m-rivalry';

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

/** Queries */

export const useRivalryWithAllInfoQuery = ({
  rivalry,
  onSuccess,
}: RivalryQueryProps) =>
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
            'tierLists.tierSlots.*',
          ],
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

      if (tierLists.items.some(Boolean) && contests.items.some(Boolean)) {
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
        console.warn('[useRivalryWithAllInfoQuery] Missing tier lists or contests - rivalry data incomplete');
      }

      return rivalryData;
    },
  });

/** Mutations */

export const useCreateContestMutation = ({
  rivalry,
  onSuccess,
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
        bias: 0,
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to create contest');
      }

      return getMContest(contestData as any);
    },
    onSuccess: (contest) => {
      queryClient.invalidateQueries({ queryKey: ['rivalryId', rivalry?.id] });
      onSuccess?.(contest);
    },
  });
};

export const useUpdateRivalryMutation = ({ rivalry }: RivalryMutationProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const updateInput = pick(rivalry, UPDATE_RIVALRY_KEYS);

      const { data, errors } = await client.models.Rivalry.update(updateInput as any);

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to update rivalry');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rivalryId', rivalry?.id] });
    },
  });
};

export const useUpdateContestMutation = ({
  rivalry,
  onSuccess,
}: RivalryMutationProps) => {
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
        bias: contest.bias,
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to update contest');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rivalryId', rivalry?.id] });
      onSuccess?.();
    },
  });
};

export const useUpdateContestTierListsMutation = ({
  contest,
  onSuccess,
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
          standing: rivalry.tierListA.standing,
        }),
        client.models.TierList.update({
          id: rivalry.tierListB.id,
          standing: rivalry.tierListB.standing,
        }),
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
    },
  });
};

export const useUpdateTierSlotsMutation = ({
  rivalry,
  tierListSignifier,
  onSuccess,
}: TierListMutationProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const tierList =
        tierListSignifier === 'A' ? rivalry?.tierListA : rivalry?.tierListB;

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
    },
  });
};

export const useUpdateCurrentContestShuffleTierSlotsMutation = ({
  rivalry,
  onSuccess,
}: UpdateCurrentContestShuffleTierSlotsMutationProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const tierSlotA = rivalry?.tierListA?.sampleEligibleSlot();
      const tierSlotB = rivalry?.tierListB?.sampleEligibleSlot();

      if (!(tierSlotA && tierSlotB && rivalry?.currentContest)) {
        throw new Error('Unable to sample tier slots');
      }

      const { data, errors } = await client.models.Contest.update({
        id: rivalry.currentContest.id,
        tierSlotAId: tierSlotA.id,
        tierSlotBId: tierSlotB.id,
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to update contest');
      }

      return getMContest(data as any);
    },
    onSuccess: (contest) => {
      queryClient.invalidateQueries({ queryKey: ['rivalryId', rivalry?.id] });
      onSuccess?.(contest);
    },
  });
};
