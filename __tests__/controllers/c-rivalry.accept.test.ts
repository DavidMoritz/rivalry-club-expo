import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/data';
import React from 'react';

import { useAcceptRivalryMutation } from '../../src/controllers/c-rivalry';

// Mock AWS Amplify
jest.mock('aws-amplify/data');

const mockGenerateClient = generateClient as jest.MockedFunction<typeof generateClient>;

describe('useAcceptRivalryMutation', () => {
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

  it('should update rivalry accepted field to true', async () => {
    const mockUpdatedRivalry = {
      id: 'rivalry-1',
      userAId: 'user-1',
      userBId: 'user-2',
      gameId: 'game-1',
      contestCount: 0,
      currentContestId: null,
      accepted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const mockClient = {
      models: {
        Rivalry: {
          update: jest.fn().mockResolvedValue({
            data: mockUpdatedRivalry,
            errors: null
          })
        }
      }
    };

    mockGenerateClient.mockReturnValue(mockClient as any);

    const onSuccess = jest.fn();
    const { result } = renderHook(
      () => useAcceptRivalryMutation({ rivalryId: 'rivalry-1', onSuccess }),
      { wrapper }
    );

    result.current.mutate();

    await waitFor(() => {
      expect(mockClient.models.Rivalry.update).toHaveBeenCalledWith({
        id: 'rivalry-1',
        accepted: true
      });
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should handle errors when update fails', async () => {
    const mockClient = {
      models: {
        Rivalry: {
          update: jest.fn().mockResolvedValue({
            data: null,
            errors: [{ message: 'Update failed' }]
          })
        }
      }
    };

    mockGenerateClient.mockReturnValue(mockClient as any);

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
    const mockUpdatedRivalry = {
      id: 'rivalry-1',
      userAId: 'user-1',
      userBId: 'user-2',
      gameId: 'game-1',
      contestCount: 0,
      currentContestId: null,
      accepted: true
    };

    const mockClient = {
      models: {
        Rivalry: {
          update: jest.fn().mockResolvedValue({
            data: mockUpdatedRivalry,
            errors: null
          })
        }
      }
    };

    mockGenerateClient.mockReturnValue(mockClient as any);

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

  it('should not call onSuccess when update fails', async () => {
    const mockClient = {
      models: {
        Rivalry: {
          update: jest.fn().mockResolvedValue({
            data: null,
            errors: [{ message: 'Update failed' }]
          })
        }
      }
    };

    mockGenerateClient.mockReturnValue(mockClient as any);

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
});
