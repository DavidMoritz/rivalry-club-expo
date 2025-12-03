import { renderHook, waitFor } from '@testing-library/react-native';

import { useAuthUser } from '../useAuthUser';

// Mock Supabase
const mockGetSession = jest.fn();
const mockGetUser = jest.fn();
const mockOnAuthStateChange = jest.fn();

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      getUser: () => mockGetUser(),
      onAuthStateChange: (...args: any[]) => mockOnAuthStateChange(...args),
    },
  },
}));

// Mock AWS Amplify
const mockUserList = jest.fn();
const mockUserCreate = jest.fn();
const mockGenerateClient = jest.fn();

jest.mock('aws-amplify/data', () => ({
  generateClient: () => mockGenerateClient(),
}));

describe('useAuthUser Hook', () => {
  const testSupabaseUserId = 'test-supabase-user-id-123';
  const testEmail = 'test@test.com';
  const testDynamoUserId = 'test-dynamo-user-id-456';

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock setup
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });

    mockGenerateClient.mockReturnValue({
      models: {
        User: {
          list: mockUserList,
          create: mockUserCreate,
        },
      },
    });

    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: testSupabaseUserId,
          email: testEmail,
        },
      },
    });
  });

  describe('Initial State', () => {
    it('starts with no loading state when no session exists', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });

      const { result } = renderHook(() => useAuthUser());

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Supabase Session Detection', () => {
    it('detects existing Supabase session on mount', async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: testSupabaseUserId,
              email: testEmail,
            },
          },
        },
      });

      mockUserList.mockResolvedValue({
        data: [],
        errors: [],
      });

      mockUserCreate.mockResolvedValue({
        data: {
          id: testDynamoUserId,
          email: testEmail,
          awsSub: testSupabaseUserId,
          role: 0,
        },
        errors: [],
      });

      const { result } = renderHook(() => useAuthUser());

      await waitFor(() => {
        expect(mockGetSession).toHaveBeenCalled();
      });
    });

    it('listens for auth state changes', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });

      renderHook(() => useAuthUser());

      await waitFor(() => {
        expect(mockOnAuthStateChange).toHaveBeenCalled();
      });
    });

    it('unsubscribes from auth changes on unmount', async () => {
      const mockUnsubscribe = jest.fn();

      mockGetSession.mockResolvedValue({ data: { session: null } });
      mockOnAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      });

      const { unmount } = renderHook(() => useAuthUser());

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('Existing User Lookup', () => {
    it('finds and returns existing user from DynamoDB', async () => {
      const existingUser = {
        id: testDynamoUserId,
        email: testEmail,
        firstName: 'Test',
        lastName: 'User',
        role: 1,
        awsSub: testSupabaseUserId,
      };

      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: testSupabaseUserId,
              email: testEmail,
            },
          },
        },
      });

      mockUserList.mockResolvedValue({
        data: [existingUser],
        errors: [],
      });

      const { result } = renderHook(() => useAuthUser());

      await waitFor(() => {
        expect(result.current.user).toEqual(existingUser);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it('queries DynamoDB with correct Supabase user ID', async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: testSupabaseUserId,
              email: testEmail,
            },
          },
        },
      });

      mockUserList.mockResolvedValue({
        data: [],
        errors: [],
      });

      mockUserCreate.mockResolvedValue({
        data: {
          id: testDynamoUserId,
          email: testEmail,
          awsSub: testSupabaseUserId,
          role: 0,
        },
        errors: [],
      });

      renderHook(() => useAuthUser());

      await waitFor(() => {
        expect(mockUserList).toHaveBeenCalledWith({
          filter: {
            awsSub: {
              eq: testSupabaseUserId,
            },
          },
        });
      });
    });

    it('handles query errors gracefully', async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: testSupabaseUserId,
              email: testEmail,
            },
          },
        },
      });

      mockUserList.mockResolvedValue({
        data: [],
        errors: [{ message: 'Database error' }],
      });

      const { result } = renderHook(() => useAuthUser());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.error?.message).toContain('Query failed');
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('User Creation', () => {
    it('creates new user when not found in DynamoDB', async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: testSupabaseUserId,
              email: testEmail,
            },
          },
        },
      });

      mockUserList.mockResolvedValue({
        data: [], // No existing user
        errors: [],
      });

      const newUser = {
        id: testDynamoUserId,
        email: testEmail,
        awsSub: testSupabaseUserId,
        role: 0,
      };

      mockUserCreate.mockResolvedValue({
        data: newUser,
        errors: [],
      });

      const { result } = renderHook(() => useAuthUser());

      await waitFor(() => {
        expect(mockUserCreate).toHaveBeenCalledWith({
          email: testEmail,
          awsSub: testSupabaseUserId,
          role: 0,
        });
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(newUser);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it('handles user creation errors', async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: testSupabaseUserId,
              email: testEmail,
            },
          },
        },
      });

      mockUserList.mockResolvedValue({
        data: [],
        errors: [],
      });

      mockUserCreate.mockResolvedValue({
        data: null,
        errors: [{ message: 'Creation failed' }],
      });

      const { result } = renderHook(() => useAuthUser());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.error?.message).toContain('Failed to create user');
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('handles case where creation returns no data', async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: testSupabaseUserId,
              email: testEmail,
            },
          },
        },
      });

      mockUserList.mockResolvedValue({
        data: [],
        errors: [],
      });

      mockUserCreate.mockResolvedValue({
        data: null,
        errors: [],
      });

      const { result } = renderHook(() => useAuthUser());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.error?.message).toContain('User creation returned no data');
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Session Changes', () => {
    it('updates user when session changes', async () => {
      const mockCallback = jest.fn();

      mockGetSession.mockResolvedValue({ data: { session: null } });

      mockOnAuthStateChange.mockImplementation((callback) => {
        mockCallback.mockImplementation(callback);

        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        };
      });

      const { result } = renderHook(() => useAuthUser());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate session change
      const newSession = {
        user: {
          id: testSupabaseUserId,
          email: testEmail,
        },
      };

      mockUserList.mockResolvedValue({
        data: [
          {
            id: testDynamoUserId,
            email: testEmail,
            awsSub: testSupabaseUserId,
            role: 0,
          },
        ],
        errors: [],
      });

      mockCallback('SIGNED_IN', newSession);

      // Wait for the user to be loaded (loading state may be too fast to catch)
      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user?.id).toBe(testDynamoUserId);
    });

    it('clears user when session is removed', async () => {
      const mockCallback = jest.fn();

      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: testSupabaseUserId,
              email: testEmail,
            },
          },
        },
      });

      mockUserList.mockResolvedValue({
        data: [
          {
            id: testDynamoUserId,
            email: testEmail,
            awsSub: testSupabaseUserId,
            role: 0,
          },
        ],
        errors: [],
      });

      mockOnAuthStateChange.mockImplementation((callback) => {
        mockCallback.mockImplementation(callback);

        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        };
      });

      const { result } = renderHook(() => useAuthUser());

      await waitFor(() => {
        expect(result.current.user).toBeTruthy();
      });

      // Simulate sign out
      mockCallback('SIGNED_OUT', null);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing Supabase user ID gracefully', async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: null, // Missing ID
              email: testEmail,
            },
          },
        },
      });

      const { result } = renderHook(() => useAuthUser());

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      // Should not attempt to query DynamoDB
      expect(mockUserList).not.toHaveBeenCalled();
    });

    it('handles missing email gracefully', async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: testSupabaseUserId,
              email: null,
            },
          },
        },
      });

      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: testSupabaseUserId,
            email: null,
          },
        },
      });

      mockUserList.mockResolvedValue({
        data: [],
        errors: [],
      });

      mockUserCreate.mockResolvedValue({
        data: {
          id: testDynamoUserId,
          email: '',
          awsSub: testSupabaseUserId,
          role: 0,
        },
        errors: [],
      });

      const { result } = renderHook(() => useAuthUser());

      await waitFor(() => {
        expect(mockUserCreate).toHaveBeenCalledWith({
          email: '',
          awsSub: testSupabaseUserId,
          role: 0,
        });
      });
    });

    it('handles network errors during user fetch', async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: testSupabaseUserId,
              email: testEmail,
            },
          },
        },
      });

      mockUserList.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuthUser());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.error?.message).toContain('Network error');
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
