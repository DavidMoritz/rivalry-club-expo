import type { Schema } from '../../amplify/data/resource';
import { MFighter } from './m-fighter';
import { MTierList, Tier, TIERS, FIGHTER_COUNT } from './m-tier-list';

// Extract Gen 2 type
type TierSlot = Schema['TierSlot']['type'];

export function normalizeTierSlotPositionToIndex(slot: MTierSlot, idx: number) {
  return {
    ...slot,
    position: idx
  };
}

export interface MTierSlot extends TierSlot {
  // private
  _mFighter?: MFighter;
  _mTierList?: MTierList;

  // public
  baseTierSlot: TierSlot;
  fighter?: MFighter;
  fighterTier: Tier;
  higherItemsCount: () => number;
  lowerItemsCount: () => number;
  tierList?: MTierList;
}

export function getMTierSlot(tierSlot: TierSlot): MTierSlot {
  return {
    ...tierSlot,

    // private
    _mFighter: undefined,
    _mTierList: undefined,

    // public
    baseTierSlot: tierSlot,
    higherItemsCount() {
      return this.position as number;
    },
    lowerItemsCount() {
      return (this.tierList?.slots?.length as number) - 1 - (this.position as number);
    },

    // setters
    set fighter(fighter: MFighter | undefined) {
      this._mFighter = fighter;
    },
    set tierList(tierList: MTierList | undefined) {
      this._mTierList = tierList;
    },

    // getters
    get fighter() {
      return this._mFighter;
    },
    get fighterTier() {
      return TIERS[Math.floor(Number(tierSlot.position) / Number(this.tierList?.slotsPerTier))];
    },
    get tierList() {
      return this._mTierList;
    }
  };
}

/** Utility Functions */

/**
 * Computes the tier label (S, A, B, C, D, E, F, or UNKNOWN) from a position value.
 * Handles nullable positions and out-of-range values.
 *
 * @param position - The fighter's position (0-85, 0-based), or null for unknown
 * @returns The tier label as a string
 */
export function computeTierFromPosition(position: number | null): string {
  // Handle null, undefined, or out-of-range positions (0-based: 0-85)
  if (position === null || position === undefined || position < 0 || position >= FIGHTER_COUNT) {
    return 'U';
  }

  const BASE_PER_TIER = Math.floor(FIGHTER_COUNT / 7); // 12

  if (position < BASE_PER_TIER) return 'S';
  if (position < 2 * BASE_PER_TIER) return 'A';
  if (position < 3 * BASE_PER_TIER) return 'B';
  if (position < 4 * BASE_PER_TIER) return 'C';
  if (position < 5 * BASE_PER_TIER) return 'D';
  if (position < 6 * BASE_PER_TIER) return 'E';
  return 'F';
}

/**
 * Type guard to check if a tier slot has been positioned (has a non-null position).
 *
 * @param tierSlot - The tier slot to check
 * @returns true if the tier slot has a position, false otherwise
 */
export function isPositioned(tierSlot: MTierSlot): boolean {
  return tierSlot.position !== null && tierSlot.position !== undefined;
}
