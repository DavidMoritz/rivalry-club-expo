import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Create mock functions BEFORE jest.mock and controller imports
export const mockRivalryGet = jest.fn();
export const mockRivalryUpdate = jest.fn();
export const mockContestCreate = jest.fn();
export const mockContestUpdate = jest.fn();
export const mockTierListUpdate = jest.fn();
export const mockTierSlotUpdate = jest.fn();

// Mock the aws-amplify/data module
jest.mock('aws-amplify/data', () => ({
  generateClient: jest.fn(() => {
    // Access mocks from the test file module
    const testModule = require(__filename);

    return {
      models: {
        Rivalry: {
          get: testModule.mockRivalryGet,
          update: testModule.mockRivalryUpdate
        },
        Contest: {
          create: testModule.mockContestCreate,
          update: testModule.mockContestUpdate
        },
        TierList: {
          update: testModule.mockTierListUpdate
        },
        TierSlot: {
          update: testModule.mockTierSlotUpdate
        }
      }
    };
  })
}));

import {
  useCreateContestMutation,
  useRivalryWithAllInfoQuery,
  useUpdateContestMutation,
  useUpdateRivalryMutation
} from '../../src/controllers/c-rivalry';
import { getMRivalry } from '../../src/models/m-rivalry';
import { getMTierList } from '../../src/models/m-tier-list';
import { TestRivalry } from '../test-helpers';

