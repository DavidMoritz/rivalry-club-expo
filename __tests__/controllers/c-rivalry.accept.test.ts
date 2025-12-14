import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

interface MockTierSlot {
  id: string;
  fighterId: string;
  position: number | null;
}

interface MockTierListData {
  id: string;
  tierSlots?: {
    items?: MockTierSlot[];
  };
}

interface MockFunctions {
  mockRivalryGet: jest.Mock;
  mockRivalryUpdate: jest.Mock;
  mockRivalryList: jest.Mock;
  mockFighterList: jest.Mock;
  mockTierListQuery: jest.Mock;
  mockTierListCreate: jest.Mock;
  mockTierListList: jest.Mock;
  mockTierListGet: jest.Mock;
  mockTierSlotList: jest.Mock;
  mockTierSlotCreate: jest.Mock;
}

declare const global: typeof globalThis & {
  mockAcceptRivalryFns: MockFunctions;
};

// Mock the m-tier-list module for dynamic import
jest.mock('../../src/models/m-tier-list', () => ({
  getMTierList: jest.fn((tierListData: MockTierListData) => {
    // Create 86 slots to match FIGHTER_COUNT and avoid integrity check
    const slots: MockTierSlot[] = [];
    if (tierListData.tierSlots) {
      // If tierSlots is an async generator, collect all items
      slots.push(...(tierListData.tierSlots.items || []));
    }
    // Pad to 86 slots if needed
    while (slots.length < 86) {
      slots.push({
        id: `mock-slot-${slots.length}`,
        fighterId: `mock-fighter-${slots.length}`,
        position: null,
      });
    }
    return {
      id: tierListData.id,
      slots,
      tierListData,
    };
  }),
  FIGHTER_COUNT: 86,
}));

// Mock the aws-amplify/data module
jest.mock('aws-amplify/data', () => {
  const mockFns = {
    mockRivalryGet: jest.fn(),
    mockRivalryUpdate: jest.fn(),
    mockRivalryList: jest.fn(),
    mockFighterList: jest.fn(),
    mockTierListQuery: jest.fn(),
    mockTierListCreate: jest.fn(),
    mockTierListList: jest.fn(),
    mockTierListGet: jest.fn(),
    mockTierSlotList: jest.fn(),
    mockTierSlotCreate: jest.fn(),
  };

  // Store references globally for use in tests
  global.mockAcceptRivalryFns = mockFns;

  return {
    generateClient: jest.fn(() => ({
      models: {
        Rivalry: {
          get: mockFns.mockRivalryGet,
          update: mockFns.mockRivalryUpdate,
          list: mockFns.mockRivalryList,
        },
        Fighter: {
          list: mockFns.mockFighterList,
        },
        TierList: {
          tierListsByUserIdAndUpdatedAt: mockFns.mockTierListQuery,
          create: mockFns.mockTierListCreate,
          list: mockFns.mockTierListList,
          get: mockFns.mockTierListGet,
        },
        TierSlot: {
          list: mockFns.mockTierSlotList,
          create: mockFns.mockTierSlotCreate,
        },
      },
    })),
  };
});

import { useAcceptRivalryMutation } from '../../src/controllers/c-rivalry';

