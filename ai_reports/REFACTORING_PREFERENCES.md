# Refactoring Preferences

**Author**: Claude Code
**Date**: 2025-12-12
**Status**: Reference Guide

## Overview

This document outlines the project's refactoring philosophy: prioritize **readability and clarity** over DRY (Don't Repeat Yourself) principles. Some duplication is acceptable and even preferred when it maintains code clarity.

**Important**: Always check `src/utils/styles.ts` before creating new styles. Reuse global styles when possible, inherit using spread syntax when appropriate, and add common patterns to the global stylesheet.

---

## ✅ GOOD Refactoring Examples

These types of refactoring improve readability and maintainability:

### 1. Extract Inline Styles

**✅ DO THIS**: Extract inline styles into named constants

**Rules**:
1. **Extract duplicate styles** - If the same style appears multiple times, extract it
2. **Extract large styles** - If an inline style object takes up **more than 3 lines of code**, extract it to the bottom of the file

**Example 1**: Duplicate inline styles (`TierListsDisplay.tsx`)

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

**Example 2**: Large inline styles (more than 3 lines)

```typescript
// ❌ BEFORE: Large inline style cluttering JSX
<TouchableOpacity
  style={{
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 12,
    backgroundColor: '#334155',
    marginStart: 80
  }}
  onPress={onPress}
>
  <Text>Click me</Text>
</TouchableOpacity>

// ✅ AFTER: Extracted to named constant
<TouchableOpacity style={buttonStyle} onPress={onPress}>
  <Text>Click me</Text>
</TouchableOpacity>

// At bottom of file
const buttonStyle = {
  alignItems: 'center' as const,
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderWidth: 1,
  borderColor: 'white',
  borderRadius: 12,
  backgroundColor: '#334155',
  marginStart: 80
};
```

**Why this is good**:

- Single source of truth for the style
- Easy to update in one place
- Improves readability by naming the intent (`tierListHeaderStyle`, `buttonStyle`)
- Reduces visual noise and clutter in the JSX
- Makes the component structure easier to scan

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

### 4. Leverage Global Styles from styles.ts

**✅ DO THIS**: Before creating new style constants, check `src/utils/styles.ts` for existing styles you can reuse or inherit from

**File structure**:
- `styles` - General reusable styles (containers, text, buttons, etc.)
- `darkStyles` - Dark mode specific styles
- `lightStyles` - Light mode specific styles
- `contestStyles` - Contest-specific styles
- Domain-specific style groups (e.g., `tierStyles`, `rivalryStyles`)

**Pattern 1: Inherit from global styles using spread**

```typescript
// ❌ BEFORE: Recreating similar styles locally
const headerContainerStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  marginBottom: 8
};

// ✅ AFTER: Inherit from styles.ts and customize
import { contestStyles } from '../../../utils/styles';

const headerContainerStyle = {
  ...contestStyles.row,  // Already has flexDirection: 'row', alignItems: 'center'
  justifyContent: 'center' as const,
  marginBottom: 8
};
```

**Pattern 2: Add common patterns to styles.ts**

When you notice a styling pattern used in **3+ places across different files**, add it to `styles.ts` with a generic name:

```typescript
// In CurrentContest.tsx, RivalryView.tsx, TierList.tsx - all have similar centered containers
const centeredContainer = {
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  flexDirection: 'row' as const
};

// ✅ ADD TO styles.ts
export const styles = StyleSheet.create({
  // ... existing styles
  centeredRow: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  }
});

// Then use everywhere
import { styles } from '../../../utils/styles';
<View style={styles.centeredRow}>
```

**When to add to styles.ts vs keep local**:
- ✅ Add to styles.ts: Used in 3+ files, generic/reusable pattern
- ❌ Keep local: Component-specific styling, used in 1-2 files only

**Pattern 3: Move single-use styles OUT of styles.ts**

If you find a style in `styles.ts` that's only used in one file, **move it to that file**:

```typescript
// ❌ BEFORE: In styles.ts but only used in CurrentContest.tsx
export const styles = StyleSheet.create({
  // ... other styles
  currentContestUser: {
    fontSize: 16,
    fontWeight: 'bold'
  }
});

// ✅ AFTER: Move to CurrentContest.tsx
// In CurrentContest.tsx
const currentContestUserStyle = {
  fontSize: 16,
  fontWeight: 'bold' as const
};

// Remove from styles.ts entirely
```

**Why this is good**:
- `styles.ts` stays focused on truly shared styles
- Easier to find and modify component-specific styles
- Reduces unused style imports across the app
- Prevents styles.ts from becoming a dumping ground

### 5. Use Object Spread for Style Variations

**✅ DO THIS**: When you have similar style objects with only minor differences, use object spread to inherit from a base style

