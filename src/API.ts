/**
 * Type definitions for backwards compatibility with Amplify Gen 1
 * This file re-exports types from the Amplify Gen 2 schema
 * for use in test files that haven't been migrated yet.
 */

import type { Schema } from '../amplify/data/resource';

// Re-export Amplify Gen 2 types with Gen 1 naming
// Add __typename for backwards compatibility with test mocks
export type User = Schema['User']['type'] & { __typename?: 'User' };
export type Game = Schema['Game']['type'] & { __typename?: 'Game' };
export type Fighter = Schema['Fighter']['type'] & { __typename?: 'Fighter' };
export type Rivalry = Schema['Rivalry']['type'] & { __typename?: 'Rivalry' };
export type Contest = Schema['Contest']['type'] & { __typename?: 'Contest' };
export type TierList = Schema['TierList']['type'] & { __typename?: 'TierList' };
export type TierSlot = Schema['TierSlot']['type'] & { __typename?: 'TierSlot' };

// Connection types for backwards compatibility
export type ModelUserConnection = {
  __typename: 'ModelUserConnection';
  items: (User | null)[];
  nextToken?: string | null;
};

export type ModelGameConnection = {
  __typename: 'ModelGameConnection';
  items: (Game | null)[];
  nextToken?: string | null;
};

export type ModelFighterConnection = {
  __typename: 'ModelFighterConnection';
  items: (Fighter | null)[];
  nextToken?: string | null;
};

export type ModelRivalryConnection = {
  __typename: 'ModelRivalryConnection';
  items: (Rivalry | null)[];
  nextToken?: string | null;
};

export type ModelContestConnection = {
  __typename: 'ModelContestConnection';
  items: (Contest | null)[];
  nextToken?: string | null;
};

export type ModelTierListConnection = {
  __typename: 'ModelTierListConnection';
  items: (TierList | null)[];
  nextToken?: string | null;
};

export type ModelTierSlotConnection = {
  __typename: 'ModelTierSlotConnection';
  items: (TierSlot | null)[];
  nextToken?: string | null;
};
