import type { Schema } from '../../amplify/data/resource';

// Extract Gen 2 type
type TierListSnapshot = Schema['TierListSnapshot']['type'];

export interface MTierListSnapshot extends TierListSnapshot {
  baseSnapshot: TierListSnapshot;
}

export interface SnapshotArrangement {
  fighterId: string;
  position: number;
}

export function getMTierListSnapshot(
  snapshot: TierListSnapshot
): MTierListSnapshot {
  return {
    ...snapshot,

    get baseSnapshot() {
      return snapshot;
    },
  };
}
