import type { Schema } from '../../amplify/data/resource';
import type { MFighter } from './m-fighter';
import { FIGHTER_COUNT, type MTierList, TIERS, type Tier } from './m-tier-list';

// Extract Gen 2 type
type TierSlot = Schema['TierSlot']['type'];

export function normalizeTierSlotPositionToIndex(slot: MTierSlot, idx: number) {
  return {
    ...slot,
    position: idx,
  };
}

export interface MTierSlot extends Omit<TierSlot, 'tierList' | 'fighter'> {
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
      return (
        (this.tierList?.slots?.length as number) - 1 - (this.position as number)
      );
    },

    // accessors
    get fighter() {
      return this._mFighter;
    },
    set fighter(fighter: MFighter | undefined) {
      this._mFighter = fighter;
    },
    get fighterTier() {
      return TIERS[
        Math.floor(
          Number(tierSlot.position) / Number(this.tierList?.slotsPerTier)
        )
      ];
    },
    get tierList() {
      return this._mTierList;
    },
    set tierList(tierList: MTierList | undefined) {
      this._mTierList = tierList;
    },
  };
}

/** Utility Functions */

const TIER_COUNT = 7;
const TIER_LABELS = ['S', 'A', 'B', 'C', 'D', 'E', 'F'] as const;

/**
 * Computes the tier label (S, A, B, C, D, E, F, or UNKNOWN) from a position value.
 * Handles nullable positions and out-of-range values.
 *
 * @param position - The fighter's position (0-85, 0-based), or null for unknown
 * @returns The tier label as a string
 */
export function computeTierFromPosition(position: number | null): string {
  // Handle null, undefined, or out-of-range positions (0-based: 0-85)
  if (
    position === null ||
    position === undefined ||
    position < 0 ||
    position >= FIGHTER_COUNT
  ) {
    return 'U';
  }

  const slotsPerTier = Math.floor(FIGHTER_COUNT / TIER_COUNT); // 12
  const tierIndex = Math.min(
    Math.floor(position / slotsPerTier),
    TIER_COUNT - 1
  );

  return TIER_LABELS[tierIndex];
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