```typescript
// ❌ BEFORE: Duplicated properties
const primaryButtonStyle = {
  alignItems: 'center' as const,
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderWidth: 1,
  borderColor: 'white',
  borderRadius: 12,
  backgroundColor: '#334155',
  marginStart: 80
};

const secondaryButtonStyle = {
  alignItems: 'center' as const,
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderWidth: 1,
  borderColor: 'transparent',  // Only difference
  borderRadius: 12,
  backgroundColor: 'transparent',  // Only difference
  marginStart: 80
};

// ✅ AFTER: Use spread to inherit and override
const primaryButtonStyle = {
  alignItems: 'center' as const,
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderWidth: 1,
  borderColor: 'white',
  borderRadius: 12,
  backgroundColor: '#334155',
  marginStart: 80
};

const secondaryButtonStyle = {
  ...primaryButtonStyle,
  borderColor: 'transparent',
  backgroundColor: 'transparent'
};
```

**Why this is good**:
- DRY principle - shared properties defined once
- Easy to maintain - changes to base style automatically apply to variants
- Clear intent - shows which properties are overridden
- Shorter and more readable

### 5. Extract Repeated Style Values

**✅ DO THIS**: Extract recurring style values (like `'center'`, `'absolute'`) that appear in multiple style objects

**Problem**: TypeScript errors when string literals are used in multiple style objects without `as const`:
```
Type 'string' is not assignable to type 'FlexAlignType | undefined'
```

**Solution**: Extract the repeated value to a constant:

```typescript
// ❌ BEFORE: Repeated 'center' with TypeScript errors
const headerContainerStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,      // Repeated
  justifyContent: 'center' as const,  // Repeated
  marginBottom: 8
};

const buttonStyle = {
  alignItems: 'center' as const,      // Repeated
  paddingHorizontal: 16,
  paddingVertical: 8
};

const footerStyle = {
  alignItems: 'center' as const,      // Repeated
  justifyContent: 'center' as const,  // Repeated
  marginTop: 16
};

// ✅ AFTER: Extract to constant
const center = 'center' as const;

const headerContainerStyle = {
  flexDirection: 'row' as const,
  alignItems: center,
  justifyContent: center,
  marginBottom: 8
};

const buttonStyle = {
  alignItems: center,
  paddingHorizontal: 16,
  paddingVertical: 8
};

const footerStyle = {
  alignItems: center,
  justifyContent: center,
  marginTop: 16
};
```

**When to extract**:
- A style value appears **3+ times** across style objects
- Common examples: `'center'`, `'absolute'`, `'relative'`, `'row'`, `'column'`

**Important**: Always use `as const` when declaring the constant to preserve the literal type:
```typescript
const center = 'center' as const;  // ✅ Good - preserves literal type
const center = 'center';            // ❌ Bad - TypeScript infers as string
```

**Why this is good**:
- Fixes TypeScript type inference issues
- Single source of truth for the value
- Cleaner style objects (no repetitive `as const` on every usage)
- Easy to update if the value needs to change
- The constant preserves the literal type with one `as const` declaration

### 6. Concise Single-Line Conditionals

**✅ DO THIS**: If an `if` condition and a `return` statement fit on the same line with fewer than 80 characters, put them on the same line.

```typescript
// ❌ BEFORE: Unnecessarily verbose
if (!tierList) {
  return null;
}

if (position < 0) {
  return 0;
}

// ✅ AFTER: Concise single-line format
if (!tierList) return null;

if (position < 0) return 0;
```

**When to use single-line conditionals**:
- The entire line (including `if`, condition, and `return`) is under 80 characters
- It's a simple guard clause or early return
- No `else` branch is needed

**When NOT to use**:
- The line would exceed 80 characters
- There's an `else` or `else if` branch
- The body has multiple statements

**Why this is good**:
- Reduces visual noise for simple guard clauses
- Keeps the file shorter and easier to scan
- Common convention for early returns

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

### ✅ Before creating new styles:

1. **Check `src/utils/styles.ts` first** - Can you reuse or inherit from an existing style?
2. Is this pattern used in 3+ files? Add it to `styles.ts` as a global style
3. Is it similar to a global style with minor differences? Use spread to inherit
4. **Found a style in `styles.ts` used in only 1 file?** Move it OUT to that file

### ✅ Extract if:

1. It's a style object repeated multiple times
2. **It's an inline style object that takes up more than 3 lines of code**
3. **It's a style value (like `'center'`, `'absolute'`) used 3+ times across style objects**
4. It's complex logic/calculation that could have bugs
5. It's a magic number that has business meaning
6. It's used in 3+ places across multiple files
7. The extraction makes the code **more** readable

### ✅ Use object spread if:

1. **Two style objects share most properties with only 1-3 differences**
2. One style is a variation of another (e.g., primary/secondary buttons, active/inactive states)
3. The relationship between base and variant is clear
4. **A local style is similar to a global style from `styles.ts`** - inherit and customize

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

**Styling workflow**:
1. Check `src/utils/styles.ts` first before creating new styles
2. Inherit from global styles using spread when appropriate
3. Add common patterns (3+ files) to `styles.ts` with generic names
4. **Move single-use styles OUT of `styles.ts` to their component file**
5. Extract large inline styles (>3 lines) to constants
6. Use spread to create style variations

**General principles**:
- Extract duplicate styles, constants, and complex logic
- Keep A/B rivalry structures explicit and separate
- Avoid premature abstraction
- If the "abstracted" version is harder to read, don't do it

**Remember**: Code is read far more often than it's written. Optimize for the reader's understanding.
