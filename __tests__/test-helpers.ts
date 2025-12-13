import type { Schema } from '../amplify/data/resource';

// Helper types for testing - makes LazyLoader fields optional
// so we can create mock objects without having to mock the entire relationship structure

export type TestRivalry = Omit<
  Schema['Rivalry']['type'],
  'game' | 'contests' | 'tierLists'
> &
  Partial<Pick<Schema['Rivalry']['type'], 'game' | 'contests' | 'tierLists'>>;

export type TestTierList = Omit<
  Schema['TierList']['type'],
  'rivalry' | 'tierSlots'
> &
  Partial<Pick<Schema['TierList']['type'], 'rivalry' | 'tierSlots'>>;

export type TestContest = Omit<Schema['Contest']['type'], 'rivalry'> &
  Partial<Pick<Schema['Contest']['type'], 'rivalry'>>;

export type TestFighter = Omit<
  Schema['Fighter']['type'],
  'game' | 'tierSlots'
> &
  Partial<Pick<Schema['Fighter']['type'], 'game' | 'tierSlots'>>;

export type TestGame = Omit<Schema['Game']['type'], 'fighters' | 'rivalries'> &
  Partial<Pick<Schema['Game']['type'], 'fighters' | 'rivalries'>>;
