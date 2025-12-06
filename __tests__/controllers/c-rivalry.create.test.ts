import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/data';
import React from 'react';

import { useCreateRivalryMutation } from '../../src/controllers/c-rivalry';

// Mock AWS Amplify
jest.mock('aws-amplify/data');

const mockGenerateClient = generateClient as jest.MockedFunction<typeof generateClient>;

describe.skip('useCreateRivalryMutation', () => {
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

  it('should create a rivalry with accepted: false', async () => {
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

    const mockFighters = [
      { id: 'fighter-1', name: 'Fighter 1', gameId: 'game-1' },
      { id: 'fighter-2', name: 'Fighter 2', gameId: 'game-1' }
    ];

    const mockTierListA = { id: 'tierlist-1', rivalryId: 'rivalry-1', userId: 'user-1' };
    const mockTierListB = { id: 'tierlist-2', rivalryId: 'rivalry-1', userId: 'user-2' };

    const mockClient = {
      models: {
        Rivalry: {
          create: jest.fn().mockResolvedValue({
            data: mockRivalry,
            errors: null
          })
        },
        Fighter: {
          list: jest.fn().mockResolvedValue({
            data: mockFighters,
            errors: null
          })
        },
        TierList: {
          create: jest
            .fn()
            .mockResolvedValueOnce({ data: mockTierListA, errors: null })
            .mockResolvedValueOnce({ data: mockTierListB, errors: null })
        },
        TierSlot: {
          create: jest.fn().mockResolvedValue({ data: {}, errors: null })
        }
      }
    };

    mockGenerateClient.mockReturnValue(mockClient as any);

    const onSuccess = jest.fn();
    const { result } = renderHook(() => useCreateRivalryMutation({ onSuccess }), { wrapper });

    result.current.mutate({
      userAId: 'user-1',
      userBId: 'user-2',
      gameId: 'game-1'
    });

    await waitFor(() => {
      expect(mockClient.models.Rivalry.create).toHaveBeenCalledWith({
        userAId: 'user-1',
        userBId: 'user-2',
        gameId: 'game-1',
        contestCount: 0,
        accepted: false
      });
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should create tier lists for both users', async () => {
    const mockRivalry = {
      id: 'rivalry-1',
      userAId: 'user-1',
      userBId: 'user-2',
      gameId: 'game-1',
      contestCount: 0,
      accepted: false
    };

    const mockFighters = [{ id: 'fighter-1', name: 'Fighter 1', gameId: 'game-1' }];

    const mockTierListA = { id: 'tierlist-1', rivalryId: 'rivalry-1', userId: 'user-1' };
    const mockTierListB = { id: 'tierlist-2', rivalryId: 'rivalry-1', userId: 'user-2' };

    const mockClient = {
      models: {
        Rivalry: {
          create: jest.fn().mockResolvedValue({ data: mockRivalry, errors: null })
        },
        Fighter: {
          list: jest.fn().mockResolvedValue({ data: mockFighters, errors: null })
        },
        TierList: {
          create: jest
            .fn()
            .mockResolvedValueOnce({ data: mockTierListA, errors: null })
            .mockResolvedValueOnce({ data: mockTierListB, errors: null })
        },
        TierSlot: {
          create: jest.fn().mockResolvedValue({ data: {}, errors: null })
        }
      }
    };

    mockGenerateClient.mockReturnValue(mockClient as any);

    const { result } = renderHook(() => useCreateRivalryMutation(), { wrapper });

    result.current.mutate({
      userAId: 'user-1',
      userBId: 'user-2',
      gameId: 'game-1'
    });

    await waitFor(() => {
      expect(mockClient.models.TierList.create).toHaveBeenCalledTimes(2);
      expect(mockClient.models.TierList.create).toHaveBeenCalledWith({
        rivalryId: 'rivalry-1',
        userId: 'user-1',
        standing: 0
      });
      expect(mockClient.models.TierList.create).toHaveBeenCalledWith({
        rivalryId: 'rivalry-1',
        userId: 'user-2',
        standing: 0
      });
    });
  });

  it('should create tier slots for all fighters for both users', async () => {
    const mockRivalry = {
      id: 'rivalry-1',
      userAId: 'user-1',
      userBId: 'user-2',
      gameId: 'game-1',
      contestCount: 0,
      accepted: false
    };

    const mockFighters = [
      { id: 'fighter-1', name: 'Fighter 1', gameId: 'game-1' },
      { id: 'fighter-2', name: 'Fighter 2', gameId: 'game-1' }
    ];

    const mockTierListA = { id: 'tierlist-1', rivalryId: 'rivalry-1', userId: 'user-1' };
    const mockTierListB = { id: 'tierlist-2', rivalryId: 'rivalry-1', userId: 'user-2' };

    const mockClient = {
      models: {
        Rivalry: {
          create: jest.fn().mockResolvedValue({ data: mockRivalry, errors: null })
        },
        Fighter: {
          list: jest.fn().mockResolvedValue({ data: mockFighters, errors: null })
        },
        TierList: {
          create: jest
            .fn()
            .mockResolvedValueOnce({ data: mockTierListA, errors: null })
            .mockResolvedValueOnce({ data: mockTierListB, errors: null })
        },
        TierSlot: {
          create: jest.fn().mockResolvedValue({ data: {}, errors: null })
        }
      }
    };

    mockGenerateClient.mockReturnValue(mockClient as any);

    const { result } = renderHook(() => useCreateRivalryMutation(), { wrapper });

    result.current.mutate({
      userAId: 'user-1',
      userBId: 'user-2',
      gameId: 'game-1'
    });

    await waitFor(() => {
      // 2 fighters × 2 users = 4 tier slots
      expect(mockClient.models.TierSlot.create).toHaveBeenCalledTimes(4);
    });
  });

  it('should handle errors when rivalry creation fails', async () => {
    const mockClient = {
      models: {
        Rivalry: {
          create: jest.fn().mockResolvedValue({
            data: null,
            errors: [{ message: 'Creation failed' }]
          })
        }
      }
    };

    mockGenerateClient.mockReturnValue(mockClient as any);

    const onError = jest.fn();
    const { result } = renderHook(() => useCreateRivalryMutation({ onError }), { wrapper });

    result.current.mutate({
      userAId: 'user-1',
      userBId: 'user-2',
      gameId: 'game-1'
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });

  it('should handle errors when no fighters exist for game', async () => {
    const mockRivalry = {
      id: 'rivalry-1',
      userAId: 'user-1',
      userBId: 'user-2',
      gameId: 'game-1',
      contestCount: 0,
      accepted: false
    };

    const mockClient = {
      models: {
        Rivalry: {
          create: jest.fn().mockResolvedValue({ data: mockRivalry, errors: null })
        },
        Fighter: {
          list: jest.fn().mockResolvedValue({ data: [], errors: null })
        }
      }
    };

    mockGenerateClient.mockReturnValue(mockClient as any);

    const onError = jest.fn();
    const { result } = renderHook(() => useCreateRivalryMutation({ onError }), { wrapper });

    result.current.mutate({
      userAId: 'user-1',
      userBId: 'user-2',
      gameId: 'game-1'
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('No fighters found')
      }));
    });
  });

  it('should invalidate queries after successful creation', async () => {
    const mockRivalry = {
      id: 'rivalry-1',
      userAId: 'user-1',
      userBId: 'user-2',
      gameId: 'game-1',
      contestCount: 0,
      accepted: false
    };

    const mockFighters = [{ id: 'fighter-1', name: 'Fighter 1', gameId: 'game-1' }];

    const mockClient = {
      models: {
        Rivalry: {
          create: jest.fn().mockResolvedValue({ data: mockRivalry, errors: null })
        },
        Fighter: {
          list: jest.fn().mockResolvedValue({ data: mockFighters, errors: null })
        },
        TierList: {
          create: jest.fn().mockResolvedValue({ data: {}, errors: null })
        },
        TierSlot: {
          create: jest.fn().mockResolvedValue({ data: {}, errors: null })
        }
      }
    };

    mockGenerateClient.mockReturnValue(mockClient as any);

    const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateRivalryMutation(), { wrapper });

    result.current.mutate({
      userAId: 'user-1',
      userBId: 'user-2',
      gameId: 'game-1'
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['pendingRivalries', 'user-1']
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['usersByAwsSub']
      });
    });
  });
});