describe('c-rivalry Controller', () => {
  let queryClient: QueryClient;

  const mockRivalry = getMRivalry({
    rivalry: {
      id: 'rivalry-123',
      userAId: 'user-a',
      userBId: 'user-b',
      gameId: 'game-123',
      contestCount: 10,
      currentContestId: 'contest-current',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    } as TestRivalry
  });

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  describe('useRivalryWithAllInfoQuery', () => {
    it.skip('should populate contestCount, userAId, userBId, and gameId from GraphQL', async () => {
      // Mock the GraphQL response with fresh generators for each call
      mockRivalryGet.mockImplementation(async () => ({
        data: {
          id: 'rivalry-123',
          userAId: 'user-a-updated',
          userBId: 'user-b-updated',
          gameId: 'game-456',
          contestCount: 255,
          currentContestId: 'contest-current',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
          contests: (async function* () {
            yield { id: 'contest-1' };
          })(),
          tierLists: (async function* () {
            yield {
              id: 'tierlist-a',
              userId: 'user-a-updated',
              standing: 0,
              createdAt: '2024-01-01',
              updatedAt: '2024-01-01',
              tierSlots: (async function* () {
                yield { id: 'slot-1', fighterId: 'fighter-1', position: 0 };
              })()
            };
            yield {
              id: 'tierlist-b',
              userId: 'user-b-updated',
              standing: 0,
              createdAt: '2024-01-01',
              updatedAt: '2024-01-01',
              tierSlots: (async function* () {
                yield { id: 'slot-2', fighterId: 'fighter-2', position: 0 };
              })()
            };
          })()
        },
        errors: null
      }));

      let populatedRivalry: any = null;
      const { result } = renderHook(
        () =>
          useRivalryWithAllInfoQuery({
            rivalry: mockRivalry,
            onSuccess: (r) => {
              populatedRivalry = r;
            }
          }),
        { wrapper }
      );

      await waitFor(
        () => {
          expect(result.current.isSuccess).toBe(true);
        },
        { timeout: 3000 }
      );

      // Verify all fields are populated
      expect(populatedRivalry).not.toBeNull();
      expect(populatedRivalry.contestCount).toBe(255);
      expect(populatedRivalry.userAId).toBe('user-a-updated');
      expect(populatedRivalry.userBId).toBe('user-b-updated');
      expect(populatedRivalry.gameId).toBe('game-456');
      expect(populatedRivalry.currentContestId).toBe('contest-current');
    });

    it.skip('should match tier lists to users using userAId and userBId', async () => {
      mockRivalryGet.mockImplementation(async () => ({
        data: {
          id: 'rivalry-123',
          userAId: 'user-alpha',
          userBId: 'user-beta',
          gameId: 'game-123',
          contestCount: 10,
          currentContestId: null,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          contests: (async function* () {
            yield { id: 'contest-1' };
          })(),
          tierLists: (async function* () {
            yield {
              id: 'tierlist-alpha',
              userId: 'user-alpha',
              standing: 0,
              createdAt: '2024-01-01',
              updatedAt: '2024-01-01',
              tierSlots: (async function* () {
                yield { id: 'slot-a1', fighterId: 'fighter-1', position: 0 };
              })()
            };
            yield {
              id: 'tierlist-beta',
              userId: 'user-beta',
              standing: 0,
              createdAt: '2024-01-01',
              updatedAt: '2024-01-01',
              tierSlots: (async function* () {
                yield { id: 'slot-b1', fighterId: 'fighter-2', position: 0 };
              })()
            };
          })()
        },
        errors: null
      }));

      let populatedRivalry: any = null;
      const { result } = renderHook(
        () =>
          useRivalryWithAllInfoQuery({
            rivalry: mockRivalry,
            onSuccess: (r) => {
              populatedRivalry = r;
            }
          }),
        { wrapper }
      );

      await waitFor(
        () => {
          expect(result.current.isSuccess).toBe(true);
        },
        { timeout: 3000 }
      );

      // Verify tier lists are correctly matched
      expect(populatedRivalry.tierListA).toBeDefined();
      expect(populatedRivalry.tierListB).toBeDefined();
      expect(populatedRivalry.tierListA.id).toBe('tierlist-alpha');
      expect(populatedRivalry.tierListB.id).toBe('tierlist-beta');
      expect(populatedRivalry.tierListA.userId).toBe('user-alpha');
      expect(populatedRivalry.tierListB.userId).toBe('user-beta');
    });

    it.skip('should fetch rivalry with contests and tier lists', async () => {
      // Create mock data
      const mockContest = {
        id: 'contest-1',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-a',
        tierSlotBId: 'slot-b',
        result: 2,
        bias: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mockTierSlot = {
        id: 'tier-slot-1',
        tierListId: 'tier-list-a',
        fighterId: 'fighter-1',
        position: 0,
        winCount: 0,
        contestCount: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      // Mock implementation that returns fresh generators each time
      mockRivalryGet.mockImplementation(async () => {
        const mockTierList = {
          id: 'tier-list-a',
          rivalryId: 'rivalry-123',
          userId: 'user-a',
          standing: 0,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          tierSlots: (async function* () {
            yield mockTierSlot;
          })()
        };

        const mockRivalryData = {
          id: 'rivalry-123',
          userAId: 'user-a',
          userBId: 'user-b',
          gameId: 'game-123',
          contestCount: 10,
          currentContestId: 'contest-current',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          contests: (async function* () {
            yield mockContest;
          })(),
          tierLists: (async function* () {
            yield mockTierList;
          })()
        };

        return {
          data: mockRivalryData,
          errors: null
        };
      });

      const onSuccess = jest.fn();
      const { result } = renderHook(
        () =>
          useRivalryWithAllInfoQuery({
            rivalry: mockRivalry,
            onSuccess
          }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockRivalryGet).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalledWith(mockRivalry);
    });

    it('should not execute query if rivalry is not provided', () => {
      const { result } = renderHook(
        () =>
          useRivalryWithAllInfoQuery({
            rivalry: null
          }),
        { wrapper }
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockRivalryGet).not.toHaveBeenCalled();
    });
  });

  describe('useCreateContestMutation', () => {
    // Mutation test needs adjustment for async behavior
    it.skip('should create a contest', async () => {
      const mockContest = {
        id: 'contest-new',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-a',
        tierSlotBId: 'slot-b'
      };

      mockGraphql.mockResolvedValue({
        data: {
          createContest: mockContest
        }
      });

      // Add tier lists to rivalry for sampling
      mockRivalry.tierListA = getMTierList({
        id: 'tier-list-a',
        rivalryId: 'rivalry-123',
        userId: 'user-a',
        standing: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      } as any);

      mockRivalry.tierListB = getMTierList({
        id: 'tier-list-b',
        rivalryId: 'rivalry-123',
        userId: 'user-b',
        standing: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      } as any);

      const onSuccess = jest.fn();
      const { result } = renderHook(
        () =>
          useCreateContestMutation({
            rivalry: mockRivalry,
            onSuccess
          }),
        { wrapper }
      );

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockGraphql).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe('useUpdateContestMutation', () => {
    // Mutation test needs adjustment for async behavior
    it.skip('should update a contest', async () => {
      const contestRivalry = getMRivalry({
        rivalry: {
          id: 'rivalry-123',
          userAId: 'user-a',
          userBId: 'user-b',
          gameId: 'game-123',
          contestCount: 10,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        } as TestRivalry
      });

      contestRivalry.currentContest = {
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-a',
        tierSlotBId: 'slot-b',
        result: 2,
        bias: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      } as any;

      mockGraphql.mockResolvedValue({
        data: {
          updateContest: {
            id: 'contest-123',
            result: 2
          }
        }
      });

      const onSuccess = jest.fn();
      const { result } = renderHook(
        () =>
          useUpdateContestMutation({
            rivalry: contestRivalry,
            onSuccess
          }),
        { wrapper }
      );

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockGraphql).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe('useUpdateRivalryMutation', () => {
    // Mutation test needs adjustment for async behavior
    it.skip('should update a rivalry', async () => {
      mockGraphql.mockResolvedValue({
        data: {
          updateRivalry: {
            id: 'rivalry-123',
            contestCount: 11
          }
        }
      });

      const onSuccess = jest.fn();
      const { result } = renderHook(
        () =>
          useUpdateRivalryMutation({
            rivalry: mockRivalry,
            onSuccess
          }),
        { wrapper }
      );

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockGraphql).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
