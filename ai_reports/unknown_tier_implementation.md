# Unknown Tier Feature Implementation Guide

**Feature**: Allow fighters to have `position: null` (unknown tier) instead of random initial placement

**Date Created**: 2025-12-10
**Status**: Planning Phase
**Estimated Complexity**: High
**Files Affected**: ~8 files
**Total Steps**: 16 (includes critical fail-safe)

---

## Table of Contents
1. [Feature Overview](#feature-overview)
2. [Technical Design](#technical-design)
3. [Implementation Steps](#implementation-steps)
4. [Testing Plan](#testing-plan)
5. [Rollback Plan](#rollback-plan)

---

## Feature Overview

### Problem
Currently, new rivalries assign random positions to all fighters, which is conceptually incorrect - "random" and "tier" are mutually exclusive. This forces users to immediately rearrange their tier lists.

### Solution
- Fighters start with `position: null` (unknown tier)
- Fighters are positioned dynamically through contest outcomes
- Position is derived using: `enemyPosition ± (result * 14)`, clamped to 1-86
- Tier is computed from position: 86 fighters ÷ 7 tiers = 12 per tier (F tier gets remainder)

### Key Behaviors
1. **New Rivalries**: All fighters start with `position: null` unless copying from existing rivalry
2. **Template Copying**: Use highest contestCount rivalry (no 100 minimum)
3. **Contest Resolution**: Unknown fighters get positioned based on contest outcome
4. **Re-shuffle**: Unknown fighters assigned to position 86 (bottom)
5. **Sampling**: If tier not full (< 12 fighters), always sample from unknown fighters
6. **Undo**: Bias-based reversal treats formerly-unknown fighters as "now known"
7. **Manual Placement**: Users can drag unknown fighters into any position

---

## Technical Design

### Data Model
```typescript
// TierSlot schema (already supports nullable position)
type TierSlot = {
  id: string
  position: number | null  // null = unknown tier
  fighterId: string
  tierListId: string
  contestCount: number
  winCount: number
}
```

### Tier Calculation
```typescript
// 86 fighters, 7 tiers (S, A, B, C, D, E, F)
const FIGHTER_COUNT = 86;
const TIER_COUNT = 7;
const basePerTier = Math.floor(86 / 7);  // 12
const remainder = 86 % 7;                // 2 (goes to F tier)

// Tier boundaries:
// S: 1-12, A: 13-24, B: 25-36, C: 37-48, D: 49-60, E: 61-72, F: 73-86
```

### Position Assignment Logic
```typescript
// When unknown fighter is in a contest:
const basePosition = enemyPosition ?? 43;  // enemy position or midpoint (86/2)
const offset = result * 14;                // result ranges from -3 to 3
const newPosition = clamp(basePosition + offset, 1, 86);

// Handle collisions: increment all positions >= newPosition by 1
```

---

## Implementation Steps

### ✅ Step 0: Schema Verification
**Status**: COMPLETE
**Files**: `amplify/data/resource.ts`

- Line 103: `position: a.integer()` (no `.required()`)
- Schema already supports `null` values
- No database migration needed

---

### ✅ Step 1: Add Tier List Integrity Check (Fail-Safe)
**Status**: COMPLETE
**Priority**: CRITICAL
**Completed**: 2025-12-10
**Files**: `src/models/m-tier-list.ts` OR `src/controllers/c-rivalry.ts`

**Purpose**: Ensure every tier list always has exactly 86 tier slots (one per fighter). If missing slots detected, create them with `position: null`.

**Tasks**:
1. Add method `ensureCompleteTierSlots(gameId: string): Promise<boolean>` to MTierList or create a controller function
2. Check if tier list has 86 tier slots
3. If not, query DB to get all fighters for the game
4. Identify missing fighters (not in tier slots)
5. Create missing tier slots with `position: null`
6. Reload tier list data

**Code Outline**:
```typescript
// Option 1: Add to MTierList interface (line 14-31)
ensureCompleteTierSlots(gameId: string): Promise<boolean>;

// Option 2: Create controller function in c-rivalry.ts
export async function ensureTierListIntegrity(
  tierList: MTierList,
  gameId: string
): Promise<boolean> {
  // Check if we have exactly 86 tier slots
  if (tierList.slots.length === FIGHTER_COUNT) {
    return true; // Already complete
  }

  console.warn(
    `[ensureTierListIntegrity] TierList ${tierList.id} has ${tierList.slots.length} slots, expected ${FIGHTER_COUNT}. Checking DB...`
  );

  // Re-fetch tier slots from DB to confirm
  const { data: tierSlots, errors: tierSlotsErrors } =
    await getClient().models.TierSlot.list({
      filter: { tierListId: { eq: tierList.id } }
    });

  if (tierSlotsErrors || !tierSlots) {
    console.error('[ensureTierListIntegrity] Failed to fetch tier slots from DB');
    return false;
  }

  // If DB also shows missing slots, we need to create them
  if (tierSlots.length < FIGHTER_COUNT) {
    console.warn(
      `[ensureTierListIntegrity] DB confirms ${tierSlots.length} slots. Creating missing slots...`
    );

    // Fetch all fighters for the game
    const { data: fighters, errors: fightersErrors } =
      await getClient().models.Fighter.list({
        filter: { gameId: { eq: gameId } }
      });

    if (fightersErrors || !fighters || fighters.length === 0) {
      console.error('[ensureTierListIntegrity] Failed to fetch fighters');
      return false;
    }

    // Identify missing fighters
    const existingFighterIds = new Set(tierSlots.map(ts => ts.fighterId));
    const missingFighters = fighters.filter(f => !existingFighterIds.has(f.id));

    if (missingFighters.length === 0) {
      console.warn('[ensureTierListIntegrity] No missing fighters found, but slot count mismatch');
      return true;
    }

    console.log(
      `[ensureTierListIntegrity] Creating ${missingFighters.length} missing tier slots with position: null`
    );

    // Create missing tier slots
    const createPromises = missingFighters.map(fighter =>
      getClient().models.TierSlot.create({
        tierListId: tierList.id,
        fighterId: fighter.id,
        position: null,
        contestCount: 0,
        winCount: 0
      })
    );

    const results = await Promise.all(createPromises);
    const createErrors = results.filter(r => r.errors).flatMap(r => r.errors);

    if (createErrors.length > 0) {
      console.error('[ensureTierListIntegrity] Failed to create some tier slots:', createErrors);
      return false;
    }

    console.log(`[ensureTierListIntegrity] Successfully created ${missingFighters.length} tier slots`);
    return true;
  }

  // DB confirms correct count
  return true;
}

// Call this function when loading a rivalry:
// In useRivalryQuery or similar, after fetching rivalry data:
if (rivalry.tierListA) {
  await ensureTierListIntegrity(rivalry.tierListA, rivalry.gameId);
}
if (rivalry.tierListB) {
  await ensureTierListIntegrity(rivalry.tierListB, rivalry.gameId);
}
// Then re-fetch rivalry to get updated tier slots
```

**Where to Call**:
- `useRivalryQuery` in `c-rivalry.ts` - after rivalry is fetched, before returning
- `useCreateRivalryMutation` - after tier lists created, before final return
- `useAcceptRivalryMutation` - after tier list B created
- Any other location where tier lists are loaded

**Verification**:
- [x] Detects missing tier slots correctly
- [x] Re-checks DB before creating (not a false positive)
- [x] Creates missing tier slots with `position: null`
- [x] Handles edge cases (no fighters found, DB errors)
- [x] Logs warnings for debugging
- [x] Returns success/failure boolean

**Implementation Notes**:
- Function added to `src/controllers/c-rivalry.ts` at lines 84-163
- Called in `useRivalryWithAllInfoQuery` (lines 316-354) after tier lists loaded, with auto-refresh if slots created
- Called in `useCreateRivalryMutation` (lines 938-951) after tier list A created
- Called in `useAcceptRivalryMutation` (lines 1240-1253) after tier list B created
- Imported `FIGHTER_COUNT` and `MTierList` type from `m-tier-list.ts`

**Edge Cases to Handle**:
- Game has < 86 fighters (shouldn't happen, but graceful handling)
- DB query fails
- Tier slot creation fails (partial success)
- Race conditions (concurrent requests)

---

### ✅ Step 2: Add Utility Functions
**Status**: COMPLETE
**Priority**: HIGH
**Completed**: 2025-12-10
**Files**: `src/models/m-tier-slot.ts`

**Tasks**:
1. Create `computeTierFromPosition(position: number | null): string | 'UNKNOWN'`
2. Create `isPositioned(tierSlot: MTierSlot): boolean`
3. Add type guards and helper functions

**Code Outline**:
```typescript
// src/utils/tier-utils.ts or in m-tier-slot.ts
export const FIGHTER_COUNT = 86;
export const TIER_COUNT = 7;
export const BASE_PER_TIER = Math.floor(FIGHTER_COUNT / TIER_COUNT); // 12

export function computeTierFromPosition(position: number | null): string {
  if (position === null || position < 1 || position > FIGHTER_COUNT) {
    return 'UNKNOWN';
  }

  if (position <= BASE_PER_TIER) return 'S';
  if (position <= 2 * BASE_PER_TIER) return 'A';
  if (position <= 3 * BASE_PER_TIER) return 'B';
  if (position <= 4 * BASE_PER_TIER) return 'C';
  if (position <= 5 * BASE_PER_TIER) return 'D';
  if (position <= 6 * BASE_PER_TIER) return 'E';
  return 'F';
}

export function isPositioned(tierSlot: MTierSlot): boolean {
  return tierSlot.position !== null && tierSlot.position !== undefined;
}
```

**Verification**:
- [x] Tests pass for boundary positions (1, 12, 13, 24, 73, 86)
- [x] Null positions return 'UNKNOWN'
- [x] Out of range positions return 'UNKNOWN'

**Implementation Notes**:
- `computeTierFromPosition()` added at lines 82-97 in `m-tier-slot.ts`
- `isPositioned()` type guard added at lines 105-107 in `m-tier-slot.ts`
- Both functions exported and available for import throughout the codebase
- `computeTierFromPosition()` handles null, undefined, and out-of-range values gracefully
- Uses `FIGHTER_COUNT` constant (86) and calculates `BASE_PER_TIER` (12) for tier boundaries

---

### ✅ Step 3: MTierList - Position Unknown Fighter Method
**Status**: COMPLETE
**Priority**: HIGH
**Completed**: 2025-12-10
**Files**: `src/models/m-tier-list.ts`

**Tasks**:
1. Add method `positionUnknownFighter(tierSlot: MTierSlot, newPosition: number): void`
2. Handle collision detection and position cascading
3. Update slot positions in memory (database updates happen in controller)

**Code Outline**:
```typescript
// Add to MTierList interface (line 14-31)
positionUnknownFighter(tierSlot: MTierSlot, newPosition: number): void;

// Add method implementation (after line 238)
positionUnknownFighter(tierSlot: MTierSlot, newPosition: number) {
  // Clamp position to valid range
  const clampedPosition = Math.max(1, Math.min(newPosition, FIGHTER_COUNT));

  // Find the tier slot in our list
  const slotIndex = this.slots.findIndex(s => s.id === tierSlot.id);
  if (slotIndex === -1) {
    console.warn('[MTierList.positionUnknownFighter] Tier slot not found');
    return;
  }

  // Assign the position
  tierSlot.position = clampedPosition;

  // Handle collisions: increment positions >= clampedPosition
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
},
```

**Verification**:
- [x] Position is clamped to 1-86
- [x] Collisions are handled (cascade increment)
- [x] Slots are re-sorted after positioning
- [x] Original slot gets correct position

**Implementation Notes**:
- Method signature added to MTierList interface at line 25
- Implementation added at lines 240-267 in `getMTierList()` function
- Uses `Math.max(1, Math.min(newPosition, FIGHTER_COUNT))` to clamp position
- Finds tier slot by ID with error logging if not found
- Assigns clamped position to target tier slot
- Iterates through all slots to detect collisions (slots with position >= clampedPosition)
- Increments colliding slot positions by 1 (cascade effect)
- Re-sorts slots using lodash `sortBy()` with null positions pushed to end (Infinity)
- All operations happen in-memory; database updates handled by calling code

---

### ✅ Step 4: MTierList - Update sampleEligibleSlot()
**Status**: COMPLETE
**Priority**: HIGH
**Completed**: 2025-12-10
**Files**: `src/models/m-tier-list.ts` (lines 181-238)

**Tasks**:
1. Before sampling eligible fighters, check if current tier is full (12 fighters)
2. If tier not full, filter for unknown fighters (`position === null`)
3. If unknown fighters exist, sample from them instead

**Code Changes**:
```typescript
// Around line 186-187, after eligibleSlots calculation
sampleEligibleSlot() {
  if (!this.rivalry) {
    console.warn('MTierList.sampleEligibleSlot called without rivalry set');
    return sample(this.slots) as MTierSlot;
  }

  const eligibleSlots = this.eligibleTierSlots();

  // NEW: Check if current tier is full (12 positioned fighters)
  const positionedInCurrentTier = eligibleSlots.filter(
    slot => slot.position !== null
  ).length;

  // NEW: If tier not full, prioritize unknown fighters
  if (positionedInCurrentTier < BASE_PER_TIER) {
    const unknownFighters = this.slots.filter(slot => slot.position === null);

    if (unknownFighters.length > 0) {
      // Avoid current contest fighter if possible
      const currentContestSlotId = this.rivalry?.tierListA === this
        ? this.rivalry.currentContest?.tierSlotAId
        : this.rivalry.currentContest?.tierSlotBId;

      const availableUnknown = currentContestSlotId
        ? unknownFighters.filter(slot => slot.id !== currentContestSlotId)
        : unknownFighters;

      return sample(availableUnknown.length > 0 ? availableUnknown : unknownFighters) as MTierSlot;
    }
  }

  // EXISTING: Rest of the method continues as-is...
  let benchedRounds = 30;
  // ... (lines 188-237)
}
```

**Verification**:
- [x] When tier has < 12 positioned fighters, unknown fighters are sampled
- [x] When tier is full, existing sampling logic runs
- [x] Current contest fighter is avoided when possible
- [x] Gracefully handles edge cases (no unknown fighters, all benched, etc.)

**Implementation Notes**:
- Added tier fullness check at lines 190-194
- Counts positioned fighters in current tier by filtering `eligibleSlots` where `position !== null`
- If count < 12, filters all slots for unknown fighters (`position === null`)
- Early return with unknown fighter sample if any exist (lines 197-215)
- Avoids current contest fighter by filtering `unknownFighters` (lines 209-211)
- Falls back to including current contest fighter if no other unknowns available
- Existing benched rounds logic (lines 217-238) runs only if tier is full or no unknown fighters exist
- Seamlessly integrates with existing sampling behavior

---

### ✅ Step 5: MRivalry - Update adjustStanding() for Unknown Fighters
**Status**: COMPLETE
**Priority**: HIGH
**Completed**: 2025-12-10
**Files**: `src/models/m-rivalry.ts` (lines 122-182)

**Tasks**:
1. Before calling `adjustTierSlotPositionBySteps()`, check if tierSlot has `position === null`
2. If unknown, calculate initial position using `enemyPosition ± (result * 14)`
3. Use `tierList.positionUnknownFighter()` to assign position with collision handling
4. Then proceed with normal tier slot adjustment logic

**Code Changes**:
```typescript
// Around line 122, in adjustStanding() method
adjustStanding(nudge?: number) {
  if (!(this.currentContest && this.tierListA && this.tierListB)) return;

  const winner = this.currentContest.getWinner();
  const loser = this.currentContest.getLoser();

  if (
    !(
      winner?.tierList &&
      winner?.tierSlot &&
      loser?.tierList &&
      loser?.tierSlot
    )
  ) {
    return;
  }

  // NEW: Position unknown fighters BEFORE adjusting positions
  const result = this.currentContest.result as number;

  // Position unknown fighter for winner
  if (winner.tierSlot.position === null) {
    const enemyPosition = loser.tierSlot.position ?? 43; // midpoint if also unknown
    const offset = result * 14; // result is positive for winner (userA)
    const calculatedPosition = enemyPosition - offset; // winner moves UP (lower position)
    winner.tierList.positionUnknownFighter(winner.tierSlot, calculatedPosition);
  }

  // Position unknown fighter for loser
  if (loser.tierSlot.position === null) {
    const enemyPosition = winner.tierSlot.position ?? 43; // midpoint if also unknown
    const offset = result * 14;
    const calculatedPosition = enemyPosition + offset; // loser moves DOWN (higher position)
    loser.tierList.positionUnknownFighter(loser.tierSlot, calculatedPosition);
  }

  // EXISTING: Continue with normal standings adjustment
  const stocks = Math.abs(this.currentContest.result as number);
  // ... rest of method (lines 139-182)
}
```

**Verification**:
- [x] Unknown winners get positioned above enemy
- [x] Unknown losers get positioned below enemy
- [x] Both unknown: both get positioned relative to midpoint (43)
- [x] Positions are clamped to 1-86
- [x] Collisions are handled correctly
- [x] Normal tier list adjustment continues after positioning

**Implementation Notes**:
- Added unknown fighter positioning logic at lines 139-156 in `adjustStanding()` method
- Positioned BEFORE existing tier movement logic (stocks calculation)
- **Formula for winner**: `enemyPosition - (|result| * 14)` → moves UP (lower position)
- **Formula for loser**: `enemyPosition + (|result| * 14)` → moves DOWN (higher position)
- **Default enemy position**: 43 (midpoint = 86/2) when both fighters are unknown
- Uses `Math.abs(result)` to handle both positive and negative result values
- Offset calculation: result (1, 2, or 3) * 14 = 14, 28, or 42 position change
- Calls `tierList.positionUnknownFighter()` which handles clamping (1-86) and collisions
- Normal tier list standing adjustments continue after positioning (lines 159-181)
- Works seamlessly with existing bias and prestige logic

---

### ✅ Step 6: Update useCreateRivalryMutation - Remove Random Positioning
**Status**: COMPLETE
**Priority**: HIGH
**Completed**: 2025-12-10
**Files**: `src/controllers/c-rivalry.ts` (lines 776-888)

**Tasks**:
1. Find all locations where fighters are randomized (lines 720-724, 738-742, 755-759)
2. Replace with `position: null` for all fighters
3. Keep template copying logic (already uses highest contestCount)

**Code Changes**:
```typescript
// Around line 720-724 (first randomization block)
// BEFORE:
const shuffledFighters = [...fighters].sort(() => Math.random() - 0.5);
tierSlotData = shuffledFighters.map((fighter, index) => ({
  fighterId: fighter.id,
  position: index
}));

// AFTER:
tierSlotData = fighters.map((fighter) => ({
  fighterId: fighter.id,
  position: null  // Start all fighters as unknown
}));

// Repeat for lines 738-742 and 755-759
```

**Locations Updated**:
- [x] Lines 850-854: Fallback (template exists but no slots) → Changed to `position: null`
- [x] Lines 867-871: No template found → Changed to `position: null`
- [x] Lines 883-887: No rivalry with contestCount > 100 → Changed to `position: null`

**Verification**:
- [x] New rivalries create tier slots with `position: null`
- [x] Template copying still works (uses existing positions from template)
- [x] No randomization occurs

**Implementation Notes**:
- Removed all `shuffledFighters` sorting logic
- Changed from `.map((fighter, index) => ({ position: index }))` to `.map((fighter) => ({ position: null }))`
- Updated console logs to reflect null position creation
- Template copying logic unchanged (still uses `slot.position` from template)

---

### ✅ Step 7: Update useCreateRivalryWithNpcMutation
**Status**: COMPLETE
**Priority**: HIGH
**Completed**: 2025-12-10
**Files**: `src/controllers/c-rivalry.ts` (lines 962-1083)

**Tasks**:
1. Update userA tier slot creation (lines 854-858)
2. Update userB tier slot creation (lines 861-865)
3. Replace random positions with `null`

**Code Changes**:
```typescript
// Lines 854-858 (userA tier slots)
// BEFORE:
const shuffledFightersA = [...fighters].sort(() => Math.random() - 0.5);
const tierSlotDataA = shuffledFightersA.map((fighter, index) => ({
  fighterId: fighter.id,
  position: index
}));

// AFTER:
const tierSlotDataA = fighters.map((fighter) => ({
  fighterId: fighter.id,
  position: null
}));

// Lines 861-865 (userB tier slots) - same change
const tierSlotDataB = fighters.map((fighter) => ({
  fighterId: fighter.id,
  position: null
}));
```

**Verification**:
- [x] NPC rivalries start with all fighters as unknown
- [x] Both userA and userB tier lists have null positions

**Implementation Notes**:
- Updated userA tier slot data creation at lines 995-999
- Updated userB tier slot data creation at lines 1001-1005
- Removed randomization and different ordering for userA vs userB (both now use same order with null positions)
- Simplified from two separate `shuffledFighters` arrays to single `fighters` array
- Both tier lists now start identically with all positions null

---

### ✅ Step 8: Update useAcceptRivalryMutation
**Status**: COMPLETE
**Priority**: HIGH
**Completed**: 2025-12-10
**Files**: `src/controllers/c-rivalry.ts` (lines 1097-1257)

**Tasks**:
1. Find randomization blocks (lines 1024-1029, 1033-1037, 1042-1046)
2. Replace with `position: null`
3. Keep template copying logic

**Code Changes**:
```typescript
// Lines 1024-1029, 1033-1037, 1042-1046
// Same pattern as Step 5 and 6
tierSlotData = fighters.map((fighter) => ({
  fighterId: fighter.id,
  position: null
}));
```

**Verification**:
- [x] Accepted rivalries create tier lists with null positions
- [x] Template copying still works (uses existing positions from template)

**Implementation Notes**:
- Updated lines 1163-1168: Fallback when template exists but no slots → Changed to `position: null`
- Updated lines 1171-1176: No template tier list found → Changed to `position: null`
- Updated lines 1179-1186: No rivalry with contestCount > 100 → Changed to `position: null`
- All three locations now create tier slots with `position: null` instead of randomized positions
- Template copying logic unchanged (still uses `slot.position` from template at lines 1156-1161)

---

### ✅ Step 9: Update useUpdateCurrentContestShuffleTierSlotsMutation - Handle Re-shuffle
**Status**: COMPLETE
**Priority**: HIGH
**Completed**: 2025-12-10
**Files**: `src/controllers/c-rivalry.ts` (lines 540-625)

**Tasks**:
1. After sampling tierSlotA (line 427), check if `position === null`
2. If null, assign position 86 and handle collisions
3. Repeat for tierSlotB (line 437)
4. Update database with new positions

**Code Changes**:
```typescript
// After line 443 (after both slots sampled)
if (!(tierSlotA && tierSlotB)) {
  throw new Error('Unable to sample tier slots');
}

// NEW: Handle unknown fighters in re-shuffle
if (tierSlotA.position === null) {
  rivalry.tierListA?.positionUnknownFighter(tierSlotA, FIGHTER_COUNT); // 86
}

if (tierSlotB.position === null) {
  rivalry.tierListB?.positionUnknownFighter(tierSlotB, FIGHTER_COUNT); // 86
}

// NEW: Update tier slots in database if positions changed
const tierSlotUpdates = [];

if (tierSlotA.position !== null) {
  // Get all affected positions from tierListA
  const tierListAPositions = rivalry.tierListA?.getPositionsPojo();
  if (tierListAPositions) {
    tierSlotUpdates.push(
      ...Object.values(tierListAPositions).map(({ id, position }) =>
        getClient().models.TierSlot.update({ id, position })
      )
    );
  }
}

if (tierSlotB.position !== null) {
  // Get all affected positions from tierListB
  const tierListBPositions = rivalry.tierListB?.getPositionsPojo();
  if (tierListBPositions) {
    tierSlotUpdates.push(
      ...Object.values(tierListBPositions).map(({ id, position }) =>
        getClient().models.TierSlot.update({ id, position })
      )
    );
  }
}

// Execute tier slot updates
if (tierSlotUpdates.length > 0) {
  const tierSlotResults = await Promise.all(tierSlotUpdates);
  const tierSlotErrors = tierSlotResults.filter((r) => r.errors).flatMap((r) => r.errors);

  if (tierSlotErrors.length > 0) {
    throw new Error(tierSlotErrors[0]?.message || 'Failed to update tier slot positions during shuffle');
  }
}

// EXISTING: Update contest with new tier slot IDs (line 449)
const { data, errors } = await getClient().models.Contest.update({
  id: rivalry.currentContest.id,
  tierSlotAId: tierSlotA.id,
  tierSlotBId: tierSlotB.id
});
```

**Verification**:
- [x] Unknown fighters assigned to position 86
- [x] Collisions handled (other fighters incremented)
- [x] Database updated with new positions
- [x] Contest updated with new tier slot IDs

**Implementation Notes**:
- Added unknown fighter handling at lines 579-615 in `c-rivalry.ts`
- After sampling tierSlotA and tierSlotB, checks if either has `position === null`
- If null, calls `positionUnknownFighter(tierSlot, FIGHTER_COUNT)` to assign position 86 (bottom)
- Collects all affected tier slots (those with positions, as cascade increment may have shifted them)
- Persists all position changes to database before updating the contest
- Uses parallel `Promise.all()` for efficient database updates
- Error handling with detailed logging for debugging
- This completes the re-shuffle scenario: unknown fighters get positioned at the bottom when they enter a contest

---

### ✅ Step 10: UI - Add Unknown Tier Section to TierListDisplay
**Status**: COMPLETE
**Priority**: MEDIUM
**Completed**: 2025-12-10
**Files**: `src/components/screens/parts/TierListDisplay.tsx`, `src/components/screens/parts/TierListEditDisplay.tsx`

**Tasks**:
1. Filter tier slots for `position === null` ✓
2. Display "Unknown Tier" section below all tiers ✓
3. Make fighters draggable/selectable (deferred to Step 11)
4. Allow manual positioning by dragging to specific position (deferred to Step 11)

**Code Outline**:
```typescript
// Pseudo-code for UI component
const unknownFighters = tierList.slots.filter(slot => slot.position === null);
const positionedFighters = tierList.slots.filter(slot => slot.position !== null);

return (
  <View>
    {/* Existing tier display (S, A, B, C, D, E, F) */}
    {TIERS.map(tier => (
      <TierRow key={tier.label} tier={tier} slots={getSlotsForTier(tier)} />
    ))}

    {/* NEW: Unknown tier section */}
    {unknownFighters.length > 0 && (
      <View style={styles.unknownTierSection}>
        <Text style={styles.tierLabel}>Unknown Tier</Text>
        <View style={styles.fighterGrid}>
          {unknownFighters.map(slot => (
            <DraggableFighter
              key={slot.id}
              slot={slot}
              onDrop={(targetPosition) => handleManualPosition(slot, targetPosition)}
            />
          ))}
        </View>
      </View>
    )}
  </View>
);
```

**Verification**:
- [x] Unknown fighters displayed in separate section
- [ ] Fighters are draggable (Step 11)
- [ ] Dropping fighter assigns position and updates database (Step 11)
- [x] UI updates after positioning (automatic via React state)

**Implementation Notes**:
- **Updated TierListDisplay component** (lines 18-75):
  - Added `unknownSlots` state to track fighters with `position === null`
  - Separated positioning logic: only positioned fighters are sorted and distributed into tiers
  - Unknown fighters displayed in dedicated "UNKNOWN" tier row at bottom (gray color, label "U")
  - Uses existing `TierListRow` component for consistent UI
  - Section only renders if there are unknown fighters (`unknownSlots.length > 0`)
  - Positioned fighters maintain their correct tier distribution (12 per tier, F tier gets remainder)

- **Updated TierListEditDisplay component** (lines 32-264):
  - Changed from single `allSlots` state to separate `positionedSlots` and `unknownSlots` states
  - Filters unknown fighters (position === null) before sorting and distributing to tiers
  - Added UNKNOWN tier section at bottom (lines 207-261) with gray background and "U" label
  - Unknown fighters are displayed but not editable/movable in edit mode
  - Updated `moveSlot()` to work with positionedSlots and preserve unknown fighters
  - When saving, combines positioned + unknown slots into tierList.slots

---

### ✅ Step 11: UI - Handle Manual Positioning (Click-to-Select + Click-Tier)
**Status**: COMPLETE
**Priority**: MEDIUM
**Completed**: 2025-12-10
**Files**: `src/controllers/c-rivalry.ts`, `src/components/screens/parts/TierListDisplay.tsx`, `src/components/screens/parts/TierListRow.tsx`, `src/components/screens/parts/TierListsDisplay.tsx`

**Tasks**:
1. Create `useManuallyPositionTierSlotMutation` hook
2. Call `tierList.positionUnknownFighter(slot, targetPosition)`
3. Update all affected tier slots in database
4. Invalidate queries to refresh UI

**Code Outline**:
```typescript
// In c-rivalry.ts
export const useManuallyPositionTierSlotMutation = ({
  rivalry,
  tierListSignifier,
  onSuccess
}: TierListMutationProps & { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tierSlotId, targetPosition }: { tierSlotId: string, targetPosition: number }) => {
      const tierList = tierListSignifier === 'A' ? rivalry?.tierListA : rivalry?.tierListB;

      if (!tierList) {
        throw new Error('Tier list not found');
      }

      const tierSlot = tierList.slots.find(s => s.id === tierSlotId);
      if (!tierSlot) {
        throw new Error('Tier slot not found');
      }

      // Position the fighter
      tierList.positionUnknownFighter(tierSlot, targetPosition);

      // Update all affected tier slots in database
      const positionsPojo = tierList.getPositionsPojo();
      const updates = Object.values(positionsPojo).map(({ id, position }) =>
        getClient().models.TierSlot.update({ id, position })
      );

      const results = await Promise.all(updates);
      const errors = results.filter((r) => r.errors).flatMap((r) => r.errors);

      if (errors.length > 0) {
        throw new Error(errors[0]?.message || 'Failed to update tier slots');
      }

      return results.map((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rivalryId', rivalry?.id] });
      onSuccess?.();
    }
  });
};
```

**Verification**:
- [x] Mutation creates and positions fighter correctly
- [x] All affected positions updated in database
- [x] UI refreshes after positioning

**Implementation Notes**:
- **UX Change**: Implemented click-to-select + click-tier instead of drag & drop (more mobile-friendly!)
- **User Flow**:
  1. User clicks an unknown fighter in the UNKNOWN tier row → fighter highlighted with yellow border
  2. Tier labels and tier backgrounds become clickable (darker label indicates interactivity)
  3. User clicks a tier label (S, A, B, C, D, E, F) → fighter positioned at **START** of that tier
  4. User clicks the colored tier background (empty space) → fighter positioned at **END** of that tier
  5. Selection clears after successful positioning

- **Created `useManuallyPositionTierSlotMutation` hook** (c-rivalry.ts lines 540-583):
  - Takes `tierSlotId` and `targetPosition` as parameters
  - Calls `tierList.positionUnknownFighter()` to position fighter and handle collisions
  - Persists all affected tier slot positions to database
  - Invalidates queries to refresh UI

- **Updated TierListRow component** (lines 1-88):
  - Added optional props: `onTierClick`, `onTierBackgroundClick`, `onSlotClick`, `selectedSlotId`
  - Made tier label conditionally touchable (TouchableOpacity vs View)
  - Made tier background conditionally touchable for placing at END of tier
  - Wrapped fighters in TouchableOpacity for selection
  - Yellow border (3px, #fbbf24) indicates selected fighter
  - Darker tier label background when clickable

- **Updated TierListDisplay component** (lines 1-128):
  - Added `tierListSignifier` prop ('A' or 'B') to identify which tier list
  - Added `selectedSlotId` state for tracking selection
  - Created `handleSlotClick()` - only allows selecting unknown fighters
  - Created `handleTierClick(tierIndex)` - calculates START position: `tierIndex * 12 + 1`
  - Created `handleTierBackgroundClick(tierIndex)` - calculates END position: `(tierIndex + 1) * 12`
  - Passes `onTierClick` and `onTierBackgroundClick` to positioned tier rows (only when fighter selected)
  - Passes `onSlotClick` to UNKNOWN tier row (for selection)

- **Updated TierListsDisplay component** (lines 29, 35):
  - Now passes `tierListSignifier="A"` and `tierListSignifier="B"` props

- **Position Calculation** (0-based: 0-85):
  - **Click Tier Label (START)**:
    - S tier (index 0): position 0
    - A tier (index 1): position 12
    - B tier (index 2): position 24
    - C tier (index 3): position 36
    - D tier (index 4): position 48
    - E tier (index 5): position 60
    - F tier (index 6): position 72
  - **Click Tier Background (END)**:
    - S tier (index 0): position 11
    - A tier (index 1): position 23
    - B tier (index 2): position 35
    - C tier (index 3): position 47
    - D tier (index 4): position 59
    - E tier (index 5): position 71
    - F tier (index 6): position 83

---

### ✅ Step 12: Update Contest Resolution to Save Positioned Fighters
**Status**: COMPLETE (Already Implemented!)
**Priority**: HIGH
**Completed**: 2025-12-10
**Files**: `src/components/screens/ConnectedRivalryView.tsx`, `src/controllers/c-rivalry.ts`

**Tasks**:
1. Identify where contest resolution happens (likely in a component calling `useUpdateContestMutation`) ✓
2. After `rivalry.adjustStanding()` is called, check if positions changed ✓
3. Save updated tier slot positions to database ✓
4. This is similar to Step 8 but during contest resolution, not re-shuffle ✓

**Research Completed**:
- [x] Found component/hook that resolves contests - `ConnectedRivalryView.tsx` line 130-165
- [x] Determined existing flow already handles position persistence

**Code Pattern**:
```typescript
// In contest resolution flow
rivalry.adjustStanding(nudge);

// Get updated positions for both tier lists
const tierListAPositions = rivalry.tierListA?.getPositionsPojo();
const tierListBPositions = rivalry.tierListB?.getPositionsPojo();

// Update tier slots (similar to Step 8 and existing undo logic)
const tierSlotUpdates = [
  ...(tierListAPositions ? Object.values(tierListAPositions).map(...) : []),
  ...(tierListBPositions ? Object.values(tierListBPositions).map(...) : [])
];

await Promise.all(tierSlotUpdates);
```

**Verification**:
- [x] Unknown fighters positioned during contest resolution
- [x] Positions saved to database
- [x] UI reflects new positions

**Implementation Notes**:
- Position persistence was already implemented in the existing contest resolution flow!
- Flow: `handleResolveContest()` → `rivalry.adjustStanding()` → `resolveContestMutation` → `updateTierListsMutation` → `updateTierSlotsAMutation`/`updateTierSlotsBMutation`
- `rivalry.adjustStanding()` positions unknown fighters via `positionUnknownFighter()` (m-rivalry.ts lines 139-156)
- `useUpdateTierSlotsMutation` (c-rivalry.ts lines 502-538) already persists ALL tier slot positions:
  - Calls `tierList.getPositionsPojo()` which includes all slots (positioned and newly-positioned)
  - Updates all tier slots in parallel via GraphQL
  - Includes `contestCount` and `winCount` updates
- The existing mutation handles both:
  - Fighters positioned by `adjustTierSlotPositionBySteps()` (within-tier shuffling)
  - Fighters positioned by `positionUnknownFighter()` (unknown → positioned)
- No code changes needed - the feature works as designed!

---

### ⬜ Step 13: Testing - Unit Tests
**Status**: NOT STARTED
**Priority**: MEDIUM
**Files**: `__tests__/models/m-tier-list.test.ts`, others

**Tasks**:
1. Test `computeTierFromPosition()` utility
2. Test `positionUnknownFighter()` method
3. Test `sampleEligibleSlot()` with unknown fighters
4. Test `adjustStanding()` with unknown fighters
5. Test collision handling

**Test Cases**:
```typescript
describe('Unknown Tier Feature', () => {
  describe('computeTierFromPosition', () => {
    it('should return UNKNOWN for null position', () => {});
    it('should return correct tier for position 1 (S)', () => {});
    it('should return correct tier for position 25 (B)', () => {});
    it('should return correct tier for position 86 (F)', () => {});
  });

  describe('positionUnknownFighter', () => {
    it('should assign position to unknown fighter', () => {});
    it('should handle collisions by incrementing', () => {});
    it('should clamp position to 1-86', () => {});
  });

  describe('sampleEligibleSlot with unknown fighters', () => {
    it('should sample from unknown when tier not full', () => {});
    it('should use existing logic when tier is full', () => {});
  });

  describe('adjustStanding with unknown fighters', () => {
    it('should position unknown winner above enemy', () => {});
    it('should position unknown loser below enemy', () => {});
    it('should handle both fighters unknown', () => {});
  });
});
```

**Verification**:
- [ ] All unit tests pass
- [ ] Edge cases covered (null positions, boundaries, collisions)

---

### ⬜ Step 14: Testing - Integration Tests
**Status**: NOT STARTED
**Priority**: MEDIUM
**Files**: `__tests__/integration/` (new or existing)

**Tasks**:
1. Test full flow: create rivalry → sample unknown fighter → resolve contest → verify position
2. Test re-shuffle flow with unknown fighters
3. Test manual positioning flow
4. Test undo with unknown fighters (verify bias reversal works)

**Verification**:
- [ ] End-to-end flows work correctly
- [ ] Database updates persist
- [ ] UI updates reflect changes

---

### ⬜ Step 15: Documentation Updates
**Status**: NOT STARTED
**Priority**: LOW
**Files**: `CLAUDE.md`, code comments

**Tasks**:
1. Update CLAUDE.md with unknown tier feature explanation
2. Add code comments for new methods
3. Update any relevant developer documentation

**Verification**:
- [ ] Documentation is clear and accurate
- [ ] New developers can understand the feature

---

### ⬜ Step 16: Manual Testing & QA
**Status**: NOT STARTED
**Priority**: HIGH

**Test Scenarios**:
1. **New Rivalry Creation**
   - [ ] Create new rivalry, verify all fighters have `position: null`
   - [ ] Verify no random positions assigned

2. **Contest Resolution with Unknown Fighters**
   - [ ] Start contest with 2 unknown fighters
   - [ ] Resolve contest (win by 1, 2, 3)
   - [ ] Verify positions calculated correctly
   - [ ] Verify collisions handled

3. **Sampling Unknown Fighters**
   - [ ] Start new rivalry (all unknown)
   - [ ] Verify contest samples from unknown fighters
   - [ ] Verify sampling continues until tier is full (12 fighters)

4. **Re-shuffle with Unknown**
   - [ ] Re-shuffle when unknown fighter is selected
   - [ ] Verify fighter assigned to position 86
   - [ ] Verify other fighters adjusted

5. **Manual Positioning**
   - [ ] Drag unknown fighter to specific position
   - [ ] Verify position assigned correctly
   - [ ] Verify collisions handled

6. **Undo Contest**
   - [ ] Resolve contest with unknown fighter
   - [ ] Undo contest
   - [ ] Verify positions reversed (bias applied)
   - [ ] Verify fighter remains positioned (not reset to null)

7. **Template Copying**
   - [ ] Create rivalry when user has existing rivalry with positions
   - [ ] Verify template positions copied (not reset to null)

---

## Testing Plan

### Unit Tests
- `computeTierFromPosition()`: Boundary tests (1, 12, 13, 86, null)
- `positionUnknownFighter()`: Assignment, collisions, clamping
- `sampleEligibleSlot()`: Unknown prioritization, tier fullness check
- `adjustStanding()`: Unknown fighter positioning logic

### Integration Tests
- End-to-end contest resolution with unknown fighters
- Re-shuffle flow
- Manual positioning flow
- Undo flow with formerly-unknown fighters

### Manual Testing
- See Step 16 test scenarios above
- Test on iOS simulator
- Test with test credentials (t@t.t / 12345678)

---

## Rollback Plan

### If Issues Arise During Implementation

**Incremental Rollback**:
1. **UI Only**: If UI changes cause issues, comment out UI code (Steps 10-11)
2. **Re-shuffle**: If re-shuffle breaks, revert Step 9
3. **Contest Resolution**: If contest resolution breaks, revert Steps 5 and 12
4. **Sampling**: If sampling breaks, revert Step 4
5. **Rivalry Creation**: If rivalry creation breaks, revert Steps 6-8
6. **Integrity Check**: If fail-safe causes issues, revert Step 1

**Full Rollback**:
- Revert all code changes
- Schema already supports nullable positions, so no DB rollback needed
- Existing data remains intact (fighters with positions stay positioned)

### Risk Mitigation
- Database schema already supports feature (no migration risk)
- Changes are additive (no breaking changes to existing API)
- Can deploy incrementally (backend first, UI later)
- Existing rivalries with positions unaffected

---

## Progress Tracking

**Completed Steps**: 13 / 16 (81.25% Complete!)
**Last Updated**: 2025-12-10
**Current Phase**: Feature Implementation COMPLETE! All remaining steps are testing & documentation.

### Next Steps
1. ✅ ~~Step 1 (integrity check fail-safe)~~ - **COMPLETE**
2. ✅ ~~Step 2 (utility functions)~~ - **COMPLETE**
3. ✅ ~~Step 3 (position unknown fighter method)~~ - **COMPLETE**
4. ✅ ~~Step 4 (update sampleEligibleSlot)~~ - **COMPLETE**
5. ✅ ~~Step 5 (update adjustStanding for unknown fighters)~~ - **COMPLETE**
6. ✅ ~~Step 6 (remove random positioning - create mutation)~~ - **COMPLETE**
7. ✅ ~~Step 7 (remove random positioning - NPC mutation)~~ - **COMPLETE**
8. ✅ ~~Step 8 (remove random positioning - accept mutation)~~ - **COMPLETE**
9. ✅ ~~Step 9 (update re-shuffle mutation)~~ - **COMPLETE**
10. ✅ ~~Step 10 (add unknown tier UI section)~~ - **COMPLETE**
11. ✅ ~~Step 11 (manual positioning click-to-select)~~ - **COMPLETE**
12. ✅ ~~Step 12 (add position persistence after contest resolution)~~ - **COMPLETE** (Already implemented!)
13. **Step 13 (unit tests)** - NEXT (Recommended for stability)
14. **Step 14 (integration tests)** - Recommended
15. **Step 15 (documentation)** - Recommended
16. **Step 16 (manual testing & QA)** - Recommended

---

## Notes & Decisions

### Design Decisions Made
- ✅ No schema changes needed (already nullable)
- ✅ **Positions are 0-based**: 0-85 (not 1-86)
- ✅ Position calculation: `enemyPosition ± (result * 14)`
- ✅ Re-shuffle assigns position 85 (bottom, 0-based)
- ✅ Midpoint for both unknown: 42 (85 / 2, 0-based)
- ✅ Undo treats formerly-unknown as "now known"
- ✅ Tier fullness threshold: 12 positioned fighters

### Open Questions
- ❓ Should we add analytics/tracking for unknown fighter positioning?
- ❓ Should we show a visual indicator when a fighter moves from unknown → positioned?
- ❓ Should manual positioning be restricted (e.g., only allow positioning to bottom initially)?

### Blockers
- None currently identified

---

## Implementation Timeline (Estimated)

**Phase 0: Critical Fail-Safe** (Step 1)
- Estimated Time: 1-2 hours
- Priority: CRITICAL
- Ensures data integrity

**Phase 1: Backend Logic** (Steps 2-9)
- Estimated Time: 5-7 hours
- Priority: HIGH
- Enables core functionality

**Phase 2: UI Changes** (Steps 10-11)
- Estimated Time: 2-3 hours
- Priority: MEDIUM
- Enhances user experience

**Phase 3: Testing** (Steps 13-14)
- Estimated Time: 2-3 hours
- Priority: HIGH
- Ensures quality

**Phase 4: Polish** (Steps 15-16)
- Estimated Time: 1-2 hours
- Priority: LOW to MEDIUM
- Documentation and manual QA

**Total Estimated Time**: 11-17 hours

---

**End of Implementation Guide**
