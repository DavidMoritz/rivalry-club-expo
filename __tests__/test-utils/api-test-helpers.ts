/**
 * API Testing Utilities
 *
 * Provides standardized helpers for testing GraphQL and REST API interactions
 * with React Query hooks in the Rivalry Club application.
 */

import { waitFor } from '@testing-library/react-native';

/**
 * Standard timeout values for different types of operations
 */
export const TEST_TIMEOUTS = {
  /** Fast operations (state updates, synchronous mock calls) */
  FAST: 1000,

  /** Standard queries (database reads, simple API calls) */
  QUERY: 3000,

  /** Complex mutations (multiple operations, batch updates) */
  MUTATION: 5000,

  /** Integration tests (full workflows, multi-step operations) */
  INTEGRATION: 10_000,

  /** Element rendering and UI updates */
  ELEMENT_RENDER: 3000,
} as const;

/**
 * Default waitFor options with helpful debugging
 */
export const DEFAULT_WAIT_FOR_OPTIONS = {
  timeout: TEST_TIMEOUTS.QUERY,
  onTimeout: (error: Error) => {
    console.error('waitFor timed out:', error);

    return error;
  },
} as const;

/**
 * Helper to wait for a React Query query to succeed
 * Automatically checks for error state and provides helpful error messages
 *
 * @param result - The result object from renderHook
 * @param options - Optional configuration
 *
 * @example
 * const { result } = renderHook(() => useMyQuery(), { wrapper });
 * await waitForQuerySuccess(result);
 * expect(result.current.data).toBeDefined();
 */
export async function waitForQuerySuccess<T>(
  result: {
    current: {
      isSuccess: boolean;
      isError: boolean;
      error?: Error;
      status?: string;
    };
  },
  options?: { timeout?: number }
) {
  await waitFor(
    () => {
      if (result.current.isError) {
        throw new Error(
          `Expected query success but got error: ${result.current.error?.message || 'Unknown error'}`
        );
      }
      expect(result.current.isSuccess).toBe(true);
    },
    {
      timeout: options?.timeout || TEST_TIMEOUTS.QUERY,
      onTimeout: () => {
        console.error('Query failed to succeed:');
        console.error('  Status:', result.current.status);
        console.error('  IsError:', result.current.isError);
        console.error('  Error:', result.current.error);

        return new Error(
          `Query did not succeed. Status: ${result.current.status}`
        );
      },
    }
  );
}

/**
 * Helper to wait for a React Query mutation to succeed
 * Automatically checks for error state and provides helpful error messages
 *
 * @param result - The result object from renderHook
 * @param options - Optional configuration
 *
 * @example
 * const { result } = renderHook(() => useMyMutation(), { wrapper });
 * result.current.mutate(data);
 * await waitForMutationSuccess(result);
 */
export async function waitForMutationSuccess<T>(
  result: { current: { isSuccess: boolean; isError: boolean; error?: Error } },
  options?: { timeout?: number }
) {
  await waitFor(
    () => {
      if (result.current.isError) {
        throw new Error(
          `Expected mutation success but got error: ${result.current.error?.message || 'Unknown error'}`
        );
      }
      expect(result.current.isSuccess).toBe(true);
    },
    { timeout: options?.timeout || TEST_TIMEOUTS.MUTATION }
  );
}

/**
 * Helper to wait for a React Query operation to fail with an error
 *
 * @param result - The result object from renderHook
 * @param options - Optional configuration
 *
 * @example
 * const { result } = renderHook(() => useMyQuery(), { wrapper });
 * await waitForError(result);
 * expect(result.current.error).toBeDefined();
 */
export async function waitForError<T>(
  result: { current: { isError: boolean; error?: Error } },
  options?: { timeout?: number }
) {
  await waitFor(() => expect(result.current.isError).toBe(true), {
    timeout: options?.timeout || TEST_TIMEOUTS.QUERY,
  });
}

/**
 * Helper to wait for a mock function to be called with specific arguments
 *
 * @param mockFn - The Jest mock function
 * @param expectedArgs - Optional expected arguments
 * @param options - Optional configuration
 *
 * @example
 * await waitForMockCall(mockCreateMutation, { userId: 'user-1' });
 */
export async function waitForMockCall(
  mockFn: jest.Mock,
  expectedArgs?: any,
  options?: { timeout?: number; times?: number }
) {
  await waitFor(
    () => {
      const times = options?.times || 1;
      expect(mockFn).toHaveBeenCalledTimes(times);

      if (expectedArgs !== undefined) {
        expect(mockFn).toHaveBeenCalledWith(
          expect.objectContaining(expectedArgs)
        );
      }
    },
    { timeout: options?.timeout || TEST_TIMEOUTS.FAST }
  );
}

/**
 * GraphQL response builder for consistent mock responses
 *
 * @example
 * mockApi.mockResolvedValue(createGraphQLResponse(mockData));
 * mockApi.mockResolvedValue(createGraphQLResponse(null, [{ message: 'Error' }]));
 */
export function createGraphQLResponse<T>(
  data: T | null,
  errors?: Array<{ message: string }> | null
) {
  return {
    data,
    errors: errors || null,
  };
}

