import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { Profile } from '../Profile';

// Mock expo-router
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace
  })
}));

// Mock useAuthUser hook
const mockUseAuthUser = jest.fn();

jest.mock('../../../hooks/useAuthUser', () => ({
  useAuthUser: () => mockUseAuthUser()
}));

// Mock AWS Amplify Auth
const mockUpdatePassword = jest.fn();

jest.mock('../../../lib/amplify-auth', () => ({
  updatePassword: (...args: any[]) => mockUpdatePassword(...args),
  isExpoGo: false,
}));

// Mock AWS Amplify
const mockUserUpdate = jest.fn();

jest.mock('aws-amplify/data', () => ({
  generateClient: jest.fn(() => ({
    models: {
      User: {
        update: (...args: any[]) => mockUserUpdate(...args)
      }
    }
  }))
}));

describe('Profile Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Default mocks
    mockUpdatePassword.mockResolvedValue({ error: null });
    mockUserUpdate.mockResolvedValue({ data: {}, errors: [] });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Loading state', () => {
    it('shows loading indicator when user data is loading', () => {
      mockUseAuthUser.mockReturnValue({
        user: null,
        isLoading: true,
        error: null
      });

      const { getByText } = render(<Profile />);

      expect(getByText('Loading...')).toBeTruthy();
    });
  });

  describe('New user (no firstName)', () => {
    it('shows welcome message for new users', () => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-new',
          email: 'newuser@test.com',
          firstName: null,
          lastName: null,
          role: 1,
          awsSub: 'aws-sub-new'
        },
        isLoading: false,
        error: null
      });

      const { getByText } = render(<Profile />);

      expect(getByText('Welcome! 👋')).toBeTruthy();
      expect(getByText('Please enter your first name to get started')).toBeTruthy();
    });

    it('shows welcome message when firstName is empty string', () => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-empty',
          email: 'empty@test.com',
          firstName: '',
          lastName: '',
          role: 1,
          awsSub: 'aws-sub-empty'
        },
        isLoading: false,
        error: null
      });

      const { getByText } = render(<Profile />);

      expect(getByText('Welcome! 👋')).toBeTruthy();
    });

    it('redirects to /rivalries after successful profile completion', async () => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-complete',
          email: 'complete@test.com',
          firstName: null,
          lastName: null,
          role: 1,
          awsSub: 'aws-sub-complete'
        },
        isLoading: false,
        error: null
      });

      mockUserUpdate.mockResolvedValue({
        data: {
          id: 'user-complete',
          firstName: 'New',
          lastName: 'User'
        },
        errors: null
      });

      const { getByText, getByPlaceholderText } = render(<Profile />);

      const firstNameInput = getByPlaceholderText('Enter first name');
      const lastNameInput = getByPlaceholderText('Enter last name');
      const updateButton = getByText('Update Profile');

      fireEvent.changeText(firstNameInput, 'New');
      fireEvent.changeText(lastNameInput, 'User');
      fireEvent.press(updateButton);

      await waitFor(() => {
        expect(mockUserUpdate).toHaveBeenCalledWith({
          id: 'user-complete',
          firstName: 'New',
          lastName: 'User'
        });
      });

      await waitFor(() => {
        expect(getByText('Profile updated successfully')).toBeTruthy();
      });

      // Fast-forward the 1-second delay
      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/rivalries');
      });
    });
  });

  describe('Existing user (has firstName)', () => {
    it('does not show welcome message for existing users', () => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-existing',
          email: 'existing@test.com',
          firstName: 'Existing',
          lastName: 'User',
          role: 1,
          awsSub: 'aws-sub-existing'
        },
        isLoading: false,
        error: null
      });

      const { queryByText } = render(<Profile />);

      expect(queryByText('Welcome! 👋')).toBeNull();
      expect(queryByText('Please enter your first name to get started')).toBeNull();
    });

    it('pre-fills form with existing user data', () => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-prefill',
          email: 'prefill@test.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 1,
          awsSub: 'aws-sub-prefill'
        },
        isLoading: false,
        error: null
      });

      const { getByDisplayValue } = render(<Profile />);

      expect(getByDisplayValue('John')).toBeTruthy();
      expect(getByDisplayValue('Doe')).toBeTruthy();
    });

    it('does not redirect after update for existing users', async () => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-no-redirect',
          email: 'noredirect@test.com',
          firstName: 'No',
          lastName: 'Redirect',
          role: 1,
          awsSub: 'aws-sub-no-redirect'
        },
        isLoading: false,
        error: null
      });

      mockUserUpdate.mockResolvedValue({
        data: {
          id: 'user-no-redirect',
          firstName: 'Updated',
          lastName: 'Name'
        },
        errors: null
      });

      const { getByText, getByPlaceholderText } = render(<Profile />);

      const firstNameInput = getByPlaceholderText('Enter first name');
      const updateButton = getByText('Update Profile');

      fireEvent.changeText(firstNameInput, 'Updated');
      fireEvent.press(updateButton);

      await waitFor(() => {
        expect(getByText('Profile updated successfully')).toBeTruthy();
      });

      // Fast-forward timers
      jest.advanceTimersByTime(3000);

      // Should not redirect
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe('Form validation', () => {
    beforeEach(() => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-validation',
          email: 'validation@test.com',
          firstName: '',
          lastName: '',
          role: 1,
          awsSub: 'aws-sub-validation'
        },
        isLoading: false,
        error: null
      });
    });

    it('shows error when firstName is empty', async () => {
      const { getByText, getByPlaceholderText } = render(<Profile />);

      const lastNameInput = getByPlaceholderText('Enter last name');
      const updateButton = getByText('Update Profile');

      fireEvent.changeText(lastNameInput, 'OnlyLast');
      fireEvent.press(updateButton);

      await waitFor(() => {
        expect(getByText('First name is required')).toBeTruthy();
      });

      expect(mockUserUpdate).not.toHaveBeenCalled();
    });

    it('allows update when lastName is empty', async () => {
      mockUserUpdate.mockResolvedValue({
        data: {
          id: 'user-validation',
          firstName: 'OnlyFirst',
          lastName: ' '
        },
        errors: null
      });

      const { getByText, getByPlaceholderText } = render(<Profile />);

      const firstNameInput = getByPlaceholderText('Enter first name');
      const updateButton = getByText('Update Profile');

      fireEvent.changeText(firstNameInput, 'OnlyFirst');
      fireEvent.press(updateButton);

      await waitFor(() => {
        expect(mockUserUpdate).toHaveBeenCalledWith({
          id: 'user-validation',
          firstName: 'OnlyFirst',
          lastName: ' '
        });
      });
    });

    it('trims whitespace from names before validation', async () => {
      const { getByText, getByPlaceholderText } = render(<Profile />);

      const firstNameInput = getByPlaceholderText('Enter first name');
      const lastNameInput = getByPlaceholderText('Enter last name');
      const updateButton = getByText('Update Profile');

      fireEvent.changeText(firstNameInput, '   ');
      fireEvent.changeText(lastNameInput, '   ');
      fireEvent.press(updateButton);

      await waitFor(() => {
        expect(getByText('First name is required')).toBeTruthy();
      });
    });

    it('trims whitespace before saving', async () => {
      mockUserUpdate.mockResolvedValue({
        data: { id: 'user-validation', firstName: 'Trimmed', lastName: 'Name' },
        errors: null
      });

      const { getByText, getByPlaceholderText } = render(<Profile />);

      const firstNameInput = getByPlaceholderText('Enter first name');
      const lastNameInput = getByPlaceholderText('Enter last name');
      const updateButton = getByText('Update Profile');

      fireEvent.changeText(firstNameInput, '  Trimmed  ');
      fireEvent.changeText(lastNameInput, '  Name  ');
      fireEvent.press(updateButton);

      await waitFor(() => {
        expect(mockUserUpdate).toHaveBeenCalledWith({
          id: 'user-validation',
          firstName: 'Trimmed',
          lastName: 'Name'
        });
      });
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-error',
          email: 'error@test.com',
          firstName: 'Error',
          lastName: 'User',
          role: 1,
          awsSub: 'aws-sub-error'
        },
        isLoading: false,
        error: null
      });
    });

    it('displays error message when update fails', async () => {
      mockUserUpdate.mockResolvedValue({
        data: null,
        errors: [{ message: 'Network error' }]
      });

      const { getByText, getByPlaceholderText } = render(<Profile />);

      const firstNameInput = getByPlaceholderText('Enter first name');
      const updateButton = getByText('Update Profile');

      fireEvent.changeText(firstNameInput, 'Updated');
      fireEvent.press(updateButton);

      await waitFor(() => {
        expect(getByText('Network error')).toBeTruthy();
      });
    });

    it('handles update exception gracefully', async () => {
      mockUserUpdate.mockRejectedValue(new Error('Database connection failed'));

      const { getByText, getByPlaceholderText } = render(<Profile />);

      const firstNameInput = getByPlaceholderText('Enter first name');
      const updateButton = getByText('Update Profile');

      fireEvent.changeText(firstNameInput, 'Updated');
      fireEvent.press(updateButton);

      await waitFor(() => {
        expect(getByText('Database connection failed')).toBeTruthy();
      });
    });
  });

  describe.skip('Password change', () => {
    beforeEach(() => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-password',
          email: 'password@test.com',
          firstName: 'Password',
          lastName: 'User',
          role: 1,
          awsSub: 'aws-sub-password'
        },
        isLoading: false,
        error: null
      });
    });

    it('validates all password fields are filled', async () => {
      const { getByText, getByPlaceholderText } = render(<Profile />);

      const changePasswordButton = getByText('Change Password');

      fireEvent.press(changePasswordButton);

      await waitFor(() => {
        expect(getByText('All password fields are required')).toBeTruthy();
      });
    });

    it('validates new passwords match', async () => {
      const { getByText, getByPlaceholderText } = render(<Profile />);

      const currentPasswordInput = getByPlaceholderText('Enter current password');
      const newPasswordInput = getByPlaceholderText('Enter new password (min 8 characters)');
      const confirmPasswordInput = getByPlaceholderText('Re-enter new password');
      const changePasswordButton = getByText('Change Password');

      fireEvent.changeText(currentPasswordInput, 'oldpassword');
      fireEvent.changeText(newPasswordInput, 'newpassword123');
      fireEvent.changeText(confirmPasswordInput, 'differentpassword');
      fireEvent.press(changePasswordButton);

      await waitFor(() => {
        expect(getByText('New passwords do not match')).toBeTruthy();
      });
    });

    it('validates password length', async () => {
      const { getByText, getByPlaceholderText } = render(<Profile />);

      const currentPasswordInput = getByPlaceholderText('Enter current password');
      const newPasswordInput = getByPlaceholderText('Enter new password (min 8 characters)');
      const confirmPasswordInput = getByPlaceholderText('Re-enter new password');
      const changePasswordButton = getByText('Change Password');

      fireEvent.changeText(currentPasswordInput, 'oldpassword');
      fireEvent.changeText(newPasswordInput, 'short');
      fireEvent.changeText(confirmPasswordInput, 'short');
      fireEvent.press(changePasswordButton);

      await waitFor(() => {
        expect(getByText('Password must be at least 8 characters')).toBeTruthy();
      });
    });

    it('successfully changes password', async () => {
      mockUpdateUser.mockResolvedValue({ error: null });

      const { getByText, getByPlaceholderText } = render(<Profile />);

      const currentPasswordInput = getByPlaceholderText('Enter current password');
      const newPasswordInput = getByPlaceholderText('Enter new password (min 8 characters)');
      const confirmPasswordInput = getByPlaceholderText('Re-enter new password');
      const changePasswordButton = getByText('Change Password');

      fireEvent.changeText(currentPasswordInput, 'oldpassword');
      fireEvent.changeText(newPasswordInput, 'newpassword123');
      fireEvent.changeText(confirmPasswordInput, 'newpassword123');
      fireEvent.press(changePasswordButton);

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({
          password: 'newpassword123'
        });
      });

      await waitFor(() => {
        expect(getByText('Password changed successfully')).toBeTruthy();
      });
    });

    it('clears password fields after successful change', async () => {
      mockUpdateUser.mockResolvedValue({ error: null });

      const { getByText, getByPlaceholderText } = render(<Profile />);

      const currentPasswordInput = getByPlaceholderText('Enter current password');
      const newPasswordInput = getByPlaceholderText('Enter new password (min 8 characters)');
      const confirmPasswordInput = getByPlaceholderText('Re-enter new password');
      const changePasswordButton = getByText('Change Password');

      fireEvent.changeText(currentPasswordInput, 'oldpassword');
      fireEvent.changeText(newPasswordInput, 'newpassword123');
      fireEvent.changeText(confirmPasswordInput, 'newpassword123');
      fireEvent.press(changePasswordButton);

      await waitFor(() => {
        expect(getByText('Password changed successfully')).toBeTruthy();
      });

      // Check fields are cleared
      expect(currentPasswordInput.props.value).toBe('');
      expect(newPasswordInput.props.value).toBe('');
      expect(confirmPasswordInput.props.value).toBe('');
    });
  });

  describe('UI elements', () => {
    it('displays email as read-only', () => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-ui',
          email: 'readonly@test.com',
          firstName: 'UI',
          lastName: 'Test',
          role: 1,
          awsSub: 'aws-sub-ui'
        },
        isLoading: false,
        error: null
      });

      const { getByText } = render(<Profile />);

      expect(getByText('readonly@test.com')).toBeTruthy();
    });

    it('shows updating state when profile is being updated', async () => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-updating',
          email: 'updating@test.com',
          firstName: 'Updating',
          lastName: 'State',
          role: 1,
          awsSub: 'aws-sub-updating'
        },
        isLoading: false,
        error: null
      });

      let resolveUpdate: any;
      const updatePromise = new Promise((resolve) => {
        resolveUpdate = resolve;
      });

      mockUserUpdate.mockReturnValue(updatePromise);

      const { getByText, getByPlaceholderText } = render(<Profile />);

      const firstNameInput = getByPlaceholderText('Enter first name');
      const updateButton = getByText('Update Profile');

      fireEvent.changeText(firstNameInput, 'Updated');
      fireEvent.press(updateButton);

      await waitFor(() => {
        expect(getByText('Updating...')).toBeTruthy();
      });

      resolveUpdate({ data: { id: 'user-updating' }, errors: null });
    });
  });
});