describe('useAcceptRivalryMutation', () => {
  let queryClient: QueryClient;
  let mockRivalryGet: jest.Mock;
  let mockRivalryUpdate: jest.Mock;
  let mockRivalryList: jest.Mock;
  let mockFighterList: jest.Mock;
  let _mockTierListQuery: jest.Mock;
  let mockTierListCreate: jest.Mock;
  let mockTierListList: jest.Mock;
  let mockTierListGet: jest.Mock;
  let _mockTierSlotList: jest.Mock;
  let mockTierSlotCreate: jest.Mock;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
      logger: {
        log: console.log,
        warn: console.warn,
        error: () => {
          // suppress error logs in tests
        },
      },
    });

    // Get references to the mocked functions
    const globalMocks = global.mockAcceptRivalryFns;
    mockRivalryGet = globalMocks.mockRivalryGet;
    mockRivalryUpdate = globalMocks.mockRivalryUpdate;
    mockRivalryList = globalMocks.mockRivalryList;
    mockFighterList = globalMocks.mockFighterList;
    _mockTierListQuery = globalMocks.mockTierListQuery;
    mockTierListCreate = globalMocks.mockTierListCreate;
    mockTierListList = globalMocks.mockTierListList;
    mockTierListGet = globalMocks.mockTierListGet;
    _mockTierSlotList = globalMocks.mockTierSlotList;
    mockTierSlotCreate = globalMocks.mockTierSlotCreate;

    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  it('should update rivalry accepted field to true and create tier list for userB', async () => {
    const mockRivalry = {
      id: 'rivalry-1',
      userAId: 'user-1',
      userBId: 'user-2',
      gameId: 'game-1',
      contestCount: 0,
      currentContestId: null,
      accepted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockUpdatedRivalry = {
      ...mockRivalry,
      accepted: true,
    };

    const mockFighters = [
      { id: 'fighter-1', name: 'Fighter 1', gameId: 'game-1' },
      { id: 'fighter-2', name: 'Fighter 2', gameId: 'game-1' },
    ];

    mockRivalryGet.mockResolvedValue({
      data: mockRivalry,
      errors: null,
    });

    mockRivalryUpdate.mockResolvedValue({
      data: mockUpdatedRivalry,
      errors: null,
    });

    mockFighterList.mockResolvedValue({
      data: mockFighters,
      errors: null,
    });

    // Mock the query for userB's existing rivalries (no template found - contestCount < 100)
    mockRivalryList.mockResolvedValue({
      data: [],
    });

    mockTierListCreate.mockResolvedValue({
      data: { id: 'tier-list-1' },
      errors: null,
    });

    // Mock TierList.get for integrity check - return null to skip the integrity check
    // This avoids the dynamic import issue in tests
    mockTierListGet.mockResolvedValue({
      data: null,
    });

    mockTierSlotCreate.mockResolvedValue({
      data: { id: 'tier-slot-1' },
      errors: null,
    });

    const onSuccess = jest.fn();
    const { result } = renderHook(
      () => useAcceptRivalryMutation({ onSuccess }),
      { wrapper }
    );

    result.current.mutate('rivalry-1');

    // Wait for the mutation to complete and onSuccess to be called
    await waitFor(
      () => {
        if (result.current.isError) {
          throw new Error(
            `Mutation failed: ${result.current.error?.message || 'Unknown error'}`
          );
        }
        expect(result.current.isSuccess).toBe(true);
        expect(onSuccess).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    // Verify the expected API calls were made in the correct sequence
    expect(mockRivalryGet).toHaveBeenCalledWith({ id: 'rivalry-1' });
    expect(mockFighterList).toHaveBeenCalledWith({
      filter: { gameId: { eq: 'game-1' } },
    });
    // Only creates tier list for userB (accepter), not userA (initiator already has one)
    expect(mockTierListCreate).toHaveBeenCalledTimes(1);
    expect(mockTierListCreate).toHaveBeenCalledWith({
      rivalryId: 'rivalry-1',
      userId: 'user-2',
      standing: 0,
    });
    expect(mockTierSlotCreate).toHaveBeenCalled();
    expect(mockRivalryUpdate).toHaveBeenCalledWith({
      id: 'rivalry-1',
      accepted: true,
    });
  });

  it('should handle errors when rivalry fetch fails', async () => {
    mockRivalryGet.mockResolvedValue({
      data: null,
      errors: [{ message: 'Rivalry not found' }],
    });

    const { result } = renderHook(() => useAcceptRivalryMutation({}), {
      wrapper,
    });

    result.current.mutate('rivalry-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('should invalidate pending rivalries queries after successful acceptance', async () => {
    const mockRivalry = {
      id: 'rivalry-1',
      userAId: 'user-1',
      userBId: 'user-2',
      gameId: 'game-1',
      contestCount: 0,
      currentContestId: null,
      accepted: false,
    };

    const mockUpdatedRivalry = {
      ...mockRivalry,
      accepted: true,
    };

    const mockFighters = [
      { id: 'fighter-1', name: 'Fighter 1', gameId: 'game-1' },
    ];

    mockRivalryGet.mockResolvedValue({
      data: mockRivalry,
      errors: null,
    });

    mockRivalryUpdate.mockResolvedValue({
      data: mockUpdatedRivalry,
      errors: null,
    });

    mockFighterList.mockResolvedValue({
      data: mockFighters,
      errors: null,
    });

    // Mock Rivalry.list to return no template rivalries
    mockRivalryList.mockResolvedValue({
      data: [],
    });

    mockTierListCreate.mockResolvedValue({
      data: { id: 'tier-list-1' },
      errors: null,
    });

    // Mock TierList.get to skip integrity check
    mockTierListGet.mockResolvedValue({
      data: null,
    });

    mockTierSlotCreate.mockResolvedValue({
      data: { id: 'tier-slot-1' },
      errors: null,
    });

    const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useAcceptRivalryMutation({}), {
      wrapper,
    });

    result.current.mutate('rivalry-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['pendingRivalries'],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['usersByAwsSub'],
    });
  });

  it('should not call onSuccess when rivalry fetch fails', async () => {
    mockRivalryGet.mockResolvedValue({
      data: null,
      errors: [{ message: 'Rivalry not found' }],
    });

    const onSuccess = jest.fn();
    const { result } = renderHook(
      () => useAcceptRivalryMutation({ onSuccess }),
      { wrapper }
    );

    result.current.mutate('rivalry-1');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('should use template tier list from existing rivalry with contestCount > 100', async () => {
    const mockRivalry = {
      id: 'rivalry-1',
      userAId: 'user-1',
      userBId: 'user-2',
      gameId: 'game-1',
      contestCount: 0,
      currentContestId: null,
      accepted: false,
    };

    const mockFighters = [
      { id: 'fighter-1', name: 'Fighter 1', gameId: 'game-1' },
      { id: 'fighter-2', name: 'Fighter 2', gameId: 'game-1' },
    ];

    // Template rivalry with contestCount > 100
    const mockTemplateRivalry = {
      id: 'template-rivalry',
      userAId: 'user-2',
      userBId: 'user-3',
      gameId: 'game-1',
      contestCount: 150,
      accepted: true,
    };

    const mockTemplateTierList = {
      id: 'template-tier-list-1',
      userId: 'user-2',
      rivalryId: 'template-rivalry',
      standing: 5,
    };

    const mockTemplateTierSlots = [
      {
        id: 'slot-1',
        fighterId: 'fighter-2',
        position: 0,
        tierListId: 'template-tier-list-1',
      },
      {
        id: 'slot-2',
        fighterId: 'fighter-1',
        position: 1,
        tierListId: 'template-tier-list-1',
      },
    ];

    mockRivalryGet.mockResolvedValue({
      data: mockRivalry,
      errors: null,
    });

    mockRivalryUpdate.mockResolvedValue({
      data: { ...mockRivalry, accepted: true },
      errors: null,
    });

    mockFighterList.mockResolvedValue({
      data: mockFighters,
      errors: null,
    });

    // Mock Rivalry.list to return a template rivalry with contestCount > 100
    mockRivalryList.mockResolvedValue({
      data: [mockTemplateRivalry],
    });

    // Mock TierList.list to return userB's tier list from the template rivalry
    mockTierListList.mockResolvedValue({
      data: [mockTemplateTierList],
    });

    // Mock TierList.get to return the tier list with tier slots
    mockTierListGet
      .mockResolvedValueOnce({
        data: {
          id: 'template-tier-list-1',
          tierSlots: (function* () {
            for (const slot of mockTemplateTierSlots) {
              yield slot;
            }
          })(),
        },
      })
      .mockResolvedValueOnce({
        // Second call is for integrity check - skip it
        data: null,
      });

    mockTierListCreate.mockResolvedValue({
      data: { id: 'new-tier-list-1' },
      errors: null,
    });

    mockTierSlotCreate.mockResolvedValue({
      data: { id: 'new-tier-slot-1' },
      errors: null,
    });

    const { result } = renderHook(() => useAcceptRivalryMutation({}), {
      wrapper,
    });

    result.current.mutate('rivalry-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify that the template rivalry was searched for
    expect(mockRivalryList).toHaveBeenCalledWith({
      filter: {
        or: [{ userAId: { eq: 'user-2' } }, { userBId: { eq: 'user-2' } }],
        accepted: { eq: true },
      },
    });

    // Verify that the template tier list was fetched
    expect(mockTierListList).toHaveBeenCalledWith({
      filter: {
        rivalryId: { eq: 'template-rivalry' },
        userId: { eq: 'user-2' },
      },
    });

    // Verify that tier list was fetched with tier slots
    expect(mockTierListGet).toHaveBeenCalledWith(
      { id: 'template-tier-list-1' },
      { selectionSet: ['id', 'tierSlots.*'] }
    );

    // Verify that tier slots were created with the same positions as the template tier list
    expect(mockTierSlotCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        fighterId: 'fighter-2',
        position: 0,
      })
    );
    expect(mockTierSlotCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        fighterId: 'fighter-1',
        position: 1,
      })
    );
  });
});
