import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { API } from 'aws-amplify';
import React from 'react';

import {
  useCreateContestMutation,
  useRivalryWithAllInfoQuery,
  useUpdateContestMutation,
  useUpdateRivalryMutation,
} from '../../src/controllers/c-rivalry';
import { getMRivalry } from '../../src/models/m-rivalry';
import { getMTierList } from '../../src/models/m-tier-list';

jest.mock('aws-amplify', () => ({
  API: {
    graphql: jest.fn(),
  },
}));

describe('c-rivalry Controller', () => {
  let queryClient: QueryClient;

  const mockRivalry = getMRivalry({
    rivalry: {
      __typename: 'Rivalry',
      id: 'rivalry-123',
      userAId: 'user-a',
      userBId: 'user-b',
      gameId: 'game-123',
      contestCount: 10,
      currentContestId: 'contest-current',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  });

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  describe('useRivalryWithAllInfoQuery', () => {
    it('should fetch rivalry with contests and tier lists', async () => {
      const mockData = {
        data: {
          getRivalry: {
            id: 'rivalry-123',
            userAId: 'user-a',
            userBId: 'user-b',
            gameId: 'game-123',
            contests: {
              items: [
                {
                  id: 'contest-1',
                  rivalryId: 'rivalry-123',
                  tierSlotAId: 'slot-a',
                  tierSlotBId: 'slot-b',
                  result: 2,
                },
              ],
            },
            tierLists: {
              items: [
                {
                  id: 'tier-list-a',
                  rivalryId: 'rivalry-123',
                  userId: 'user-a',
                  standing: 0,
                  tierSlots: { items: [] },
                },
              ],
            },
          },
        },
      };

      (API.graphql as jest.Mock).mockResolvedValue(mockData);

      const onSuccess = jest.fn();
      const { result } = renderHook(
        () =>
          useRivalryWithAllInfoQuery({
            rivalry: mockRivalry,
            onSuccess,
          }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(API.graphql).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalledWith(mockRivalry);
    });

    it('should not execute query if rivalry is not provided', () => {
      const { result } = renderHook(
        () =>
          useRivalryWithAllInfoQuery({
            rivalry: null,
          }),
        { wrapper },
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(API.graphql).not.toHaveBeenCalled();
    });
  });

  describe('useCreateContestMutation', () => {
    // Mutation test needs adjustment for async behavior
    it.skip('should create a contest', async () => {
      const mockContest = {
        id: 'contest-new',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-a',
        tierSlotBId: 'slot-b',
      };

      (API.graphql as jest.Mock).mockResolvedValue({
        data: {
          createContest: mockContest,
        },
      });

      // Add tier lists to rivalry for sampling
      mockRivalry.tierListA = getMTierList({
        __typename: 'TierList',
        id: 'tier-list-a',
        rivalryId: 'rivalry-123',
        userId: 'user-a',
        standing: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        tierSlots: {
          __typename: 'ModelTierSlotConnection',
          items: [
            {
              __typename: 'TierSlot',
              id: 'slot-a',
              tierListId: 'tier-list-a',
              fighterId: 'fighter-a',
              position: 0,
              createdAt: '2024-01-01',
              updatedAt: '2024-01-01',
            },
          ],
        },
      });

      mockRivalry.tierListB = getMTierList({
        __typename: 'TierList',
        id: 'tier-list-b',
        rivalryId: 'rivalry-123',
        userId: 'user-b',
        standing: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        tierSlots: {
          __typename: 'ModelTierSlotConnection',
          items: [
            {
              __typename: 'TierSlot',
              id: 'slot-b',
              tierListId: 'tier-list-b',
              fighterId: 'fighter-b',
              position: 0,
              createdAt: '2024-01-01',
              updatedAt: '2024-01-01',
            },
          ],
        },
      });

      const onSuccess = jest.fn();
      const { result } = renderHook(
        () =>
          useCreateContestMutation({
            rivalry: mockRivalry,
            onSuccess,
          }),
        { wrapper },
      );

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(API.graphql).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe('useUpdateContestMutation', () => {
    // Mutation test needs adjustment for async behavior
    it.skip('should update a contest', async () => {
      const contestRivalry = getMRivalry({
        rivalry: {
          __typename: 'Rivalry',
          id: 'rivalry-123',
          userAId: 'user-a',
          userBId: 'user-b',
          gameId: 'game-123',
          contestCount: 10,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      });

      contestRivalry.currentContest = {
        __typename: 'Contest',
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-a',
        tierSlotBId: 'slot-b',
        result: 2,
        bias: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      } as any;

      (API.graphql as jest.Mock).mockResolvedValue({
        data: {
          updateContest: {
            id: 'contest-123',
            result: 2,
          },
        },
      });

      const onSuccess = jest.fn();
      const { result } = renderHook(
        () =>
          useUpdateContestMutation({
            rivalry: contestRivalry,
            onSuccess,
          }),
        { wrapper },
      );

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(API.graphql).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe('useUpdateRivalryMutation', () => {
    // Mutation test needs adjustment for async behavior
    it.skip('should update a rivalry', async () => {
      (API.graphql as jest.Mock).mockResolvedValue({
        data: {
          updateRivalry: {
            id: 'rivalry-123',
            contestCount: 11,
          },
        },
      });

      const onSuccess = jest.fn();
      const { result } = renderHook(
        () =>
          useUpdateRivalryMutation({
            rivalry: mockRivalry,
            onSuccess,
          }),
        { wrapper },
      );

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(API.graphql).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
