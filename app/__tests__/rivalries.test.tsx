import { render, waitFor } from '@testing-library/react-native';
import React from 'react';

import RivalriesRoute from '../rivalries';

// Mock expo-router
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace
  })
}));

// Mock useAuthUser hook
const mockUseAuthUser = jest.fn();

jest.mock('../src/hooks/useAuthUser', () => ({
  useAuthUser: () => mockUseAuthUser()
}));

// Mock RivalryIndex component
jest.mock('../src/components/screens/RivalryIndex', () => ({
  RivalryIndex: () => {
    const { View, Text } = require('react-native');

    return (
      <View testID="rivalry-index">
        <Text>Rivalry Index</Text>
      </View>
    );
  }
}));

// Mock HamburgerMenu component
jest.mock('../src/components/common/HamburgerMenu', () => ({
  HamburgerMenu: () => {
    const { View } = require('react-native');

    return <View testID="hamburger-menu" />;
  }
}));

describe.skip('RivalriesRoute - Profile Guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User with complete profile', () => {
    it('renders rivalries page when user has firstName', async () => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-complete',
          email: 'complete@test.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 1,
          awsSub: 'aws-sub-complete'
        },
        isLoading: false,
        error: null
      });

      const { getByTestId } = render(<RivalriesRoute />);

      await waitFor(() => {
        expect(getByTestId('rivalry-index')).toBeTruthy();
      });

      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('does not redirect when firstName has non-whitespace content', async () => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-valid',
          email: 'valid@test.com',
          firstName: 'Valid',
          lastName: 'User',
          role: 1,
          awsSub: 'aws-sub-valid'
        },
        isLoading: false,
        error: null
      });

      render(<RivalriesRoute />);

      await waitFor(() => {
        expect(mockReplace).not.toHaveBeenCalled();
      });
    });
  });

  describe('User with incomplete profile', () => {
    it('redirects to /profile when user has no firstName', async () => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-no-name',
          email: 'noname@test.com',
          firstName: null,
          lastName: null,
          role: 1,
          awsSub: 'aws-sub-no-name'
        },
        isLoading: false,
        error: null
      });

      render(<RivalriesRoute />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/profile');
      });
    });

    it('redirects to /profile when firstName is empty string', async () => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-empty',
          email: 'empty@test.com',
          firstName: '',
          lastName: 'User',
          role: 1,
          awsSub: 'aws-sub-empty'
        },
        isLoading: false,
        error: null
      });

      render(<RivalriesRoute />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/profile');
      });
    });

    it('redirects to /profile when firstName is only whitespace', async () => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-whitespace',
          email: 'whitespace@test.com',
          firstName: '   ',
          lastName: 'User',
          role: 1,
          awsSub: 'aws-sub-whitespace'
        },
        isLoading: false,
        error: null
      });

      render(<RivalriesRoute />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/profile');
      });
    });
  });

  describe('Loading state', () => {
    it('does not redirect while user data is loading', async () => {
      mockUseAuthUser.mockReturnValue({
        user: null,
        isLoading: true,
        error: null
      });

      render(<RivalriesRoute />);

      await waitFor(() => {
        expect(mockReplace).not.toHaveBeenCalled();
      });
    });

    it('waits for loading to complete before checking profile', async () => {
      // Start with loading
      mockUseAuthUser.mockReturnValue({
        user: null,
        isLoading: true,
        error: null
      });

      const { rerender } = render(<RivalriesRoute />);

      // Should not redirect yet
      expect(mockReplace).not.toHaveBeenCalled();

      // Update to loaded with incomplete profile
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-loaded',
          email: 'loaded@test.com',
          firstName: '',
          lastName: '',
          role: 1,
          awsSub: 'aws-sub-loaded'
        },
        isLoading: false,
        error: null
      });

      rerender(<RivalriesRoute />);

      // Should now redirect
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/profile');
      });
    });
  });

  describe('Edge cases', () => {
    it('does not redirect when user is null and not loading', async () => {
      mockUseAuthUser.mockReturnValue({
        user: null,
        isLoading: false,
        error: null
      });

      render(<RivalriesRoute />);

      await waitFor(() => {
        expect(mockReplace).not.toHaveBeenCalled();
      });
    });

    it('handles error state gracefully', async () => {
      mockUseAuthUser.mockReturnValue({
        user: null,
        isLoading: false,
        error: new Error('Failed to load user')
      });

      render(<RivalriesRoute />);

      await waitFor(() => {
        expect(mockReplace).not.toHaveBeenCalled();
      });
    });

    it('only redirects once even if component re-renders', async () => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-rerender',
          email: 'rerender@test.com',
          firstName: '',
          lastName: '',
          role: 1,
          awsSub: 'aws-sub-rerender'
        },
        isLoading: false,
        error: null
      });

      const { rerender } = render(<RivalriesRoute />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledTimes(1);
      });

      // Force re-render
      rerender(<RivalriesRoute />);

      // Should still only have been called once
      expect(mockReplace).toHaveBeenCalledTimes(1);
    });
  });

  describe('Console logging', () => {
    it('logs when redirecting user without name', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-log',
          email: 'log@test.com',
          firstName: null,
          lastName: null,
          role: 1,
          awsSub: 'aws-sub-log'
        },
        isLoading: false,
        error: null
      });

      render(<RivalriesRoute />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          '[RivalriesRoute] User has no name, redirecting to profile'
        );
      });

      consoleSpy.mockRestore();
    });
  });
});
