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
  TEST_TIMEOUTS,
  DEFAULT_WAIT_FOR_OPTIONS,
  waitForQuerySuccess,
  waitForMutationSuccess,
  waitForError,
  waitForMockCall,
  createGraphQLResponse,
  createGraphQLListResponse,
  createMockAsyncGenerator,
  createMockAsyncGeneratorFromArray,
  isGraphQLError,
  expectGraphQLMutationCall,
  expectGraphQLQueryCall,
  createTestQueryWrapper,
  waitForMultipleQueries,
  resetMockGraphQLClient,
  spyOnConsole
} from './api-test-helpers';

// Mock factories
export {
  createMockUser,
  createMockGame,
  createMockFighter,
  createMockRivalry,
  createMockContest,
  createMockTierList,
  createMockTierSlot,
  createMockRivalryWithData,
  createMockTierListWithSlots,
  createMockConnection,
  createMockGraphQLClient,
  createMockAPIResponse
} from './mock-factories';
