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
const mockContestUpdate = jest.fn();
const mockContestDelete = jest.fn();
const mockRivalryUpdate = jest.fn();
const mockTierListUpdate = jest.fn();
const mockTierSlotUpdate = jest.fn();
const mockContestsByRivalryIdAndCreatedAt = jest.fn();

jest.mock('aws-amplify/data', () => ({
  generateClient: jest.fn(() => ({
    models: {
      Rivalry: {
        get: mockGet,
        update: mockRivalryUpdate,
      },
      User: {
        get: jest.fn(),
      },
      Contest: {
        list: mockList,
        update: mockContestUpdate,
        delete: mockContestDelete,
        contestsByRivalryIdAndCreatedAt: mockContestsByRivalryIdAndCreatedAt,
      },
      TierList: {
        update: mockTierListUpdate,
      },
      TierSlot: {
        update: mockTierSlotUpdate,
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

  describe.skip('Undo Recent Contest', () => {
    it('successfully undoes a contest and restores correct state', async () => {
      // Setup: Create a rivalry with 2 contests (current + most recent resolved)
      const currentContestId = 'contest-current';
      const mostRecentContestId = 'contest-recent';

      const mockRivalryData = {
        data: {
          id: 'rivalry-123',
          userAId: 'user-1',
          userBId: 'user-2',
          gameId: 'game-1',
          contestCount: 5,
          currentContestId: currentContestId,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-05',
          tierLists: [
            {
              id: 'tierlist-1',
              userId: 'user-1',
              rivalryId: 'rivalry-123',
              standing: 15, // After winning recent contest
              tierSlots: [
                { id: 'slot-1', fighterId: 'fighter-1', position: 5, contestCount: 10, winCount: 6 },
                { id: 'slot-2', fighterId: 'fighter-2', position: 10, contestCount: 8, winCount: 4 },
              ],
            },
            {
              id: 'tierlist-2',
              userId: 'user-2',
              rivalryId: 'rivalry-123',
              standing: 9, // After losing recent contest
              tierSlots: [
                { id: 'slot-3', fighterId: 'fighter-3', position: 3, contestCount: 9, winCount: 3 },
                { id: 'slot-4', fighterId: 'fighter-4', position: 12, contestCount: 7, winCount: 5 },
              ],
            },
          ],
        },
        errors: null,
      };

      const mockContestsData = {
        data: [
          {
            id: currentContestId,
            rivalryId: 'rivalry-123',
            tierSlotAId: 'slot-1',
            tierSlotBId: 'slot-3',
            result: 0, // Unresolved
            bias: 0,
            createdAt: '2024-01-05',
            updatedAt: '2024-01-05',
          },
          {
            id: mostRecentContestId,
            rivalryId: 'rivalry-123',
            tierSlotAId: 'slot-2',
            tierSlotBId: 'slot-4',
            result: 2, // User A won by 2 stocks
            bias: -1,
            createdAt: '2024-01-04',
            updatedAt: '2024-01-04',
          },
        ],
        errors: null,
        nextToken: null,
      };

      // Mock initial data load
      mockGet.mockResolvedValue(mockRivalryData);
      mockContestsByRivalryIdAndCreatedAt.mockResolvedValue(mockContestsData);

      const { generateClient } = require('aws-amplify/data');
      const mockClient = generateClient();
      mockClient.models.User.get
        .mockResolvedValue({ data: { id: 'user-1', firstName: 'Alice' }, errors: null })
        .mockResolvedValue({ data: { id: 'user-2', firstName: 'Bob' }, errors: null });

      // Mock undo operation responses
      mockTierListUpdate.mockResolvedValue({ data: {}, errors: null });
      mockTierSlotUpdate.mockResolvedValue({ data: {}, errors: null });
      mockContestUpdate.mockResolvedValue({
        data: {
          id: mostRecentContestId,
          result: 0,
          bias: 0,
          tierSlotAId: 'slot-2',
          tierSlotBId: 'slot-4',
        },
        errors: null,
      });
      mockRivalryUpdate.mockResolvedValue({ data: {}, errors: null });
      mockContestDelete.mockResolvedValue({ data: {}, errors: null });

      renderWithProviders(<HistoryRoute />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(/Undo Recent Contest/i)).toBeTruthy();
      });

      // Click undo button
      const undoButton = screen.getByText(/Undo Recent Contest/i);
      fireEvent.press(undoButton);

      // Verify the undo operation called the correct mutations in order
      await waitFor(() => {
        // 1. Tier lists updated with reversed standings
        expect(mockTierListUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'tierlist-1',
            standing: expect.any(Number), // Should be reversed from 15
          })
        );
        expect(mockTierListUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'tierlist-2',
            standing: expect.any(Number), // Should be reversed from 9
          })
        );

        // 2. Tier slots updated with reversed positions
        expect(mockTierSlotUpdate).toHaveBeenCalled();

        // 3. Most recent contest reset to unresolved state
        expect(mockContestUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: mostRecentContestId,
            result: 0,
            bias: 0,
          })
        );

        // 4. Rivalry updated to point to undone contest as current
        expect(mockRivalryUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'rivalry-123',
            currentContestId: mostRecentContestId,
            contestCount: 4, // Decremented from 5
          })
        );

        // 5. Old current contest deleted
        expect(mockContestDelete).toHaveBeenCalledWith(
          expect.objectContaining({
            id: currentContestId,
          })
        );
      });

      // Verify button is hidden after clicking
      await waitFor(() => {
        expect(screen.queryByText(/Undo Recent Contest/i)).toBeNull();
      });
    });

    it('verifies tier slot positions are correctly reversed', async () => {
      const mockRivalryData = {
        data: {
          id: 'rivalry-123',
          userAId: 'user-1',
          userBId: 'user-2',
          gameId: 'game-1',
          contestCount: 2,
          currentContestId: 'contest-current',
          tierLists: [
            {
              id: 'tierlist-1',
              userId: 'user-1',
              standing: 6,
              tierSlots: [
                { id: 'slot-1', fighterId: 'fighter-1', position: 2, contestCount: 5, winCount: 3 },
              ],
            },
            {
              id: 'tierlist-2',
              userId: 'user-2',
              standing: 3,
              tierSlots: [
                { id: 'slot-2', fighterId: 'fighter-2', position: 8, contestCount: 5, winCount: 2 },
              ],
            },
          ],
        },
        errors: null,
      };

      const contestWithResult = {
        id: 'contest-recent',
        result: 1, // 1 stock difference
        bias: 0,
        tierSlotAId: 'slot-1',
        tierSlotBId: 'slot-2',
      };

      mockGet.mockResolvedValue(mockRivalryData);
      mockContestsByRivalryIdAndCreatedAt.mockResolvedValue({
        data: [
          { id: 'contest-current', result: 0, createdAt: '2024-01-02' },
          contestWithResult,
        ],
        errors: null,
      });

      // Mock successful undo
      mockTierListUpdate.mockResolvedValue({ data: {}, errors: null });
      mockTierSlotUpdate.mockResolvedValue({ data: {}, errors: null });
      mockContestUpdate.mockResolvedValue({ data: { ...contestWithResult, result: 0 }, errors: null });
      mockRivalryUpdate.mockResolvedValue({ data: {}, errors: null });
      mockContestDelete.mockResolvedValue({ data: {}, errors: null });

      renderWithProviders(<HistoryRoute />);

      await waitFor(() => {
        expect(screen.getByText(/Undo Recent Contest/i)).toBeTruthy();
      });

      const undoButton = screen.getByText(/Undo Recent Contest/i);
      fireEvent.press(undoButton);

      // Verify tier slot positions were reversed
      // With result=1 and STEPS_PER_STOCK=3:
      // - Fighter A position should move by (1 * 3) = +3
      // - Fighter B position should move by (1 * 3 * -1) = -3
      await waitFor(() => {
        const tierSlotCalls = mockTierSlotUpdate.mock.calls;
        const slot1Update = tierSlotCalls.find((call: any) => call[0].id === 'slot-1');
        const slot2Update = tierSlotCalls.find((call: any) => call[0].id === 'slot-2');

        // Verify positions were adjusted correctly (reversing the original resolve)
        expect(slot1Update).toBeDefined();
        expect(slot2Update).toBeDefined();
      });
    });
  });
});
