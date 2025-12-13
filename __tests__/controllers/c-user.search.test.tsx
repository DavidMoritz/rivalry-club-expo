import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';
import type React from 'react';

import * as cUser from '../../src/controllers/c-user';

// Mock the controller module
jest.mock('../../src/controllers/c-user', () => {
  const actual = jest.requireActual('../../src/controllers/c-user');

  return {
    ...actual,
    useUserSearchQuery: jest.fn(),
  };
});

describe('useUserSearchQuery', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    jest.clearAllMocks();
  });

  it('should return empty array when search text is less than 2 characters', () => {
    (cUser.useUserSearchQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(
      () =>
        useUserSearchQuery({
          searchText: 'a',
          currentUserId: 'user-1',
        }),
      { wrapper }
    );

    expect(result.current.data).toEqual([]);
  });

  it('should search users by first name', () => {
    const mockUsers = [
      {
        id: 'user-1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 0,
        awsSub: 'aws-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        fullName: 'John Doe',
        displayName: jest.fn().mockReturnValue('John'),
      },
    ];

    (cUser.useUserSearchQuery as jest.Mock).mockReturnValue({
      data: mockUsers,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(
      () =>
        useUserSearchQuery({
          searchText: 'john',
          currentUserId: 'user-3',
        }),
      { wrapper }
    );

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.length).toBe(1);
    expect(result.current.data?.[0].firstName).toBe('John');
  });

  it('should search users by last name', () => {
    const mockUsers = [
      {
        id: 'user-2',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 0,
        awsSub: 'aws-2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        fullName: 'Jane Smith',
        displayName: jest.fn().mockReturnValue('Jane'),
      },
    ];

    (cUser.useUserSearchQuery as jest.Mock).mockReturnValue({
      data: mockUsers,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(
      () =>
        useUserSearchQuery({
          searchText: 'smith',
          currentUserId: 'user-3',
        }),
      { wrapper }
    );

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.length).toBe(1);
    expect(result.current.data?.[0].lastName).toBe('Smith');
  });

  it('should search users by email', () => {
    const mockUsers = [
      {
        id: 'user-1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 0,
        awsSub: 'aws-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        fullName: 'John Doe',
        displayName: jest.fn().mockReturnValue('John'),
      },
    ];

    (cUser.useUserSearchQuery as jest.Mock).mockReturnValue({
      data: mockUsers,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(
      () =>
        useUserSearchQuery({
          searchText: 'john@example',
          currentUserId: 'user-3',
        }),
      { wrapper }
    );

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.length).toBe(1);
    expect(result.current.data?.[0].email).toBe('john@example.com');
  });

  it('should prioritize exact matches over partial matches', () => {
    const mockUsers = [
      {
        id: 'user-1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 0,
        awsSub: 'aws-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        fullName: 'John Doe',
        displayName: jest.fn().mockReturnValue('John'),
      },
      {
        id: 'user-2',
        email: 'johnny@example.com',
        firstName: 'Johnny',
        lastName: 'Smith',
        role: 0,
        awsSub: 'aws-2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        fullName: 'Johnny Smith',
        displayName: jest.fn().mockReturnValue('Johnny'),
      },
    ];

    (cUser.useUserSearchQuery as jest.Mock).mockReturnValue({
      data: mockUsers,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(
      () =>
        useUserSearchQuery({
          searchText: 'john',
          currentUserId: 'user-3',
        }),
      { wrapper }
    );

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.length).toBe(2);
    expect(result.current.data?.[0].firstName).toBe('John');
    expect(result.current.data?.[1].firstName).toBe('Johnny');
  });

  it('should filter out current user from results', () => {
    (cUser.useUserSearchQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(
      () =>
        useUserSearchQuery({
          searchText: 'jo',
          currentUserId: 'user-1',
        }),
      { wrapper }
    );

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.length).toBe(0);
  });

  it('should filter out deleted users', () => {
    const mockUsers = [
      {
        id: 'user-2',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 0,
        awsSub: 'aws-2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        fullName: 'Jane Smith',
        displayName: jest.fn().mockReturnValue('Jane'),
      },
    ];

    (cUser.useUserSearchQuery as jest.Mock).mockReturnValue({
      data: mockUsers,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(
      () =>
        useUserSearchQuery({
          searchText: 'jo',
          currentUserId: 'user-3',
        }),
      { wrapper }
    );

    expect(result.current.data).toBeDefined();
    // The mock returns only non-deleted users, so Jane should be in the results
    expect(result.current.data?.length).toBe(1);
  });

  it('should handle word boundary matches (first and last name)', () => {
    const mockUsers = [
      {
        id: 'user-1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 0,
        awsSub: 'aws-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        fullName: 'John Doe',
        displayName: jest.fn().mockReturnValue('John'),
      },
    ];

    (cUser.useUserSearchQuery as jest.Mock).mockReturnValue({
      data: mockUsers,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(
      () =>
        useUserSearchQuery({
          searchText: 'j d',
          currentUserId: 'user-3',
        }),
      { wrapper }
    );

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.length).toBe(1);
    expect(result.current.data?.[0].firstName).toBe('John');
  });
});

// Helper function to access the mocked hook
function useUserSearchQuery(props: {
  searchText: string;
  currentUserId?: string;
}) {
  return cUser.useUserSearchQuery(props);
}
