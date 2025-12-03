import { TierSlot } from '../API';
import { MFighter } from './m-fighter';
import { MTierList, Tier, TIERS } from './m-tier-list';

export function normalizeTierSlotPositionToIndex(slot: MTierSlot, idx: number) {
  return {
    ...slot,
    position: idx,
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
      return (
        (this.tierList?.slots?.length as number) - 1 - (this.position as number)
      );
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
      return TIERS[
        Math.floor(
          Number(tierSlot.position) / Number(this.tierList?.slotsPerTier),
        )
      ];
    },
    get tierList() {
      return this._mTierList;
    },
  };
}
