import { sample, sortBy } from 'lodash';
import type { Schema } from '../../amplify/data/resource';

import { STEPS_PER_STOCK } from './m-game';
import { MRivalry } from './m-rivalry';
import { getMTierSlot, MTierSlot, normalizeTierSlotPositionToIndex } from './m-tier-slot';
import { colors } from '../utils/colors';

// Extract Gen 2 types
type TierList = Schema['TierList']['type'];
type TierSlot = Schema['TierSlot']['type'];

type TierSlotPositionsPojo = Record<
  string,
  { id: string; position: number; contestCount: number; winCount: number }
>;

export interface MTierList extends Omit<TierList, 'rivalry'> {
  _mTierSlots: MTierSlot[];
  _mRivalry?: MRivalry;
  adjustTierSlotPositionBySteps: (
    tierSlotPosition: number,
    steps?: number,
    trackStats?: boolean
  ) => void;
  baseTierList: TierList;
  getCurrentTier(): number;
  eligibleTierSlots(): MTierSlot[];
  getPositionsPojo(): TierSlotPositionsPojo;
  getChangedTierSlots(): Array<{
    id: string;
    position: number;
    contestCount: number;
    winCount: number;
  }>;
  getPrestige(): number;
  moveDownATier(): boolean;
  moveUpATier(): boolean;
  positionFighterAtBottom(tierSlot: MTierSlot): void;
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
  { label: 'S', position: 0, color: colors.tierS, fightersCount: baseFightersPerTier },
  { label: 'A', position: 1, color: colors.tierA, fightersCount: baseFightersPerTier },
  { label: 'B', position: 2, color: colors.tierB, fightersCount: baseFightersPerTier },
  { label: 'C', position: 3, color: colors.tierC, fightersCount: baseFightersPerTier },
  { label: 'D', position: 4, color: colors.tierD, fightersCount: baseFightersPerTier },
  { label: 'E', position: 5, color: colors.tierE, fightersCount: baseFightersPerTier },
  {
    label: 'F',
    position: 6,
    color: colors.tierF,
    fightersCount: baseFightersPerTier + remainderFighters
  }
] as const;

export type Tier = (typeof TIERS)[number];

export type TierWithSlots = Tier & { slots: MTierSlot[] };

