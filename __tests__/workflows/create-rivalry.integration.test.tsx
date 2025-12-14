import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import { CreateRivalry } from '../../src/components/screens/CreateRivalry';
import {
  useAcceptRivalryMutation,
  useCreateNpcRivalryMutation,
  useCreateRivalryMutation,
} from '../../src/controllers/c-rivalry';
import { useUserSearchQuery } from '../../src/controllers/c-user';

// Regex patterns for test queries (must be at top level per Biome rules)
const SEARCH_PLACEHOLDER_REGEX = /Type 'npc' or search by name/;
const ERROR_MESSAGE_REGEX = /Error:.*Failed to create rivalry/;

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));
jest.mock('../../src/hooks/useAuthUser');
jest.mock('../../src/providers/game');
jest.mock('../../src/providers/all-rivalries', () => ({
  useAllRivalries: jest.fn(() => ({ rivalries: [] })),
  useAllRivalriesUpdate: jest.fn(() => ({
    addRivalry: jest.fn(),
    updateRivalry: jest.fn(),
  })),
}));
jest.mock('../../src/controllers/c-user');
jest.mock('../../src/controllers/c-rivalry');

const mockUseRouter = require('expo-router').useRouter as jest.Mock;
const mockUseLocalSearchParams = require('expo-router')
  .useLocalSearchParams as jest.Mock;
const mockUseAuthUser = require('../../src/hooks/useAuthUser')
  .useAuthUser as jest.Mock;
const mockUseGame = require('../../src/providers/game').useGame as jest.Mock;

interface MockRouter {
  back: jest.Mock;
  push: jest.Mock;
}

describe('Create Rivalry Integration Test', () => {
  let queryClient: QueryClient;
  let mockRouter: MockRouter;
  let mockCreateRivalryMutate: jest.Mock;
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
      deletedAt: null,
      fullName: 'Jane Smith',
      displayName: jest.fn().mockReturnValue('Jane'),
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockRouter = { back: jest.fn(), push: jest.fn() };
    mockUseRouter.mockReturnValue(mockRouter);
    mockUseLocalSearchParams.mockReturnValue({});

    mockUseAuthUser.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
      },
      isLoading: false,
      error: null,
    });

    mockUseGame.mockReturnValue({
      id: 'game-1',
      name: 'Super Smash Bros. Ultimate',
    });

    // Mock user search to respond to searchText - return users when searchText includes 'jane'
    (useUserSearchQuery as jest.Mock).mockImplementation(({ searchText }) => ({
      data: searchText?.toLowerCase().includes('jane') ? mockUsers : [],
      isLoading: false,
    }));

    // Mock rivalry creation mutation
    mockCreateRivalryMutate = jest.fn();
    (useCreateRivalryMutation as jest.Mock).mockReturnValue({
      mutate: mockCreateRivalryMutate,
      isLoading: false,
      isSuccess: false,
      error: null,
    });

    // Mock accept rivalry mutation
    (useAcceptRivalryMutation as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isLoading: false,
      isSuccess: false,
      error: null,
    });

    // Mock NPC rivalry mutation
    (useCreateNpcRivalryMutation as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isLoading: false,
      isSuccess: false,
      error: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should complete the full rivalry creation workflow', async () => {
    const { getByPlaceholderText, rerender } = render(
      <QueryClientProvider client={queryClient}>
        <CreateRivalry />
      </QueryClientProvider>
    );

    // Enter search text
    const searchInput = getByPlaceholderText(SEARCH_PLACEHOLDER_REGEX);
    fireEvent.changeText(searchInput, 'jane');

    // Force a rerender to apply the mock with new searchText
    rerender(
      <QueryClientProvider client={queryClient}>
        <CreateRivalry />
      </QueryClientProvider>
    );

    // Wait for user to appear in results
    const userItem = await screen.findByText(
      'Jane Smith',
      {},
      { timeout: 3000 }
    );

    // Select user from results
    fireEvent.press(userItem);

    // Wait for and click the "Send Rivalry Request" button
    const createButton = await screen.findByText('Send Rivalry Request');

    // Setup mutation to call onSuccess callback
    mockCreateRivalryMutate.mockImplementation(params => {
      const { onSuccess } =
        (useCreateRivalryMutation as jest.Mock).mock.calls[0][0] || {};
      if (onSuccess) {
        onSuccess({ id: 'rivalry-1', ...params });
      }
    });

    fireEvent.press(createButton);

    // Verify rivalry creation was called with correct params
    await waitFor(() => {
      expect(mockCreateRivalryMutate).toHaveBeenCalledWith({
        userAId: 'user-1',
        userBId: 'user-2',
        gameId: 'game-1',
      });
    });

    // Verify navigation back after success
    await waitFor(() => {
      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  it('should display error when rivalry creation fails', async () => {
    // Setup mutation to call onError callback
    (useCreateRivalryMutation as jest.Mock).mockReturnValue({
      mutate: () => {
        const { onError } =
          (useCreateRivalryMutation as jest.Mock).mock.calls[0][0] || {};
        if (onError) {
          onError(new Error('Failed to create rivalry'));
        }
      },
      isLoading: false,
      isSuccess: false,
      error: null,
    });

    const { getByPlaceholderText } = render(
      <QueryClientProvider client={queryClient}>
        <CreateRivalry />
      </QueryClientProvider>
    );

    // Enter search - mock will return users when 'jane' is in search
    const searchInput = getByPlaceholderText(SEARCH_PLACEHOLDER_REGEX);
    fireEvent.changeText(searchInput, 'jane');

    // Wait for user to appear
    const userItem = await screen.findByText('Jane Smith');
    fireEvent.press(userItem);

    // Attempt to create rivalry
    const createButton = await screen.findByText('Send Rivalry Request');
    fireEvent.press(createButton);

    // Verify error message is displayed
    const errorMessage = await screen.findByText(ERROR_MESSAGE_REGEX);
    expect(errorMessage).toBeTruthy();

    // Router back should NOT be called on error
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it('should not allow creation without selecting a user', () => {
    const { queryByText } = render(
      <QueryClientProvider client={queryClient}>
        <CreateRivalry />
      </QueryClientProvider>
    );

    // Initiate Rivalry button should not be visible without a selected user
    expect(queryByText('Initiate Rivalry')).toBeNull();
  });
});
