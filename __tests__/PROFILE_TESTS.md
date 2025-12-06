# Profile Onboarding Flow - Test Documentation

This document describes the comprehensive test suite for the profile onboarding flow.

## Test Files Created

### 1. `app/__tests__/auth.test.tsx`
**Purpose**: Tests the authentication route's profile checking logic

**Coverage**:
- ✅ User with complete profile redirects to `/rivalries`
- ✅ User with incomplete profile redirects to `/profile`
- ✅ New user (not in database) redirects to `/profile`
- ✅ Empty firstName redirects to `/profile`
- ✅ Whitespace-only firstName redirects to `/profile`
- ✅ Null firstName redirects to `/profile`
- ✅ Database errors default to `/rivalries` (failsafe)
- ✅ GraphQL errors default to `/rivalries` (failsafe)
- ✅ Auth state changes trigger profile checks
- ✅ No redirect when no session exists

**Test Count**: ~10 test cases

---

### 2. `src/components/screens/__tests__/Profile.test.tsx`
**Purpose**: Tests the Profile component functionality

**Coverage**:

#### Loading State
- ✅ Shows loading indicator while user data loads

#### New User Flow
- ✅ Shows welcome message for users without firstName
- ✅ Shows welcome message for empty string firstName
- ✅ Redirects to `/rivalries` after profile completion (1s delay)
- ✅ Does not show welcome message for existing users

#### Existing User Flow
- ✅ Pre-fills form with existing user data
- ✅ Does not redirect after update (no auto-redirect for existing users)
- ✅ Clears success message after 3 seconds

#### Form Validation
- ✅ Shows error when firstName is empty
- ✅ Shows error when lastName is empty
- ✅ Trims whitespace before validation
- ✅ Trims whitespace before saving to database
- ✅ Validates both firstName and lastName are required

#### Password Change
- ✅ Validates all password fields are filled
- ✅ Validates new passwords match
- ✅ Validates password minimum length (8 characters)
- ✅ Successfully changes password
- ✅ Clears password fields after successful change
- ✅ Shows error on password change failure

#### Error Handling
- ✅ Displays error message when update fails (GraphQL errors)
- ✅ Handles update exceptions gracefully
- ✅ Shows meaningful error messages to user

#### UI Elements
- ✅ Displays email as read-only field
- ✅ Shows "Updating..." state during save
- ✅ Shows "Changing..." state during password change
- ✅ Displays success messages with appropriate styling

**Test Count**: ~25 test cases

---

### 3. `app/__tests__/rivalries.test.tsx`
**Purpose**: Tests the rivalries route guard

**Coverage**:

#### Complete Profile Access
- ✅ Renders rivalries page for users with firstName
- ✅ Does not redirect for valid profiles

#### Incomplete Profile Guard
- ✅ Redirects to `/profile` when firstName is null
- ✅ Redirects to `/profile` when firstName is empty string
- ✅ Redirects to `/profile` when firstName is whitespace-only

#### Loading State
- ✅ Does not redirect while user data is loading
- ✅ Waits for loading to complete before checking profile

#### Edge Cases
- ✅ Does not redirect when user is null and not loading
- ✅ Handles error state gracefully (no redirect)
- ✅ Only redirects once even on re-renders

#### Console Logging
- ✅ Logs when redirecting user without name

**Test Count**: ~11 test cases

---

### 4. `__tests__/integration/profile-onboarding.test.ts`
**Purpose**: Integration tests for the complete onboarding flow

**Coverage**:

#### New User Journey
- ✅ Complete flow: auth → profile → rivalries
- ✅ Prevents direct navigation to `/rivalries` without profile
- ✅ Step-by-step validation of entire flow

#### Existing User Journey
- ✅ Allows immediate access to rivalries
- ✅ Updates profile without redirect
- ✅ No welcome message for existing users

#### Edge Cases
- ✅ Handles whitespace-only firstName
- ✅ Handles empty string firstName
- ✅ Requires both first and last name
- ✅ Validates multiple edge case scenarios

#### Database Error Scenarios
- ✅ Defaults to `/rivalries` on error (failsafe)
- ✅ Shows error but allows retry on update failure

#### Timing & Async Behavior
- ✅ 1-second delay before redirecting new users
- ✅ No delay for existing users
- ✅ Proper async handling

#### Data Trimming
- ✅ Trims whitespace before saving
- ✅ Validates after trimming
- ✅ Ensures clean data in database

#### Session Persistence
- ✅ Checks profile on auth state changes
- ✅ Checks profile on initial session load
- ✅ Handles logout/login cycles

#### UI/UX Behavior
- ✅ Welcome message only for new users
- ✅ Form pre-fills with existing data
- ✅ Success message before redirect

**Test Count**: ~22 test cases

---

## Total Test Coverage

**Total Test Files**: 4
**Total Test Cases**: ~68 test cases

## Running the Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test auth.test.tsx
npm test Profile.test.tsx
npm test rivalries.test.tsx
npm test profile-onboarding.test.ts

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

## Test Categories

### Unit Tests (45 tests)
- Component rendering and behavior
- Form validation logic
- Error handling
- State management
- UI element presence and styling

### Integration Tests (23 tests)
- Complete user flows
- Multi-step processes
- Edge case scenarios
- Error recovery paths
- Session management

## Key Testing Patterns Used

1. **Mocking External Dependencies**
   - `expo-router` for navigation
   - `aws-amplify/data` for database queries
   - `supabase` for authentication
   - `useAuthUser` hook for user data

2. **Async Testing**
   - `waitFor` for async operations
   - Promise resolution/rejection
   - Timer mocking for delays

3. **State Verification**
   - Component rendering
   - Navigation calls
   - Database mutations
   - Error states

4. **User Interaction Simulation**
   - Form input changes
   - Button presses
   - Navigation events

## Edge Cases Covered

✅ Null values
✅ Empty strings
✅ Whitespace-only strings
✅ Database errors
✅ Network errors
✅ GraphQL errors
✅ Loading states
✅ Re-renders
✅ Session changes
✅ Direct navigation attempts

## Success Criteria

All tests validate that:
1. New users are directed to complete their profile
2. Existing users have seamless access
3. Profile completion triggers appropriate navigation
4. Guards prevent unauthorized access
5. Errors are handled gracefully
6. User experience is smooth and intuitive
7. Data validation is comprehensive
8. Security boundaries are maintained

## Maintenance Notes

When updating the profile flow:
1. Update corresponding tests
2. Ensure all navigation paths are tested
3. Validate error handling
4. Check async timing assumptions
5. Verify mocks match implementation
