import { GraphQLQuery, GraphQLResult } from '@aws-amplify/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API, graphqlOperation } from 'aws-amplify';
import { pick } from 'lodash';

import { CreateContestMutation, Rivalry, UpdateContestMutation } from '../API';
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
      const result = await API.graphql<GraphQLQuery<RivalryWithAllInfoQuery>>({
        query: getRivalryWithAllInfo,
        variables: { id: rivalry?.id as string },
      });

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
    mutationFn: async () =>
      await API.graphql(
        graphqlOperation(createContest, {
          input: {
            rivalryId: rivalry?.id,
            tierSlotAId: rivalry?.tierListA?.sampleEligibleSlot()?.id,
            tierSlotBId: rivalry?.tierListB?.sampleEligibleSlot()?.id,
          },
        }),
      ),
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
      const key = `tierList${tierListSignifier}` as keyof MRivalry;
      const tierList = rivalry?.[key] as MTierList;

      return await API.graphql<GraphQLQuery<UpdateMultipleTierSlotsMutation>>({
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
    mutationFn: async () =>
      await API.graphql(
        graphqlOperation(updateContest, {
          input: {
            bias: rivalry?.currentContest?.bias,
            id: rivalry?.currentContest?.id,
            result: rivalry?.currentContest?.result,
          },
        }),
      ),
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
    mutationFn: async () =>
      await API.graphql(
        graphqlOperation(updateContest, {
          input: {
            id: rivalry?.currentContest?.id,
            tierSlotAId: rivalry?.tierListA?.sampleEligibleSlot()?.id,
            tierSlotBId: rivalry?.tierListB?.sampleEligibleSlot()?.id,
          },
        }),
      ),
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
    mutationFn: async () =>
      await API.graphql(
        graphqlOperation(updateRivalry, {
          input: pick(rivalry, UPDATE_RIVALRY_KEYS),
        }),
      ),
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
    mutationFn: async () =>
      await API.graphql<GraphQLQuery<UpdateContestTierListsMutation>>({
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
      }),
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
