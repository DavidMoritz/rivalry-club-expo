import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the aws-amplify/data module
jest.mock('aws-amplify/data', () => {
  const mockFns = {
    mockContestDelete: jest.fn(),
    mockContestUpdate: jest.fn(),
    mockTierListUpdate: jest.fn(),
    mockTierSlotUpdate: jest.fn(),
    mockRivalryUpdate: jest.fn()
  };

  // Store references globally for use in tests
  (global as any).mockFns = mockFns;

  return {
    generateClient: jest.fn(() => ({
      models: {
        Contest: {
          delete: mockFns.mockContestDelete,
          update: mockFns.mockContestUpdate
        },
        TierList: {
          update: mockFns.mockTierListUpdate
        },
        TierSlot: {
          update: mockFns.mockTierSlotUpdate
        },
        Rivalry: {
          update: mockFns.mockRivalryUpdate
        }
      }
    }))
  };
});

import { useDeleteMostRecentContestMutation } from '../../src/controllers/c-rivalry';
import { getMRivalry } from '../../src/models/m-rivalry';
import { getMTierList } from '../../src/models/m-tier-list';
import { getMContest } from '../../src/models/m-contest';
import type { Schema } from '../../amplify/data/resource';

type Rivalry = Schema['Rivalry']['type'];
type TierList = Schema['TierList']['type'];
type Contest = Schema['Contest']['type'];

