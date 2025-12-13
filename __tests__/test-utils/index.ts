/**
 * Test Utilities Index
 *
 * Central export point for all test utilities.
 * Import from this file to get access to all testing helpers.
 *
 * @example
 * import {
 *   waitForQuerySuccess,
 *   createMockUser,
 *   TEST_TIMEOUTS
 * } from '../test-utils';
 */

// API testing helpers
export {
  createGraphQLListResponse,
  createGraphQLResponse,
  createMockAsyncGenerator,
  createMockAsyncGeneratorFromArray,
  createTestQueryWrapper,
  DEFAULT_WAIT_FOR_OPTIONS,
  expectGraphQLMutationCall,
  expectGraphQLQueryCall,
  isGraphQLError,
  resetMockGraphQLClient,
  spyOnConsole,
  TEST_TIMEOUTS,
  waitForError,
  waitForMockCall,
  waitForMultipleQueries,
  waitForMutationSuccess,
  waitForQuerySuccess,
} from './api-test-helpers';

// Mock factories
export {
  createMockAPIResponse,
  createMockConnection,
  createMockContest,
  createMockFighter,
  createMockGame,
  createMockGraphQLClient,
  createMockRivalry,
  createMockRivalryWithData,
  createMockTierList,
  createMockTierListWithSlots,
  createMockTierSlot,
  createMockUser,
} from './mock-factories';
