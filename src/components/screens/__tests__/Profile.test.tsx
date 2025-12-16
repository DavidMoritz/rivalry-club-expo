import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { Profile } from '../Profile';

// Mock expo-router
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

// Mock useAuthUser hook
const mockUseAuthUser = jest.fn();

jest.mock('../../../hooks/useAuthUser', () => ({
  useAuthUser: () => mockUseAuthUser(),
}));

// Mock AWS Amplify Auth
const mockUpdatePassword = jest.fn();
const mockDeleteUser = jest.fn();
const mockSignOut = jest.fn();

jest.mock('../../../lib/amplify-auth', () => ({
  updatePassword: (...args: unknown[]) => mockUpdatePassword(...args),
  deleteUser: () => mockDeleteUser(),
  signOut: () => mockSignOut(),
  isExpoGo: false,
}));

// Mock user identity
const mockClearStoredUuid = jest.fn();

jest.mock('../../../lib/user-identity', () => ({
  clearStoredUuid: () => mockClearStoredUuid(),
}));

// Mock AWS Amplify
const mockUserUpdate = jest.fn();

jest.mock('aws-amplify/data', () => ({
  generateClient: jest.fn(() => ({
    models: {
      User: {
        update: (...args: unknown[]) => mockUserUpdate(...args),
      },
    },
  })),
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
        error: null,
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
          awsSub: 'aws-sub-new',
        },
        isLoading: false,
        error: null,
      });

      const { getByText } = render(<Profile />);

      expect(getByText('Welcome! 👋')).toBeTruthy();
      expect(
        getByText('Please enter your first name to get started')
      ).toBeTruthy();
    });

    it('shows welcome message when firstName is empty string', () => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-empty',
          email: 'empty@test.com',
          firstName: '',
          lastName: '',
          role: 1,
          awsSub: 'aws-sub-empty',
        },
        isLoading: false,
        error: null,
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
          awsSub: 'aws-sub-complete',
        },
        isLoading: false,
        error: null,
      });

      mockUserUpdate.mockResolvedValue({
        data: {
          id: 'user-complete',
          firstName: 'New',
          lastName: 'User',
        },
        errors: null,
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
          lastName: 'User',
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
          awsSub: 'aws-sub-existing',
        },
        isLoading: false,
        error: null,
      });

      const { queryByText } = render(<Profile />);

      expect(queryByText('Welcome! 👋')).toBeNull();
      expect(
        queryByText('Please enter your first name to get started')
      ).toBeNull();
    });

    it('pre-fills form with existing user data', () => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-prefill',
          email: 'prefill@test.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 1,
          awsSub: 'aws-sub-prefill',
        },
        isLoading: false,
        error: null,
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
          awsSub: 'aws-sub-no-redirect',
        },
        isLoading: false,
        error: null,
      });

      mockUserUpdate.mockResolvedValue({
        data: {
          id: 'user-no-redirect',
          firstName: 'Updated',
          lastName: 'Name',
        },
        errors: null,
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
          awsSub: 'aws-sub-validation',
        },
        isLoading: false,
        error: null,
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
          lastName: ' ',
        },
        errors: null,
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
          lastName: ' ',
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
        errors: null,
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
          lastName: 'Name',
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
          awsSub: 'aws-sub-error',
        },
        isLoading: false,
        error: null,
      });
    });

    it('displays error message when update fails', async () => {
      mockUserUpdate.mockResolvedValue({
        data: null,
        errors: [{ message: 'Network error' }],
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

  describe('Password change', () => {
    beforeEach(() => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-password',
          email: 'password@test.com',
          firstName: 'Password',
          lastName: 'User',
          role: 1,
          awsSub: 'aws-sub-password',
        },
        isLoading: false,
        error: null,
      });
    });

    it('shows Change Password button for authenticated users', () => {
      const { getByText } = render(<Profile />);

      expect(getByText('Change Password')).toBeTruthy();
    });

    it('shows password fields when Change Password is pressed', async () => {
      const { getByText, getByPlaceholderText } = render(<Profile />);

      const changePasswordButton = getByText('Change Password');
      fireEvent.press(changePasswordButton);

      await waitFor(() => {
        expect(getByPlaceholderText('Enter current password')).toBeTruthy();
        expect(
          getByPlaceholderText('Enter new password (min 8 characters)')
        ).toBeTruthy();
        expect(getByPlaceholderText('Re-enter new password')).toBeTruthy();
      });
    });

    it('validates all password fields are filled', async () => {
      const { getByText, getAllByText } = render(<Profile />);

      const changePasswordButton = getByText('Change Password');
      fireEvent.press(changePasswordButton);

      await waitFor(() => {
        // After clicking, there will be 2 "Change Password" texts - the section title and the button
        const buttons = getAllByText('Change Password');
        const submitButton = buttons.at(-1); // Get the last one (the button)
        if (submitButton) {
          fireEvent.press(submitButton);
        }
      });

      await waitFor(() => {
        expect(getByText('All password fields are required')).toBeTruthy();
      });
    });

    it('validates new passwords match', async () => {
      const { getByText, getAllByText, getByPlaceholderText } = render(
        <Profile />
      );

      const changePasswordButton = getByText('Change Password');
      fireEvent.press(changePasswordButton);

      await waitFor(() => {
        const currentPasswordInput = getByPlaceholderText(
          'Enter current password'
        );
        const newPasswordInput = getByPlaceholderText(
          'Enter new password (min 8 characters)'
        );
        const confirmPasswordInput = getByPlaceholderText(
          'Re-enter new password'
        );

        fireEvent.changeText(currentPasswordInput, 'oldpassword');
        fireEvent.changeText(newPasswordInput, 'newpassword123');
        fireEvent.changeText(confirmPasswordInput, 'differentpassword');
      });

      const buttons = getAllByText('Change Password');
      const submitButton = buttons.at(-1);
      if (submitButton) {
        fireEvent.press(submitButton);
      }

      await waitFor(() => {
        expect(getByText('New passwords do not match')).toBeTruthy();
      });
    });

    it('validates password length', async () => {
      const { getByText, getAllByText, getByPlaceholderText } = render(
        <Profile />
      );

      const changePasswordButton = getByText('Change Password');
      fireEvent.press(changePasswordButton);

      await waitFor(() => {
        const currentPasswordInput = getByPlaceholderText(
          'Enter current password'
        );
        const newPasswordInput = getByPlaceholderText(
          'Enter new password (min 8 characters)'
        );
        const confirmPasswordInput = getByPlaceholderText(
          'Re-enter new password'
        );

        fireEvent.changeText(currentPasswordInput, 'oldpassword');
        fireEvent.changeText(newPasswordInput, 'short');
        fireEvent.changeText(confirmPasswordInput, 'short');
      });

      const buttons = getAllByText('Change Password');
      const submitButton = buttons.at(-1);
      if (submitButton) {
        fireEvent.press(submitButton);
      }

      await waitFor(() => {
        expect(
          getByText('Password must be at least 8 characters')
        ).toBeTruthy();
      });
    });

    it('successfully changes password', async () => {
      mockUpdatePassword.mockResolvedValue(undefined);

      const { getByText, getAllByText, getByPlaceholderText } = render(
        <Profile />
      );

      const changePasswordButton = getByText('Change Password');
      fireEvent.press(changePasswordButton);

      await waitFor(() => {
        const currentPasswordInput = getByPlaceholderText(
          'Enter current password'
        );
        const newPasswordInput = getByPlaceholderText(
          'Enter new password (min 8 characters)'
        );
        const confirmPasswordInput = getByPlaceholderText(
          'Re-enter new password'
        );

        fireEvent.changeText(currentPasswordInput, 'oldpassword');
        fireEvent.changeText(newPasswordInput, 'newpassword123');
        fireEvent.changeText(confirmPasswordInput, 'newpassword123');
      });

      const buttons = getAllByText('Change Password');
      const submitButton = buttons.at(-1);
      if (submitButton) {
        fireEvent.press(submitButton);
      }

      await waitFor(() => {
        expect(mockUpdatePassword).toHaveBeenCalledWith(
          'oldpassword',
          'newpassword123'
        );
      });

      await waitFor(() => {
        expect(getByText('Password changed successfully')).toBeTruthy();
      });
    });

    it('clears password fields after successful change', async () => {
      mockUpdatePassword.mockResolvedValue(undefined);

      const { getByText, getAllByText, getByPlaceholderText } = render(
        <Profile />
      );

      const changePasswordButton = getByText('Change Password');
      fireEvent.press(changePasswordButton);

      await waitFor(() => {
        const currentPasswordInput = getByPlaceholderText(
          'Enter current password'
        );
        const newPasswordInput = getByPlaceholderText(
          'Enter new password (min 8 characters)'
        );
        const confirmPasswordInput = getByPlaceholderText(
          'Re-enter new password'
        );

        fireEvent.changeText(currentPasswordInput, 'oldpassword');
        fireEvent.changeText(newPasswordInput, 'newpassword123');
        fireEvent.changeText(confirmPasswordInput, 'newpassword123');
      });

      const buttons = getAllByText('Change Password');
      const submitButton = buttons.at(-1);
      if (submitButton) {
        fireEvent.press(submitButton);
      }

      await waitFor(() => {
        expect(getByText('Password changed successfully')).toBeTruthy();
      });

      // Check fields are cleared
      const currentPasswordInput = getByPlaceholderText(
        'Enter current password'
      );
      const newPasswordInput = getByPlaceholderText(
        'Enter new password (min 8 characters)'
      );
      const confirmPasswordInput = getByPlaceholderText(
        'Re-enter new password'
      );

      expect(currentPasswordInput.props.value).toBe('');
      expect(newPasswordInput.props.value).toBe('');
      expect(confirmPasswordInput.props.value).toBe('');
    });

    it('handles password change error', async () => {
      const error = new Error('Current password is incorrect');
      error.name = 'NotAuthorizedException';
      mockUpdatePassword.mockRejectedValue(error);

      const { getByText, getAllByText, getByPlaceholderText } = render(
        <Profile />
      );

      const changePasswordButton = getByText('Change Password');
      fireEvent.press(changePasswordButton);

      await waitFor(() => {
        const currentPasswordInput = getByPlaceholderText(
          'Enter current password'
        );
        const newPasswordInput = getByPlaceholderText(
          'Enter new password (min 8 characters)'
        );
        const confirmPasswordInput = getByPlaceholderText(
          'Re-enter new password'
        );

        fireEvent.changeText(currentPasswordInput, 'wrongpassword');
        fireEvent.changeText(newPasswordInput, 'newpassword123');
        fireEvent.changeText(confirmPasswordInput, 'newpassword123');
      });

      const buttons = getAllByText('Change Password');
      const submitButton = buttons.at(-1);
      if (submitButton) {
        fireEvent.press(submitButton);
      }

      await waitFor(() => {
        expect(getByText('Current password is incorrect')).toBeTruthy();
      });
    });

    it('hides password change section for anonymous users', () => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-anon',
          email: 'anon@test.com',
          firstName: 'Anonymous',
          lastName: 'User',
          role: 1,
          awsSub: 'anonymous',
        },
        isLoading: false,
        error: null,
      });

      const { queryByText } = render(<Profile />);

      // Should not show Change Password button for anonymous users
      expect(queryByText('Change Password')).toBeNull();
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
          awsSub: 'aws-sub-ui',
        },
        isLoading: false,
        error: null,
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
          awsSub: 'aws-sub-updating',
        },
        isLoading: false,
        error: null,
      });

      let resolveUpdate: ((value: unknown) => void) | undefined;
      const updatePromise = new Promise(resolve => {
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

      resolveUpdate?.({ data: { id: 'user-updating' }, errors: null });
    });
  });

  describe('Account Deletion', () => {
    it('shows Delete Account section', () => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-delete',
          email: 'delete@test.com',
          firstName: 'Delete',
          lastName: 'Test',
          role: 1,
          awsSub: 'aws-sub-delete',
        },
        isLoading: false,
        error: null,
      });

      const { getAllByText } = render(<Profile />);

      // Should have both the section title and button with "Delete Account" text
      const deleteAccountElements = getAllByText('Delete Account');
      expect(deleteAccountElements.length).toBeGreaterThanOrEqual(1);
    });

    it('shows appropriate warning for anonymous users', () => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-anon-delete',
          email: 'Player_ABC123@anonymous.local',
          firstName: 'Anon',
          lastName: 'User',
          role: 1,
          awsSub: 'anonymous',
        },
        isLoading: false,
        error: null,
      });

      const { getByText } = render(<Profile />);

      expect(
        getByText(
          'Deleting your account will make all your current rivalries inaccessible. This action cannot be undone.'
        )
      ).toBeTruthy();
    });

    it('shows appropriate warning for Cognito users', () => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-cognito-delete',
          email: 'cognito@test.com',
          firstName: 'Cognito',
          lastName: 'User',
          role: 1,
          awsSub: 'aws-sub-cognito',
        },
        isLoading: false,
        error: null,
      });

      const { getByText } = render(<Profile />);

      expect(
        getByText(
          'Permanently delete your account and all associated data. Once deleted, you will not be able to recover your rivalries. This action cannot be undone.'
        )
      ).toBeTruthy();
    });

    it('successfully deletes anonymous user account', async () => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-anon-delete',
          email: 'Player_ABC123@anonymous.local',
          firstName: 'Anon',
          lastName: 'User',
          role: 1,
          awsSub: 'anonymous',
        },
        isLoading: false,
        error: null,
      });

      mockUserUpdate.mockResolvedValue({
        data: {
          id: 'user-anon-delete',
          email: 'anonymous',
          role: 5,
        },
        errors: null,
      });

      mockClearStoredUuid.mockResolvedValue(undefined);
      mockSignOut.mockResolvedValue(undefined);

      const { getAllByText } = render(<Profile />);

      // Mock Alert.alert to auto-confirm
      const mockAlert = jest.spyOn(require('react-native').Alert, 'alert');
      mockAlert.mockImplementation((title, message, buttons) => {
        // Simulate pressing the "Delete Account" button
        const deleteButton = buttons?.find(
          (b: { text: string }) => b.text === 'Delete Account'
        );
        deleteButton?.onPress?.();
      });

      // Get the button (last occurrence of "Delete Account" text)
      const deleteButtons = getAllByText('Delete Account');
      const deleteButton = deleteButtons[deleteButtons.length - 1];
      fireEvent.press(deleteButton);

      await waitFor(() => {
        expect(mockUserUpdate).toHaveBeenCalledWith({
          id: 'user-anon-delete',
          email: 'anonymous',
          role: 5,
        });
      });

      // Should NOT delete from Cognito for anonymous users
      expect(mockDeleteUser).not.toHaveBeenCalled();

      // Should clear UUID and sign out
      await waitFor(() => {
        expect(mockClearStoredUuid).toHaveBeenCalled();
        expect(mockSignOut).toHaveBeenCalled();
      });

      // Should redirect to home
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/');
      });

      mockAlert.mockRestore();
    });

    it('successfully deletes Cognito user account', async () => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-cognito-delete',
          email: 'cognito@test.com',
          firstName: 'Cognito',
          lastName: 'User',
          role: 1,
          awsSub: 'aws-sub-cognito',
        },
        isLoading: false,
        error: null,
      });

      mockUserUpdate.mockResolvedValue({
        data: {
          id: 'user-cognito-delete',
          email: 'anonymous',
          role: 5,
        },
        errors: null,
      });

      mockDeleteUser.mockResolvedValue(undefined);
      mockClearStoredUuid.mockResolvedValue(undefined);
      mockSignOut.mockResolvedValue(undefined);

      const { getAllByText } = render(<Profile />);

      // Mock Alert.alert to auto-confirm
      const mockAlert = jest.spyOn(require('react-native').Alert, 'alert');
      mockAlert.mockImplementation((title, message, buttons) => {
        const deleteButton = buttons?.find(
          (b: { text: string }) => b.text === 'Delete Account'
        );
        deleteButton?.onPress?.();
      });

      // Get the button (last occurrence of "Delete Account" text)
      const deleteButtons = getAllByText('Delete Account');
      const deleteButton = deleteButtons[deleteButtons.length - 1];
      fireEvent.press(deleteButton);

      await waitFor(() => {
        expect(mockUserUpdate).toHaveBeenCalledWith({
          id: 'user-cognito-delete',
          email: 'anonymous',
          role: 5,
        });
      });

      // Should delete from Cognito for authenticated users
      await waitFor(() => {
        expect(mockDeleteUser).toHaveBeenCalled();
      });

      // Should clear UUID and sign out
      await waitFor(() => {
        expect(mockClearStoredUuid).toHaveBeenCalled();
        expect(mockSignOut).toHaveBeenCalled();
      });

      // Should redirect to home
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/');
      });

      mockAlert.mockRestore();
    });

    it('handles deletion error gracefully', async () => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-error-delete',
          email: 'error@test.com',
          firstName: 'Error',
          lastName: 'User',
          role: 1,
          awsSub: 'aws-sub-error',
        },
        isLoading: false,
        error: null,
      });

      mockUserUpdate.mockRejectedValue(new Error('Database error'));

      const { getAllByText } = render(<Profile />);

      // Mock Alert.alert to capture both the confirmation and error alerts
      const mockAlert = jest.spyOn(require('react-native').Alert, 'alert');
      let errorAlertCalled = false;

      mockAlert.mockImplementation((title, message, buttons) => {
        if (title === 'Delete Account' && buttons) {
          // Confirmation alert - press delete
          const deleteButton = buttons.find(
            (b: { text: string }) => b.text === 'Delete Account'
          );
          deleteButton?.onPress?.();
        } else if (title === 'Error') {
          // Error alert
          errorAlertCalled = true;
          expect(message).toBe('Failed to delete account. Please try again.');
        }
      });

      // Get the button (last occurrence of "Delete Account" text)
      const deleteButtons = getAllByText('Delete Account');
      const deleteButton = deleteButtons[deleteButtons.length - 1];
      fireEvent.press(deleteButton);

      await waitFor(() => {
        expect(errorAlertCalled).toBe(true);
      });

      // Should not proceed with deletion steps after database error
      expect(mockDeleteUser).not.toHaveBeenCalled();
      expect(mockClearStoredUuid).not.toHaveBeenCalled();
      expect(mockSignOut).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();

      mockAlert.mockRestore();
    });

    it('allows user to cancel account deletion', async () => {
      mockUseAuthUser.mockReturnValue({
        user: {
          id: 'user-cancel',
          email: 'cancel@test.com',
          firstName: 'Cancel',
          lastName: 'User',
          role: 1,
          awsSub: 'aws-sub-cancel',
        },
        isLoading: false,
        error: null,
      });

      const { getAllByText } = render(<Profile />);

      // Mock Alert.alert to simulate cancel
      const mockAlert = jest.spyOn(require('react-native').Alert, 'alert');
      mockAlert.mockImplementation((title, message, buttons) => {
        const cancelButton = buttons?.find(
          (b: { text: string }) => b.text === 'Cancel'
        );
        cancelButton?.onPress?.();
      });

      // Get the button (last occurrence of "Delete Account" text)
      const deleteButtons = getAllByText('Delete Account');
      const deleteButton = deleteButtons[deleteButtons.length - 1];
      fireEvent.press(deleteButton);

      // Should not perform any deletion actions
      expect(mockUserUpdate).not.toHaveBeenCalled();
      expect(mockDeleteUser).not.toHaveBeenCalled();
      expect(mockClearStoredUuid).not.toHaveBeenCalled();
      expect(mockSignOut).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();

      mockAlert.mockRestore();
    });
  });
});