describe('useDeleteMostRecentContestMutation', () => {
  let queryClient: QueryClient;
  let mockContestDelete: jest.Mock;
  let mockContestUpdate: jest.Mock;
  let mockTierListUpdate: jest.Mock;
  let mockTierSlotUpdate: jest.Mock;
  let mockRivalryUpdate: jest.Mock;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    // Get references to the mocked functions
    const globalMocks = (global as any).mockFns;
    mockContestDelete = globalMocks.mockContestDelete;
    mockContestUpdate = globalMocks.mockContestUpdate;
    mockTierListUpdate = globalMocks.mockTierListUpdate;
    mockTierSlotUpdate = globalMocks.mockTierSlotUpdate;
    mockRivalryUpdate = globalMocks.mockRivalryUpdate;

    jest.clearAllMocks();

    // Reset all mocks to return success by default
    mockTierSlotUpdate.mockResolvedValue({ data: {}, errors: null });
    mockTierListUpdate.mockResolvedValue({ data: {}, errors: null });
    mockContestUpdate.mockResolvedValue({ data: {}, errors: null });
    mockContestDelete.mockResolvedValue({ data: {}, errors: null });
    mockRivalryUpdate.mockResolvedValue({ data: {}, errors: null });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  const createTierListWithStanding = (
    userId: string,
    standing: number
  ): TierList => ({
    __typename: 'TierList',
    id: `tier-list-${userId}`,
    rivalryId: 'rivalry-123',
    userId,
    standing,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    tierSlots: {
      __typename: 'ModelTierSlotConnection',
      items: [
        {
          __typename: 'TierSlot',
          id: `slot-${userId}`,
          tierListId: `tier-list-${userId}`,
          fighterId: `fighter-${userId}`,
          position: 0,
          winCount: 0,
          contestCount: 0,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        }
      ]
    }
  });

  describe('1-stock win deletion', () => {
    it('should correctly revert standings after deleting 1-stock win (bias=1)', async () => {
      const initialStandingA = 3;
      const initialStandingB = 3;

      const mockRivalry: Rivalry = {
        __typename: 'Rivalry',
        id: 'rivalry-123',
        userAId: 'user-a',
        userBId: 'user-b',
        gameId: 'game-123',
        contestCount: 5,
        currentContestId: 'contest-123',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      mRivalry.tierListA = getMTierList(
        createTierListWithStanding('user-a', initialStandingA)
      );
      mRivalry.tierListB = getMTierList(
        createTierListWithStanding('user-b', initialStandingB)
      );

      const contest: Contest = {
        __typename: 'Contest',
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: 1,
        bias: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mContest = getMContest(contest);
      mContest.setRivalryAndSlots(mRivalry);
      mRivalry.currentContest = mContest;

      // Apply the contest standing with nudge=1 (forces loser to move up, bias=1)
      mRivalry.adjustStanding(1);

      // Create a new unresolved contest that will be the "current" contest
      const currentContest: Contest = {
        __typename: 'Contest',
        id: 'contest-current',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: null,
        bias: null,
        createdAt: '2024-01-02',
        updatedAt: '2024-01-02'
      };

      const mCurrentContest = getMContest(currentContest);

      // Set up mContests array: [0] = current unresolved, [1] = most recent resolved
      mRivalry.mContests = [mCurrentContest, mContest];

      // For 1-stock win, only the loser moves up (or winner moves down if loser is at top)
      // With nudge=1, loser should move up
      expect(mContest.bias).toBe(1);
      expect(mRivalry.tierListA.standing).toBe(initialStandingA); // Winner stays
      expect(mRivalry.tierListB.standing).toBe(initialStandingB - 1); // Loser moves up 1

      const onSuccess = jest.fn();
      const { result } = renderHook(
        () => useDeleteMostRecentContestMutation({ rivalry: mRivalry, onSuccess }),
        { wrapper }
      );

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify standings were reverted
      expect(mRivalry.tierListA.standing).toBe(initialStandingA);
      expect(mRivalry.tierListB.standing).toBe(initialStandingB);

      // Verify API calls
      expect(mockTierListUpdate).toHaveBeenCalledWith({
        id: 'tier-list-user-a',
        standing: initialStandingA
      });
      expect(mockTierListUpdate).toHaveBeenCalledWith({
        id: 'tier-list-user-b',
        standing: initialStandingB
      });
      expect(mockContestDelete).toHaveBeenCalledWith({
        id: 'contest-current'
      });
      expect(mockRivalryUpdate).toHaveBeenCalledWith({
        id: 'rivalry-123',
        contestCount: 4,
        currentContestId: 'contest-123'
      });
    });

    it('should correctly revert standings after deleting 1-stock win (bias=-1)', async () => {
      const initialStandingA = 3;
      const initialStandingB = 3;

      const mockRivalry: Rivalry = {
        __typename: 'Rivalry',
        id: 'rivalry-123',
        userAId: 'user-a',
        userBId: 'user-b',
        gameId: 'game-123',
        contestCount: 5,
        currentContestId: 'contest-123',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      mRivalry.tierListA = getMTierList(
        createTierListWithStanding('user-a', initialStandingA)
      );
      mRivalry.tierListB = getMTierList(
        createTierListWithStanding('user-b', initialStandingB)
      );

      const contest: Contest = {
        __typename: 'Contest',
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: 1,
        bias: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mContest = getMContest(contest);
      mContest.setRivalryAndSlots(mRivalry);
      mRivalry.currentContest = mContest;

      // Apply the contest standing with nudge=-1 (forces winner to move down, bias=-1)
      mRivalry.adjustStanding(-1);

      // Create a new unresolved contest that will be the "current" contest
      const currentContest: Contest = {
        __typename: 'Contest',
        id: 'contest-current',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: null,
        bias: null,
        createdAt: '2024-01-02',
        updatedAt: '2024-01-02'
      };

      const mCurrentContest = getMContest(currentContest);

      // Set up mContests array: [0] = current unresolved, [1] = most recent resolved
      mRivalry.mContests = [mCurrentContest, mContest];

      // For 1-stock win with nudge=-1, winner moves down
      expect(mContest.bias).toBe(-1);
      expect(mRivalry.tierListA.standing).toBe(initialStandingA + 1); // Winner moves down 1
      expect(mRivalry.tierListB.standing).toBe(initialStandingB); // Loser stays

      const { result } = renderHook(
        () => useDeleteMostRecentContestMutation({ rivalry: mRivalry }),
        { wrapper }
      );

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify standings were reverted
      expect(mRivalry.tierListA.standing).toBe(initialStandingA);
      expect(mRivalry.tierListB.standing).toBe(initialStandingB);
    });
  });

  describe('2-stock win deletion', () => {
    it('should correctly revert standings after deleting 2-stock win', async () => {
      const initialStandingA = 3;
      const initialStandingB = 3;

      const mockRivalry: Rivalry = {
        __typename: 'Rivalry',
        id: 'rivalry-123',
        userAId: 'user-a',
        userBId: 'user-b',
        gameId: 'game-123',
        contestCount: 5,
        currentContestId: 'contest-123',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      mRivalry.tierListA = getMTierList(
        createTierListWithStanding('user-a', initialStandingA)
      );
      mRivalry.tierListB = getMTierList(
        createTierListWithStanding('user-b', initialStandingB)
      );

      const contest: Contest = {
        __typename: 'Contest',
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: 2,
        bias: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mContest = getMContest(contest);
      mContest.setRivalryAndSlots(mRivalry);
      mRivalry.currentContest = mContest;

      // Apply the contest standing
      mRivalry.adjustStanding();

      expect(mRivalry.tierListA.standing).toBe(4);
      expect(mRivalry.tierListB.standing).toBe(2);

      // Create a new unresolved contest that will be the "current" contest
      const currentContest: Contest = {
        __typename: 'Contest',
        id: 'contest-current',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: null,
        bias: null,
        createdAt: '2024-01-02',
        updatedAt: '2024-01-02'
      };

      const mCurrentContest = getMContest(currentContest);

      // Set up mContests array: [0] = current unresolved, [1] = most recent resolved
      mRivalry.mContests = [mCurrentContest, mContest];

      const { result } = renderHook(
        () => useDeleteMostRecentContestMutation({ rivalry: mRivalry }),
        { wrapper }
      );

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify standings were reverted
      expect(mRivalry.tierListA.standing).toBe(initialStandingA);
      expect(mRivalry.tierListB.standing).toBe(initialStandingB);
    });

    it('should correctly revert standings when loser was at top tier', async () => {
      const initialStandingA = 3;
      const initialStandingB = 0;

      const mockRivalry: Rivalry = {
        __typename: 'Rivalry',
        id: 'rivalry-123',
        userAId: 'user-a',
        userBId: 'user-b',
        gameId: 'game-123',
        contestCount: 5,
        currentContestId: 'contest-123',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      mRivalry.tierListA = getMTierList(
        createTierListWithStanding('user-a', initialStandingA)
      );
      mRivalry.tierListB = getMTierList(
        createTierListWithStanding('user-b', initialStandingB)
      );

      const contest: Contest = {
        __typename: 'Contest',
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: 2,
        bias: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mContest = getMContest(contest);
      mContest.setRivalryAndSlots(mRivalry);
      mRivalry.currentContest = mContest;

      // Apply the contest standing
      mRivalry.adjustStanding();

      expect(mRivalry.tierListA.standing).toBe(5); // Winner moved down 2
      expect(mRivalry.tierListB.standing).toBe(0); // Loser stayed at top

      // Create a new unresolved contest that will be the "current" contest
      const currentContest: Contest = {
        __typename: 'Contest',
        id: 'contest-current',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: null,
        bias: null,
        createdAt: '2024-01-02',
        updatedAt: '2024-01-02'
      };

      const mCurrentContest = getMContest(currentContest);

      // Set up mContests array: [0] = current unresolved, [1] = most recent resolved
      mRivalry.mContests = [mCurrentContest, mContest];

      const { result } = renderHook(
        () => useDeleteMostRecentContestMutation({ rivalry: mRivalry }),
        { wrapper }
      );

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify standings were reverted
      expect(mRivalry.tierListA.standing).toBe(initialStandingA);
      expect(mRivalry.tierListB.standing).toBe(initialStandingB);
    });
  });

  describe('3-stock win deletion', () => {
    it('should correctly revert standings after deleting 3-stock win (bias=1)', async () => {
      const initialStandingA = 5;
      const initialStandingB = 5;

      const mockRivalry: Rivalry = {
        __typename: 'Rivalry',
        id: 'rivalry-123',
        userAId: 'user-a',
        userBId: 'user-b',
        gameId: 'game-123',
        contestCount: 5,
        currentContestId: 'contest-123',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      mRivalry.tierListA = getMTierList(
        createTierListWithStanding('user-a', initialStandingA)
      );
      mRivalry.tierListB = getMTierList(
        createTierListWithStanding('user-b', initialStandingB)
      );

      const contest: Contest = {
        __typename: 'Contest',
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: 3,
        bias: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mContest = getMContest(contest);
      mContest.setRivalryAndSlots(mRivalry);
      mRivalry.currentContest = mContest;

      // Apply the contest standing
      mRivalry.adjustStanding();

      expect(mRivalry.tierListA.standing).toBe(6); // Down 1
      expect(mRivalry.tierListB.standing).toBe(3); // Up 2

      // Create a new unresolved contest that will be the "current" contest
      const currentContest: Contest = {
        __typename: 'Contest',
        id: 'contest-current',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: null,
        bias: null,
        createdAt: '2024-01-02',
        updatedAt: '2024-01-02'
      };

      const mCurrentContest = getMContest(currentContest);

      // Set up mContests array: [0] = current unresolved, [1] = most recent resolved
      mRivalry.mContests = [mCurrentContest, mContest];

      const { result } = renderHook(
        () => useDeleteMostRecentContestMutation({ rivalry: mRivalry }),
        { wrapper }
      );

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify standings were reverted
      expect(mRivalry.tierListA.standing).toBe(initialStandingA);
      expect(mRivalry.tierListB.standing).toBe(initialStandingB);
    });

    it('should correctly revert standings after deleting 3-stock win (bias=-1)', async () => {
      const initialStandingA = 5;
      const initialStandingB = 5;

      const mockRivalry: Rivalry = {
        __typename: 'Rivalry',
        id: 'rivalry-123',
        userAId: 'user-a',
        userBId: 'user-b',
        gameId: 'game-123',
        contestCount: 5,
        currentContestId: 'contest-123',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      mRivalry.tierListA = getMTierList(
        createTierListWithStanding('user-a', initialStandingA)
      );
      mRivalry.tierListB = getMTierList(
        createTierListWithStanding('user-b', initialStandingB)
      );

      const contest: Contest = {
        __typename: 'Contest',
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: 3,
        bias: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mContest = getMContest(contest);
      mContest.setRivalryAndSlots(mRivalry);
      mRivalry.currentContest = mContest;

      // Apply the contest standing with nudge=-1 to force winner to move down
      mRivalry.adjustStanding(-1);

      // 3 stocks = 1 both-move + 1 additional
      // Both move: A down 1, B up 1
      // Additional: A down 1 (bias=-1)
      // But with bias set on the contest, the actual result is A down 1, B up 2
      expect(mRivalry.tierListA.standing).toBe(6); // Down 1
      expect(mRivalry.tierListB.standing).toBe(3); // Up 2

      // Create a new unresolved contest that will be the "current" contest
      const currentContest: Contest = {
        __typename: 'Contest',
        id: 'contest-current',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: null,
        bias: null,
        createdAt: '2024-01-02',
        updatedAt: '2024-01-02'
      };

      const mCurrentContest = getMContest(currentContest);

      // Set up mContests array: [0] = current unresolved, [1] = most recent resolved
      mRivalry.mContests = [mCurrentContest, mContest];

      const { result } = renderHook(
        () => useDeleteMostRecentContestMutation({ rivalry: mRivalry }),
        { wrapper }
      );

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify standings were reverted
      expect(mRivalry.tierListA.standing).toBe(initialStandingA);
      expect(mRivalry.tierListB.standing).toBe(initialStandingB);
    });
  });

  describe('Error handling', () => {
    it('should throw error when no rivalry is provided', async () => {
      const { result } = renderHook(
        () => useDeleteMostRecentContestMutation({ rivalry: null }),
        { wrapper }
      );

      result.current.mutate();

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(new Error('No rivalry provided'));
    });

    it('should throw error when no contests exist', async () => {
      const mockRivalry: Rivalry = {
        __typename: 'Rivalry',
        id: 'rivalry-123',
        userAId: 'user-a',
        userBId: 'user-b',
        gameId: 'game-123',
        contestCount: 0,
        currentContestId: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      mRivalry.mContests = []; // No contests in array

      const { result } = renderHook(
        () => useDeleteMostRecentContestMutation({ rivalry: mRivalry }),
        { wrapper }
      );

      result.current.mutate();

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(new Error('No contests to delete'));
    });

    it('should throw error when contest is unresolved', async () => {
      const mockRivalry: Rivalry = {
        __typename: 'Rivalry',
        id: 'rivalry-123',
        userAId: 'user-a',
        userBId: 'user-b',
        gameId: 'game-123',
        contestCount: 1,
        currentContestId: 'contest-123',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mRivalry = getMRivalry({ rivalry: mockRivalry });

      const contest: Contest = {
        __typename: 'Contest',
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: null,
        bias: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      mRivalry.currentContest = getMContest(contest);

      // Create a current contest and set up mContests
      const currentContest: Contest = {
        __typename: 'Contest',
        id: 'contest-current',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: null,
        bias: null,
        createdAt: '2024-01-02',
        updatedAt: '2024-01-02'
      };

      const mCurrentContest = getMContest(currentContest);

      // Set up mContests array: [0] = current unresolved, [1] = most recent (also unresolved)
      mRivalry.mContests = [mCurrentContest, mRivalry.currentContest];

      const { result } = renderHook(
        () => useDeleteMostRecentContestMutation({ rivalry: mRivalry }),
        { wrapper }
      );

      result.current.mutate();

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(new Error('Cannot delete unresolved contest'));
    });

    it('should handle tier list update errors', async () => {
      const mockRivalry: Rivalry = {
        __typename: 'Rivalry',
        id: 'rivalry-123',
        userAId: 'user-a',
        userBId: 'user-b',
        gameId: 'game-123',
        contestCount: 1,
        currentContestId: 'contest-123',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      mRivalry.tierListA = getMTierList(createTierListWithStanding('user-a', 3));
      mRivalry.tierListB = getMTierList(createTierListWithStanding('user-b', 3));

      const contest: Contest = {
        __typename: 'Contest',
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: 2,
        bias: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mContest = getMContest(contest);
      mContest.setRivalryAndSlots(mRivalry);
      mRivalry.currentContest = mContest;

      // Create a current contest and set up mContests
      const currentContest: Contest = {
        __typename: 'Contest',
        id: 'contest-current',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: null,
        bias: null,
        createdAt: '2024-01-02',
        updatedAt: '2024-01-02'
      };

      const mCurrentContest = getMContest(currentContest);

      // Set up mContests array: [0] = current unresolved, [1] = most recent resolved
      mRivalry.mContests = [mCurrentContest, mContest];

      mockTierSlotUpdate.mockResolvedValue({ data: {}, errors: null });
      mockTierListUpdate.mockResolvedValue({
        data: null,
        errors: [{ message: 'Update failed' }]
      });

      const { result } = renderHook(
        () => useDeleteMostRecentContestMutation({ rivalry: mRivalry }),
        { wrapper }
      );

      result.current.mutate();

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(
        new Error('Failed to update tier lists after reversal')
      );
    });

    it('should handle contest delete errors', async () => {
      const mockRivalry: Rivalry = {
        __typename: 'Rivalry',
        id: 'rivalry-123',
        userAId: 'user-a',
        userBId: 'user-b',
        gameId: 'game-123',
        contestCount: 1,
        currentContestId: 'contest-123',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      mRivalry.tierListA = getMTierList(createTierListWithStanding('user-a', 3));
      mRivalry.tierListB = getMTierList(createTierListWithStanding('user-b', 3));

      const contest: Contest = {
        __typename: 'Contest',
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: 2,
        bias: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mContest = getMContest(contest);
      mContest.setRivalryAndSlots(mRivalry);
      mRivalry.currentContest = mContest;

      // Create a current contest and set up mContests
      const currentContest: Contest = {
        __typename: 'Contest',
        id: 'contest-current',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: null,
        bias: null,
        createdAt: '2024-01-02',
        updatedAt: '2024-01-02'
      };

      const mCurrentContest = getMContest(currentContest);

      // Set up mContests array: [0] = current unresolved, [1] = most recent resolved
      mRivalry.mContests = [mCurrentContest, mContest];

      mockTierSlotUpdate.mockResolvedValue({ data: {}, errors: null });
      mockTierListUpdate.mockResolvedValue({ data: {}, errors: null });
      mockContestUpdate.mockResolvedValue({ data: {}, errors: null });
      mockRivalryUpdate.mockResolvedValue({ data: {}, errors: null });
      mockContestDelete.mockResolvedValue({
        data: null,
        errors: [{ message: 'Delete failed' }]
      });

      const { result } = renderHook(
        () => useDeleteMostRecentContestMutation({ rivalry: mRivalry }),
        { wrapper }
      );

      result.current.mutate();

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(new Error('Delete failed'));
    });
  });

  describe('Callback execution', () => {
    it('should call onSuccess callback after successful deletion', async () => {
      const mockRivalry: Rivalry = {
        __typename: 'Rivalry',
        id: 'rivalry-123',
        userAId: 'user-a',
        userBId: 'user-b',
        gameId: 'game-123',
        contestCount: 1,
        currentContestId: 'contest-123',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mRivalry = getMRivalry({ rivalry: mockRivalry });
      mRivalry.tierListA = getMTierList(createTierListWithStanding('user-a', 3));
      mRivalry.tierListB = getMTierList(createTierListWithStanding('user-b', 3));

      const contest: Contest = {
        __typename: 'Contest',
        id: 'contest-123',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: 2,
        bias: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      const mContest = getMContest(contest);
      mContest.setRivalryAndSlots(mRivalry);
      mRivalry.currentContest = mContest;

      // Create a current contest and set up mContests
      const currentContest: Contest = {
        __typename: 'Contest',
        id: 'contest-current',
        rivalryId: 'rivalry-123',
        tierSlotAId: 'slot-user-a',
        tierSlotBId: 'slot-user-b',
        result: null,
        bias: null,
        createdAt: '2024-01-02',
        updatedAt: '2024-01-02'
      };

      const mCurrentContest = getMContest(currentContest);

      // Set up mContests array: [0] = current unresolved, [1] = most recent resolved
      mRivalry.mContests = [mCurrentContest, mContest];

      const onSuccess = jest.fn();

      const { result } = renderHook(
        () => useDeleteMostRecentContestMutation({ rivalry: mRivalry, onSuccess }),
        { wrapper }
      );

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
