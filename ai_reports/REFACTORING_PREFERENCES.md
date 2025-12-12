# Refactoring Preferences

**Author**: Claude Code
**Date**: 2025-12-12
**Status**: Reference Guide

## Overview

This document outlines the project's refactoring philosophy: prioritize **readability and clarity** over DRY (Don't Repeat Yourself) principles. Some duplication is acceptable and even preferred when it maintains code clarity.

---

## ✅ GOOD Refactoring Examples

These types of refactoring improve readability and maintainability:

### 1. Extract Duplicate Inline Styles

**✅ DO THIS**: Extract repeated inline styles into named constants

**Example**: `TierListsDisplay.tsx`

```typescript
// ❌ BEFORE: Duplicate inline styles
<Text style={[darkStyles.text, { fontSize: 18, marginBottom: 8, marginTop: 16 }]}>
  {rivalry.displayUserAName()} tier list
</Text>
// ... later in the file
<Text style={[darkStyles.text, { fontSize: 18, marginBottom: 8, marginTop: 16 }]}>
  {rivalry.displayUserBName()} tier list
</Text>

// ✅ AFTER: Reusable style constant
<Text style={[darkStyles.text, tierListHeaderStyle]}>
  {rivalry.displayUserAName()} tier list
</Text>
// ... later in the file
<Text style={[darkStyles.text, tierListHeaderStyle]}>
  {rivalry.displayUserBName()} tier list
</Text>

// At bottom of file
const tierListHeaderStyle = {
  fontSize: 18,
  marginBottom: 8,
  marginTop: 16
};
```

**Why this is good**:

- Single source of truth for the style
- Easy to update in one place
- Improves readability by naming the intent (`tierListHeaderStyle`)
- Reduces visual noise in the JSX

### 2. Extract Repeated Logic Into Helper Functions

**✅ DO THIS**: When the same complex logic appears multiple times

```typescript
// ✅ GOOD: Extract repeated calculations
const calculateWinRate = (winCount: number, contestCount: number): number => {
  return contestCount > 0 ? (winCount / contestCount) * 100 : 0;
};

// Then use it
const fighterAWinRate = calculateWinRate(fighterA.winCount, fighterA.contestCount);
const fighterBWinRate = calculateWinRate(fighterB.winCount, fighterB.contestCount);
```

**Why this is good**:

- Reduces chance of calculation errors
- Names the operation clearly
- Easy to test in isolation
- Single place to update business logic

### 3. Extract Magic Numbers Into Named Constants

**✅ DO THIS**: Give meaning to numbers that appear multiple times

```typescript
// ❌ BEFORE: Magic numbers scattered throughout
const step = result * 14;
// ... elsewhere
if (position >= 72) {
  // F tier logic
}

// ✅ AFTER: Named constants
const STEPS_PER_STOCK = 14;
const F_TIER_START_POSITION = 72;

const step = result * STEPS_PER_STOCK;
if (position >= F_TIER_START_POSITION) {
  // F tier logic
}
```

**Why this is good**:

- Self-documenting code
- Easy to update values project-wide
- Reveals intent and business rules

---

## ❌ BAD Refactoring Examples

These types of refactoring harm readability:

### 1. Over-Abstracting Parallel A/B Structures

**❌ DON'T DO THIS**: Combine User A and User B code with loops/iterations

**Example**: `TierListsDisplay.tsx`

```typescript
// ❌ BAD: Abstract loop that obscures intent
{['A', 'B'].map((signifier) => {
  const tierList = signifier === 'A' ? rivalry.tierListA : rivalry.tierListB;
  const userName = signifier === 'A'
    ? rivalry.displayUserAName()
    : rivalry.displayUserBName();

  return (
    <View key={signifier} style={{ flex: 1 }}>
      <Text style={[darkStyles.text, tierListHeaderStyle]}>
        {userName} tier list
      </Text>
      {tierList && (
        <TierListDisplay
          tierList={tierList}
          tierListSignifier={signifier}
          unlinked={unlinked}
        />
      )}
    </View>
  );
})}

// ✅ GOOD: Keep them separate and explicit
<View style={{ flex: 1 }}>
  <Text style={[darkStyles.text, tierListHeaderStyle]}>
    {rivalry.displayUserAName()} tier list
  </Text>
  {rivalry.tierListA && (
    <TierListDisplay
      tierList={rivalry.tierListA}
      tierListSignifier="A"
      unlinked={unlinked}
    />
  )}
</View>
<View style={{ flex: 1 }}>
  <Text style={[darkStyles.text, tierListHeaderStyle]}>
    {rivalry.displayUserBName()} tier list
  </Text>
  {rivalry.tierListB && (
    <TierListDisplay
      tierList={rivalry.tierListB}
      tierListSignifier="B"
      unlinked={unlinked}
    />
  )}
</View>
```

