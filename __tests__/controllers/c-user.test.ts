import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { API } from 'aws-amplify';
import React from 'react';

import {
  useUserDataQuery,
  useUserWithRivalriesByAwsSubQuery,
} from '../../src/controllers/c-user';
import { getMRivalry } from '../../src/models/m-rivalry';

jest.mock('aws-amplify', () => ({
  API: {
    graphql: jest.fn(),
  },
}));

describe('c-user Controller', () => {
  let queryClient: QueryClient;

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

  describe('useUserWithRivalriesByAwsSubQuery', () => {
    it('should fetch user data by AWS sub', async () => {
      const mockData = {
        data: {
          usersByAwsSub: {
            items: [
              {
                id: 'user-123',
                email: 'test@test.com',
                firstName: 'Test',
                lastName: 'User',
                awsSub: 'aws-sub-123',
              },
            ],
          },
        },
      };

      (API.graphql as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(
        () =>
          useUserWithRivalriesByAwsSubQuery({
            amplifyUser: { username: 'aws-sub-123' },
          }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(API.graphql).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockData);
    });

    it('should return early if username is not provided', async () => {
      const { result } = renderHook(
        () =>
          useUserWithRivalriesByAwsSubQuery({
            amplifyUser: {},
          }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.data).toBeDefined());

      expect(result.current.data).toEqual({ data: null, isLoading: true });
      expect(API.graphql).not.toHaveBeenCalled();
    });
  });

  describe('useUserDataQuery', () => {
    it('should fetch multiple users from rivalries', async () => {
      const mockRivalries = [
        getMRivalry({
          rivalry: {
            __typename: 'Rivalry',
            id: 'rivalry-1',
            userAId: 'user-a',
            userBId: 'user-b',
            gameId: 'game-123',
            contestCount: 10,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        }),
        getMRivalry({
          rivalry: {
            __typename: 'Rivalry',
            id: 'rivalry-2',
            userAId: 'user-a',
            userBId: 'user-c',
            gameId: 'game-123',
            contestCount: 5,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        }),
      ];

      const mockData = {
        data: {
          user0: {
            id: 'user-a',
            firstName: 'Alice',
            lastName: 'Anderson',
          },
          user1: {
            id: 'user-b',
            firstName: 'Bob',
            lastName: 'Brown',
          },
          user2: {
            id: 'user-c',
            firstName: 'Charlie',
            lastName: 'Chen',
          },
        },
      };

      (API.graphql as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(
        () => useUserDataQuery({ rivalries: mockRivalries }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(API.graphql).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockData);
    });

    it('should return early if no rivalries provided', async () => {
      const { result } = renderHook(() => useUserDataQuery({ rivalries: [] }), {
        wrapper,
      });

      await waitFor(() => expect(result.current.data).toBeDefined());

      expect(result.current.data).toEqual({ data: null, isLoading: true });
      expect(API.graphql).not.toHaveBeenCalled();
    });

    it('should handle duplicate user IDs correctly', async () => {
      const mockRivalries = [
        getMRivalry({
          rivalry: {
            __typename: 'Rivalry',
            id: 'rivalry-1',
            userAId: 'user-a',
            userBId: 'user-b',
            gameId: 'game-123',
            contestCount: 10,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        }),
        getMRivalry({
          rivalry: {
            __typename: 'Rivalry',
            id: 'rivalry-2',
            userAId: 'user-a', // duplicate
            userBId: 'user-b', // duplicate
            gameId: 'game-123',
            contestCount: 5,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        }),
      ];

      (API.graphql as jest.Mock).mockResolvedValue({ data: {} });

      renderHook(() => useUserDataQuery({ rivalries: mockRivalries }), {
        wrapper,
      });

      await waitFor(() => expect(API.graphql).toHaveBeenCalled());

      const call = (API.graphql as jest.Mock).mock.calls[0][0];
      const query = call.query;

      // Should only query each user once
      expect(query.match(/user0:/g)).toHaveLength(1);
      expect(query.match(/user1:/g)).toHaveLength(1);
      expect(query.match(/user2:/g)).toBeNull();
    });
  });
});
