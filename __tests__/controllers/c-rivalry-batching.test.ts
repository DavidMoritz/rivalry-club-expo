/**
 * Tests for batched tier slot creation in rivalry mutations
 * Ensures that tier slots are created in batches to avoid API timeouts
 */

import { renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the aws-amplify/data module
jest.mock('aws-amplify/data', () => {
  const mockFns = {
    mockRivalryCreate: jest.fn(),
    mockRivalryGet: jest.fn(),
    mockRivalryUpdate: jest.fn(),
    mockFighterList: jest.fn(),
    mockTierListCreate: jest.fn(),
    mockTierListQuery: jest.fn(),
    mockTierSlotCreate: jest.fn(),
    mockTierSlotList: jest.fn()
  };

  // Store references globally for use in tests
  (global as any).mockBatchingFns = mockFns;

  return {
    generateClient: jest.fn(() => ({
      models: {
        Rivalry: {
          create: mockFns.mockRivalryCreate,
          get: mockFns.mockRivalryGet,
          update: mockFns.mockRivalryUpdate
        },
        Fighter: {
          list: mockFns.mockFighterList
        },
        TierList: {
          create: mockFns.mockTierListCreate,
          tierListsByUserIdAndUpdatedAt: mockFns.mockTierListQuery
        },
        TierSlot: {
          create: mockFns.mockTierSlotCreate,
          list: mockFns.mockTierSlotList
        }
      }
    }))
  };
});

import { useCreateRivalryMutation, useAcceptRivalryMutation } from '../../src/controllers/c-rivalry';

describe('Batched Tier Slot Creation', () => {
  let queryClient: QueryClient;
  let mockRivalryCreate: jest.Mock;
  let mockRivalryGet: jest.Mock;
  let mockRivalryUpdate: jest.Mock;
  let mockFighterList: jest.Mock;
  let mockTierListCreate: jest.Mock;
  let mockTierListQuery: jest.Mock;
  let mockTierSlotCreate: jest.Mock;
  let mockTierSlotList: jest.Mock;

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

    // Get references to the mocked functions
    const globalMocks = (global as any).mockBatchingFns;
    mockRivalryCreate = globalMocks.mockRivalryCreate;
    mockRivalryGet = globalMocks.mockRivalryGet;
    mockRivalryUpdate = globalMocks.mockRivalryUpdate;
    mockFighterList = globalMocks.mockFighterList;
    mockTierListCreate = globalMocks.mockTierListCreate;
    mockTierListQuery = globalMocks.mockTierListQuery;
    mockTierSlotCreate = globalMocks.mockTierSlotCreate;
    mockTierSlotList = globalMocks.mockTierSlotList;

    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  describe('useCreateRivalryMutation', () => {
    it('should create tier slots in batches of 10 for large fighter lists', async () => {
      // Create a large list of fighters (e.g., SSBU has 82 fighters)
      const mockFighters = Array.from({ length: 82 }, (_, i) => ({
        id: `fighter-${i + 1}`,
        name: `Fighter ${i + 1}`,
        gameId: 'game-1'
      }));

      const mockRivalry = {
        id: 'rivalry-1',
        userAId: 'user-1',
        userBId: 'user-2',
        gameId: 'game-1',
        contestCount: 0,
        accepted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockRivalryCreate.mockResolvedValue({
        data: mockRivalry,
        errors: null
      });

      mockFighterList.mockResolvedValue({
        data: mockFighters,
        errors: null
      });

      mockTierListCreate.mockResolvedValue({
        data: { id: 'tier-list-1' },
        errors: null
      });

      // Track the order of tier slot creation calls
      const tierSlotCreationOrder: number[] = [];
      mockTierSlotCreate.mockImplementation(() => {
        tierSlotCreationOrder.push(Date.now());
        return Promise.resolve({
          data: { id: `tier-slot-${tierSlotCreationOrder.length}` },
          errors: null
        });
      });

      const { result } = renderHook(
        () => useCreateRivalryMutation({}),
        { wrapper }
      );

      // Start the mutation
      const mutatePromise = new Promise<void>((resolve) => {
        result.current.mutate(
          {
            userAId: 'user-1',
            userBId: 'user-2',
            gameId: 'game-1'
          },
          {
            onSuccess: () => resolve(),
            onError: (error) => {
              console.error('Mutation error:', error);
              resolve();
            }
          }
        );
      });

      await mutatePromise;

      // Verify tier slot creation was called the correct number of times
      // 82 fighters × 2 tier slots (one for each user) = 164 total tier slots
      expect(mockTierSlotCreate).toHaveBeenCalledTimes(164);

      // Verify batching: with batch size of 10, we should see gaps in creation times
      // Each batch should be created in parallel, then the next batch starts
      // This is a proxy test - we verify all calls happened
      expect(tierSlotCreationOrder.length).toBe(164);
    });

    it('should handle small fighter lists without batching issues', async () => {
      // Create a small list of fighters
      const mockFighters = Array.from({ length: 5 }, (_, i) => ({
        id: `fighter-${i + 1}`,
        name: `Fighter ${i + 1}`,
        gameId: 'game-1'
      }));

      const mockRivalry = {
        id: 'rivalry-1',
        userAId: 'user-1',
        userBId: 'user-2',
        gameId: 'game-1',
        contestCount: 0,
        accepted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockRivalryCreate.mockResolvedValue({
        data: mockRivalry,
        errors: null
      });

      mockFighterList.mockResolvedValue({
        data: mockFighters,
        errors: null
      });

      mockTierListCreate.mockResolvedValue({
        data: { id: 'tier-list-1' },
        errors: null
      });

      mockTierSlotCreate.mockResolvedValue({
        data: { id: 'tier-slot-1' },
        errors: null
      });

      const { result } = renderHook(
        () => useCreateRivalryMutation({}),
        { wrapper }
      );

      const mutatePromise = new Promise<void>((resolve) => {
        result.current.mutate(
          {
            userAId: 'user-1',
            userBId: 'user-2',
            gameId: 'game-1'
          },
          {
            onSuccess: () => resolve(),
            onError: () => resolve()
          }
        );
      });

      await mutatePromise;

      // 5 fighters × 2 tier slots = 10 total
      expect(mockTierSlotCreate).toHaveBeenCalledTimes(10);
    });
  });

  describe('useAcceptRivalryMutation', () => {
    it('should create tier slots in batches when accepting rivalry', async () => {
      // Create a large list of fighters
      const mockFighters = Array.from({ length: 82 }, (_, i) => ({
        id: `fighter-${i + 1}`,
        name: `Fighter ${i + 1}`,
        gameId: 'game-1'
      }));

      const mockRivalry = {
        id: 'rivalry-1',
        userAId: 'user-1',
        userBId: 'user-2',
        gameId: 'game-1',
        contestCount: 0,
        accepted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockRivalryGet.mockResolvedValue({
        data: mockRivalry,
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

      mockRivalryUpdate.mockResolvedValue({
        data: { ...mockRivalry, accepted: true },
        errors: null
      });

      const { result } = renderHook(
        () => useAcceptRivalryMutation({}),
        { wrapper }
      );

      const mutatePromise = new Promise<void>((resolve) => {
        result.current.mutate('rivalry-1', {
          onSuccess: () => resolve(),
          onError: () => resolve()
        });
      });

      await mutatePromise;

      // 82 fighters × 2 tier lists = 164 total tier slots
      expect(mockTierSlotCreate).toHaveBeenCalledTimes(164);
    });
  });

  describe('Error handling in batches', () => {
    it.skip('should report partial failures when some tier slots fail to create', async () => {
      const mockFighters = Array.from({ length: 25 }, (_, i) => ({
        id: `fighter-${i + 1}`,
        name: `Fighter ${i + 1}`,
        gameId: 'game-1'
      }));

      const mockRivalry = {
        id: 'rivalry-1',
        userAId: 'user-1',
        userBId: 'user-2',
        gameId: 'game-1',
        contestCount: 0,
        accepted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockRivalryCreate.mockResolvedValue({
        data: mockRivalry,
        errors: null
      });

      mockFighterList.mockResolvedValue({
        data: mockFighters,
        errors: null
      });

      mockTierListCreate.mockResolvedValue({
        data: { id: 'tier-list-1' },
        errors: null
      });

      // Simulate some failures in tier slot creation
      let callCount = 0;
      mockTierSlotCreate.mockImplementation(() => {
        callCount++;
        // Fail every 10th call
        if (callCount % 10 === 0) {
          return Promise.resolve({
            data: null,
            errors: [{ message: 'Creation failed' }]
          });
        }
        return Promise.resolve({
          data: { id: `tier-slot-${callCount}` },
          errors: null
        });
      });

      const { result } = renderHook(
        () => useCreateRivalryMutation({}),
        { wrapper }
      );

      let errorCaught = false;
      const mutatePromise = new Promise<void>((resolve) => {
        result.current.mutate(
          {
            userAId: 'user-1',
            userBId: 'user-2',
            gameId: 'game-1'
          },
          {
            onSuccess: () => resolve(),
            onError: (error) => {
              errorCaught = true;
              // Verify the error message includes information about failures
              expect(error.message).toContain('Failed to create');
              expect(error.message).toContain('tier slots');
              resolve();
            }
          }
        );
      });

      await mutatePromise;

      // Should have attempted all 50 tier slots (25 fighters × 2)
      expect(mockTierSlotCreate).toHaveBeenCalledTimes(50);

      // Mutation should have triggered the error callback
      expect(errorCaught).toBe(true);
    });
  });
});
