/**
 * Mock Factories
 *
 * Factory functions for creating consistent mock data across tests.
 * These factories help maintain data consistency and reduce test setup boilerplate.
 */

import type { Schema } from '../../amplify/data/resource';
import { createMockAsyncGenerator } from './api-test-helpers';

/**
 * Creates a mock User object with sensible defaults
 */
export function createMockUser(overrides?: Partial<Schema['User']['type']>): Schema['User']['type'] {
  const now = new Date().toISOString();

  return {
    __typename: 'User',
    id: 'user-test-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 0,
    awsSub: 'aws-sub-test',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides
  } as Schema['User']['type'];
}

/**
 * Creates a mock Game object with sensible defaults
 */
export function createMockGame(overrides?: Partial<Schema['Game']['type']>): any {
  const now = new Date().toISOString();

  return {
    __typename: 'Game',
    id: 'game-test-id',
    name: 'Super Smash Bros. Ultimate',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    fighters: createMockAsyncGenerator([]),
    rivalries: createMockAsyncGenerator([]),
    ...overrides
  };
}

/**
 * Creates a mock Fighter object with sensible defaults
 */
export function createMockFighter(overrides?: Partial<Schema['Fighter']['type']>): any {
  const now = new Date().toISOString();

  return {
    __typename: 'Fighter',
    id: 'fighter-test-id',
    name: 'Mario',
    gameId: 'game-test-id',
    gamePosition: 0,
    contestCount: 0,
    winCount: 0,
    tierBreakdown: null,
    createdAt: now,
    updatedAt: now,
    game: undefined,
    tierSlots: createMockAsyncGenerator([]),
    ...overrides
  };
}

/**
 * Creates a mock Rivalry object with sensible defaults
 */
export function createMockRivalry(overrides?: Partial<Schema['Rivalry']['type']>): any {
  const now = new Date().toISOString();

  return {
    __typename: 'Rivalry',
    id: 'rivalry-test-id',
    userAId: 'user-a-id',
    userBId: 'user-b-id',
    gameId: 'game-test-id',
    contestCount: 0,
    currentContestId: null,
    accepted: true,
    hiddenByA: false,
    hiddenByB: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    game: undefined,
    contests: createMockAsyncGenerator([]),
    tierLists: createMockAsyncGenerator([]),
    ...overrides
  };
}

/**
 * Creates a mock Contest object with sensible defaults
 */
export function createMockContest(overrides?: Partial<Schema['Contest']['type']>): any {
  const now = new Date().toISOString();

  return {
    __typename: 'Contest',
    id: 'contest-test-id',
    rivalryId: 'rivalry-test-id',
    tierSlotAId: 'tier-slot-a-id',
    tierSlotBId: 'tier-slot-b-id',
    result: 0,
    bias: 0,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    rivalry: undefined,
    ...overrides
  };
}

/**
 * Creates a mock TierList object with sensible defaults
 */
export function createMockTierList(overrides?: Partial<Schema['TierList']['type']>): any {
  const now = new Date().toISOString();

  return {
    __typename: 'TierList',
    id: 'tier-list-test-id',
    rivalryId: 'rivalry-test-id',
    userId: 'user-test-id',
    standing: 0,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    rivalry: undefined,
    tierSlots: createMockAsyncGenerator([]),
    ...overrides
  };
}

/**
 * Creates a mock TierSlot object with sensible defaults
 */
export function createMockTierSlot(overrides?: Partial<Schema['TierSlot']['type']>): any {
  const now = new Date().toISOString();

  return {
    __typename: 'TierSlot',
    id: 'tier-slot-test-id',
    tierListId: 'tier-list-test-id',
    fighterId: 'fighter-test-id',
    position: 0,
    contestCount: 0,
    winCount: 0,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    tierList: undefined,
    fighter: undefined,
    ...overrides
  };
}

/**
 * Creates a complete mock rivalry with tier lists and tier slots
 * Useful for testing complex scenarios
 */