/**
 * Creates a mock GraphQL list response with pagination
 *
 * @example
 * mockApi.mockResolvedValue(createGraphQLListResponse(mockItems, 'nextToken123'));
 */
export function createGraphQLListResponse<T>(
  items: T[],
  nextToken?: string | null
) {
  return {
    data: items,
    errors: null,
    nextToken: nextToken || null,
  };
}

/**
 * Helper to create a mock async generator for GraphQL Gen 2 relationships
 * Used for mocking LazyLoader fields in Amplify Gen 2
 *
 * @example
 * const mockRivalry = {
 *   id: 'rivalry-1',
 *   contests: createMockAsyncGenerator([contest1, contest2]),
 *   tierLists: createMockAsyncGenerator([tierList1, tierList2])
 * };
 */
export async function* createMockAsyncGenerator<T>(items: T[]) {
  for (const item of items) {
    yield item;
  }
}

/**
 * Type guard to check if a value is a GraphQL error response
 */
export function isGraphQLError(
  response: any
): response is { errors: Array<{ message: string }> } {
  return (
    response && Array.isArray(response.errors) && response.errors.length > 0
  );
}

/**
 * Helper to verify GraphQL mutation was called correctly
 * Checks both that the mutation was called and with the right arguments
 */
export function expectGraphQLMutationCall(
  mockMutation: jest.Mock,
  expectedInput: any,
  options?: { times?: number }
) {
  const times = options?.times || 1;
  expect(mockMutation).toHaveBeenCalledTimes(times);
  expect(mockMutation).toHaveBeenCalledWith(
    expect.objectContaining(expectedInput)
  );
}

/**
 * Helper to verify GraphQL query was called correctly
 * Can check for filter parameters, selection sets, etc.
 */
export function expectGraphQLQueryCall(
  mockQuery: jest.Mock,
  expectedParams?: {
    filter?: any;
    limit?: number;
    selectionSet?: string[];
  },
  options?: { times?: number }
) {
  const times = options?.times || 1;
  expect(mockQuery).toHaveBeenCalledTimes(times);

  if (expectedParams) {
    const callArgs = mockQuery.mock.calls[mockQuery.mock.calls.length - 1];

    if (expectedParams.filter) {
      expect(callArgs[0]?.filter || callArgs[0]).toMatchObject(
        expectedParams.filter
      );
    }

    if (expectedParams.selectionSet) {
      expect(callArgs[1]?.selectionSet).toEqual(expectedParams.selectionSet);
    }

    if (expectedParams.limit !== undefined) {
      expect(callArgs[0]?.limit || callArgs.limit).toBe(expectedParams.limit);
    }
  }
}

/**
 * Creates a standardized test wrapper with QueryClient
 * Use this in beforeEach to ensure consistent React Query configuration
 *
 * @example
 * const { wrapper, queryClient } = createTestQueryWrapper();
 */
export function createTestQueryWrapper() {
  const { QueryClient, QueryClientProvider } = require('@tanstack/react-query');
  const React = require('react');

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {
        // Suppress error logs in tests unless needed
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  return { wrapper, queryClient };
}

/**
 * Helper to create mock async generators for testing Amplify Gen 2 relationships
 * Supports multiple yields for testing iteration
 *
 * @example
 * const mockTierLists = createMockAsyncGeneratorFromArray([tierList1, tierList2]);
 * for await (const tierList of mockTierLists) {
 *   console.log(tierList);
 * }
 */
export function createMockAsyncGeneratorFromArray<T>(
  items: T[]
): AsyncGenerator<T> {
  return createMockAsyncGenerator(items);
}

/**
 * Helper to wait for multiple queries to complete
 * Useful when testing components that fetch multiple resources
 *
 * @example
 * await waitForMultipleQueries([result1, result2, result3]);
 */
export async function waitForMultipleQueries(
  results: Array<{
    current: { isSuccess: boolean; isError: boolean; error?: Error };
  }>,
  options?: { timeout?: number }
) {
  await Promise.all(
    results.map(result => waitForQuerySuccess(result, options))
  );
}

/**
 * Helper to reset all mocks in a GraphQL client mock
 * Useful in beforeEach to ensure clean state
 *
 * @example
 * const mockClient = createMockGraphQLClient();
 * resetMockGraphQLClient(mockClient);
 */
export function resetMockGraphQLClient(mockClient: any) {
  Object.values(mockClient.models).forEach((model: any) => {
    Object.values(model).forEach((method: any) => {
      if (typeof method.mockReset === 'function') {
        method.mockReset();
      }
    });
  });
}

/**
 * Helper to create a spy on console methods for testing error/warning output
 * Automatically restores the original method after test
 *
 * @example
 * const errorSpy = spyOnConsole('error');
 * // ... code that logs errors
 * expect(errorSpy).toHaveBeenCalledWith('Error message');
 * errorSpy.mockRestore();
 */
export function spyOnConsole(method: 'log' | 'warn' | 'error' | 'info') {
  return jest.spyOn(console, method).mockImplementation(() => {});
}
