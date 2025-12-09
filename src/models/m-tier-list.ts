import { sample, sortBy } from 'lodash';
import type { Schema } from '../../amplify/data/resource';

import { STEPS_PER_STOCK } from './m-game';
import { MRivalry } from './m-rivalry';
import { getMTierSlot, MTierSlot, normalizeTierSlotPositionToIndex } from './m-tier-slot';

// Extract Gen 2 types
type TierList = Schema['TierList']['type'];
type TierSlot = Schema['TierSlot']['type'];

type TierSlotPositionsPojo = Record<string, { id: string; position: number }>;

export interface MTierList extends TierList {
  _mTierSlots: MTierSlot[];
  _mRivalry?: MRivalry;
  adjustTierSlotPositionBySteps: (tierSlotPosition: number, steps?: number) => void;
  baseTierList: TierList;
  getCurrentTier(): number;
  eligibleTierSlots(): MTierSlot[];
  getPositionsPojo(): TierSlotPositionsPojo;
  getPrestige(): number;
  moveDownATier(): boolean;
  moveUpATier(): boolean;
  prestigeDisplay: string;
  rivalry?: MRivalry;
  sampleEligibleSlot(): MTierSlot;
  slots: MTierSlot[];
  slotsPerTier: number;
  title: string;
}

export const TIERS = [
  { label: 'S', position: 0, color: 'hsl(0, 100%, 75%)' },
  { label: 'A', position: 1, color: 'hsl(30, 100%, 75%)' },
  { label: 'B', position: 2, color: 'hsl(45, 100%, 75%)' },
  { label: 'C', position: 3, color: 'hsl(60, 100%, 75%)' },
  { label: 'D', position: 4, color: 'hsl(90, 100%, 75%)' },
  { label: 'E', position: 5, color: 'hsl(120, 100%, 75%)' },
  { label: 'F', position: 6, color: 'hsl(180, 100%, 75%)' }
] as const;

export type Tier = (typeof TIERS)[number];

export type TierWithSlots = Tier & { slots: TierSlot[] };

