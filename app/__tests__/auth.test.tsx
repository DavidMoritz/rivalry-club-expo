import { render, waitFor } from '@testing-library/react-native';
import React from 'react';

import AuthRoute from '../auth';

// Mock expo-router
const mockReplace = jest.fn();
const mockUseRouter = jest.fn(() => ({
  replace: mockReplace
}));
const mockUseLocalSearchParams = jest.fn(() => ({}));

jest.mock('expo-router', () => ({
  useRouter: () => mockUseRouter(),
  useLocalSearchParams: () => mockUseLocalSearchParams()
}));

// Mock Supabase
const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();

jest.mock('../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (...args: any[]) => mockOnAuthStateChange(...args)
    }
  }
}));

// Mock AWS Amplify
const mockUserList = jest.fn();

jest.mock('aws-amplify/data', () => ({
  generateClient: jest.fn(() => ({
    models: {
      User: {
        list: (...args: any[]) => mockUserList(...args)
      }
    }
  }))
}));

// Mock Auth component
jest.mock('../src/components/screens/Auth', () => ({
  Auth: ({ onAuthSuccess }: { onAuthSuccess: () => void }) => {
    const { View, Button } = require('react-native');

    return (
      <View testID="auth-component">
        <Button testID="auth-success-button" title="Auth Success" onPress={onAuthSuccess} />
      </View>
    );
  }
}));

describe('AuthRoute - Profile Checking Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    });
  });

  describe('User with complete profile', () => {
    it('redirects to /rivalries when user has firstName', async () => {
      const mockSession = {
        user: { id: 'supabase-user-123', email: 'test@test.com' }
      };

      mockGetSession.mockResolvedValue({ data: { session: mockSession } });

      mockUserList.mockResolvedValue({
        data: [
          {
            id: 'user-123',
            awsSub: 'supabase-user-123',
            firstName: 'John',
            lastName: 'Doe',
            email: 'test@test.com'
          }
        ],
        errors: null
      });

      render(<AuthRoute />);

      await waitFor(() => {
        expect(mockUserList).toHaveBeenCalledWith({
          filter: {
            awsSub: {
              eq: 'supabase-user-123'
            }
          }
        });
      });

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/rivalries');
      });
    });
  });

  describe('User with incomplete profile', () => {
    it('redirects to /profile when user has no firstName', async () => {
      const mockSession = {
        user: { id: 'supabase-user-456', email: 'newuser@test.com' }
      };

      mockGetSession.mockResolvedValue({ data: { session: mockSession } });

      mockUserList.mockResolvedValue({
        data: [
          {
            id: 'user-456',
            awsSub: 'supabase-user-456',
            firstName: '',
            lastName: '',
            email: 'newuser@test.com'
          }
        ],
        errors: null
      });

      render(<AuthRoute />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/profile');
      });
    });

    it('redirects to /profile when firstName is only whitespace', async () => {
      const mockSession = {
        user: { id: 'supabase-user-789', email: 'spaceuser@test.com' }
      };

      mockGetSession.mockResolvedValue({ data: { session: mockSession } });

      mockUserList.mockResolvedValue({
        data: [
          {
            id: 'user-789',
            awsSub: 'supabase-user-789',
            firstName: '   ',
            lastName: 'Test',
            email: 'spaceuser@test.com'
          }
        ],
        errors: null
      });

      render(<AuthRoute />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/profile');
      });
    });

    it('redirects to /profile when firstName is null', async () => {
      const mockSession = {
        user: { id: 'supabase-user-null', email: 'nulluser@test.com' }
      };

      mockGetSession.mockResolvedValue({ data: { session: mockSession } });

      mockUserList.mockResolvedValue({
        data: [
          {
            id: 'user-null',
            awsSub: 'supabase-user-null',
            firstName: null,
            lastName: null,
            email: 'nulluser@test.com'
          }
        ],
        errors: null
      });

      render(<AuthRoute />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/profile');
      });
    });
  });

  describe('New user (not in database)', () => {
    it('redirects to /profile when user not found in database', async () => {
      const mockSession = {
        user: { id: 'supabase-new-user', email: 'brandnew@test.com' }
      };

      mockGetSession.mockResolvedValue({ data: { session: mockSession } });

      mockUserList.mockResolvedValue({
        data: [],
        errors: null
      });

      render(<AuthRoute />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/profile');
      });
    });
  });

  describe('Error handling', () => {
    it('defaults to /rivalries on database error', async () => {
      const mockSession = {
        user: { id: 'supabase-error-user', email: 'error@test.com' }
      };

      mockGetSession.mockResolvedValue({ data: { session: mockSession } });

      mockUserList.mockRejectedValue(new Error('Database connection failed'));

      render(<AuthRoute />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/rivalries');
      });
    });

    it('defaults to /rivalries when user query returns errors', async () => {
      const mockSession = {
        user: { id: 'supabase-graphql-error', email: 'graphqlerror@test.com' }
      };

      mockGetSession.mockResolvedValue({ data: { session: mockSession } });

      mockUserList.mockResolvedValue({
        data: null,
        errors: [{ message: 'GraphQL error' }]
      });

      render(<AuthRoute />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/rivalries');
      });
    });
  });

  describe('Auth state changes', () => {
    it('checks profile when auth state changes to authenticated', async () => {
      let authCallback: any;

      mockOnAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;

        return {
          data: { subscription: { unsubscribe: jest.fn() } }
        };
      });

      mockUserList.mockResolvedValue({
        data: [
          {
            id: 'user-state-change',
            awsSub: 'supabase-state-change',
            firstName: 'State',
            lastName: 'Change',
            email: 'state@test.com'
          }
        ],
        errors: null
      });

      render(<AuthRoute />);

      // Simulate auth state change
      const mockSession = {
        user: { id: 'supabase-state-change', email: 'state@test.com' }
      };

      authCallback('SIGNED_IN', mockSession);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/rivalries');
      });
    });
  });

  describe('No session', () => {
    it('does not redirect when no session exists', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });

      render(<AuthRoute />);

      await waitFor(() => {
        expect(mockReplace).not.toHaveBeenCalled();
      });
    });
  });
});
