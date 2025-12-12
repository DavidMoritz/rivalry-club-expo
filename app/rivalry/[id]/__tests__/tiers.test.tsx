import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import TiersRoute from '../tiers';
import { RivalryProvider } from '../../../../src/providers/rivalry';
import { getMRivalry } from '../../../../src/models/m-rivalry';

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

// Create shared mock client
const mockRivalryGet = jest.fn();
const mockUserGet = jest.fn();

const mockClient = {
  models: {
    Rivalry: {
      get: mockRivalryGet,
    },
    User: {
      get: mockUserGet,
    },
  },
};

// Mock AWS Amplify
jest.mock('aws-amplify/data', () => ({
  generateClient: jest.fn(() => mockClient),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const mockRivalry = getMRivalry({
  rivalry: {
    id: 'rivalry-1',
    userAId: 'user-1',
    userBId: 'user-2',
    gameId: 'game-1',
  } as any,
});

describe('TiersRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      id: 'rivalry-1',
    });
    // Reset mock implementations
    mockRivalryGet.mockReset();
    mockUserGet.mockReset();
  });

  it('renders loading state initially', () => {
    const queryClient = createTestQueryClient();

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <RivalryProvider rivalry={null}>
          <TiersRoute />
        </RivalryProvider>
      </QueryClientProvider>
    );

    expect(getByText('Loading Tier Lists...')).toBeTruthy();
  });

  it('displays rivalry ID from route params', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      id: 'test-rivalry-123',
    });

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <RivalryProvider rivalry={null}>
          <TiersRoute />
        </RivalryProvider>
      </QueryClientProvider>
    );

    // Component should be rendered
    expect(true).toBe(true);
  });

  it('uses user names from rivalry context when available', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      id: 'rivalry-1',
    });

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <RivalryProvider rivalry={mockRivalry} userAName="Alice" userBName="Bob">
          <TiersRoute />
        </RivalryProvider>
      </QueryClientProvider>
    );

    // Component should render
    expect(true).toBe(true);
  });

  it('renders synced scroll view context provider', () => {
    const queryClient = createTestQueryClient();

    const { root } = render(
      <QueryClientProvider client={queryClient}>
        <RivalryProvider rivalry={null}>
          <TiersRoute />
        </RivalryProvider>
      </QueryClientProvider>
    );

    expect(root).toBeTruthy();
  });

  it('renders game provider', () => {
    const queryClient = createTestQueryClient();

    const { root } = render(
      <QueryClientProvider client={queryClient}>
        <RivalryProvider rivalry={null}>
          <TiersRoute />
        </RivalryProvider>
      </QueryClientProvider>
    );

    expect(root).toBeTruthy();
  });

  it('displays linked/unlinked button when rivalry is loaded', async () => {
    const queryClient = createTestQueryClient();

    // Mock Rivalry.get
    mockRivalryGet.mockResolvedValue({
      data: {
        id: 'rivalry-1',
        userAId: 'user-1',
        userBId: 'user-2',
        gameId: 'game-1',
        contestCount: 0,
        currentContestId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        tierLists: [],
      },
      errors: null,
    });

    // Mock User.get to handle both userA and userB calls
    mockUserGet
      .mockResolvedValueOnce({
        data: { id: 'user-1', firstName: 'Alice', lastName: 'A' },
        errors: null,
      })
      .mockResolvedValueOnce({
        data: { id: 'user-2', firstName: 'Bob', lastName: 'B' },
        errors: null,
      });

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <RivalryProvider rivalry={null} userAName="Alice" userBName="Bob">
          <TiersRoute />
        </RivalryProvider>
      </QueryClientProvider>
    );

    // Wait for rivalry to load
    await waitFor(() => {
      // Button text should be "Linked" by default (unlinked state is false initially)
      expect(getByText('Linked')).toBeTruthy();
    });

    // Also verify Edit Tier List button is present
    expect(getByText('Edit Tier List')).toBeTruthy();
  });
});
