import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/data';
import React from 'react';

import { usePendingRivalriesQuery } from '../../src/controllers/c-rivalry';

// Mock AWS Amplify
jest.mock('aws-amplify/data');

const mockGenerateClient = generateClient as jest.MockedFunction<typeof generateClient>;

describe.skip('usePendingRivalriesQuery', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    jest.clearAllMocks();
  });

  it('should return empty arrays when userId is not provided', async () => {
    const { result } = renderHook(() => usePendingRivalriesQuery({ userId: undefined }), {
      wrapper
    });

    expect(result.current.data).toEqual({
      awaitingAcceptance: [],
      initiated: []
    });
  });

  it('should fetch rivalries awaiting acceptance (user is UserB)', async () => {
    const mockAwaitingAcceptance = [
      {
        id: 'rivalry-1',
        userAId: 'user-2',
        userBId: 'user-1',
        gameId: 'game-1',
        contestCount: 0,
        currentContestId: null,
        accepted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const mockClient = {
      models: {
        Rivalry: {
          list: jest
            .fn()
            .mockResolvedValueOnce({
              data: mockAwaitingAcceptance,
              errors: null
            })
            .mockResolvedValueOnce({
              data: [],
              errors: null
            })
        }
      }
    };

    mockGenerateClient.mockReturnValue(mockClient as any);

    const { result } = renderHook(() => usePendingRivalriesQuery({ userId: 'user-1' }), {
      wrapper
    });

    await waitFor(() => {
      expect(result.current.data?.awaitingAcceptance).toHaveLength(1);
      expect(result.current.data?.awaitingAcceptance[0].userBId).toBe('user-1');
      expect(result.current.data?.initiated).toHaveLength(0);
    });
  });

  it('should fetch initiated rivalries (user is UserA)', async () => {
    const mockInitiated = [
      {
        id: 'rivalry-1',
        userAId: 'user-1',
        userBId: 'user-2',
        gameId: 'game-1',
        contestCount: 0,
        currentContestId: null,
        accepted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const mockClient = {
      models: {
        Rivalry: {
          list: jest
            .fn()
            .mockResolvedValueOnce({
              data: [],
              errors: null
            })
            .mockResolvedValueOnce({
              data: mockInitiated,
              errors: null
            })
        }
      }
    };

    mockGenerateClient.mockReturnValue(mockClient as any);

    const { result } = renderHook(() => usePendingRivalriesQuery({ userId: 'user-1' }), {
      wrapper
    });

    await waitFor(() => {
      expect(result.current.data?.awaitingAcceptance).toHaveLength(0);
      expect(result.current.data?.initiated).toHaveLength(1);
      expect(result.current.data?.initiated[0].userAId).toBe('user-1');
    });
  });

  it('should filter rivalries by accepted: false', async () => {
    const mockAwaitingAcceptance = [
      {
        id: 'rivalry-1',
        userAId: 'user-2',
        userBId: 'user-1',
        gameId: 'game-1',
        contestCount: 0,
        currentContestId: null,
        accepted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const mockClient = {
      models: {
        Rivalry: {
          list: jest.fn((options) => {
            const filter = options?.filter;

            if (filter?.userBId?.eq === 'user-1' && filter?.accepted?.eq === false) {
              return Promise.resolve({ data: mockAwaitingAcceptance, errors: null });
            }

            if (filter?.userAId?.eq === 'user-1' && filter?.accepted?.eq === false) {
              return Promise.resolve({ data: [], errors: null });
            }

            return Promise.resolve({ data: [], errors: null });
          })
        }
      }
    };

    mockGenerateClient.mockReturnValue(mockClient as any);

    const { result } = renderHook(() => usePendingRivalriesQuery({ userId: 'user-1' }), {
      wrapper
    });

    await waitFor(() => {
      expect(mockClient.models.Rivalry.list).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({
            userBId: { eq: 'user-1' },
            accepted: { eq: false }
          })
        })
      );

      expect(mockClient.models.Rivalry.list).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({
            userAId: { eq: 'user-1' },
            accepted: { eq: false }
          })
        })
      );
    });
  });

  it('should convert rivalries to MRivalry models', async () => {
    const mockAwaitingAcceptance = [
      {
        id: 'rivalry-1',
        userAId: 'user-2',
        userBId: 'user-1',
        gameId: 'game-1',
        contestCount: 0,
        currentContestId: null,
        accepted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const mockClient = {
      models: {
        Rivalry: {
          list: jest
            .fn()
            .mockResolvedValueOnce({
              data: mockAwaitingAcceptance,
              errors: null
            })
            .mockResolvedValueOnce({
              data: [],
              errors: null
            })
        }
      }
    };

    mockGenerateClient.mockReturnValue(mockClient as any);

    const { result } = renderHook(() => usePendingRivalriesQuery({ userId: 'user-1' }), {
      wrapper
    });

    await waitFor(() => {
      expect(result.current.data?.awaitingAcceptance[0]).toHaveProperty('displayTitle');
      expect(result.current.data?.awaitingAcceptance[0]).toHaveProperty('setLoggedInUserId');
    });
  });

  it('should handle errors gracefully', async () => {
    const mockClient = {
      models: {
        Rivalry: {
          list: jest.fn().mockResolvedValue({
            data: null,
            errors: [{ message: 'Query failed' }]
          })
        }
      }
    };

    mockGenerateClient.mockReturnValue(mockClient as any);

    const { result } = renderHook(() => usePendingRivalriesQuery({ userId: 'user-1' }), {
      wrapper
    });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });
});
