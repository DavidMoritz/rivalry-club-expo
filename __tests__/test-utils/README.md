# Test Utilities - User Guide

This directory contains reusable testing utilities for the Rivalry Club Expo application. These utilities standardize API mocking, async testing, and test data creation.

---

## Quick Start

```typescript
import {
  waitForQuerySuccess,
  createMockUser,
  createMockRivalry,
  TEST_TIMEOUTS,
  createGraphQLResponse
} from '../test-utils';

describe('MyComponent', () => {
  it('should fetch user data', async () => {
    // Create mock data
    const mockUser = createMockUser({ firstName: 'John' });

    // Setup mock response
    mockUserGet.mockResolvedValue(createGraphQLResponse(mockUser));

    // Render hook
    const { result } = renderHook(() => useUserQuery(), { wrapper });

    // Wait for success
    await waitForQuerySuccess(result);

    // Verify
    expect(result.current.data).toEqual(mockUser);
  });
});
```

---

## Table of Contents

1. [API Test Helpers](#api-test-helpers)
2. [Mock Factories](#mock-factories)
3. [Common Patterns](#common-patterns)
4. [Migration Guide](#migration-guide)

---

## API Test Helpers

### Timeout Constants

Use standardized timeouts instead of arbitrary values:

```typescript
import { TEST_TIMEOUTS } from '../test-utils';

// Available timeouts:
TEST_TIMEOUTS.FAST          // 1000ms - Fast operations
TEST_TIMEOUTS.QUERY         // 3000ms - Standard queries
TEST_TIMEOUTS.MUTATION      // 5000ms - Complex mutations
TEST_TIMEOUTS.INTEGRATION   // 10000ms - Integration tests
TEST_TIMEOUTS.ELEMENT_RENDER // 3000ms - UI element rendering
```

**Before**:
```typescript
await waitFor(() => expect(result.current.isSuccess).toBe(true), {
  timeout: 3000  // ❌ Magic number
});
```

**After**:
```typescript
await waitFor(() => expect(result.current.isSuccess).toBe(true), {
  timeout: TEST_TIMEOUTS.QUERY  // ✅ Clear intent
});
```

---

### Async Waiting Helpers

#### `waitForQuerySuccess()`

Wait for a React Query query to succeed, with automatic error checking:

```typescript
import { waitForQuerySuccess } from '../test-utils';

const { result } = renderHook(() => useMyQuery(), { wrapper });

await waitForQuerySuccess(result);
// Automatically fails if query errors
// Provides helpful error messages on timeout
```

**With custom timeout**:
```typescript
await waitForQuerySuccess(result, { timeout: TEST_TIMEOUTS.INTEGRATION });
```

---

#### `waitForMutationSuccess()`

Wait for a React Query mutation to succeed:

```typescript
import { waitForMutationSuccess } from '../test-utils';

const { result } = renderHook(() => useMyMutation(), { wrapper });

result.current.mutate(data);

await waitForMutationSuccess(result);
```

---

#### `waitForError()`

Wait for an operation to fail with an error:

```typescript
import { waitForError } from '../test-utils';

mockApi.mockResolvedValue(
  createGraphQLResponse(null, [{ message: 'Not found' }])
);

const { result } = renderHook(() => useMyQuery(), { wrapper });

await waitForError(result);

expect(result.current.error).toBeDefined();
```

---

#### `waitForMockCall()`

Wait for a mock function to be called:

```typescript
import { waitForMockCall } from '../test-utils';

// Wait for mock to be called
await waitForMockCall(mockCreateRivalry);

// Wait for mock with specific arguments
await waitForMockCall(mockCreateRivalry, { userId: 'user-1' });

// Wait for multiple calls
await waitForMockCall(mockCreateRivalry, null, { times: 2 });
```

---

### GraphQL Response Builders

#### `createGraphQLResponse()`

Create consistent GraphQL responses:

```typescript
import { createGraphQLResponse } from '../test-utils';

// Success response
mockApi.mockResolvedValue(createGraphQLResponse(mockData));

// Error response
mockApi.mockResolvedValue(
  createGraphQLResponse(null, [{ message: 'Error occurred' }])
);
```

---

#### `createGraphQLListResponse()`

Create list responses with pagination:

```typescript
import { createGraphQLListResponse } from '../test-utils';

mockApi.mockResolvedValue(
  createGraphQLListResponse([item1, item2], 'nextToken123')
);
```

---

#### `createMockAsyncGenerator()`

Create async generators for Amplify Gen 2 LazyLoader fields:

```typescript
import { createMockAsyncGenerator } from '../test-utils';

const mockRivalry = {
  id: 'rivalry-1',
  contests: createMockAsyncGenerator([contest1, contest2]),
  tierLists: createMockAsyncGenerator([tierList1, tierList2])
};
```

---

### Assertion Helpers

#### `expectGraphQLMutationCall()`

Verify a GraphQL mutation was called correctly:

```typescript
import { expectGraphQLMutationCall } from '../test-utils';

expectGraphQLMutationCall(mockCreateRivalry, {
  userAId: 'user-1',
  userBId: 'user-2',
  gameId: 'game-1'
});

// Verify multiple calls
expectGraphQLMutationCall(mockUpdate, { id: 'user-1' }, { times: 2 });
```

---

#### `expectGraphQLQueryCall()`

Verify a GraphQL query was called with correct parameters:

```typescript
import { expectGraphQLQueryCall } from '../test-utils';

expectGraphQLQueryCall(mockRivalryList, {
  filter: { userAId: { eq: 'user-1' } },
  limit: 100,
  selectionSet: ['id', 'userAId', 'gameId']
});
```

---

### Test Setup Helper

#### `createTestQueryWrapper()`

Create a standardized QueryClient and wrapper:

```typescript
import { createTestQueryWrapper } from '../test-utils';

describe('MyHook', () => {
  let queryClient: QueryClient;
  let wrapper: any;

  beforeEach(() => {
    const setup = createTestQueryWrapper();
    queryClient = setup.queryClient;
    wrapper = setup.wrapper;
  });

  it('should work', async () => {
    const { result } = renderHook(() => useMyHook(), { wrapper });
    // ...
  });
});
```

---

## Mock Factories

### User Mock

```typescript
import { createMockUser } from '../test-utils';

// With defaults
const user = createMockUser();

// With overrides
const john = createMockUser({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com'
});
```

---

### Game Mock

```typescript
import { createMockGame } from '../test-utils';

const game = createMockGame({
  name: 'Super Smash Bros. Ultimate'
});
```

---

### Fighter Mock

```typescript
import { createMockFighter } from '../test-utils';

const mario = createMockFighter({
  name: 'Mario',
  gameId: 'game-ssbu'
});
```

---

### Rivalry Mock

```typescript
import { createMockRivalry } from '../test-utils';

const rivalry = createMockRivalry({
  userAId: 'user-john',
  userBId: 'user-jane',
  gameId: 'game-ssbu',
  contestCount: 5
});
```

---

### Complex Rivalry with Data

Create a rivalry with tier lists, tier slots, and contests:

```typescript
import { createMockRivalryWithData } from '../test-utils';

const {
  rivalry,
  tierListA,
  tierListB,
  tierSlotsA,
  tierSlotsB,
  contests,
  fighters
} = createMockRivalryWithData({
  rivalryId: 'r-1',
  userAId: 'user-john',
  userBId: 'user-jane',
  fighters: [
    { id: 'f-1', name: 'Mario' },
    { id: 'f-2', name: 'Luigi' }
  ],
  contestCount: 3
});
```

---

### GraphQL Client Mock

```typescript
import { createMockGraphQLClient } from '../test-utils';

const mockClient = createMockGraphQLClient();

// Use individual mocks
mockClient.models.User.get.mockResolvedValue({ data: mockUser });
mockClient.models.Rivalry.list.mockResolvedValue({ data: [rivalry] });
```

---

### REST API Response Mocks

```typescript
import { createMockAPIResponse } from '../test-utils';

// Success response
mockAxios.post.mockResolvedValue(
  createMockAPIResponse.success({ id: '123' })
);

// Error response
mockAxios.post.mockResolvedValue(
  createMockAPIResponse.error('Not found', '404')
);

// Fighter update response
mockAxios.post.mockResolvedValue(
  createMockAPIResponse.updateFighter(true)
);
```

---

## Common Patterns

### Pattern 1: Testing a Query Hook

```typescript
import {
  waitForQuerySuccess,
  createMockUser,
  createGraphQLResponse
} from '../test-utils';

describe('useUserQuery', () => {
  it('should fetch user successfully', async () => {
    // Arrange
    const mockUser = createMockUser({ firstName: 'John' });
    mockUserGet.mockResolvedValue(createGraphQLResponse(mockUser));

    // Act
    const { result } = renderHook(() => useUserQuery('user-1'), { wrapper });

    // Assert
    await waitForQuerySuccess(result);
    expect(result.current.data).toEqual(mockUser);
  });

  it('should handle errors', async () => {
    // Arrange
    mockUserGet.mockResolvedValue(
      createGraphQLResponse(null, [{ message: 'User not found' }])
    );

    // Act
    const { result } = renderHook(() => useUserQuery('user-1'), { wrapper });

    // Assert
    await waitForError(result);
  });
});
```

---

### Pattern 2: Testing a Mutation Hook

```typescript
import {
  waitForMutationSuccess,
  createMockRivalry,
  createGraphQLResponse,
  expectGraphQLMutationCall
} from '../test-utils';

describe('useCreateRivalryMutation', () => {
  it('should create rivalry', async () => {
    // Arrange
    const mockRivalry = createMockRivalry();
    mockRivalryCreate.mockResolvedValue(createGraphQLResponse(mockRivalry));
    const onSuccess = jest.fn();

    // Act
    const { result } = renderHook(
      () => useCreateRivalryMutation({ onSuccess }),
      { wrapper }
    );

    result.current.mutate({
      userAId: 'user-1',
      userBId: 'user-2',
      gameId: 'game-1'
    });

    // Assert
    await waitForMutationSuccess(result);
    expect(onSuccess).toHaveBeenCalledWith(mockRivalry);
    expectGraphQLMutationCall(mockRivalryCreate, {
      userAId: 'user-1',
      userBId: 'user-2',
      gameId: 'game-1'
    });
  });
});
```

---

### Pattern 3: Testing Component with API

```typescript
import {
  createMockUser,
  createGraphQLResponse,
  TEST_TIMEOUTS
} from '../test-utils';

describe('ProfileComponent', () => {
  it('should display user profile', async () => {
    // Arrange
    const mockUser = createMockUser({ firstName: 'John', lastName: 'Doe' });
    mockUserGet.mockResolvedValue(createGraphQLResponse(mockUser));

    // Act
    const { findByText } = render(<ProfileComponent userId="user-1" />);

    // Assert
    const name = await findByText('John Doe', {}, {
      timeout: TEST_TIMEOUTS.ELEMENT_RENDER
    });
    expect(name).toBeTruthy();
  });
});
```

---

### Pattern 4: Testing Integration Flow

```typescript
import {
  createMockUser,
  createMockRivalry,
  createGraphQLResponse,
  waitForMockCall,
  TEST_TIMEOUTS
} from '../test-utils';

describe('Create Rivalry Flow', () => {
  it('should complete full workflow', async () => {
    // Setup mocks
    const mockUser = createMockUser({ firstName: 'Jane' });
    const mockRivalry = createMockRivalry();

    mockUserSearch.mockResolvedValue(
      createGraphQLResponse([mockUser])
    );
    mockRivalryCreate.mockResolvedValue(
      createGraphQLResponse(mockRivalry)
    );

    // Render and interact
    const { getByPlaceholderText } = render(<CreateRivalryScreen />);

    fireEvent.changeText(getByPlaceholderText('Search'), 'jane');

    const userItem = await screen.findByText('Jane');
    fireEvent.press(userItem);

    const createBtn = await screen.findByText('Create');
    fireEvent.press(createBtn);

    // Verify
    await waitForMockCall(
      mockRivalryCreate,
      { userBId: mockUser.id },
      { timeout: TEST_TIMEOUTS.INTEGRATION }
    );
  });
});
```

---

## Migration Guide

### Migrating Existing Tests

#### Step 1: Replace Timeout Values

**Before**:
```typescript
await waitFor(() => expect(result.current.isSuccess).toBe(true), {
  timeout: 3000
});
```

**After**:
```typescript
import { TEST_TIMEOUTS } from '../test-utils';

await waitFor(() => expect(result.current.isSuccess).toBe(true), {
  timeout: TEST_TIMEOUTS.QUERY
});
```

---

#### Step 2: Use Async Helpers

**Before**:
```typescript
await waitFor(() => {
  if (result.current.isError) {
    throw new Error(`Query failed: ${result.current.error}`);
  }
  expect(result.current.isSuccess).toBe(true);
}, { timeout: 3000 });
```

**After**:
```typescript
import { waitForQuerySuccess } from '../test-utils';

await waitForQuerySuccess(result);
```

---

#### Step 3: Use Mock Factories

**Before**:
```typescript
const mockUser = {
  id: 'user-123',
  email: 'test@test.com',
  firstName: 'Test',
  lastName: 'User',
  role: 1,
  awsSub: 'aws-sub-123',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  deletedAt: null
};
```

**After**:
```typescript
import { createMockUser } from '../test-utils';

const mockUser = createMockUser({
  firstName: 'Test',
  lastName: 'User'
});
```

---

#### Step 4: Use GraphQL Response Builders

**Before**:
```typescript
mockUserGet.mockResolvedValue({
  data: mockUser,
  errors: null
});
```

**After**:
```typescript
import { createGraphQLResponse } from '../test-utils';

mockUserGet.mockResolvedValue(createGraphQLResponse(mockUser));
```

---

## Best Practices

### ✅ Do's

- **Use mock factories** for consistent test data
- **Use standardized timeouts** for predictable tests
- **Test error states** alongside success states
- **Use async helpers** to reduce boilerplate
- **Clean up mocks** in `beforeEach()`

### ❌ Don'ts

- **Don't hard-code timeouts** without using constants
- **Don't duplicate mock data** across tests
- **Don't skip error testing**
- **Don't use real API calls** in unit tests
- **Don't forget to await** async operations

---

## Troubleshooting

### Issue: Tests timing out

**Solution**: Increase timeout using `TEST_TIMEOUTS` constants:

```typescript
await waitForQuerySuccess(result, {
  timeout: TEST_TIMEOUTS.INTEGRATION
});
```

---

### Issue: Mock not being called

**Solution**: Verify mock is set up correctly:

```typescript
// Check if mock was called
console.log('Mock calls:', mockUserGet.mock.calls);

// Use helper to wait for call
await waitForMockCall(mockUserGet);
```

---

### Issue: Async generator errors

**Solution**: Use `createMockAsyncGenerator()`:

```typescript
import { createMockAsyncGenerator } from '../test-utils';

const mockData = {
  id: 'rivalry-1',
  contests: createMockAsyncGenerator([contest1, contest2])
};
```

---

## Examples

See the following test files for examples:

- **Query Testing**: `__tests__/controllers/c-user.test.ts`
- **Mutation Testing**: `__tests__/controllers/c-rivalry.test.ts`
- **Integration Testing**: `__tests__/workflows/create-rivalry.integration.test.tsx`
- **Component Testing**: `src/components/screens/__tests__/Profile.test.tsx`

---

## Contributing

When adding new utilities:

1. Add to appropriate file (`api-test-helpers.ts` or `mock-factories.ts`)
2. Export from `index.ts`
3. Add documentation to this README
4. Add usage example
5. Update type definitions if needed

---

## Support

For questions or issues with test utilities:

1. Check this README
2. Review example test files
3. Consult `API_TESTING_REPORT.md` for patterns
4. Check Jest and React Testing Library docs

---

**Last Updated**: 2025-12-07
**Maintained By**: Development Team
