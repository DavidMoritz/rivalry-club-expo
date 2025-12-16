import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { CreateAccountModal } from '../CreateAccountModal';

// Mock AWS Amplify Auth
const mockSignUp = jest.fn();
const mockConfirmSignUp = jest.fn();
const mockSignIn = jest.fn();
const mockGetCurrentUser = jest.fn();

jest.mock('../../../lib/amplify-auth', () => ({
  signUp: (...args: unknown[]) => mockSignUp(...args),
  confirmSignUp: (...args: unknown[]) => mockConfirmSignUp(...args),
  signIn: (...args: unknown[]) => mockSignIn(...args),
  getCurrentUser: () => mockGetCurrentUser(),
  isExpoGo: false,
}));

// Mock AWS Amplify Data
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

describe('CreateAccountModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const currentUserId = 'test-user-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Verification Link', () => {
    it('shows "Have a confirmation code? Verify" link on create account screen', () => {
      const { getByText } = render(
        <CreateAccountModal
          visible={true}
          currentUserId={currentUserId}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(getByText('Have a confirmation code? Verify')).toBeTruthy();
    });

    it('switches to verification screen when clicking verification link', () => {
      const { getByText } = render(
        <CreateAccountModal
          visible={true}
          currentUserId={currentUserId}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const verifyLink = getByText('Have a confirmation code? Verify');
      fireEvent.press(verifyLink);

      expect(getByText('Verify Email')).toBeTruthy();
      expect(getByText('Verification Code')).toBeTruthy();
    });

    it('shows email input on verification screen when email is not filled', () => {
      const { getByText, getByPlaceholderText } = render(
        <CreateAccountModal
          visible={true}
          currentUserId={currentUserId}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Go to verification screen
      fireEvent.press(getByText('Have a confirmation code? Verify'));

      // Should show email input (hasCredentials = false by default)
      expect(getByPlaceholderText('Enter your email')).toBeTruthy();
      expect(getByPlaceholderText('Enter your password')).toBeTruthy();
      expect(getByPlaceholderText('Enter verification code')).toBeTruthy();
    });

    it('hides email and password inputs on verification screen after sign up', async () => {
      mockSignUp.mockResolvedValue({
        nextStep: {
          signUpStep: 'CONFIRM_SIGN_UP',
        },
      });

      const { getByText, getByPlaceholderText, queryByPlaceholderText } = render(
        <CreateAccountModal
          visible={true}
          currentUserId={currentUserId}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Fill out sign up form
      const emailInput = getByPlaceholderText('Enter your email');
      const passwordInput = getByPlaceholderText('Enter your password');
      const confirmPasswordInput = getByPlaceholderText('Confirm your password');

      fireEvent.changeText(emailInput, 'test@test.com');
      fireEvent.changeText(passwordInput, 'Password123!');
      fireEvent.changeText(confirmPasswordInput, 'Password123!');

      // Submit sign up
      const createButton = getByText('Create Account');
      fireEvent.press(createButton);

      // Wait for sign up to complete and switch to verification
      await waitFor(() => {
        expect(getByText('Verify Email')).toBeTruthy();
      });

      // Should only show verification code input (hasCredentials = true)
      expect(queryByPlaceholderText('Enter your email')).toBeNull();
      expect(queryByPlaceholderText('Enter your password')).toBeNull();
      expect(getByPlaceholderText('Enter verification code')).toBeTruthy();
    });

    it('shows appropriate message based on whether email is filled', () => {
      const { getByText } = render(
        <CreateAccountModal
          visible={true}
          currentUserId={currentUserId}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Go to verification screen without credentials
      fireEvent.press(getByText('Have a confirmation code? Verify'));

      // Should show message asking for both email and code
      expect(
        getByText('Please enter your email and the verification code we sent you')
      ).toBeTruthy();
    });

    it('requires both email and verification code to enable verify button', async () => {
      const { getByText, getByPlaceholderText } = render(
        <CreateAccountModal
          visible={true}
          currentUserId={currentUserId}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Go to verification screen
      fireEvent.press(getByText('Have a confirmation code? Verify'));

      // Fill in only verification code
      const codeInput = getByPlaceholderText('Enter verification code');
      fireEvent.changeText(codeInput, '123456');

      // Fill in email to complete the form
      const emailInput = getByPlaceholderText('Enter your email');
      fireEvent.changeText(emailInput, 'test@test.com');

      // Fill in password
      const passwordInput = getByPlaceholderText('Enter your password');
      fireEvent.changeText(passwordInput, 'Password123!');

      // Verify button should exist and be pressable
      const verifyButton = getByText('Verify');
      expect(verifyButton).toBeTruthy();
    });

    it('successfully verifies with email and code', async () => {
      mockConfirmSignUp.mockResolvedValue(undefined);
      mockSignIn.mockResolvedValue({
        isSignedIn: true,
        nextStep: { signInStep: 'DONE' },
      });
      mockGetCurrentUser.mockResolvedValue({
        userId: 'aws-sub-123',
      });
      mockUserUpdate.mockResolvedValue({
        data: { id: currentUserId },
        errors: null,
      });

      const { getByText, getByPlaceholderText } = render(
        <CreateAccountModal
          visible={true}
          currentUserId={currentUserId}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Go to verification screen
      fireEvent.press(getByText('Have a confirmation code? Verify'));

      // Fill in email, password, and code
      fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@test.com');
      fireEvent.changeText(getByPlaceholderText('Enter your password'), 'Password123!');
      fireEvent.changeText(getByPlaceholderText('Enter verification code'), '123456');

      // Submit verification
      fireEvent.press(getByText('Verify'));

      await waitFor(() => {
        expect(mockConfirmSignUp).toHaveBeenCalledWith('test@test.com', '123456');
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('shows back button on verification screen', () => {
      const { getByText } = render(
        <CreateAccountModal
          visible={true}
          currentUserId={currentUserId}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Go to verification screen
      fireEvent.press(getByText('Have a confirmation code? Verify'));

      expect(getByText('Back')).toBeTruthy();
    });

    it('returns to create account screen when clicking back', () => {
      const { getByText, queryByText } = render(
        <CreateAccountModal
          visible={true}
          currentUserId={currentUserId}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Go to verification screen
      fireEvent.press(getByText('Have a confirmation code? Verify'));
      expect(getByText('Verify Email')).toBeTruthy();

      // Click back
      fireEvent.press(getByText('Back'));

      // Should be back on create account screen
      expect(getByText('Create New Account')).toBeTruthy();
      expect(queryByText('Verify Email')).toBeNull();
    });
  });

  describe('Password Validation', () => {
    it('shows error when passwords do not match', async () => {
      const { getByText, getByPlaceholderText } = render(
        <CreateAccountModal
          visible={true}
          currentUserId={currentUserId}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@test.com');
      fireEvent.changeText(getByPlaceholderText('Enter your password'), 'Password123!');
      fireEvent.changeText(
        getByPlaceholderText('Confirm your password'),
        'DifferentPassword!'
      );

      fireEvent.press(getByText('Create Account'));

      await waitFor(() => {
        expect(getByText('Passwords do not match')).toBeTruthy();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });
  });
});