export function getMTierList(tierList: TierList): MTierList {
  // constructors
  const _mTierSlots = ((tierList.tierSlots?.items || []) as TierSlot[]).map((ts) =>
    getMTierSlot(ts)
  );

  return {
    ...tierList,

    // private
    _mRivalry: undefined,
    _mTierSlots,

    // public
    baseTierList: tierList,

    // setters
    set rivalry(rivalry: MRivalry | undefined) {
      this._mRivalry = rivalry;
    },
    set slots(tierSlots: MTierSlot[]) {
      this._mTierSlots = tierSlots;
    },

    // getters
    getCurrentTier() {
      return (this.standing ?? this.baseTierList.standing ?? 0) % TIERS.length;
    },
    get declareResult() {
      // placeholder
      return 'TierList Result';
    },
    get prestigeDisplay() {
      const prestige = this.getPrestige();
      const prestigeValue = prestige > 1 ? `+${prestige}` : prestige === 1 ? '+' : '';

      return `(${this.title}${prestigeValue})`;
    },
    get rivalry() {
      return this._mRivalry;
    },
    get slots() {
      return this._mTierSlots;
    },
    get slotsPerTier() {
      return this.slots.length / TIERS.length;
    },
    get title() {
      const tierIndex = this.getCurrentTier() % TIERS.length;

      return TIERS[tierIndex].label;
    },

    // methods
    /**
     * Put the slots in the correct index without adjusting their position.
     * Negative steps means the fighter won and is moving UP in the order.
     */
    adjustTierSlotPositionBySteps(tierSlotPosition: number, steps = STEPS_PER_STOCK * -1) {
      const sortedTierSlots = sortBy(this.slots, 'position');

      // Remove the element from its current index
      const tierSlotToMove = sortedTierSlots.splice(tierSlotPosition, 1)[0];

      // Update counts
      tierSlotToMove.contestCount = (tierSlotToMove.contestCount || 0) + 1;

      if (steps < 0) {
        // fighter won, increment winCount
        tierSlotToMove.winCount = (tierSlotToMove.winCount || 0) + 1;
      }

      // Insert the element at the new index (can be outside the array bounds)
      sortedTierSlots.splice(tierSlotPosition + steps, 0, tierSlotToMove);

      this.slots = sortedTierSlots.map(normalizeTierSlotPositionToIndex);
    },
    eligibleTierSlots() {
      const minSlotPosition: number = this.getCurrentTier() * this.slotsPerTier;
      const maxSlotPosition: number = minSlotPosition + this.slotsPerTier;

      return this.slots.filter((slot: MTierSlot) => {
        const safePos = slot.position || 0;

        return safePos >= minSlotPosition && safePos < maxSlotPosition;
      });
    },
    getPrestige() {
      return Math.floor((this.standing ?? this.baseTierList.standing ?? 0) / TIERS.length);
    },
    getPositionsPojo() {
      return this.slots.reduce(
        (pojo, { contestCount, id, position, winCount }, idx) => ({
          ...pojo,
          [`tierSlot${idx}`]: {
            contestCount: contestCount || 0,
            id,
            position,
            winCount: winCount || 0
          }
        }),
        {}
      );
    },
    moveDownATier() {
      if (typeof this.standing !== 'number') return false;

      this.standing += 1;

      return true;
    },
    moveUpATier() {
      const canMoveUp = (this.standing || 0) > 0;

      if (typeof this.standing !== 'number' || !canMoveUp) return false;

      this.standing -= 1;

      return true;
    },
    sampleEligibleSlot() {
      if (!this.rivalry) {
        console.warn('MTierList.sampleEligibleSlot called without rivalry set');
        return sample(this.slots) as MTierSlot;
      }

      // Recent fighters are benched several rounds before rejoining rotation.
      const eligibleSlots = this.eligibleTierSlots();
      let benchedRounds = 30;
      const reduceBenchedRoundsPerAttempt = 5;
      const isA = this.rivalry?.tierListA === this;
      let selectSlots;

      // Always avoid the current contest's fighter
      const currentContestSlotId = isA
        ? this.rivalry.currentContest?.tierSlotAId
        : this.rivalry.currentContest?.tierSlotBId;

      // Recalculate avoidSlotIds based on current benchedRounds value
      // Only look at resolved contests (those with a result AND not the current contest)
      const currentContestId = this.rivalry.currentContest?.id;
      const allResolvedContests = this.rivalry.mContests
        .filter((c) => c.id !== currentContestId && c.result !== null && c.result !== undefined)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // newest first

      // Keep trying with fewer and fewer benched rounds
      while (benchedRounds > 0) {
        let resolvedContests = allResolvedContests;

        const contestsToCheck = resolvedContests.slice(0, benchedRounds);
        const avoidSlotIds: string[] = contestsToCheck.map((c) =>
          isA ? c.tierSlotAId : c.tierSlotBId
        );

        // Add current contest fighter to avoid list
        if (currentContestSlotId) {
          avoidSlotIds.push(currentContestSlotId);
        }

        selectSlots = eligibleSlots.filter((ts) => !avoidSlotIds.includes(ts.id));

        if (selectSlots.length > 0) break;

        benchedRounds -= reduceBenchedRoundsPerAttempt;
      }

      // If still no slots available, just avoid the current contest fighter
      if (!selectSlots || selectSlots.length === 0) {
        if (currentContestSlotId) {
          selectSlots = eligibleSlots.filter((ts) => ts.id !== currentContestSlotId);
        }
        // If still none (shouldn't happen), use all eligible
        if (!selectSlots || selectSlots.length === 0) {
          selectSlots = eligibleSlots;
        }
      }

      return sample(selectSlots) as MTierSlot;
    }
  };
}
