import { renderHook } from '@testing-library/react-native';
import React from 'react';

// Create mock functions BEFORE jest.mock and controller imports
export const mockUserList = jest.fn();
export const mockUserGet = jest.fn();
export const mockRivalryList = jest.fn();

// Create mock client that will be returned by generateClient
const mockClient = {
  models: {
    User: {
      list: mockUserList,
      get: mockUserGet,
    },
    Rivalry: {
      list: mockRivalryList,
    },
  },
};

// Mock the aws-amplify/data module
jest.mock('aws-amplify/data', () => ({
  generateClient: jest.fn(() => mockClient),
}));

import {
  useUserDataQuery,
  useUserWithRivalriesByAwsSubQuery,
} from '../../src/controllers/c-user';
import { getMRivalry } from '../../src/models/m-rivalry';
import type { TestRivalry } from '../test-helpers';
import {
  createGraphQLResponse,
  createTestQueryWrapper,
  TEST_TIMEOUTS,
  waitForQuerySuccess,
} from '../test-utils';

describe('c-user Controller', () => {
  let wrapper: any;
  let queryClient: any;

  beforeEach(() => {
    const testWrapper = createTestQueryWrapper();
    wrapper = testWrapper.wrapper;
    queryClient = testWrapper.queryClient;
    jest.clearAllMocks();
  });

  describe('useUserWithRivalriesByAwsSubQuery', () => {
    it('should fetch user data by AWS sub', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        awsSub: 'aws-sub-123',
        role: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      const mockRivalriesA = [
        {
          id: 'rivalry-1',
          userAId: 'user-123',
          userBId: 'user-456',
          gameId: 'game-1',
          contestCount: 5,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ];

      const mockRivalriesB = [
        {
          id: 'rivalry-2',
          userAId: 'user-789',
          userBId: 'user-123',
          gameId: 'game-1',
          contestCount: 3,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ];

      mockUserList.mockResolvedValue(createGraphQLResponse([mockUser]));

      mockRivalryList
        .mockResolvedValueOnce(createGraphQLResponse(mockRivalriesA))
        .mockResolvedValueOnce(createGraphQLResponse(mockRivalriesB));

      const { result } = renderHook(
        () =>
          useUserWithRivalriesByAwsSubQuery({
            amplifyUser: { username: 'aws-sub-123' },
          }),
        { wrapper }
      );

      await waitForQuerySuccess(result, { timeout: TEST_TIMEOUTS.QUERY });

      expect(mockUserList).toHaveBeenCalled();
      expect(mockRivalryList).toHaveBeenCalledTimes(2);
      expect(result.current.data).toEqual({
        user: mockUser,
        rivalriesA: mockRivalriesA,
        rivalriesB: mockRivalriesB,
      });
    });

    it('should return early if username is not provided', async () => {
      const { result } = renderHook(
        () =>
          useUserWithRivalriesByAwsSubQuery({
            amplifyUser: {},
          }),
        { wrapper }
      );

      await waitForQuerySuccess(result);

      expect(result.current.data).toBeNull();
      expect(mockUserList).not.toHaveBeenCalled();
    });
  });

  describe('useUserDataQuery', () => {
    it('should fetch multiple users from rivalries', async () => {
      const mockRivalries = [
        getMRivalry({
          rivalry: {
            id: 'rivalry-1',
            userAId: 'user-a',
            userBId: 'user-b',
            gameId: 'game-123',
            contestCount: 10,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          } as TestRivalry,
        }),
        getMRivalry({
          rivalry: {
            id: 'rivalry-2',
            userAId: 'user-a',
            userBId: 'user-c',
            gameId: 'game-123',
            contestCount: 5,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          } as TestRivalry,
        }),
      ];

      const mockUsers = [
        {
          id: 'user-a',
          firstName: 'Alice',
          lastName: 'Anderson',
          email: 'alice@test.com',
          role: 1,
          awsSub: 'aws-a',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        {
          id: 'user-b',
          firstName: 'Bob',
          lastName: 'Brown',
          email: 'bob@test.com',
          role: 1,
          awsSub: 'aws-b',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        {
          id: 'user-c',
          firstName: 'Charlie',
          lastName: 'Chen',
          email: 'charlie@test.com',
          role: 1,
          awsSub: 'aws-c',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ];

      mockUserGet
        .mockResolvedValueOnce(createGraphQLResponse(mockUsers[0]))
        .mockResolvedValueOnce(createGraphQLResponse(mockUsers[1]))
        .mockResolvedValueOnce(createGraphQLResponse(mockUsers[2]));

      const { result } = renderHook(
        () => useUserDataQuery({ rivalries: mockRivalries }),
        {
          wrapper,
        }
      );

      await waitForQuerySuccess(result);

      expect(mockUserGet).toHaveBeenCalledTimes(3);
      expect(result.current.data).toEqual(mockUsers);
    });

    it('should return early if no rivalries provided', async () => {
      const { result } = renderHook(() => useUserDataQuery({ rivalries: [] }), {
        wrapper,
      });

      await waitForQuerySuccess(result);

      expect(result.current.data).toBeNull();
      expect(mockUserGet).not.toHaveBeenCalled();
    });

    it('should handle duplicate user IDs correctly', async () => {
      const mockRivalries = [
        getMRivalry({
          rivalry: {
            id: 'rivalry-1',
            userAId: 'user-a',
            userBId: 'user-b',
            gameId: 'game-123',
            contestCount: 10,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          } as TestRivalry,
        }),
        getMRivalry({
          rivalry: {
            id: 'rivalry-2',
            userAId: 'user-a', // duplicate
            userBId: 'user-b', // duplicate
            gameId: 'game-123',
            contestCount: 5,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          } as TestRivalry,
        }),
      ];

      const mockUserA = {
        id: 'user-a',
        firstName: 'Alice',
        lastName: 'Anderson',
        email: 'alice@test.com',
        role: 1,
        awsSub: 'aws-a',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      const mockUserB = {
        id: 'user-b',
        firstName: 'Bob',
        lastName: 'Brown',
        email: 'bob@test.com',
        role: 1,
        awsSub: 'aws-b',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      mockUserGet
        .mockResolvedValueOnce(createGraphQLResponse(mockUserA))
        .mockResolvedValueOnce(createGraphQLResponse(mockUserB));

      const { result } = renderHook(
        () => useUserDataQuery({ rivalries: mockRivalries }),
        {
          wrapper,
        }
      );

      await waitForQuerySuccess(result);

      // Should only fetch each unique user once
      expect(mockUserGet).toHaveBeenCalledTimes(2);
      expect(mockUserGet).toHaveBeenCalledWith(
        { id: 'user-a' },
        expect.any(Object)
      );
      expect(mockUserGet).toHaveBeenCalledWith(
        { id: 'user-b' },
        expect.any(Object)
      );
    });
  });
});