**Why the loop version is BAD**:

- Harder to read and understand at a glance
- Ternary logic makes it harder to trace which user is which
- Changes to User A logic require navigating conditional logic
- The duplication is minimal and the explicit version is clearer
- A and B are conceptually distinct entities, not array items

**The Rule**: When you see `userA`/`userB`, `tierListA`/`tierListB`, `tierSlotA`/`tierSlotB` patterns:

- Keep them separate and explicit
- They represent two distinct sides of a rivalry
- Treating them as array elements obscures the domain model

### 2. Premature Abstraction of One-Off Logic

**❌ DON'T DO THIS**: Create abstractions for code that only runs once

```typescript
// ❌ BAD: Over-engineered for single use
const createTierListSection = (
  tierList: MTierList | null,
  userName: string,
  signifier: 'A' | 'B',
  unlinked: boolean
) => {
  if (!tierList) return null;

  return (
    <View style={{ flex: 1 }}>
      <Text style={[darkStyles.text, tierListHeaderStyle]}>
        {userName} tier list
      </Text>
      <TierListDisplay
        tierList={tierList}
        tierListSignifier={signifier}
        unlinked={unlinked}
      />
    </View>
  );
};

// Then used only twice in the same component
{createTierListSection(
  rivalry.tierListA,
  rivalry.displayUserAName(),
  'A',
  unlinked
)}
{createTierListSection(
  rivalry.tierListB,
  rivalry.displayUserBName(),
  'B',
  unlinked
)}

// ✅ GOOD: Just write it inline, it's clear enough
```

**Why this is BAD**:

- Adds indirection without meaningful benefit
- The parameter list is almost as long as the original code
- Makes it harder to modify User A or User B independently
- The inline version is already very readable

---

## Decision Framework

When deciding whether to refactor duplicate code, ask:

### ✅ Extract if:

1. It's a style object repeated multiple times
2. It's complex logic/calculation that could have bugs
3. It's a magic number that has business meaning
4. It's used in 3+ places across multiple files
5. The extraction makes the code **more** readable

### ❌ Don't extract if:

1. It's A/B parallel structures (keep explicit)
2. It's only used 1-2 times
3. The abstraction adds complexity or indirection
4. The inline version is already clear
5. It represents distinct domain concepts (not truly duplicated)

---

## The Rivalry Club A/B Pattern

This codebase has a fundamental rivalry pattern throughout:

```
Rivalry
├── userA / userB
├── tierListA / tierListB
├── tierSlotA / tierSlotB
└── Contest
    ├── tierSlotA (User A's fighter)
    └── tierSlotB (User B's fighter)
```

**Key Principle**: A and B are not "items in an array" - they're two distinct sides of a competitive relationship. Keep them separate in code to reflect this domain model.

### Examples of the A/B Pattern

```typescript
// Contest resolution
const isATheWinner = (rivalry.currentContest.result || 0) > 0;

// Position adjustment
rivalry.tierListA?.adjustTierSlotPositionBySteps(
  rivalry.currentContest?.tierSlotA?.position as number,
  (rivalry.currentContest?.result as number) * STEPS_PER_STOCK * -1
);
rivalry.tierListB?.adjustTierSlotPositionBySteps(
  rivalry.currentContest?.tierSlotB?.position as number,
  (rivalry.currentContest?.result as number) * STEPS_PER_STOCK
);

// Display user names
<Text>{rivalry.displayUserAName()} tier list</Text>
<Text>{rivalry.displayUserBName()} tier list</Text>
```

All of these should remain explicit, not abstracted into loops.

---

## Summary

**The Golden Rule**: Refactor for readability, not just to reduce line count.

- Extract duplicate styles, constants, and complex logic
- Keep A/B rivalry structures explicit and separate
- Avoid premature abstraction
- If the "abstracted" version is harder to read, don't do it

**Remember**: Code is read far more often than it's written. Optimize for the reader's understanding.
