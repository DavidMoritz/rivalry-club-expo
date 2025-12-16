import { deleteUser } from '../amplify-auth';

// Mock aws-amplify/auth
const mockAuthDeleteUser = jest.fn();

jest.mock('aws-amplify/auth', () => ({
  confirmResetPassword: jest.fn(),
  confirmSignUp: jest.fn(),
  deleteUser: () => mockAuthDeleteUser(),
  getCurrentUser: jest.fn(),
  resetPassword: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  signUp: jest.fn(),
  updatePassword: jest.fn(),
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    appOwnership: 'standalone', // Default to non-Expo Go
  },
}));

describe('amplify-auth deleteUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls AWS Amplify deleteUser in standalone mode', async () => {
    mockAuthDeleteUser.mockResolvedValue(undefined);

    await deleteUser();

    expect(mockAuthDeleteUser).toHaveBeenCalledTimes(1);
  });

  it('handles deletion errors from AWS Amplify', async () => {
    const error = new Error('User deletion failed');
    mockAuthDeleteUser.mockRejectedValue(error);

    await expect(deleteUser()).rejects.toThrow('User deletion failed');
  });

  it('bypasses AWS Amplify in Expo Go mode', async () => {
    // Re-import to get Expo Go mode
    jest.resetModules();

    jest.mock('expo-constants', () => ({
      __esModule: true,
      default: {
        appOwnership: 'expo',
      },
    }));

    const { deleteUser: deleteUserExpoGo } = require('../amplify-auth');

    await deleteUserExpoGo();

    // Should not call AWS Amplify deleteUser in Expo Go
    expect(mockAuthDeleteUser).not.toHaveBeenCalled();
  });
});
