import { sample, sortBy } from 'lodash';
import type { Schema } from '../../amplify/data/resource';
import { colors } from '../utils/colors';
import type { MContest } from './m-contest';
import { STEPS_PER_STOCK } from './m-game';
import type { MRivalry } from './m-rivalry';
import {
  getMTierSlot,
  type MTierSlot,
  normalizeTierSlotPositionToIndex,
} from './m-tier-slot';

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
  adjustFullyPositionedTierList: (
    currentPosition: number,
    steps: number,
    trackStats: boolean
  ) => void;
  adjustSparsePositionedTierList: (
    currentPosition: number,
    steps: number,
    trackStats: boolean
  ) => void;
  adjustTierSlotPositionBySteps: (
    tierSlotPosition: number,
    steps?: number,
    trackStats?: boolean
  ) => void;
  baseTierList: TierList;
  eligibleTierSlots(): MTierSlot[];
  findFirstEmptyPositionUp(targetPosition: number, excludeId: string): number;
  getAvoidSlotIds(
    benchedRounds: number,
    isA: boolean,
    currentContestSlotId: string | undefined
  ): string[];
  getChangedTierSlots(): Array<{
    id: string;
    position: number;
    contestCount: number;
    winCount: number;
  }>;
  getPositionAdjustment(
    slotPosition: number,
    oldPosition: number,
    newPosition: number,
    isMovingUp: boolean
  ): number;
  getCurrentTier(): number;
  getPositionsPojo(): TierSlotPositionsPojo;
  getPrestige(): number;
  getResolvedContestsForSampling(): MContest[];
  moveDownATier(): boolean;
  moveUpATier(): boolean;
  positionFighterAtBottom(tierSlot: MTierSlot): void;
  positionUnknownFighter(tierSlot: MTierSlot, newPosition: number): void;
  prestigeDisplay: string;
  resortSlotsByPosition(): void;
  rivalry?: MRivalry;
  sampleEligibleSlot(): MTierSlot;
  sampleFromEligibleSlots(eligibleSlots: MTierSlot[]): MTierSlot;
  sampleUnknownFighterIfNeeded(
    eligibleSlots: MTierSlot[]
  ): MTierSlot | undefined;
  shiftFightersBetweenPositions(
    excludeId: string,
    oldPosition: number,
    newPosition: number,
    steps: number
  ): void;
  shiftFightersUp(
    firstEmpty: number,
    targetPosition: number,
    excludeId: string
  ): void;
  slots: MTierSlot[];
  slotsPerTier: number;
  title: string;
  updateSlotStats(slot: MTierSlot, steps: number, trackStats: boolean): void;
  validatePosition(slotId: string, position: number | null | undefined): void;
}

// TODO: Make this dynamic based on the game's fighter count
// For now, hard-coded to 86 (SSBU)
export const FIGHTER_COUNT = 86;
export const TIER_COUNT = 7;

// Calculate fighters per tier: evenly distributed, with F tier getting the remainder
const baseFightersPerTier = Math.floor(FIGHTER_COUNT / TIER_COUNT);
const remainderFighters = FIGHTER_COUNT % TIER_COUNT;

export const TIERS = [
  {
    label: 'S',
    position: 0,
    color: colors.tierS,
    fightersCount: baseFightersPerTier,
  },
  {
    label: 'A',
    position: 1,
    color: colors.tierA,
    fightersCount: baseFightersPerTier,
  },
  {
    label: 'B',
    position: 2,
    color: colors.tierB,
    fightersCount: baseFightersPerTier,
  },
  {
    label: 'C',
    position: 3,
    color: colors.tierC,
    fightersCount: baseFightersPerTier,
  },
  {
    label: 'D',
    position: 4,
    color: colors.tierD,
    fightersCount: baseFightersPerTier,
  },
  {
    label: 'E',
    position: 5,
    color: colors.tierE,
    fightersCount: baseFightersPerTier,
  },
  {
    label: 'F',
    position: 6,
    color: colors.tierF,
    fightersCount: baseFightersPerTier + remainderFighters,
  },
] as const;

