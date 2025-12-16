import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { Auth } from '../Auth';

// Mock AWS Amplify Auth
const mockSignIn = jest.fn();
const mockGetCurrentUser = jest.fn();

jest.mock('../../../lib/amplify-auth', () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
  getCurrentUser: () => mockGetCurrentUser(),
  isExpoGo: false,
}));

describe('Auth Component', () => {
  const mockOnAuthSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockGetCurrentUser.mockRejectedValue(new Error('Not authenticated'));
  });

  describe('Initial Render', () => {
    it('renders sign in form by default', () => {
      const { getAllByText, getByPlaceholderText } = render(
        <Auth onAuthSuccess={mockOnAuthSuccess} />
      );

      expect(getAllByText('Sign In').length).toBeGreaterThan(0);
      expect(getByPlaceholderText('Enter your email')).toBeTruthy();
      expect(getByPlaceholderText('Enter your password')).toBeTruthy();
    });

    it('does not show confirm password field', () => {
      const { queryByPlaceholderText } = render(
        <Auth onAuthSuccess={mockOnAuthSuccess} />
      );

      expect(queryByPlaceholderText('Confirm your password')).toBeNull();
    });
  });

  describe('Existing Session Check', () => {
    it('calls onAuthSuccess if user is already authenticated', async () => {
      const mockUser = {
        userId: 'user-123',
        username: 'test@test.com',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      render(<Auth onAuthSuccess={mockOnAuthSuccess} />);

      await waitFor(() => {
        expect(mockOnAuthSuccess).toHaveBeenCalled();
      });
    });

    it('does not call onAuthSuccess if no session exists', async () => {
      mockGetCurrentUser.mockRejectedValue(new Error('Not authenticated'));

      render(<Auth onAuthSuccess={mockOnAuthSuccess} />);

      await waitFor(() => {
        expect(mockOnAuthSuccess).not.toHaveBeenCalled();
      });
    });
  });

  describe('Sign In Flow', () => {
    it('successfully signs in with valid credentials', async () => {
      mockSignIn.mockResolvedValue({
        isSignedIn: true,
        nextStep: { signInStep: 'DONE' },
      });

      const { getByPlaceholderText, getAllByText } = render(
        <Auth onAuthSuccess={mockOnAuthSuccess} />
      );

      const emailInput = getByPlaceholderText('Enter your email');
      const passwordInput = getByPlaceholderText('Enter your password');
      const signInButton = getAllByText('Sign In')[1]; // Button is index 1, title is index 0

      fireEvent.changeText(emailInput, 'test@test.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@test.com', 'password123');
      });

      await waitFor(() => {
        expect(mockOnAuthSuccess).toHaveBeenCalled();
      });
    });

    it('shows error message when sign in fails', async () => {
      // Mock sign in throwing an error (AWS Cognito style)
      mockSignIn.mockRejectedValue({
        name: 'NotAuthorizedException',
        message: 'Incorrect username or password.',
      });

      const { getByPlaceholderText, getAllByText, getByText } = render(
        <Auth onAuthSuccess={mockOnAuthSuccess} />
      );

      const emailInput = getByPlaceholderText('Enter your email');
      const passwordInput = getByPlaceholderText('Enter your password');
      const signInButton = getAllByText('Sign In')[1];

      fireEvent.changeText(emailInput, 'test@test.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(getByText('Incorrect email or password')).toBeTruthy();
      });

      expect(mockOnAuthSuccess).not.toHaveBeenCalled();
    });

    it('disables button when email or password is empty', () => {
      const { getByPlaceholderText, getByTestId } = render(
        <Auth onAuthSuccess={mockOnAuthSuccess} />
      );

      const signInButton = getByTestId('auth-submit-button');

      expect(signInButton.props.accessibilityState?.disabled).toBe(true);

      const emailInput = getByPlaceholderText('Enter your email');
      fireEvent.changeText(emailInput, 'test@test.com');

      // Still disabled because password is empty
      expect(signInButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('trims whitespace from email and password', async () => {
      mockSignIn.mockResolvedValue({
        isSignedIn: true,
        nextStep: { signInStep: 'DONE' },
      });

      const { getByPlaceholderText, getAllByText } = render(
        <Auth onAuthSuccess={mockOnAuthSuccess} />
      );

      const emailInput = getByPlaceholderText('Enter your email');
      const passwordInput = getByPlaceholderText('Enter your password');
      const signInButton = getAllByText('Sign In')[1];

      fireEvent.changeText(emailInput, '  test@test.com  ');
      fireEvent.changeText(passwordInput, '  password123  ');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@test.com', 'password123');
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading text when signing in', async () => {
      mockSignIn.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({ isSignedIn: true, nextStep: { signInStep: 'DONE' } }),
              100
            )
          )
      );

      const { getByPlaceholderText, getByText, getAllByText } = render(
        <Auth onAuthSuccess={mockOnAuthSuccess} />
      );

      const emailInput = getByPlaceholderText('Enter your email');
      const passwordInput = getByPlaceholderText('Enter your password');

      fireEvent.changeText(emailInput, 'test@test.com');
      fireEvent.changeText(passwordInput, 'password123');

      const signInButton = getAllByText('Sign In')[1];
      fireEvent.press(signInButton);

      // Check loading state
      await waitFor(() => {
        expect(getByText('Loading...')).toBeTruthy();
      });
    });

    it('disables button during sign in', async () => {
      mockSignIn.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({ isSignedIn: true, nextStep: { signInStep: 'DONE' } }),
              100
            )
          )
      );

      const { getByPlaceholderText, getByTestId } = render(
        <Auth onAuthSuccess={mockOnAuthSuccess} />
      );

      const emailInput = getByPlaceholderText('Enter your email');
      const passwordInput = getByPlaceholderText('Enter your password');

      fireEvent.changeText(emailInput, 'test@test.com');
      fireEvent.changeText(passwordInput, 'password123');

      const signInButton = getByTestId('auth-submit-button');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(signInButton.props.accessibilityState?.disabled).toBe(true);
      });
    });
  });

});
