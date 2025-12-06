import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Create mock functions BEFORE jest.mock and controller imports
export const mockRivalryGet = jest.fn();
export const mockRivalryUpdate = jest.fn();
export const mockFighterList = jest.fn();
export const mockTierListQuery = jest.fn();
export const mockTierListCreate = jest.fn();
export const mockTierSlotList = jest.fn();
export const mockTierSlotCreate = jest.fn();

// Mock the aws-amplify/data module
jest.mock('aws-amplify/data', () => ({
  generateClient: jest.fn(() => {
    const testModule = require(__filename);

    return {
      models: {
        Rivalry: {
          get: testModule.mockRivalryGet,
          update: testModule.mockRivalryUpdate
        },
        Fighter: {
          list: testModule.mockFighterList
        },
        TierList: {
          tierListsByUserIdAndUpdatedAt: testModule.mockTierListQuery,
          create: testModule.mockTierListCreate
        },
        TierSlot: {
          list: testModule.mockTierSlotList,
          create: testModule.mockTierSlotCreate
        }
      }
    };
  })
}));

import { useAcceptRivalryMutation } from '../../src/controllers/c-rivalry';

describe('useAcceptRivalryMutation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      },
      logger: {
        log: console.log,
        warn: console.warn,
        error: () => {
          // suppress error logs in tests
        }
      }
    });

    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  it('should update rivalry accepted field to true and create tier lists', async () => {
    const mockRivalry = {
      id: 'rivalry-1',
      userAId: 'user-1',
      userBId: 'user-2',
      gameId: 'game-1',
      contestCount: 0,
      currentContestId: null,
      accepted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const mockUpdatedRivalry = {
      ...mockRivalry,
      accepted: true
    };

    const mockFighters = [
      { id: 'fighter-1', name: 'Fighter 1', gameId: 'game-1' },
      { id: 'fighter-2', name: 'Fighter 2', gameId: 'game-1' }
    ];

    mockRivalryGet.mockResolvedValue({
      data: mockRivalry,
      errors: null
    });

    mockRivalryUpdate.mockResolvedValue({
      data: mockUpdatedRivalry,
      errors: null
    });

    mockFighterList.mockResolvedValue({
      data: mockFighters,
      errors: null
    });

    mockTierListQuery.mockResolvedValue({
      data: []
    });

    mockTierListCreate.mockResolvedValue({
      data: { id: 'tier-list-1' },
      errors: null
    });

    mockTierSlotCreate.mockResolvedValue({
      data: { id: 'tier-slot-1' },
      errors: null
    });

    const onSuccess = jest.fn();
    const { result } = renderHook(
      () => useAcceptRivalryMutation({ rivalryId: 'rivalry-1', onSuccess }),
      { wrapper }
    );

    result.current.mutate();

    await waitFor(() => {
      expect(mockRivalryGet).toHaveBeenCalledWith({
        id: 'rivalry-1'
      });
    });

    await waitFor(() => {
      expect(mockFighterList).toHaveBeenCalledWith({
        filter: { gameId: { eq: 'game-1' } }
      });
    });

    await waitFor(() => {
      expect(mockTierListQuery).toHaveBeenCalledWith({
        userId: 'user-1',
        sortDirection: 'DESC',
        limit: 1
      });
      expect(mockTierListQuery).toHaveBeenCalledWith({
        userId: 'user-2',
        sortDirection: 'DESC',
        limit: 1
      });
    });

    await waitFor(() => {
      expect(mockTierListCreate).toHaveBeenCalledTimes(2);
      expect(mockTierSlotCreate).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockRivalryUpdate).toHaveBeenCalledWith({
        id: 'rivalry-1',
        accepted: true
      });
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should handle errors when rivalry fetch fails', async () => {
    mockRivalryGet.mockResolvedValue({
      data: null,
      errors: [{ message: 'Rivalry not found' }]
    });

    const { result } = renderHook(
      () => useAcceptRivalryMutation({ rivalryId: 'rivalry-1' }),
      { wrapper }
    );

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('should invalidate pending rivalries queries after successful acceptance', async () => {
    const mockRivalry = {
      id: 'rivalry-1',
      userAId: 'user-1',
      userBId: 'user-2',
      gameId: 'game-1',
      contestCount: 0,
      currentContestId: null,
      accepted: false
    };

    const mockUpdatedRivalry = {
      ...mockRivalry,
      accepted: true
    };

    const mockFighters = [
      { id: 'fighter-1', name: 'Fighter 1', gameId: 'game-1' }
    ];

    mockRivalryGet.mockResolvedValue({
      data: mockRivalry,
      errors: null
    });

    mockRivalryUpdate.mockResolvedValue({
      data: mockUpdatedRivalry,
      errors: null
    });

    mockFighterList.mockResolvedValue({
      data: mockFighters,
      errors: null
    });

    mockTierListQuery.mockResolvedValue({
      data: []
    });

    mockTierListCreate.mockResolvedValue({
      data: { id: 'tier-list-1' },
      errors: null
    });

    mockTierSlotCreate.mockResolvedValue({
      data: { id: 'tier-slot-1' },
      errors: null
    });

    const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(
      () => useAcceptRivalryMutation({ rivalryId: 'rivalry-1' }),
      { wrapper }
    );

    result.current.mutate();

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['pendingRivalries']
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['usersByAwsSub']
      });
    });
  });

  it('should not call onSuccess when rivalry fetch fails', async () => {
    mockRivalryGet.mockResolvedValue({
      data: null,
      errors: [{ message: 'Rivalry not found' }]
    });

    const onSuccess = jest.fn();
    const { result } = renderHook(
      () => useAcceptRivalryMutation({ rivalryId: 'rivalry-1', onSuccess }),
      { wrapper }
    );

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('should duplicate existing tier list if user has one', async () => {
    const mockRivalry = {
      id: 'rivalry-1',
      userAId: 'user-1',
      userBId: 'user-2',
      gameId: 'game-1',
      contestCount: 0,
      currentContestId: null,
      accepted: false
    };

    const mockFighters = [
      { id: 'fighter-1', name: 'Fighter 1', gameId: 'game-1' },
      { id: 'fighter-2', name: 'Fighter 2', gameId: 'game-1' }
    ];

    const mockExistingTierList = {
      id: 'existing-tier-list-1',
      userId: 'user-1',
      rivalryId: 'old-rivalry',
      standing: 5,
      updatedAt: new Date().toISOString()
    };

    const mockExistingTierSlots = [
      { id: 'slot-1', fighterId: 'fighter-2', position: 0, tierListId: 'existing-tier-list-1' },
      { id: 'slot-2', fighterId: 'fighter-1', position: 1, tierListId: 'existing-tier-list-1' }
    ];

    mockRivalryGet.mockResolvedValue({
      data: mockRivalry,
      errors: null
    });

    mockRivalryUpdate.mockResolvedValue({
      data: { ...mockRivalry, accepted: true },
      errors: null
    });

    mockFighterList.mockResolvedValue({
      data: mockFighters,
      errors: null
    });

    mockTierListQuery
      .mockResolvedValueOnce({ data: [mockExistingTierList] }) // user-1 has existing
      .mockResolvedValueOnce({ data: [] }); // user-2 has none

    mockTierListCreate.mockResolvedValue({
      data: { id: 'new-tier-list-1' },
      errors: null
    });

    mockTierSlotList.mockResolvedValue({
      data: mockExistingTierSlots,
      errors: null
    });

    mockTierSlotCreate.mockResolvedValue({
      data: { id: 'new-tier-slot-1' },
      errors: null
    });

    const { result } = renderHook(
      () => useAcceptRivalryMutation({ rivalryId: 'rivalry-1' }),
      { wrapper }
    );

    result.current.mutate();

    await waitFor(() => {
      expect(mockTierSlotList).toHaveBeenCalledWith({
        filter: { tierListId: { eq: 'existing-tier-list-1' } }
      });
    });

    await waitFor(() => {
      // Verify that tier slots were created with the same positions as the existing tier list
      expect(mockTierSlotCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          fighterId: 'fighter-2',
          position: 0
        })
      );
      expect(mockTierSlotCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          fighterId: 'fighter-1',
          position: 1
        })
      );
    });
  });
});
