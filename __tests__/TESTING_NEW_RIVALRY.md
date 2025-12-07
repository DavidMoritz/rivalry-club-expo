# Testing: New Rivalry Workflow

This document describes the tests for the new rivalry creation and acceptance workflow.

## Overview

The new rivalry workflow consists of several key features:
1. **User Search** - Intelligent search to find users by name or email
2. **Rivalry Creation** - Initiating a rivalry with another user
3. **Pending Rivalries** - Viewing rivalries awaiting acceptance
4. **Rivalry Acceptance** - Accepting a rivalry invitation

## Test Files

### Unit Tests

#### `__tests__/controllers/c-user.search.test.ts`
Tests the intelligent user search functionality:
- ✅ Returns empty array for search text < 2 characters
- ✅ Searches by first name, last name, and email
- ✅ Prioritizes exact matches over partial matches
- ✅ Filters out current user from results
- ✅ Filters out deleted users
- ✅ Handles word boundary matches (e.g., "j d" matches "John Doe")

#### `__tests__/controllers/c-rivalry.create.test.ts`
Tests rivalry creation mutation:
- ✅ Creates rivalry with `accepted: false`
- ✅ Creates tier lists for both users
- ✅ Creates tier slots for all fighters for both users
- ✅ Handles errors when rivalry creation fails
- ✅ Handles errors when no fighters exist for game
- ✅ Invalidates queries after successful creation

#### `__tests__/controllers/c-rivalry.pending.test.ts`
Tests fetching pending rivalries:
- ✅ Returns empty arrays when userId is not provided
- ✅ Fetches rivalries awaiting acceptance (user is UserB)
- ✅ Fetches initiated rivalries (user is UserA)
- ✅ Filters rivalries by `accepted: false`
- ✅ Converts rivalries to MRivalry models
- ✅ Handles errors gracefully

#### `__tests__/controllers/c-rivalry.accept.test.ts`
Tests rivalry acceptance mutation:
- ✅ Updates rivalry `accepted` field to true
- ✅ Handles errors when update fails
- ✅ Invalidates pending rivalries queries after successful acceptance
- ✅ Does not call onSuccess when update fails

### Integration Tests

#### `__tests__/workflows/create-rivalry.integration.test.tsx`
Tests the complete rivalry creation workflow:
- ✅ Full workflow: search → select user → create rivalry → navigate back
- ✅ Displays error when rivalry creation fails
- ✅ Prevents creation without selecting a user

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test c-user.search.test
npm test c-rivalry.create.test
npm test c-rivalry.pending.test
npm test c-rivalry.accept.test
npm test create-rivalry.integration.test
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

## Manual Testing Checklist

Before deploying, manually test the following scenarios:

### User Search
- [ ] Search with < 2 characters shows no results
- [ ] Search by first name finds correct users
- [ ] Search by last name finds correct users
- [ ] Search by email finds correct users
- [ ] Search by partial names works (e.g., "jo" finds "John")
- [ ] Search results are ordered by relevance
- [ ] Current user does not appear in search results

### Rivalry Creation
- [ ] Can select a user from search results
- [ ] Selected user is highlighted
- [ ] "Initiate Rivalry" button appears when user is selected
- [ ] Button shows loading state during creation
- [ ] Success: Navigates back to rivalries list
- [ ] Error: Shows error message and stays on screen
- [ ] Console logs show creation progress

### Pending Rivalries
- [ ] Pending Rivalries menu item appears in hamburger menu
- [ ] Screen shows two sections: "Awaiting Your Acceptance" and "Sent By You"
- [ ] Rivalries where current user is UserB appear in "Awaiting Your Acceptance"
- [ ] Rivalries where current user is UserA appear in "Sent By You"
- [ ] Empty state shows when no pending rivalries exist
- [ ] User names display correctly

### Rivalry Acceptance
- [ ] "Accept" button appears for rivalries awaiting acceptance
- [ ] Button shows loading state during acceptance
- [ ] Success: Rivalry moves from pending to active list
- [ ] Error: Shows error message
- [ ] Accepted rivalry appears in main rivalries list

### Schema Changes
- [ ] Schema has been deployed (`npx ampx sandbox` or `amplify push`)
- [ ] `accepted` field exists on Rivalry model
- [ ] New rivalries have `accepted: false`
- [ ] Accepted rivalries have `accepted: true`

## Debugging

If the rivalry creation doesn't work:

1. **Check console logs** - The mutation includes detailed logging:
   ```
   [CreateRivalry] Creating rivalry: { userAId, userBId, gameId }
   [useCreateRivalryMutation] Creating rivalry: { ... }
   [useCreateRivalryMutation] Rivalry created: <id>
   [useCreateRivalryMutation] Found fighters: <count>
   [useCreateRivalryMutation] Tier lists created
   [useCreateRivalryMutation] Tier slots created: <count>
   ```

2. **Common issues**:
   - **No fighters for game**: Check that the game has fighters in the database
   - **Schema not deployed**: Run `npx ampx sandbox` to deploy schema changes
   - **Missing game context**: Ensure GameProvider is wrapping the route
   - **Missing user data**: Verify user is authenticated and has ID

3. **Check errors in console**:
   - GraphQL errors will be logged with `[useCreateRivalryMutation]` prefix
   - Component errors will be logged with `[CreateRivalry]` prefix

## Test Coverage Goals

- **Unit Tests**: >80% coverage for all controller functions
- **Integration Tests**: Cover main user workflows
- **Edge Cases**: Handle all error scenarios

## Future Test Additions

Consider adding tests for:
- [ ] Multiple pending rivalries from same user
- [ ] Rivalry creation with duplicate users
- [ ] Network errors during creation
- [ ] Concurrent rivalry creation attempts
- [ ] Large number of fighters (performance)
