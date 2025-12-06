import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/data';
import React from 'react';

import { CreateRivalry } from '../../src/components/screens/CreateRivalry';

// Mock dependencies
jest.mock('aws-amplify/data');
jest.mock('expo-router');
jest.mock('../../src/hooks/useAuthUser');
jest.mock('../../src/providers/game');

const mockGenerateClient = generateClient as jest.MockedFunction<typeof generateClient>;
const mockUseRouter = require('expo-router').useRouter as jest.Mock;
const mockUseAuthUser = require('../../src/hooks/useAuthUser').useAuthUser as jest.Mock;
const mockUseGame = require('../../src/providers/game').useGame as jest.Mock;

describe.skip('Create Rivalry Integration Test', () => {
  let queryClient: QueryClient;
  let mockRouter: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    mockRouter = { back: jest.fn(), push: jest.fn() };
    mockUseRouter.mockReturnValue(mockRouter);

    mockUseAuthUser.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe'
      },
      isLoading: false,
      error: null
    });

    mockUseGame.mockReturnValue({
      id: 'game-1',
      name: 'Super Smash Bros. Ultimate'
    });

    jest.clearAllMocks();
  });

  it('should complete the full rivalry creation workflow', async () => {
    const mockUsers = [
      {
        id: 'user-2',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 0,
        awsSub: 'aws-2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null
      }
    ];

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
      { id: 'fighter-1', name: 'Mario', gameId: 'game-1' },
      { id: 'fighter-2', name: 'Link', gameId: 'game-1' }
    ];

    const mockClient = {
      models: {
        User: {
          list: jest.fn().mockResolvedValue({ data: mockUsers, errors: null })
        },
        Rivalry: {
          create: jest.fn().mockResolvedValue({ data: mockRivalry, errors: null })
        },
        Fighter: {
          list: jest.fn().mockResolvedValue({ data: mockFighters, errors: null })
        },
        TierList: {
          create: jest.fn().mockResolvedValue({ data: { id: 'tierlist-1' }, errors: null })
        },
        TierSlot: {
          create: jest.fn().mockResolvedValue({ data: {}, errors: null })
        }
      }
    };

    mockGenerateClient.mockReturnValue(mockClient as any);

    const { getByPlaceholderText, getByText } = render(
      <QueryClientProvider client={queryClient}>
        <CreateRivalry />
      </QueryClientProvider>
    );

    // Step 1: Enter search text
    const searchInput = getByPlaceholderText('Search by name or email...');
    fireEvent.changeText(searchInput, 'jane');

    // Step 2: Wait for search results
    await waitFor(() => {
      expect(mockClient.models.User.list).toHaveBeenCalled();
    });

    // Step 3: Select user from results
    const userItem = await waitFor(() => getByText('Jane Smith'));
    fireEvent.press(userItem);

    // Step 4: Click "Initiate Rivalry" button
    const createButton = await waitFor(() => getByText('Initiate Rivalry'));
    fireEvent.press(createButton);

    // Step 5: Verify rivalry creation
    await waitFor(() => {
      expect(mockClient.models.Rivalry.create).toHaveBeenCalledWith({
        userAId: 'user-1',
        userBId: 'user-2',
        gameId: 'game-1',
        contestCount: 0,
        accepted: false
      });
    });

    // Step 6: Verify tier lists creation
    await waitFor(() => {
      expect(mockClient.models.TierList.create).toHaveBeenCalledTimes(2);
    });

    // Step 7: Verify tier slots creation (2 fighters × 2 users = 4 slots)
    await waitFor(() => {
      expect(mockClient.models.TierSlot.create).toHaveBeenCalledTimes(4);
    });

    // Step 8: Verify navigation back
    await waitFor(() => {
      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  it('should display error when rivalry creation fails', async () => {
    const mockUsers = [
      {
        id: 'user-2',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 0,
        awsSub: 'aws-2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null
      }
    ];

    const mockClient = {
      models: {
        User: {
          list: jest.fn().mockResolvedValue({ data: mockUsers, errors: null })
        },
        Rivalry: {
          create: jest.fn().mockResolvedValue({
            data: null,
            errors: [{ message: 'Database error' }]
          })
        }
      }
    };

    mockGenerateClient.mockReturnValue(mockClient as any);

    const { getByPlaceholderText, getByText, findByText } = render(
      <QueryClientProvider client={queryClient}>
        <CreateRivalry />
      </QueryClientProvider>
    );

    // Enter search and select user
    const searchInput = getByPlaceholderText('Search by name or email...');
    fireEvent.changeText(searchInput, 'jane');

    const userItem = await waitFor(() => getByText('Jane Smith'));
    fireEvent.press(userItem);

    // Attempt to create rivalry
    const createButton = await waitFor(() => getByText('Initiate Rivalry'));
    fireEvent.press(createButton);

    // Verify error is displayed
    const errorMessage = await findByText(/Error:/);
    expect(errorMessage).toBeTruthy();
  });

  it('should not allow creation without selecting a user', async () => {
    const { queryByText } = render(
      <QueryClientProvider client={queryClient}>
        <CreateRivalry />
      </QueryClientProvider>
    );

    // Initiate Rivalry button should not be visible without a selected user
    expect(queryByText('Initiate Rivalry')).toBeNull();
  });
});
