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
  positionUnknownFighter(tierSlot: MTierSlot, newPosition: number): void;
  prestigeDisplay: string;
  rivalry?: MRivalry;
  sampleEligibleSlot(): MTierSlot;
  slots: MTierSlot[];
  slotsPerTier: number;
  title: string;
}

// TODO: Make this dynamic based on the game's fighter count
// For now, hard-coded to 86 (SSBU)
export const FIGHTER_COUNT = 86;

// Calculate fighters per tier: evenly distributed, with F tier getting the remainder
const baseFightersPerTier = Math.floor(FIGHTER_COUNT / 7);
const remainderFighters = FIGHTER_COUNT % 7;

export const TIERS = [
  { label: 'S', position: 0, color: 'hsl(0, 100%, 75%)', fightersCount: baseFightersPerTier },
  { label: 'A', position: 1, color: 'hsl(30, 100%, 75%)', fightersCount: baseFightersPerTier },
  { label: 'B', position: 2, color: 'hsl(45, 100%, 75%)', fightersCount: baseFightersPerTier },
  { label: 'C', position: 3, color: 'hsl(60, 100%, 75%)', fightersCount: baseFightersPerTier },
  { label: 'D', position: 4, color: 'hsl(90, 100%, 75%)', fightersCount: baseFightersPerTier },
  { label: 'E', position: 5, color: 'hsl(120, 100%, 75%)', fightersCount: baseFightersPerTier },
  {
    label: 'F',
    position: 6,
    color: 'hsl(180, 100%, 75%)',
    fightersCount: baseFightersPerTier + remainderFighters
  }
] as const;

export type Tier = (typeof TIERS)[number];

export type TierWithSlots = Tier & { slots: MTierSlot[] };

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

      // NEW: Check if current tier is full (12 positioned fighters)
      const BASE_PER_TIER = Math.floor(FIGHTER_COUNT / 7); // 12
      const positionedInCurrentTier = eligibleSlots.filter(
        slot => slot.position !== null && slot.position !== undefined
      ).length;

      // NEW: If tier not full, prioritize unknown fighters
      if (positionedInCurrentTier < BASE_PER_TIER) {
        const unknownFighters = this.slots.filter(
          slot => slot.position === null || slot.position === undefined
        );

        if (unknownFighters.length > 0) {
          // Avoid current contest fighter if possible
          const isA = this.rivalry?.tierListA === this;
          const currentContestSlotId = isA
            ? this.rivalry.currentContest?.tierSlotAId
            : this.rivalry.currentContest?.tierSlotBId;

          const availableUnknown = currentContestSlotId
            ? unknownFighters.filter(slot => slot.id !== currentContestSlotId)
            : unknownFighters;

          return sample(availableUnknown.length > 0 ? availableUnknown : unknownFighters) as MTierSlot;
        }
      }

      // EXISTING: Continue with normal sampling logic if tier is full or no unknown fighters
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
    },
    positionUnknownFighter(tierSlot: MTierSlot, newPosition: number) {
      // Clamp position to valid range (0-85, 0-based)
      const clampedPosition = Math.max(0, Math.min(newPosition, FIGHTER_COUNT - 1));

      // Find the tier slot in our list
      const slotIndex = this.slots.findIndex(s => s.id === tierSlot.id);
      if (slotIndex === -1) {
        console.warn('[MTierList.positionUnknownFighter] Tier slot not found:', tierSlot.id);
        return;
      }

      // Assign the position to the target tier slot
      tierSlot.position = clampedPosition;

      // Handle collisions: increment positions >= clampedPosition for other slots
      this.slots.forEach(slot => {
        if (slot.id !== tierSlot.id &&
            slot.position !== null &&
            slot.position >= clampedPosition) {
          slot.position += 1;
        }
      });

      // Re-sort slots by position (nulls at end)
      this.slots = sortBy(this.slots, [
        (slot) => slot.position === null ? Infinity : slot.position
      ]);
    }
  };
}
