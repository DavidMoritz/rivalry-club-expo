---
description: Quick refactor following project guidelines
---

Read `/Users/davidmoritz/Code/react-native/rivalry-club/rivalry-club-expo/ai_reports/REFACTORING_PREFERENCES.md` to understand the project's refactoring philosophy.

Then refactor the provided code following these key rules:

✅ **DO REFACTOR**:
- Duplicate inline styles → Extract to named constants
- Repeated complex logic → Extract to helper functions
- Magic numbers → Extract to named constants (e.g., STEPS_PER_STOCK)

❌ **DON'T REFACTOR**:
- A/B rivalry patterns (userA/userB, tierListA/tierListB) → Keep separate and explicit
- One-off code → Don't create premature abstractions
- Clear code → Don't reduce readability for DRY

**Golden Rule**: Refactor for readability, not just to reduce line count.

If you encounter a refactoring decision not in the guidelines, ask the user and update REFACTORING_PREFERENCES.md with their answer.
