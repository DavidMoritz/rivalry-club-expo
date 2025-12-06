import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { RivalryIndex } from '../RivalryIndex';

// Mock the hooks
const mockUseAuthUser = jest.fn();
const mockUseUserRivalries = jest.fn();
const mockRouterPush = jest.fn();

jest.mock('../../../hooks/useAuthUser', () => ({
  useAuthUser: () => mockUseAuthUser()
}));

jest.mock('../../../hooks/useUserRivalries', () => ({
  useUserRivalries: (userId: string | undefined) => mockUseUserRivalries(userId)
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush
  })
}));

describe.skip('RivalryIndex', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn(); // Suppress console.log in tests
  });

  describe('Loading States', () => {
    it('shows loading state when user is loading', () => {
      mockUseAuthUser.mockReturnValue({
        user: null,
        isLoading: true,
        error: null
      });
      mockUseUserRivalries.mockReturnValue({
        rivalries: [],
        isLoading: false,
        error: null,
        refetch: jest.fn()
      });

      const { getByText } = render(<RivalryIndex />);

      expect(getByText('Loading user data...')).toBeTruthy();
    });

    it('shows loading state when rivalries are loading', () => {
      mockUseAuthUser.mockReturnValue({
        user: { id: 'user1', email: 'test@test.com', firstName: 'Test' },
        isLoading: false,
        error: null
      });
      mockUseUserRivalries.mockReturnValue({
        rivalries: [],
        isLoading: true,
        error: null,
        refetch: jest.fn()
      });

      const { getByText } = render(<RivalryIndex />);

      expect(getByText('Loading rivalries...')).toBeTruthy();
    });
  });

  describe('Error States', () => {
    it('shows error when user fetch fails', () => {
      mockUseAuthUser.mockReturnValue({
        user: null,
        isLoading: false,
        error: new Error('Failed to fetch user')
      });
      mockUseUserRivalries.mockReturnValue({
        rivalries: [],
        isLoading: false,
        error: null,
        refetch: jest.fn()
      });

      const { getByText } = render(<RivalryIndex />);

      expect(getByText('Error')).toBeTruthy();
      expect(getByText('Failed to fetch user')).toBeTruthy();
    });

    it('shows error when rivalries fetch fails', () => {
      mockUseAuthUser.mockReturnValue({
        user: { id: 'user1', email: 'test@test.com', firstName: 'Test' },
        isLoading: false,
        error: null
      });
      mockUseUserRivalries.mockReturnValue({
        rivalries: [],
        isLoading: false,
        error: new Error('Failed to fetch rivalries'),
        refetch: jest.fn()
      });

      const { getByText } = render(<RivalryIndex />);

      expect(getByText('Error')).toBeTruthy();
      expect(getByText('Failed to fetch rivalries')).toBeTruthy();
    });
  });

  describe('Welcome Message', () => {
    it('shows welcome message with user first name', () => {
      mockUseAuthUser.mockReturnValue({
        user: { id: 'user1', email: 'test@test.com', firstName: 'Tess' },
        isLoading: false,
        error: null
      });
      mockUseUserRivalries.mockReturnValue({
        rivalries: [],
        isLoading: false,
        error: null,
        refetch: jest.fn()
      });

      const { getByText } = render(<RivalryIndex />);

      expect(getByText('Welcome, Tess!')).toBeTruthy();
    });

    it('shows welcome message without name when firstName is missing', () => {
      mockUseAuthUser.mockReturnValue({
        user: { id: 'user1', email: 'test@test.com' },
        isLoading: false,
        error: null
      });
      mockUseUserRivalries.mockReturnValue({
        rivalries: [],
        isLoading: false,
        error: null,
        refetch: jest.fn()
      });

      const { getByText } = render(<RivalryIndex />);

      expect(getByText('Welcome!')).toBeTruthy();
    });
  });

  describe('Create Rivalry Button', () => {
    it('renders create rivalry button', () => {
      mockUseAuthUser.mockReturnValue({
        user: { id: 'user1', email: 'test@test.com', firstName: 'Test' },
        isLoading: false,
        error: null
      });
      mockUseUserRivalries.mockReturnValue({
        rivalries: [],
        isLoading: false,
        error: null,
        refetch: jest.fn()
      });

      const { getByTestId, getByText } = render(<RivalryIndex />);

      expect(getByTestId('create-rivalry-button')).toBeTruthy();
      expect(getByText('Create New Rivalry')).toBeTruthy();
    });

    it('calls handleCreateRivalry when button is pressed', () => {
      mockUseAuthUser.mockReturnValue({
        user: { id: 'user1', email: 'test@test.com', firstName: 'Test' },
        isLoading: false,
        error: null
      });
      mockUseUserRivalries.mockReturnValue({
        rivalries: [],
        isLoading: false,
        error: null,
        refetch: jest.fn()
      });

      const { getByTestId } = render(<RivalryIndex />);

      const createButton = getByTestId('create-rivalry-button');
      fireEvent.press(createButton);

      expect(mockRouterPush).toHaveBeenCalledWith('/rivalry/create');
    });
  });

  describe('Rivalries List', () => {
    it('shows empty state when no rivalries exist', () => {
      mockUseAuthUser.mockReturnValue({
        user: { id: 'user1', email: 'test@test.com', firstName: 'Test' },
        isLoading: false,
        error: null
      });
      mockUseUserRivalries.mockReturnValue({
        rivalries: [],
        isLoading: false,
        error: null,
        refetch: jest.fn()
      });

      const { getByText } = render(<RivalryIndex />);

      expect(
        getByText('No rivalries found. Create your first rivalry to get started!')
      ).toBeTruthy();
    });

    it('renders list of rivalries when they exist', () => {
      mockUseAuthUser.mockReturnValue({
        user: { id: 'user1', email: 'test@test.com', firstName: 'Test' },
        isLoading: false,
        error: null
      });
      mockUseUserRivalries.mockReturnValue({
        rivalries: [
          {
            id: 'rivalry1',
            userAId: 'user1',
            userBId: 'user2',
            gameId: 'game1',
            userAName: 'Alice',
            userBName: 'Bob',
            contestCount: 5,
            updatedAt: new Date().toISOString()
          },
          {
            id: 'rivalry2',
            userAId: 'user1',
            userBId: 'user3',
            gameId: 'game1',
            userAName: 'Alice',
            userBName: 'Charlie',
            contestCount: 3,
            updatedAt: new Date().toISOString()
          }
        ],
        isLoading: false,
        error: null,
        refetch: jest.fn()
      });

      const { getByText } = render(<RivalryIndex />);

      expect(getByText('Alice vs. Bob')).toBeTruthy();
      expect(getByText('Alice vs. Charlie')).toBeTruthy();
    });

    it.skip('calls handleSelectRivalry when rivalry is pressed', async () => {
      mockUseAuthUser.mockReturnValue({
        user: { id: 'user1', email: 'test@test.com', firstName: 'Test' },
        isLoading: false,
        error: null
      });
      mockUseUserRivalries.mockReturnValue({
        rivalries: [
          {
            id: 'rivalry1',
            userAId: 'user1',
            userBId: 'user2',
            gameId: 'game1',
            userAName: 'Alice',
            userBName: 'Bob',
            contestCount: 5,
            updatedAt: new Date().toISOString()
          }
        ],
        isLoading: false,
        error: null,
        refetch: jest.fn()
      });

      const { getByText } = render(<RivalryIndex />);

      const rivalryRow = getByText('Alice vs. Bob');
      fireEvent.press(rivalryRow.parent?.parent || rivalryRow);

      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith('/rivalry/rivalry1');
      });
    });
  });

  describe('Hook Integration', () => {
    it('passes user ID to useUserRivalries hook', () => {
      const userId = 'user123';

      mockUseAuthUser.mockReturnValue({
        user: { id: userId, email: 'test@test.com', firstName: 'Test' },
        isLoading: false,
        error: null
      });
      mockUseUserRivalries.mockReturnValue({
        rivalries: [],
        isLoading: false,
        error: null,
        refetch: jest.fn()
      });

      render(<RivalryIndex />);

      expect(mockUseUserRivalries).toHaveBeenCalledWith(userId);
    });

    it('passes undefined to useUserRivalries when user is not loaded', () => {
      mockUseAuthUser.mockReturnValue({
        user: null,
        isLoading: true,
        error: null
      });
      mockUseUserRivalries.mockReturnValue({
        rivalries: [],
        isLoading: false,
        error: null,
        refetch: jest.fn()
      });

      render(<RivalryIndex />);

      expect(mockUseUserRivalries).toHaveBeenCalledWith(undefined);
    });
  });
});
