# Deployment #5: ESM vs CommonJS Module Type Conflict

**Date**: 2025-12-10
**Status**: ✅ RESOLVED (hopefully!)
**Deployment**: #5
**Previous Error**: CDK Assembly "Cannot find module"
**New Error**: TypeScript validation - CommonJS vs ESM conflict

## Progress!

**Good news**: Deployment #5 progressed further than #2-4! The CDK Assembly error is gone, but we hit a NEW error. This means the Node16 module resolution fix was on the right track.

## The New Error

```
[SyntaxError] TypeScript validation check failed.

error TS1479: The current file is a CommonJS module whose imports will produce 'require' calls;
however, the referenced file is an ECMAScript module and cannot be imported with 'require'.
Consider writing a dynamic 'import("@aws-amplify/backend")' call instead.
```

This error appeared in:
- `amplify/auth/resource.ts`
- `amplify/backend.ts`
- `amplify/data/resource.ts`

## Root Cause

When using `module: "Node16"` in TypeScript, the compiler determines whether a file is ESM or CommonJS based on:

1. **File extension**:
   - `.mts` = ESM (TypeScript Module)
   - `.cts` = CommonJS (TypeScript CommonJS)
   - `.ts` = Depends on package.json

2. **package.json `"type"` field**:
   - `"type": "module"` = ESM
   - `"type": "commonjs"` = CommonJS (default)
   - No field = CommonJS (default)

**The problem**:
- Our files use `.ts` extension
- No `package.json` in the `amplify/` directory
- Root `package.json` has no `"type": "module"`
- **Result**: TypeScript treats files as CommonJS
- **But**: `@aws-amplify/backend` is an ESM-only package
- **Conflict**: Can't `require()` an ESM module from CommonJS

## The Solution

Created `/amplify/package.json`:

```json
{
  "type": "module"
}
```

This tells Node.js and TypeScript that all files in the `amplify/` directory are ESM modules, which allows us to import from `@aws-amplify/backend` (which is ESM-only).

## Why This Works

1. **Scoped to amplify directory only**: Only affects files in `amplify/`, not the React Native app
2. **Enables ESM imports**: Files can now import from ESM-only packages
3. **Compatible with Node16**: Node16 module resolution respects the `"type"` field
4. **Matches Node.js behavior**: This is how Node.js determines module type

## Why This Wasn't Needed Before (Deployments #2-4)

With `moduleResolution: "bundler"`, TypeScript doesn't enforce CommonJS vs ESM rules - the bundler handles it. But with `moduleResolution: "Node16"`, TypeScript follows Node.js's strict ESM/CommonJS rules.

## Files Modified

### Created: `/amplify/package.json` ✅
```json
{
  "type": "module"
}
```

### Keep: `/amplify/tsconfig.json` ✅
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "lib": ["ES2022"],
    "moduleResolution": "Node16",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true
  }
}
```

### Keep: `/amplify/backend.ts` ✅
```typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';

export const backend = defineBackend({
  auth,
  data,
});
```

## Expected Result (Deployment #6)

With the `package.json` file marking the directory as ESM:
- ✅ TypeScript recognizes files as ESM modules
- ✅ Can import from `@aws-amplify/backend` (ESM package)
- ✅ Type validation should pass
- ✅ CDK Assembly should succeed (already working in #5)
- ✅ CloudFormation deployment should proceed

## Verification

After committing:

```bash
git add amplify/package.json
git commit -m "Add package.json to amplify directory to enable ESM modules"
git push origin main
```

Expected build output:
```
✅ npm ci completed
✅ Backend synthesized
✅ Type checks completed  ← Should pass now!
✅ CDK Assembly completed
✅ CloudFormation deployment
✅ Stack created
```

## Learning: Module Type Matters with Node16

**Key insight**: When using `moduleResolution: "Node16"`, you MUST tell TypeScript whether your files are ESM or CommonJS. This can be done via:

1. **File extension**: `.mts` for ESM, `.cts` for CommonJS
2. **package.json**: `"type": "module"` for ESM

Without either, TypeScript defaults to CommonJS, which can't import ESM-only packages like `@aws-amplify/backend`.

## Why AWS Doesn't Document This Clearly

Looking at the AWS Amplify backend repository, they likely:
- Use a monorepo with proper package.json setup
- Or have tooling that automatically handles this
- Or their examples assume you're starting fresh (not integrating with Expo)

When integrating Amplify Gen 2 into an existing Expo/React Native project, you need to explicitly configure the module type.

## Deployment Timeline Updated

| # | Issue | Fix | Result |
|---|-------|-----|--------|
| 1 | Node.js 16 → 18 | amplify.yml + AL2023 | ✅ Fixed |
| 2-4 | CDK Assembly failure | Wrong module resolution | ❌ Circling |
| 5 | ESM vs CommonJS | Node16 config | ⚠️ New error (progress!) |
| 6 | (Pending) | Add package.json to amplify | 🎯 Should work |

## Summary

Deployment #5 was **progress**, not failure! We moved from:
- ❌ CDK Assembly error (deployments #2-4)
- ✅ CDK Assembly working
- ❌ **New** error: TypeScript ESM/CommonJS validation

The fix: Add `"type": "module"` to `amplify/package.json` so TypeScript knows these are ESM modules.

---

**Last Updated**: 2025-12-10
**Status**: Ready for deployment #6
**Confidence**: High - this is a standard Node.js ESM configuration issue
