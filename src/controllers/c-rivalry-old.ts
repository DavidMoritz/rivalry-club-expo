import { GraphQLQuery, GraphQLResult } from '@aws-amplify/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/api';
import { pick } from 'lodash';
import type { Schema } from '../../amplify/data/resource';

// import { CreateContestMutation, Rivalry, UpdateContestMutation } from '../API';
type Rivalry = Schema['Rivalry']['type'];
import {
  RivalryWithAllInfoQuery,
  UpdateContestTierListsMutation,
  UpdateMultipleTierSlotsMutation,
} from '../custom-api';
import {
  generateUpdateMultipleTierSlotsQuery,
  getRivalryWithAllInfo,
  updateContestTierLists,
} from '../graphql/custom-queries';
import {
  createContest,
  updateContest,
  updateRivalry,
} from '../graphql/mutations';
import { getMContest, MContest } from '../models/m-contest';
import { MRivalry } from '../models/m-rivalry';
import { MTierList } from '../models/m-tier-list';

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

/** Queries */

export const useRivalryWithAllInfoQuery = ({
  rivalry,
  onSuccess,
}: RivalryQueryProps) =>
  useQuery({
    enabled: !!rivalry?.id,
    queryKey: ['rivalryId', rivalry?.id],
    queryFn: async () => {
      console.log('[useRivalryWithAllInfoQuery] Starting query for rivalry ID:', rivalry?.id);

      const client = generateClient();
      console.log('[useRivalryWithAllInfoQuery] Generated client:', client);

      const result = await client.graphql({
        query: getRivalryWithAllInfo,
        variables: { id: rivalry?.id as string },
      });

      console.log('[useRivalryWithAllInfoQuery] Query result:', result);

      const { contests, tierLists } = result?.data?.getRivalry as Rivalry;

      if (!(tierLists?.items.some(Boolean) && contests?.items.some(Boolean))) {
        return result;
      }

      (rivalry as MRivalry).setMContests(contests);
      (rivalry as MRivalry).setMTierLists(tierLists);

      onSuccess?.(rivalry as MRivalry);

      return result;
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
      const client = generateClient();

      return await client.graphql({
        query: createContest,
        variables: {
          input: {
            rivalryId: rivalry?.id,
            tierSlotAId: rivalry?.tierListA?.sampleEligibleSlot()?.id,
            tierSlotBId: rivalry?.tierListB?.sampleEligibleSlot()?.id,
          },
        },
      });
    },
    onSuccess: response => {
      const rawContestData = (response as GraphQLResult<CreateContestMutation>)
        ?.data?.createContest;

      if (!rawContestData) return;

      const currentContest = getMContest(rawContestData);

      queryClient.invalidateQueries({ queryKey: ['usersByAwsSub'] });
      onSuccess?.(currentContest);
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
      const client = generateClient();
      const key = `tierList${tierListSignifier}` as keyof MRivalry;
      const tierList = rivalry?.[key] as MTierList;

      return await client.graphql({
        query: generateUpdateMultipleTierSlotsQuery(tierList.slots.length || 0),
        variables: tierList.getPositionsPojo(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['rivalryId', rivalry?.id],
      });

      onSuccess?.();
    },
    onError: e => {
      console.error('Error on useUpdateTierSlotsMutation', e);
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
      const client = generateClient();

      return await client.graphql({
        query: updateContest,
        variables: {
          input: {
            bias: rivalry?.currentContest?.bias,
            id: rivalry?.currentContest?.id,
            result: rivalry?.currentContest?.result,
          },
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersByAwsSub'] });

      onSuccess?.();
    },
  });
};

export const useUpdateCurrentContestShuffleTierSlotsMutation = ({
  rivalry,
  onSuccess,
}: RivalryMutationWithContestProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const client = generateClient();

      return await client.graphql({
        query: updateContest,
        variables: {
          input: {
            id: rivalry?.currentContest?.id,
            tierSlotAId: rivalry?.tierListA?.sampleEligibleSlot()?.id,
            tierSlotBId: rivalry?.tierListB?.sampleEligibleSlot()?.id,
          },
        },
      });
    },
    onSuccess: response => {
      const rawContestData = (response as GraphQLResult<UpdateContestMutation>)
        ?.data?.updateContest;

      if (!rawContestData) return;

      const currentContest = getMContest(rawContestData);

      queryClient.invalidateQueries({ queryKey: ['usersByAwsSub'] });
      onSuccess?.(currentContest);
    },
  });
};

export const useUpdateRivalryMutation = ({
  rivalry,
  onSuccess,
}: RivalryMutationProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const client = generateClient();

      return await client.graphql({
        query: updateRivalry,
        variables: {
          input: pick(rivalry, UPDATE_RIVALRY_KEYS),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersByAwsSub'] });

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
      const client = generateClient();

      return await client.graphql({
        query: updateContestTierLists,
        variables: {
          tierListA: {
            id: contest?.tierSlotA?.tierListId,
            standing: contest?.tierSlotA?.tierList?.standing,
          },
          tierListB: {
            id: contest?.tierSlotB?.tierListId,
            standing: contest?.tierSlotB?.tierList?.standing,
          },
        },
      });
    },
    onMutate: () => {
      queryClient.invalidateQueries({
        queryKey: ['rivalryId', contest?.rivalryId],
      });

      onSuccess?.();
    },
    onError: e => {
      console.warn('Error on useUpdateContestTierListsMutation', e);
    },
  });
};