export type Tier = (typeof TIERS)[number];

export type TierWithSlots = Tier & { slots: MTierSlot[] };

// Type for the tierSlots structure from the API (has items array)
interface TierSlotsContainer {
  items?: TierSlot[];
}

export function getMTierList(tierList: TierList): MTierList {
  // constructors
  const tierSlotsContainer = tierList.tierSlots as TierSlotsContainer | null;
  const _mTierSlots = ((tierSlotsContainer?.items || []) as TierSlot[]).map(
    (ts: TierSlot) => getMTierSlot(ts)
  );

  return {
    ...tierList,

    // private
    _mRivalry: undefined,
    _mTierSlots,

    // public
    baseTierList: tierList,

    // getters and setters (grouped together)
    getCurrentTier() {
      return (this.standing ?? this.baseTierList.standing ?? 0) % TIERS.length;
    },
    get declareResult() {
      // placeholder
      return 'TierList Result';
    },
    get prestigeDisplay() {
      const prestige = this.getPrestige();
      let prestigeValue = '';
      if (prestige > 1) {
        prestigeValue = `+${prestige}`;
      } else if (prestige === 1) {
        prestigeValue = '+';
      }

      return `(${this.title}${prestigeValue})`;
    },
    get rivalry() {
      return this._mRivalry;
    },
    set rivalry(rivalry: MRivalry | undefined) {
      this._mRivalry = rivalry;
    },
    get slots() {
      return this._mTierSlots;
    },
    set slots(newTierSlots: MTierSlot[]) {
      this._mTierSlots = newTierSlots;
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
     * Helper: Update contest/win counts on a tier slot
     */
    updateSlotStats(slot: MTierSlot, steps: number, trackStats: boolean) {
      if (!trackStats) return;
      slot.contestCount = (slot.contestCount || 0) + 1;
      if (steps < 0) {
        // fighter won, increment winCount
        slot.winCount = (slot.winCount || 0) + 1;
      }
    },

    /**
     * Helper: Validate that a position is within valid bounds
     */
    validatePosition(slotId: string, position: number | null | undefined) {
      if (position != null && position < 0) {
        console.error(
          `INVALID POSITION: TierSlot ${slotId} has negative position: ${position}`
        );
      } else if (position != null && position >= FIGHTER_COUNT) {
        console.error(
          `INVALID POSITION: TierSlot ${slotId} has position ${position} >= FIGHTER_COUNT (${FIGHTER_COUNT})`
        );
      }
    },

    /**
     * Helper: Adjust position when all fighters are positioned (efficient reindexing)
     */
    adjustFullyPositionedTierList(
      currentPosition: number,
      steps: number,
      trackStats: boolean
    ) {
      const sortedTierSlots = sortBy(this.slots, 'position');
      const tierSlotIndex = sortedTierSlots.findIndex(
        slot => slot.position === currentPosition
      );

      if (tierSlotIndex === -1) {
        console.warn(
          `[adjustTierSlotPositionBySteps] No slot found at position ${currentPosition}`
        );
        return;
      }

      const tierSlotToMove = sortedTierSlots.splice(tierSlotIndex, 1)[0];
      this.updateSlotStats(tierSlotToMove, steps, trackStats);
      sortedTierSlots.splice(tierSlotIndex + steps, 0, tierSlotToMove);
      this.slots = sortedTierSlots.map(normalizeTierSlotPositionToIndex);
      this.validatePosition(tierSlotToMove.id, tierSlotToMove.position);
    },

    /**
     * Helper: Adjust position with sparse positions (collision-aware shifting)
     */
    adjustSparsePositionedTierList(
      currentPosition: number,
      steps: number,
      trackStats: boolean
    ) {
      const tierSlotToMove = this.slots.find(
        slot => slot.position === currentPosition
      );

      if (!tierSlotToMove) {
        console.warn(
          `No tier slot found at position ${currentPosition} in adjustTierSlotPositionBySteps`
        );
        return;
      }

      const oldPosition = currentPosition;
      const newPosition = Math.max(
        0,
        Math.min(currentPosition + steps, FIGHTER_COUNT - 1)
      );

      this.updateSlotStats(tierSlotToMove, steps, trackStats);
      this.shiftFightersBetweenPositions(
        tierSlotToMove.id,
        oldPosition,
        newPosition,
        steps
      );
      tierSlotToMove.position = newPosition;

      this.validatePosition(tierSlotToMove.id, newPosition);
      this.resortSlotsByPosition();
    },

    /**
     * Helper: Check if slot is in the shift range and return position adjustment
     * Returns 1 for shift down, -1 for shift up, 0 for no change
     */
    getPositionAdjustment(
      slotPosition: number,
      oldPosition: number,
      newPosition: number,
      isMovingUp: boolean
    ): number {
      if (isMovingUp) {
        // Moving UP: shift fighters in [newPosition, oldPosition) down by 1
        const inRange =
          slotPosition >= newPosition && slotPosition < oldPosition;
        return inRange ? 1 : 0;
      }
      // Moving DOWN: shift fighters in (oldPosition, newPosition] up by 1
      const inRange = slotPosition > oldPosition && slotPosition <= newPosition;
      return inRange ? -1 : 0;
    },

    /**
     * Helper: Shift fighters between old and new positions
     */
    shiftFightersBetweenPositions(
      excludeId: string,
      oldPosition: number,
      newPosition: number,
      steps: number
    ) {
      const isMovingUp = steps < 0;
      for (const slot of this.slots) {
        if (slot.id === excludeId || slot.position == null) continue;
        const adjustment = this.getPositionAdjustment(
          slot.position,
          oldPosition,
          newPosition,
          isMovingUp
        );
        slot.position += adjustment;
      }
    },

    /**
     * Adjusts a fighter's position based on contest results.
     *
     * @param currentPosition - The current POSITION value of the fighter (0-85)
     * @param steps - Number of positions to move (negative = moving UP/winning, positive = moving DOWN/losing)
     * @param trackStats - Whether to increment contestCount/winCount (default true). Set false for undo operations.
     *
     * IMPORTANT: Positions are sparse (e.g., 0, 1, 12, 48, 72, 85). When moving a fighter:
     * - Calculate new position: currentPosition + steps
     * - Only shift fighters between old and new position by +/-1
     * - Preserve all other position values (don't reindex!)
     */
    adjustTierSlotPositionBySteps(
      currentPosition: number,
      steps = STEPS_PER_STOCK * -1,
      trackStats = true
    ) {
      const allPositioned = this.slots.every(slot => slot.position != null);

      if (allPositioned) {
        this.adjustFullyPositionedTierList(currentPosition, steps, trackStats);
      } else {
        this.adjustSparsePositionedTierList(currentPosition, steps, trackStats);
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
        if (slot.position == null) return false; // Filters out null and undefined, keeps 0

        return (
          slot.position >= minSlotPosition && slot.position < maxSlotPosition
        );
      });
    },
    getPrestige() {
      return Math.floor(
        (this.standing ?? this.baseTierList.standing ?? 0) / TIERS.length
      );
    },
    getPositionsPojo() {
      const pojo: TierSlotPositionsPojo = {};
      for (const [idx, slot] of this.slots.entries()) {
        pojo[`tierSlot${idx}`] = {
          contestCount: slot.contestCount || 0,
          id: slot.id,
          position: slot.position ?? 0,
          winCount: slot.winCount || 0,
        };
      }
      return pojo;
    },
    getChangedTierSlots() {
      // Returns only tier slots that have changed from their base values
      const changed: Array<{
        id: string;
        position: number;
        contestCount: number;
        winCount: number;
      }> = [];

      const baseTierSlotsContainer = this.baseTierList
        .tierSlots as TierSlotsContainer | null;

      for (const slot of this.slots) {
        const baseTierSlot = baseTierSlotsContainer?.items?.find(
          (ts: TierSlot) => ts?.id === slot.id
        );

        const positionChanged = slot.position !== baseTierSlot?.position;
        const contestCountChanged =
          (slot.contestCount || 0) !== (baseTierSlot?.contestCount || 0);
        const winCountChanged =
          (slot.winCount || 0) !== (baseTierSlot?.winCount || 0);

        if (positionChanged || contestCountChanged || winCountChanged) {
          changed.push({
            id: slot.id,
            position: slot.position as number,
            contestCount: slot.contestCount || 0,
            winCount: slot.winCount || 0,
          });
        }
      }

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

      // Check for unknown fighters that need positioning
      const unknownResult = this.sampleUnknownFighterIfNeeded(eligibleSlots);
      if (unknownResult) return unknownResult;

      // Continue with normal sampling logic if tier is full or no unknown fighters
      return this.sampleFromEligibleSlots(eligibleSlots);
    },

    /**
     * Helper: Sample unknown fighter if current tier is not full
     */
    sampleUnknownFighterIfNeeded(
      eligibleSlots: MTierSlot[]
    ): MTierSlot | undefined {
      const positionedInCurrentTier = eligibleSlots.filter(
        slot => slot.position !== null && slot.position !== undefined
      ).length;

      // If tier is full, no need to prioritize unknown fighters
      if (positionedInCurrentTier >= baseFightersPerTier) return;

      const unknownFighters = this.slots.filter(
        slot => slot.position === null || slot.position === undefined
      );

      if (unknownFighters.length === 0) return;

      // Avoid current contest fighter if possible
      const isA = this.rivalry?.tierListA === this;
      const currentContestSlotId = isA
        ? this.rivalry?.currentContest?.tierSlotAId
        : this.rivalry?.currentContest?.tierSlotBId;

      const availableUnknown = currentContestSlotId
        ? unknownFighters.filter(slot => slot.id !== currentContestSlotId)
        : unknownFighters;

      return sample(
        availableUnknown.length > 0 ? availableUnknown : unknownFighters
      ) as MTierSlot;
    },

    /**
     * Helper: Get resolved contests for sampling (filtered and sorted newest first)
     */
    getResolvedContestsForSampling() {
      const currentContestId = this.rivalry?.currentContest?.id;
      return (
        this.rivalry?.mContests
          .filter(
            c =>
              c.id !== currentContestId &&
              c.result !== null &&
              c.result !== undefined
          )
          .sort((a, b) =>
            (b.createdAt || '').localeCompare(a.createdAt || '')
          ) || []
      );
    },

    /**
     * Helper: Get slot IDs to avoid based on benched rounds
     */
    getAvoidSlotIds(
      benchedRounds: number,
      isA: boolean,
      currentContestSlotId: string | undefined
    ): string[] {
      const resolvedContests = this.getResolvedContestsForSampling();
      const contestsToCheck = resolvedContests.slice(0, benchedRounds);
      const avoidSlotIds: string[] = contestsToCheck.map(c =>
        isA ? c.tierSlotAId : c.tierSlotBId
      );

      if (currentContestSlotId) {
        avoidSlotIds.push(currentContestSlotId);
      }
      return avoidSlotIds;
    },

    /**
     * Helper: Sample from eligible slots avoiding recently used fighters
     */
    sampleFromEligibleSlots(eligibleSlots: MTierSlot[]): MTierSlot {
      const INITIAL_BENCHED_ROUNDS = 30;
      const REDUCE_BENCHED_ROUNDS_PER_ATTEMPT = 5;

      const isA = this.rivalry?.tierListA === this;
      const currentContestSlotId = isA
        ? this.rivalry?.currentContest?.tierSlotAId
        : this.rivalry?.currentContest?.tierSlotBId;

      // Try to find slots with progressively fewer benched rounds
      let benchedRounds = INITIAL_BENCHED_ROUNDS;
      while (benchedRounds > 0) {
        const avoidSlotIds = this.getAvoidSlotIds(
          benchedRounds,
          isA,
          currentContestSlotId
        );
        const selectSlots = eligibleSlots.filter(
          ts => !avoidSlotIds.includes(ts.id)
        );

        if (selectSlots.length > 0) {
          return sample(selectSlots) as MTierSlot;
        }
        benchedRounds -= REDUCE_BENCHED_ROUNDS_PER_ATTEMPT;
      }

      // Fallback: try avoiding just the current contest fighter
      if (currentContestSlotId) {
        const filtered = eligibleSlots.filter(
          ts => ts.id !== currentContestSlotId
        );
        if (filtered.length > 0) {
          return sample(filtered) as MTierSlot;
        }
      }

      // Last resort: use all eligible
      return sample(eligibleSlots) as MTierSlot;
    },
    /**
     * Helper: Find first empty position searching UP from targetPosition toward 0
     */
    findFirstEmptyPositionUp(
      targetPosition: number,
      excludeId: string
    ): number {
      let firstEmpty = targetPosition - 1;
      while (firstEmpty >= 0) {
        const isOccupied = this.slots.some(
          slot => slot.id !== excludeId && slot.position === firstEmpty
        );
        if (!isOccupied) break;
        firstEmpty--;
      }
      return firstEmpty;
    },

    /**
     * Helper: Shift fighters UP (position - 1) from firstEmpty+1 to targetPosition
     */
    shiftFightersUp(
      firstEmpty: number,
      targetPosition: number,
      excludeId: string
    ) {
      for (let pos = firstEmpty + 1; pos <= targetPosition; pos++) {
        const slotAtPos = this.slots.find(
          slot => slot.id !== excludeId && slot.position === pos
        );
        if (slotAtPos) {
          slotAtPos.position = pos - 1;
        }
      }
    },

    /**
     * Helper: Re-sort slots by position (nulls at end)
     */
    resortSlotsByPosition() {
      this.slots = sortBy(this.slots, [
        slot =>
          slot.position === null ? Number.POSITIVE_INFINITY : slot.position,
      ]);
    },

    positionUnknownFighter(tierSlot: MTierSlot, newPosition: number) {
      // Clamp position to valid range (0-85, 0-based)
      const clampedPosition = Math.max(
        0,
        Math.min(newPosition, FIGHTER_COUNT - 1)
      );

      // Find the tier slot in our list
      const slotIndex = this.slots.findIndex(s => s.id === tierSlot.id);
      if (slotIndex === -1) {
        console.warn(
          '[MTierList.positionUnknownFighter] Tier slot not found:',
          tierSlot.id
        );
        return;
      }

      // Check if target position is already occupied
      const occupiedSlot = this.slots.find(
        slot => slot.id !== tierSlot.id && slot.position === clampedPosition
      );

      if (occupiedSlot) {
        const firstEmpty = this.findFirstEmptyPositionUp(
          clampedPosition,
          tierSlot.id
        );
        this.shiftFightersUp(firstEmpty, clampedPosition, tierSlot.id);
      }

      // Place the fighter at target position
      tierSlot.position = clampedPosition;

      // Re-sort slots by position (nulls at end)
      this.resortSlotsByPosition();
    },
    positionFighterAtBottom(tierSlot: MTierSlot) {
      // Position fighter at 85 (bottom) and shift existing fighters UP
      const bottomPosition = FIGHTER_COUNT - 1; // 85 (0-based)

      // Find the tier slot in our list
      const slotIndex = this.slots.findIndex(s => s.id === tierSlot.id);
      if (slotIndex === -1) {
        console.warn(
          '[MTierList.positionFighterAtBottom] Tier slot not found:',
          tierSlot.id
        );
        return;
      }

      // Check if bottom position is already occupied
      const occupiedSlot = this.slots.find(
        slot => slot.id !== tierSlot.id && slot.position === bottomPosition
      );

      if (occupiedSlot) {
        const firstEmpty = this.findFirstEmptyPositionUp(
          bottomPosition,
          tierSlot.id
        );
        this.shiftFightersUp(firstEmpty, bottomPosition, tierSlot.id);
      }

      // Place the fighter at bottom position
      tierSlot.position = bottomPosition;

      // Re-sort slots by position (nulls at end)
      this.resortSlotsByPosition();
    },
  };
}
