# Amplify Gen 2 Deployment Failures: Complete Analysis and Resolution

**Date**: 2025-12-10
**Total Deployment Attempts**: 4 (all failed)
**Status**: Solution identified - Deployment #5 pending
**Time Spent**: ~3 hours debugging

## Executive Summary

The Amplify Gen 2 production deployment failed 4 times with three different root causes. After extensive research and testing, the core issue was identified: **the `amplify/tsconfig.json` was using incompatible module resolution settings**. The project was configured with `moduleResolution: "bundler"`, but AWS Amplify Gen 2's official backend uses `moduleResolution: "Node16"`, which has different import requirements.

## Deployment Timeline

### Deployment #1: Node.js Version Incompatibility ✅ FIXED
- **Error**: `SyntaxError: The requested module 'node:events' does not provide an export named 'addAbortListener'`
- **Root Cause**: Amazon Linux 2 build image (Node.js 16.19.0) lacking APIs required by dependencies (Node.js 18+)
- **Fix**: Created `amplify.yml` + changed to Amazon Linux 2023 build image in AWS Console
- **Result**: Progressed to CDK Assembly stage
- **Report**: `AMPLIFY_BUILD_FAILURE_NODE_VERSION.md`

### Deployments #2, #3, #4: Module Resolution Incompatibility ⚠️ CIRCLING
- **Error**: `[BackendBuildError] Unable to deploy due to CDK Assembly Error`
  - `Cannot find module '.../amplify/auth/resource'` (#2, #4)
  - `Cannot find module '.../amplify/auth/resource.js'` (#3)
- **Build Progress** (all 3 deployments):
  - ✅ npm ci completed
  - ✅ Backend synthesized (~1.4 seconds)
  - ✅ Type checks completed (~10 seconds)
  - ❌ CDK Assembly failed

**Attempted Fixes** (all incorrect):
1. **Deployment #2→#3**: Added `.js` extensions to imports
   - Hypothesis: ESM in Node.js requires explicit extensions
   - Result: Error changed from `resource` to `resource.js` but still failed
   - Analysis: Wrong diagnosis - wasn't a Node.js ESM issue

2. **Deployment #3→#4**: Excluded `amplify/` from root tsconfig + reverted to extensionless imports
   - Hypothesis: TypeScript configuration conflict
   - Result: Same error as #2 (back to `resource` without `.js`)
   - Analysis: Partially correct (exclusion was good) but didn't address the real issue

## The Real Root Cause

After comparing the project configuration with AWS Amplify's official backend repository, I discovered a critical mismatch:

### Project Configuration (Incorrect)

**`amplify/tsconfig.json`**:
```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",  // ← Wrong for Amplify Gen 2
    "resolveJsonModule": true
  }
}
```

### AWS Amplify Official Configuration (Correct)

From [amplify-backend/tsconfig.base.json](https://github.com/aws-amplify/amplify-backend/blob/main/tsconfig.base.json):

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "Node16",              // ← Correct
    "moduleResolution": "Node16",    // ← Correct
    "lib": ["es2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  }
}
```

### Why This Matters

| Setting | `bundler` | `Node16` |
|---------|-----------|----------|
| Import extensions | Optional (resolved by bundler) | **Required** (`.js` for relative imports) |
| Use case | Webpack, Vite, esbuild | Node.js native ESM |
| Works with Amplify CDK? | ❌ No | ✅ Yes |

**The problem**:
- `moduleResolution: "bundler"` allows extensionless imports: `import { auth } from './auth/resource'`
- Amplify's CDK Assembly process expects `moduleResolution: "Node16"`, which requires: `import { auth } from './auth/resource.js'`
- TypeScript type checking passes with both (because it can resolve types either way)
- But at **runtime** (CDK Assembly), the module resolution fails because Amplify's bundler expects Node16-style imports

## The Complete Solution

### Changes Required

**1. Fix `amplify/tsconfig.json`** - Match AWS official configuration:

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

Key changes:
- ❌ Remove `"extends": "../tsconfig.json"` (Amplify backend should be independent)
- ✅ Change `"module": "ES2022"` → `"module": "Node16"`
- ✅ Change `"moduleResolution": "bundler"` → `"moduleResolution": "Node16"`
- ✅ Add `"esModuleInterop": true`, `"skipLibCheck": true"`, `"strict": true"`

**2. Fix `amplify/backend.ts`** - Add `.js` extensions (required for Node16):

```typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';    // ← .js extension required
import { data } from './data/resource.js';    // ← .js extension required

export const backend = defineBackend({
  auth,
  data,
});
```

**3. Keep `tsconfig.json`** (root) - Exclude amplify:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "resolveJsonModule": true
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "**/*.json",
    "nativewind-env.d.ts"
  ],
  "exclude": [
    "amplify"    // ← Keep this exclusion
  ]
}
```

## Why This Should Work

1. **Matches AWS Official Config**: Uses the same settings as Amplify's own backend repository
2. **Node16 Module Resolution**: Compatible with Amplify CDK's runtime expectations
3. **Explicit Extensions**: `.js` extensions satisfy Node16's ESM requirements
4. **Isolated Configuration**: Amplify backend has independent TypeScript config (no inheritance conflicts)
5. **Type Checking Passes**: Node16 supports all the features we need

## Verification Steps

After committing these changes (Deployment #5):

1. **Commit changes**:
   ```bash
   git add amplify/tsconfig.json amplify/backend.ts
   git commit -m "Fix Amplify deployment: use Node16 module resolution matching AWS official config"
   git push origin main
   ```

2. **Expected build output**:
   ```
   ✅ npm ci completed
   ✅ Backend synthesized in ~1.4 seconds
   ✅ Type checks completed in ~10 seconds
   ✅ CDK Assembly completed successfully  ← NEW!
   ✅ Deploying to CloudFormation...
   ✅ Stack created: amplify-rivalryclubexpo-main-XXXXXX
   ✅ amplify_outputs.json generated
   ```

3. **Verify resources created**:
   ```bash
   # CloudFormation stack
   aws cloudformation describe-stacks --region us-east-1 \
     --query "Stacks[?contains(StackName, 'rivalryclubexpo')].StackName"

   # DynamoDB tables
   aws dynamodb list-tables --region us-east-1 | grep -i rivalry

   # Cognito User Pool
   aws cognito-idp list-user-pools --max-results 10 --region us-east-1
   ```

## Research Sources

The solution was found by examining AWS Amplify's official backend repository:

- [amplify-backend/tsconfig.base.json](https://github.com/aws-amplify/amplify-backend/blob/main/tsconfig.base.json) - Official AWS Amplify Gen 2 TypeScript configuration
- [Why is Amplify such a mess with typescript? | AWS re:Post](https://repost.aws/questions/QUQ_0xavQ0Rki8KldgyMqaqw/why-is-amplify-such-a-mess-with-typescript) - Community discussion on TypeScript issues
- [Fullstack TypeScript: AWS Amplify Gen 2](https://aws.amazon.com/blogs/mobile/amplify-gen2-ga/) - Official AWS blog on Gen 2

## Key Learnings

### 1. Always Check Official Documentation/Repositories

When a technology keeps failing, check the **official source code** to see how they configure it:
- AWS Amplify backend repo showed `Node16`, not `bundler`
- This was the key insight that resolved 3 failed deployments

### 2. Module Resolution Matters

TypeScript's `moduleResolution` options have different behaviors:
- `"bundler"`: For bundlers (Webpack, Vite) - extensionless imports OK
- `"Node16"`: For Node.js native ESM - explicit `.js` extensions required
- `"node"`: For CommonJS/older Node - different rules

**Lesson**: Match your `moduleResolution` to your runtime environment.

### 3. TypeScript Type Checking ≠ Runtime Success

All 4 deployments had:
- ✅ Type checks completed successfully
- ❌ Runtime/CDK Assembly failed

**Lesson**: TypeScript compiler success doesn't guarantee runtime compatibility. The bundler/runtime has its own requirements.

### 4. Configuration Inheritance Can Hide Issues

The original `amplify/tsconfig.json` had `"extends": "../tsconfig.json"`, inheriting Expo's settings. This created subtle conflicts.

**Lesson**: Backend and frontend TypeScript configs should be independent.

### 5. Debugging Complex Issues Takes Time

- Deployment #1: 30 minutes (straightforward Node.js version issue)
- Deployments #2-4: 2.5 hours (circular errors, wrong diagnoses)
- **Total**: ~3 hours

**Lesson**: When circling around the same error, step back and check fundamentals (like official configurations).

## What We Tried That Didn't Work

### ❌ Adding `.js` Extensions with `bundler` Resolution (Deployment #2→#3)
- **Why it failed**: `bundler` moduleResolution doesn't use `.js` extensions the same way Node16 does
- **Evidence**: Error changed from `resource` to `resource.js`, still failed

### ❌ Excluding `amplify/` from Root Config Only (Deployment #3→#4)
- **Why it failed**: Fixed the inheritance issue, but didn't fix the core `bundler` vs `Node16` mismatch
- **Evidence**: Same error as #2 after exclusion

### ❌ Extensionless Imports with `bundler` (All attempts)
- **Why it failed**: Amplify CDK expects Node16-style imports
- **Evidence**: Consistent failure at CDK Assembly stage across deployments #2, #3, #4

## Previous Reports (Archived)

### Incorrect Diagnoses (Kept for Learning)

1. **`AMPLIFY_BUILD_FAILURE_ESM_IMPORTS.md`** - Thought it was an ESM extension issue
   - Status: ❌ Incorrect diagnosis
   - Kept as: Historical reference showing debugging process

2. **`AMPLIFY_BUILD_FAILURE_TSCONFIG.md`** - Thought it was a configuration conflict
   - Status: ⚠️ Partially correct (exclusion was good, but not the full solution)
   - Kept as: Shows the research process

### Correct Diagnosis

3. **`AMPLIFY_BUILD_FAILURE_NODE_VERSION.md`** - Node.js version issue
   - Status: ✅ Correctly diagnosed and fixed (Deployment #1)

## Next Steps After Deployment #5 Succeeds

1. **Save Production Configuration**:
   ```bash
   cp amplify_outputs.json amplify_outputs.production.json
   git add amplify_outputs.production.json
   git commit -m "Add production Amplify outputs"
   ```

2. **Begin Data Migration** (Phase 3):
   - Follow `SANDBOX_TO_PRODUCTION_MIGRATION.md`
   - Import Cognito users to production
   - Create awsSub mapping (`create-awssub-mapping.js`)
   - Import DynamoDB data with transformed User table
   - Verify data integrity

3. **Test Application**:
   - Update app to use `amplify_outputs.production.json`
   - Test authentication flow
   - Verify data loads correctly
   - Create test contest

4. **Deploy to TestFlight**:
   - Build with production backend config
   - Submit to Apple for review

## Files Modified (Final State)

### `/amplify/tsconfig.json` ✅
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

### `/amplify/backend.ts` ✅
```typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';

export const backend = defineBackend({
  auth,
  data,
});
```

### `/tsconfig.json` ✅
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "resolveJsonModule": true
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "**/*.json",
    "nativewind-env.d.ts"
  ],
  "exclude": [
    "amplify"
  ]
}
```

### `/amplify.yml` ✅ (from Deployment #1)
```yaml
version: 1
backend:
  phases:
    build:
      commands:
        - npm ci --cache .npm --prefer-offline
        - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
frontend:
  phases:
    preBuild:
      commands:
        - npm ci --cache .npm --prefer-offline
    build:
      commands:
        - echo "Frontend build not required for Amplify Gen 2 backend-only deployment"
  artifacts:
    baseDirectory: /
    files:
      - '**/*'
  cache:
    paths:
      - .npm/**/*
      - node_modules/**/*
```

## Summary

| Deployment | Issue | Fix | Correct? |
|------------|-------|-----|----------|
| #1 | Node.js 16 → 18 | `amplify.yml` + Amazon Linux 2023 | ✅ Yes |
| #2 | Module not found | Added `.js` extensions | ❌ No |
| #3 | Module.js not found | Excluded amplify from root tsconfig | ❌ No |
| #4 | Module not found (again) | Reverted to extensionless | ❌ No |
| #5 | (Pending) | **Use Node16 module resolution + .js extensions** | 🎯 Should work |

**Total time**: ~3 hours across 4 failed deployments
**Key insight**: Check official AWS configuration, don't assume module resolution settings

---

**Last Updated**: 2025-12-10
**Status**: Ready for Deployment #5
**Confidence**: High - matches AWS official configuration
**Next Action**: User needs to commit and push changes
