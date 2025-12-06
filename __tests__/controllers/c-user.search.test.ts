import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/data';
import React from 'react';

import { useUserSearchQuery } from '../../src/controllers/c-user';

// Mock AWS Amplify
jest.mock('aws-amplify/data');

const mockGenerateClient = generateClient as jest.MockedFunction<typeof generateClient>;

describe.skip('useUserSearchQuery', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    jest.clearAllMocks();
  });

  it('should return empty array when search text is less than 2 characters', async () => {
    const { result } = renderHook(
      () =>
        useUserSearchQuery({
          searchText: 'a',
          currentUserId: 'user-1'
        }),
      { wrapper }
    );

    expect(result.current.data).toEqual([]);
  });

  it('should search users by first name', async () => {
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
        deletedAt: null
      },
      {
        id: 'user-2',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 0,
        awsSub: 'aws-2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null
      }
    ];

    mockGenerateClient.mockReturnValue({
      models: {
        User: {
          list: jest.fn().mockResolvedValue({
            data: mockUsers,
            errors: null
          })
        }
      }
    } as any);

    const { result } = renderHook(
      () =>
        useUserSearchQuery({
          searchText: 'john',
          currentUserId: 'user-3'
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      expect(result.current.data?.length).toBe(1);
      expect(result.current.data?.[0].firstName).toBe('John');
    });
  });

  it('should search users by last name', async () => {
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
        deletedAt: null
      },
      {
        id: 'user-2',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 0,
        awsSub: 'aws-2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null
      }
    ];

    mockGenerateClient.mockReturnValue({
      models: {
        User: {
          list: jest.fn().mockResolvedValue({
            data: mockUsers,
            errors: null
          })
        }
      }
    } as any);

    const { result } = renderHook(
      () =>
        useUserSearchQuery({
          searchText: 'smith',
          currentUserId: 'user-3'
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      expect(result.current.data?.length).toBe(1);
      expect(result.current.data?.[0].lastName).toBe('Smith');
    });
  });

  it('should search users by email', async () => {
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
        deletedAt: null
      },
      {
        id: 'user-2',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 0,
        awsSub: 'aws-2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null
      }
    ];

    mockGenerateClient.mockReturnValue({
      models: {
        User: {
          list: jest.fn().mockResolvedValue({
            data: mockUsers,
            errors: null
          })
        }
      }
    } as any);

    const { result } = renderHook(
      () =>
        useUserSearchQuery({
          searchText: 'john@example',
          currentUserId: 'user-3'
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      expect(result.current.data?.length).toBe(1);
      expect(result.current.data?.[0].email).toBe('john@example.com');
    });
  });

  it('should prioritize exact matches over partial matches', async () => {
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
        deletedAt: null
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
        deletedAt: null
      }
    ];

    mockGenerateClient.mockReturnValue({
      models: {
        User: {
          list: jest.fn().mockResolvedValue({
            data: mockUsers,
            errors: null
          })
        }
      }
    } as any);

    const { result } = renderHook(
      () =>
        useUserSearchQuery({
          searchText: 'john',
          currentUserId: 'user-3'
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      expect(result.current.data?.length).toBe(2);
      expect(result.current.data?.[0].firstName).toBe('John');
      expect(result.current.data?.[1].firstName).toBe('Johnny');
    });
  });

  it('should filter out current user from results', async () => {
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
        deletedAt: null
      },
      {
        id: 'user-2',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 0,
        awsSub: 'aws-2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null
      }
    ];

    mockGenerateClient.mockReturnValue({
      models: {
        User: {
          list: jest.fn().mockResolvedValue({
            data: mockUsers,
            errors: null
          })
        }
      }
    } as any);

    const { result } = renderHook(
      () =>
        useUserSearchQuery({
          searchText: 'jo',
          currentUserId: 'user-1'
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      expect(result.current.data?.length).toBe(0);
    });
  });

  it('should filter out deleted users', async () => {
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
        deletedAt: new Date().toISOString()
      },
      {
        id: 'user-2',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 0,
        awsSub: 'aws-2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null
      }
    ];

    mockGenerateClient.mockReturnValue({
      models: {
        User: {
          list: jest.fn().mockResolvedValue({
            data: mockUsers,
            errors: null
          })
        }
      }
    } as any);

    const { result } = renderHook(
      () =>
        useUserSearchQuery({
          searchText: 'jo',
          currentUserId: 'user-3'
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      expect(result.current.data?.length).toBe(0);
    });
  });

  it('should handle word boundary matches (first and last name)', async () => {
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
        deletedAt: null
      }
    ];

    mockGenerateClient.mockReturnValue({
      models: {
        User: {
          list: jest.fn().mockResolvedValue({
            data: mockUsers,
            errors: null
          })
        }
      }
    } as any);

    const { result } = renderHook(
      () =>
        useUserSearchQuery({
          searchText: 'j d',
          currentUserId: 'user-3'
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      expect(result.current.data?.length).toBe(1);
      expect(result.current.data?.[0].firstName).toBe('John');
    });
  });
});