export function createMockRivalryWithData(options?: {
  rivalryId?: string;
  userAId?: string;
  userBId?: string;
  gameId?: string;
  fighters?: Array<{ id: string; name: string }>;
  contestCount?: number;
}) {
  const rivalryId = options?.rivalryId || 'rivalry-test-id';
  const userAId = options?.userAId || 'user-a-id';
  const userBId = options?.userBId || 'user-b-id';
  const gameId = options?.gameId || 'game-test-id';
  const fighters = options?.fighters || [
    { id: 'fighter-1', name: 'Mario' },
    { id: 'fighter-2', name: 'Luigi' }
  ];

  // Create tier lists
  const tierListA = createMockTierList({
    id: 'tier-list-a',
    rivalryId,
    userId: userAId
  });

  const tierListB = createMockTierList({
    id: 'tier-list-b',
    rivalryId,
    userId: userBId
  });

  // Create tier slots for both tier lists
  const tierSlotsA = fighters.map((fighter, index) =>
    createMockTierSlot({
      id: `tier-slot-a-${index}`,
      tierListId: tierListA.id,
      fighterId: fighter.id,
      position: index
    })
  );

  const tierSlotsB = fighters.map((fighter, index) =>
    createMockTierSlot({
      id: `tier-slot-b-${index}`,
      tierListId: tierListB.id,
      fighterId: fighter.id,
      position: index
    })
  );

  // Attach tier slots to tier lists
  tierListA.tierSlots = createMockAsyncGenerator(tierSlotsA);
  tierListB.tierSlots = createMockAsyncGenerator(tierSlotsB);

  // Create contests if needed
  const contests = options?.contestCount
    ? Array.from({ length: options.contestCount }, (_, i) =>
        createMockContest({
          id: `contest-${i}`,
          rivalryId,
          tierSlotAId: tierSlotsA[0].id,
          tierSlotBId: tierSlotsB[0].id,
          result: i === 0 ? 0 : 2, // First is current (unresolved)
          bias: i === 0 ? 0 : 1
        })
      )
    : [];

  // Create the rivalry with all data
  const rivalry = createMockRivalry({
    id: rivalryId,
    userAId,
    userBId,
    gameId,
    contestCount: options?.contestCount || 0,
    currentContestId: contests[0]?.id || null,
    contests: createMockAsyncGenerator(contests),
    tierLists: createMockAsyncGenerator([tierListA, tierListB])
  });

  return {
    rivalry,
    tierListA,
    tierListB,
    tierSlotsA,
    tierSlotsB,
    contests,
    fighters
  };
}

/**
 * Creates a mock GraphQL client for testing
 * Returns an object with all model methods mocked
 */
export function createMockGraphQLClient() {
  return {
    models: {
      User: {
        get: jest.fn(),
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      },
      Game: {
        get: jest.fn(),
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      },
      Fighter: {
        get: jest.fn(),
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      },
      Rivalry: {
        get: jest.fn(),
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      },
      Contest: {
        get: jest.fn(),
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        contestsByRivalryIdAndCreatedAt: jest.fn()
      },
      TierList: {
        get: jest.fn(),
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        tierListsByUserIdAndUpdatedAt: jest.fn()
      },
      TierSlot: {
        get: jest.fn(),
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      }
    }
  };
}

/**
 * Creates a mock TierList with TierSlots already populated
 * Useful for tests that need tier lists with fighters
 */
export function createMockTierListWithSlots(options?: {
  tierListId?: string;
  rivalryId?: string;
  userId?: string;
  standing?: number;
  fighters?: Array<{ id: string; name: string; position?: number }>;
}): any {
  const tierListId = options?.tierListId || 'tier-list-test-id';
  const fighters = options?.fighters || [
    { id: 'fighter-1', name: 'Fighter 1', position: 0 },
    { id: 'fighter-2', name: 'Fighter 2', position: 1 }
  ];

  const tierSlots = fighters.map((fighter, index) =>
    createMockTierSlot({
      id: `tier-slot-${tierListId}-${index}`,
      tierListId,
      fighterId: fighter.id,
      position: fighter.position !== undefined ? fighter.position : index,
      contestCount: 0,
      winCount: 0
    })
  );

  return createMockTierList({
    id: tierListId,
    rivalryId: options?.rivalryId || 'rivalry-test-id',
    userId: options?.userId || 'user-test-id',
    standing: options?.standing !== undefined ? options.standing : 0,
    tierSlots: {
      __typename: 'ModelTierSlotConnection',
      items: tierSlots
    }
  });
}

/**
 * Creates a mock connection object (for GraphQL list queries)
 * Useful for mocking paginated list responses
 */
export function createMockConnection<T>(
  items: T[],
  typename: string,
  nextToken?: string | null
): any {
  return {
    __typename: `Model${typename}Connection`,
    items,
    nextToken: nextToken || null
  };
}

/**
 * REST API response factories
 */
export const createMockAPIResponse = {
  success: <T>(data: T) => ({
    body: JSON.stringify(data),
    statusCode: '200'
  }),

  error: (message: string, statusCode = '500') => ({
    body: JSON.stringify({ error: message }),
    statusCode
  }),

  updateFighter: (success = true) => ({
    body: success ? 'Fighter updated successfully' : 'Failed to update fighter',
    statusCode: success ? '200' : '500'
  })
};