export function getMTierList(tierList: TierList): MTierList {
  // constructors
  const tierSlots = tierList.tierSlots as any;
  const _mTierSlots = ((tierSlots?.items || []) as TierSlot[]).map((ts: TierSlot) =>
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
      const tierNum = this.getCurrentTier();

      return TIERS[tierNum].fightersCount;
    },
    get title() {
      const tierIndex = this.getCurrentTier() % TIERS.length;

      return TIERS[tierIndex].label;
    },

    // methods
    /**
     * Adjusts a fighter's position based on contest results.
     *
     * @param currentPosition - The current POSITION value of the fighter (0-85)
     * @param steps - Number of positions to move (negative = moving UP/winning, positive = moving DOWN/losing)
     * @param trackStats - Whether to increment contestCount/winCount (default true). Set false for undo operations.
     *
     * IMPORTANT: Positions are sparse (e.g., 0, 1, 12, 48, 72, 85). When moving a fighter:
     * - Calculate new position: currentPosition + steps
     * - Only shift fighters between old and new position by ±1
     * - Preserve all other position values (don't reindex!)
     */
    adjustTierSlotPositionBySteps(
      currentPosition: number,
      steps = STEPS_PER_STOCK * -1,
      trackStats = true
    ) {
      // Check if ALL slots have positions (fully positioned tier list)
      const allPositioned = this.slots.every((slot) => slot.position != null);

      if (allPositioned) {
        // OPTIMIZATION: If all fighters are positioned, use efficient reindexing
        const sortedTierSlots = sortBy(this.slots, 'position');

        // Find the fighter by their current position
        const tierSlotIndex = sortedTierSlots.findIndex(
          (slot) => slot.position === currentPosition
        );
        if (tierSlotIndex === -1) {
          console.warn(
            `[adjustTierSlotPositionBySteps] No slot found at position ${currentPosition}`
          );
          return;
        }

        // Remove the element from its current index
        const tierSlotToMove = sortedTierSlots.splice(tierSlotIndex, 1)[0];

        // Update counts (only if tracking stats)
        if (trackStats) {
          tierSlotToMove.contestCount = (tierSlotToMove.contestCount || 0) + 1;

          if (steps < 0) {
            // fighter won, increment winCount
            tierSlotToMove.winCount = (tierSlotToMove.winCount || 0) + 1;
          }
        }

        // Insert the element at the new index (can be outside the array bounds)
        sortedTierSlots.splice(tierSlotIndex + steps, 0, tierSlotToMove);

        // Safe to normalize all positions when all fighters are positioned
        this.slots = sortedTierSlots.map(normalizeTierSlotPositionToIndex);

        const finalPosition = tierSlotToMove.position;

        // Validate position
        if (finalPosition != null && finalPosition < 0) {
          console.error(
            `❌ INVALID POSITION: TierSlot ${tierSlotToMove.id} has negative position: ${finalPosition}`
          );
        } else if (finalPosition != null && finalPosition >= FIGHTER_COUNT) {
          console.error(
            `❌ INVALID POSITION: TierSlot ${tierSlotToMove.id} has position ${finalPosition} >= FIGHTER_COUNT (${FIGHTER_COUNT})`
          );
        }
      } else {
        // SPARSE POSITIONS: Use collision-aware shifting logic
        // Find the fighter to move by their current POSITION
        const tierSlotToMove = this.slots.find((slot) => slot.position === currentPosition);
        if (!tierSlotToMove) {
          console.warn(
            `⚠️  No tier slot found at position ${currentPosition} in adjustTierSlotPositionBySteps`
          );
          return;
        }

        const oldPosition = currentPosition;
        const newPosition = Math.max(0, Math.min(currentPosition + steps, FIGHTER_COUNT - 1));

        // Update counts (only if tracking stats)
        if (trackStats) {
          tierSlotToMove.contestCount = (tierSlotToMove.contestCount || 0) + 1;

          if (steps < 0) {
            // fighter won, increment winCount
            tierSlotToMove.winCount = (tierSlotToMove.winCount || 0) + 1;
          }
        }

        // Only shift fighters between old and new positions
        if (steps < 0) {
          // Moving UP (to lower position): shift fighters in range [newPosition, oldPosition) down by 1
          this.slots.forEach((slot) => {
            if (
              slot.id !== tierSlotToMove.id &&
              slot.position != null &&
              slot.position >= newPosition &&
              slot.position < oldPosition
            ) {
              slot.position += 1;
            }
          });
        } else {
          // Moving DOWN (to higher position): shift fighters in range (oldPosition, newPosition] up by 1
          this.slots.forEach((slot) => {
            if (
              slot.id !== tierSlotToMove.id &&
              slot.position != null &&
              slot.position > oldPosition &&
              slot.position <= newPosition
            ) {
              slot.position -= 1;
            }
          });
        }

        // Update the moved fighter's position
        tierSlotToMove.position = newPosition;

        // Validate position
        if (newPosition < 0) {
          console.error(
            `❌ INVALID POSITION: TierSlot ${tierSlotToMove.id} has negative position: ${newPosition}`
          );
        } else if (newPosition >= FIGHTER_COUNT) {
          console.error(
            `❌ INVALID POSITION: TierSlot ${tierSlotToMove.id} has position ${newPosition} >= FIGHTER_COUNT (${FIGHTER_COUNT})`
          );
        }

        // Re-sort slots by position (nulls at end)
        this.slots = sortBy(this.slots, [
          (slot) => (slot.position === null ? Infinity : slot.position)
        ]);
      }
    },
    eligibleTierSlots() {
      const currentTier = this.getCurrentTier();

      // Calculate minSlotPosition by summing all fighters in previous tiers
      const minSlotPosition: number = TIERS.slice(0, currentTier).reduce(
        (sum, tier) => sum + tier.fightersCount,
        0
      );

      // maxSlotPosition is minSlotPosition + fighters in THIS tier
      const maxSlotPosition: number = minSlotPosition + this.slotsPerTier;

      return this.slots.filter((slot: MTierSlot) => {
        if (slot.position == null) return; // Filters out null and undefined, keeps 0

        return slot.position >= minSlotPosition && slot.position < maxSlotPosition;
      });
    },
    getPrestige() {
      return Math.floor((this.standing ?? this.baseTierList.standing ?? 0) / TIERS.length);
    },
    getPositionsPojo() {
      return this.slots.reduce(
        (pojo, slot, idx) => ({
          ...pojo,
          [`tierSlot${idx}`]: {
            contestCount: slot.contestCount || 0,
            id: slot.id,
            position: slot.position,
            winCount: slot.winCount || 0
          }
        }),
        {}
      );
    },
    getChangedTierSlots() {
      // Returns only tier slots that have changed from their base values
      const changed: Array<{
        id: string;
        position: number;
        contestCount: number;
        winCount: number;
      }> = [];

      this.slots.forEach((slot) => {
        const tierSlots = this.baseTierList.tierSlots as any;
        const baseTierSlot = tierSlots?.items?.find((ts: TierSlot) => ts?.id === slot.id);

        const positionChanged = slot.position !== baseTierSlot?.position;
        const contestCountChanged = (slot.contestCount || 0) !== (baseTierSlot?.contestCount || 0);
        const winCountChanged = (slot.winCount || 0) !== (baseTierSlot?.winCount || 0);

        if (positionChanged || contestCountChanged || winCountChanged) {
          changed.push({
            id: slot.id,
            position: slot.position as number,
            contestCount: slot.contestCount || 0,
            winCount: slot.winCount || 0
          });
        }
      });

      return changed;
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
        (slot) => slot.position !== null && slot.position !== undefined
      ).length;

      // NEW: If tier not full, prioritize unknown fighters
      if (positionedInCurrentTier < BASE_PER_TIER) {
        const unknownFighters = this.slots.filter(
          (slot) => slot.position === null || slot.position === undefined
        );

        if (unknownFighters.length > 0) {
          // Avoid current contest fighter if possible
          const isA = this.rivalry?.tierListA === this;
          const currentContestSlotId = isA
            ? this.rivalry.currentContest?.tierSlotAId
            : this.rivalry.currentContest?.tierSlotBId;

          const availableUnknown = currentContestSlotId
            ? unknownFighters.filter((slot) => slot.id !== currentContestSlotId)
            : unknownFighters;

          return sample(
            availableUnknown.length > 0 ? availableUnknown : unknownFighters
          ) as MTierSlot;
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
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')); // newest first

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
      const slotIndex = this.slots.findIndex((s) => s.id === tierSlot.id);
      if (slotIndex === -1) {
        console.warn('[MTierList.positionUnknownFighter] Tier slot not found:', tierSlot.id);
        return;
      }

      // Check if target position is already occupied
      const occupiedSlot = this.slots.find(
        (slot) => slot.id !== tierSlot.id && slot.position === clampedPosition
      );

      if (!occupiedSlot) {
        // Position is free - just place the fighter there
        tierSlot.position = clampedPosition;
      } else {
        // Find first empty position searching UP from target (clampedPosition → 0)
        let firstEmpty = clampedPosition - 1;
        while (firstEmpty >= 0) {
          const isOccupied = this.slots.some(
            (slot) => slot.id !== tierSlot.id && slot.position === firstEmpty
          );
          if (!isOccupied) break;
          firstEmpty--;
        }

        // Track affected fighters
        const affectedFighters: string[] = [];

        // Shift ONLY consecutive occupied positions UP (from firstEmpty+1 to clampedPosition)
        // Moving each fighter one position UP (position - 1)
        for (let pos = firstEmpty + 1; pos <= clampedPosition; pos++) {
          const slotAtPos = this.slots.find(
            (slot) => slot.id !== tierSlot.id && slot.position === pos
          );
          if (slotAtPos) {
            affectedFighters.push(`${slotAtPos.fighterId} (${pos} → ${pos - 1})`);
            slotAtPos.position = pos - 1;
          }
        }

        // Place the new fighter at target position
        tierSlot.position = clampedPosition;
      }

      // Re-sort slots by position (nulls at end)
      this.slots = sortBy(this.slots, [
        (slot) => (slot.position === null ? Infinity : slot.position)
      ]);
    },
    positionFighterAtBottom(tierSlot: MTierSlot) {
      // Position fighter at 85 (bottom) and shift existing fighters UP (85 → 84, 84 → 83, etc.)
      const bottomPosition = FIGHTER_COUNT - 1; // 85 (0-based)

      // Find the tier slot in our list
      const slotIndex = this.slots.findIndex((s) => s.id === tierSlot.id);
      if (slotIndex === -1) {
        console.warn('[MTierList.positionFighterAtBottom] Tier slot not found:', tierSlot.id);
        return;
      }

      // Check if bottom position is already occupied
      const occupiedSlot = this.slots.find(
        (slot) => slot.id !== tierSlot.id && slot.position === bottomPosition
      );

      if (!occupiedSlot) {
        // Position is free - just place the fighter there
        tierSlot.position = bottomPosition;
      } else {
        // Position is occupied - need to shift fighters UP (towards position 0)

        // Find first empty position searching UP from bottom (85 → 0)
        let firstEmpty = bottomPosition - 1;
        while (firstEmpty >= 0) {
          const isOccupied = this.slots.some(
            (slot) => slot.id !== tierSlot.id && slot.position === firstEmpty
          );
          if (!isOccupied) break;
          firstEmpty--;
        }

        // Track affected fighters
        const affectedFighters: string[] = [];

        // Shift ONLY consecutive occupied positions UP (from firstEmpty+1 to bottomPosition)
        // Moving each fighter one position UP (position - 1)
        for (let pos = firstEmpty + 1; pos <= bottomPosition; pos++) {
          const slotAtPos = this.slots.find(
            (slot) => slot.id !== tierSlot.id && slot.position === pos
          );
          if (slotAtPos) {
            affectedFighters.push(`${slotAtPos.fighterId} (${pos} → ${pos - 1})`);
            slotAtPos.position = pos - 1;
          }
        }

        // Place the new fighter at bottom position
        tierSlot.position = bottomPosition;
      }

      // Re-sort slots by position (nulls at end)
      this.slots = sortBy(this.slots, [
        (slot) => (slot.position === null ? Infinity : slot.position)
      ]);
    }
  };
}
