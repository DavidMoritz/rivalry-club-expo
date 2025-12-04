import { render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import HistoryRoute from '../history';

// Mock expo-router
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(() => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    navigate: jest.fn(),
    canGoBack: jest.fn(() => true),
  })),
  Stack: {
    Screen: ({ children }: any) => children,
  },
}));

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// Mock AWS Amplify
const mockGet = jest.fn();
const mockList = jest.fn();
jest.mock('aws-amplify/data', () => ({
  generateClient: jest.fn(() => ({
    models: {
      Rivalry: {
        get: mockGet,
      },
      User: {
        get: jest.fn(),
      },
      Contest: {
        list: mockList,
      },
    },
  })),
}));

// Mock game query cache
jest.mock('../../../../assets/cache/game-query.json', () => ({
  data: {
    listGames: {
      items: [
        {
          id: 'game-1',
          name: 'Super Smash Bros. Ultimate',
          fighters: {
            items: [
              {
                id: 'fighter-1',
                name: 'Mario',
                gamePosition: 1,
              },
              {
                id: 'fighter-2',
                name: 'Link',
                gamePosition: 2,
              },
            ],
          },
        },
      ],
    },
  },
}));

describe('HistoryRoute', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'rivalry-123' });
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
    );
  };

  it('renders loading state initially', () => {
    mockGet.mockReturnValue(
      new Promise(() => {}) // Never resolves
    );

    renderWithProviders(<HistoryRoute />);

    expect(screen.getByText(/loading rivalry data/i)).toBeTruthy();
  });

  it.skip('loads rivalry data and displays contest history', async () => {
    const mockRivalryData = {
      data: {
        id: 'rivalry-123',
        userAId: 'user-1',
        userBId: 'user-2',
        gameId: 'game-1',
        contestCount: 2,
        currentContestId: 'contest-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
        tierLists: [
          {
            id: 'tierlist-1',
            userId: 'user-1',
            rivalryId: 'rivalry-123',
            standing: 0,
            tierSlots: [
              {
                id: 'slot-1',
                fighterId: 'fighter-1',
                position: 0,
              },
            ],
          },
          {
            id: 'tierlist-2',
            userId: 'user-2',
            rivalryId: 'rivalry-123',
            standing: 0,
            tierSlots: [
              {
                id: 'slot-2',
                fighterId: 'fighter-2',
                position: 0,
              },
            ],
          },
        ],
      },
      errors: null,
    };

    const mockUserAData = {
      data: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
      errors: null,
    };

    const mockUserBData = {
      data: {
        id: 'user-2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
      },
      errors: null,
    };

    const mockContestData = {
      data: [
        {
          id: 'contest-1',
          rivalryId: 'rivalry-123',
          tierSlotAId: 'slot-1',
          tierSlotBId: 'slot-2',
          result: 3,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        {
          id: 'contest-2',
          rivalryId: 'rivalry-123',
          tierSlotAId: 'slot-1',
          tierSlotBId: 'slot-2',
          result: -2,
          createdAt: '2024-01-02',
          updatedAt: '2024-01-02',
        },
      ],
      errors: null,
      nextToken: null,
    };

    // Mock the Rivalry.get call
    mockGet.mockResolvedValueOnce(mockRivalryData);

    // Mock User.get calls
    const { generateClient } = require('aws-amplify/data');
    const mockClient = generateClient();
    mockClient.models.User.get
      .mockResolvedValueOnce(mockUserAData)
      .mockResolvedValueOnce(mockUserBData);

    // Mock Contest.list call
    mockList.mockResolvedValueOnce(mockContestData);

    renderWithProviders(<HistoryRoute />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John')).toBeTruthy();
    });

    // Check that user names are displayed
    expect(screen.getByText('John')).toBeTruthy();
    expect(screen.getByText('Jane')).toBeTruthy();

    // Check that score is displayed
    expect(screen.getByText('3 - 0')).toBeTruthy();
    expect(screen.getByText('0 - 2')).toBeTruthy();
  });

  it.skip('displays error state when rivalry loading fails', async () => {
    mockGet.mockResolvedValueOnce({
      data: null,
      errors: [{ message: 'Rivalry not found' }],
    });

    renderWithProviders(<HistoryRoute />);

    await waitFor(() => {
      expect(screen.getByText(/error loading data/i)).toBeTruthy();
    });

    expect(screen.getByText(/rivalry not found/i)).toBeTruthy();
  });

  it.skip('displays empty state when no contests exist', async () => {
    const mockRivalryData = {
      data: {
        id: 'rivalry-123',
        userAId: 'user-1',
        userBId: 'user-2',
        gameId: 'game-1',
        contestCount: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
        tierLists: [
          {
            id: 'tierlist-1',
            userId: 'user-1',
            rivalryId: 'rivalry-123',
            standing: 0,
            tierSlots: [],
          },
          {
            id: 'tierlist-2',
            userId: 'user-2',
            rivalryId: 'rivalry-123',
            standing: 0,
            tierSlots: [],
          },
        ],
      },
      errors: null,
    };

    const mockUserData = {
      data: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
      errors: null,
    };

    mockGet.mockResolvedValueOnce(mockRivalryData);

    const { generateClient } = require('aws-amplify/data');
    const mockClient = generateClient();
    mockClient.models.User.get
      .mockResolvedValueOnce(mockUserData)
      .mockResolvedValueOnce(mockUserData);

    mockList.mockResolvedValueOnce({
      data: [],
      errors: null,
      nextToken: null,
    });

    renderWithProviders(<HistoryRoute />);

    await waitFor(() => {
      expect(screen.getByText(/no contests yet/i)).toBeTruthy();
    });
  });

  it.skip('handles pagination correctly', async () => {
    const mockRivalryData = {
      data: {
        id: 'rivalry-123',
        userAId: 'user-1',
        userBId: 'user-2',
        gameId: 'game-1',
        contestCount: 150,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
        tierLists: [
          {
            id: 'tierlist-1',
            userId: 'user-1',
            rivalryId: 'rivalry-123',
            standing: 0,
            tierSlots: [
              {
                id: 'slot-1',
                fighterId: 'fighter-1',
                position: 0,
              },
            ],
          },
          {
            id: 'tierlist-2',
            userId: 'user-2',
            rivalryId: 'rivalry-123',
            standing: 0,
            tierSlots: [
              {
                id: 'slot-2',
                fighterId: 'fighter-2',
                position: 0,
              },
            ],
          },
        ],
      },
      errors: null,
    };

    const mockUserData = {
      data: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
      errors: null,
    };

    mockGet.mockResolvedValueOnce(mockRivalryData);

    const { generateClient } = require('aws-amplify/data');
    const mockClient = generateClient();
    mockClient.models.User.get
      .mockResolvedValueOnce(mockUserData)
      .mockResolvedValueOnce(mockUserData);

    // First page of contests
    const firstPageContests = Array.from({ length: 100 }, (_, i) => ({
      id: `contest-${i}`,
      rivalryId: 'rivalry-123',
      tierSlotAId: 'slot-1',
      tierSlotBId: 'slot-2',
      result: 1,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    }));

    mockList.mockResolvedValueOnce({
      data: firstPageContests,
      errors: null,
      nextToken: 'page-2-token',
    });

    renderWithProviders(<HistoryRoute />);

    await waitFor(() => {
      expect(screen.getByText('John')).toBeTruthy();
    });

    // Verify first page loaded
    expect(mockList).toHaveBeenCalledWith({
      filter: { rivalryId: { eq: 'rivalry-123' } },
      limit: 100,
    });
  });
});
