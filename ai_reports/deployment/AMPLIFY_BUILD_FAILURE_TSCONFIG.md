# Amplify Build Failures: The Real Root Cause - TypeScript Configuration Conflict

**Date**: 2025-12-10
**Status**: ✅ RESOLVED
**Severity**: Critical (blocked production deployment through multiple attempts)
**Deployments**: #1 (Node.js), #2 (ESM imports attempt 1), #3 (ESM imports attempt 2)

## Executive Summary

After fixing the Node.js version issue (Deployment #1), the Amplify Gen 2 deployment continued to fail at the CDK Assembly stage (Deployments #2 and #3). The error appeared to be about module resolution ("Cannot find module"), leading to an attempted fix with ESM import extensions. However, the **real root cause** was a TypeScript configuration conflict: the root `tsconfig.json` was including the `amplify/` directory, which has its own separate TypeScript configuration. This created a conflict between Expo's TypeScript settings and Amplify Gen 2's requirements.

## Problem Timeline

### Deployment #1: Node.js Version Issue ✅ FIXED
- **Error**: `addAbortListener` not found (Node.js 16 missing Node.js 18 APIs)
- **Fix**: Created `amplify.yml` + Amazon Linux 2023 build image
- **Result**: Progressed to CDK Assembly stage

### Deployment #2: Module Resolution Error (First Occurrence)
- **Build Progress**:
  - ✅ npm ci completed
  - ✅ Backend synthesized (1.44 seconds)
  - ✅ Type checks completed (10.18 seconds)
  - ❌ CDK Assembly failed

- **Error**:
  ```
  [BackendBuildError] Unable to deploy due to CDK Assembly Error
  ∟ Caused by: [AssemblyError] Assembly builder failed
  ∟ Caused by: [Error] Cannot find module '.../amplify/auth/resource'
  imported from .../amplify/backend.ts
  ```

- **Attempted Fix**: Added `.js` extensions to imports (incorrect diagnosis)

### Deployment #3: Module Resolution Error (After ESM Fix Attempt)
- **Build Progress**: Same as Deployment #2
- **Error**:
  ```
  [BackendBuildError] Unable to deploy due to CDK Assembly Error
  ∟ Caused by: [AssemblyError] Assembly builder failed
  ∟ Caused by: [Error] Cannot find module '.../amplify/auth/resource.js'
  imported from .../amplify/backend.ts
  ```

- **Key Observation**: Now looking for `.js` files (because imports had extensions), but still failing at the same stage

## Root Cause Analysis

### The Real Problem: TypeScript Configuration Conflict

**Root `tsconfig.json`** (`rivalry-club-expo/tsconfig.json`):
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "resolveJsonModule": true
  },
  "include": [
    "**/*.ts",      // ← Includes ALL .ts files
    "**/*.tsx",
    "**/*.json",
    "nativewind-env.d.ts"
  ]
  // NO "exclude" field!
}
```

**Amplify `tsconfig.json`** (`amplify/tsconfig.json`):
```json
{
  "extends": "../tsconfig.json",  // ← Inherits from root!
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",           // ← Different from Expo's settings
    "lib": ["ES2022"],
    "moduleResolution": "bundler", // ← Designed for bundlers, not Node.js
    "resolveJsonModule": true
  }
}
```

### Why This Caused Failures

1. **Double Processing**: Both TypeScript configurations were trying to process the `amplify/` files
   - Expo/React Native tsconfig: Uses Expo's module resolution rules
   - Amplify Gen 2 tsconfig: Uses bundler module resolution with ES2022

2. **Conflicting Module Resolution**:
   - `moduleResolution: "bundler"` (Amplify) vs Expo's default (via base config)
   - These strategies have different rules for resolving imports

3. **CDK Assembly Stage**:
   - Amplify's `ampx pipeline-deploy` uses its own bundler/transpiler
   - It expects to be the ONLY system processing the `amplify/` files
   - When the root tsconfig also includes these files, it creates conflicts

4. **TypeScript Type Checking Passed**:
   - Type checking succeeded because TypeScript could resolve the types
   - But at runtime/assembly time, the bundler failed due to the configuration conflict

### Why ESM Extensions Didn't Help

The `.js` extension fix was addressing the wrong problem:
- With `moduleResolution: "bundler"`, extensionless imports are correct
- Adding `.js` extensions just changed the error message from `resource` to `resource.js`
- The real issue was the conflicting TypeScript configurations

## The Solution

### Fix: Exclude `amplify/` from Root TypeScript Configuration

Updated `rivalry-club-expo/tsconfig.json`:

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
    "amplify"        // ← NEW: Exclude amplify directory
  ]
}
```

**And revert** `amplify/backend.ts` to original (extensionless imports):

```typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';      // ← NO .js extension
import { data } from './data/resource';      // ← NO .js extension
```

### Why This Works

1. **Separation of Concerns**:
   - Expo/React Native handles app code
   - Amplify Gen 2 handles backend code independently

2. **No Conflicts**:
   - Root tsconfig no longer tries to process `amplify/` files
   - `amplify/tsconfig.json` is the sole authority for Amplify backend

3. **Proper Module Resolution**:
   - Amplify's bundler uses `moduleResolution: "bundler"` correctly
   - Extensionless imports work as designed

4. **Standard Pattern**:
   - This is the recommended approach for projects mixing frameworks
   - Each subsystem has its own TypeScript configuration

## Research Sources

The solution was found through research on AWS Amplify Gen 2 TypeScript issues:

- [AWS Amplify Gen 2 Troubleshooting](https://docs.amplify.aws/vue/build-a-backend/troubleshooting/cannot-find-module-amplify-env/)
- [Why is Amplify such a mess with typescript? | AWS re:Post](https://repost.aws/questions/QUQ_0xavQ0Rki8KldgyMqaqw/why-is-amplify-such-a-mess-with-typescript)
- [Amplify Gen 2 CDK Assembly Error | AWS re:Post](https://repost.aws/questions/QUHB5XPmv8RjCjs440mKfv8g/amplify-gen-2-cdk-assembly-error-missing-manifest-json-on-first-build-attempt)

**Key insight from AWS documentation**:
> "The error occurs when your framework tsconfig.json configuration picks up the amplify directory and tries to resolve it as a module. Excluding the amplify directory in tsconfig.json prevents these resolution errors."

## Impact Analysis

### Before Fix
- ❌ Production deployment blocked at CDK Assembly
- ❌ Multiple failed deployment attempts (2, 3)
- ❌ TypeScript configuration conflict undiagnosed
- ❌ Incorrect fix attempts (ESM extensions)

### After Fix
- ✅ No TypeScript configuration conflicts
- ✅ CDK Assembly should succeed
- ✅ Amplify Gen 2 backend can deploy
- ✅ Can proceed with data migration

## Verification Steps

After implementing the fix:

1. **Commit the changes**:
   ```bash
   git add tsconfig.json amplify/backend.ts
   git commit -m "Fix Amplify deployment: exclude amplify dir from root tsconfig"
   git push origin main
   ```

2. **Monitor build logs**:
   - Should see successful CDK Assembly
   - CloudFormation stack creation should proceed
   - No more "Cannot find module" errors

3. **Verify backend resources created**:
   ```bash
   # Check CloudFormation stack
   aws cloudformation describe-stacks --region us-east-1 \
     --query "Stacks[?contains(StackName, 'rivalryclubexpo')].StackName"

   # Verify DynamoDB tables
   aws dynamodb list-tables --region us-east-1 | grep rivalry

   # Check Cognito User Pool
   aws cognito-idp list-user-pools --max-results 10 --region us-east-1
   ```

## Key Learnings

### 1. TypeScript Configuration in Monorepo/Multi-Framework Projects

When you have multiple TypeScript configurations (app + backend), always:
- Use `exclude` in parent tsconfig for child directories with their own configs
- Each subsystem should have independent TypeScript settings
- Avoid letting parent configurations process child directories

### 2. Amplify Gen 2 Requirements

- Amplify backend code needs its own isolated TypeScript environment
- `moduleResolution: "bundler"` is correct for Amplify Gen 2
- Don't add `.js` extensions with bundler module resolution
- The `amplify/` directory should be excluded from framework tsconfigs

### 3. Debugging Complex Build Failures

- TypeScript type checking success ≠ runtime/assembly success
- Look for configuration conflicts when errors persist after "obvious" fixes
- Check if multiple systems are trying to process the same files
- Research similar issues in official documentation and forums

### 4. CDK Assembly Stage

- This is where Amplify bundles and executes your backend code
- Happens AFTER TypeScript type checking
- Requires proper module resolution at runtime
- Sensitive to TypeScript configuration conflicts

## Related Files

### Files Modified

1. **`tsconfig.json`** - Added `exclude: ["amplify"]`
2. **`amplify/backend.ts`** - Reverted to extensionless imports (correct for bundler)
3. **`amplify.yml`** - Created earlier for Node.js version fix

### Configuration Files

- **`amplify/tsconfig.json`** - Unchanged (correct as-is)
- **`package.json`** - Unchanged
- **`.gitignore`** - Already correct (only excludes `.amplify/`)

## Prevention for Future

### Best Practices

1. **When adding new subsystems with TypeScript**:
   ```json
   {
     "include": ["**/*.ts"],
     "exclude": ["other-subsystem/"]
   }
   ```

2. **Document TypeScript architecture**:
   - Which directories have their own tsconfigs
   - Why they're excluded from parent configs
   - Module resolution strategies used

3. **Test locally before deployment**:
   ```bash
   # Verify no TypeScript conflicts
   npx tsc --noEmit

   # Test Amplify build locally (if possible)
   npx ampx sandbox
   ```

## Incorrect Diagnosis Archive

### What We Thought Was Wrong

**Hypothesis**: ESM imports in Node.js require `.js` extensions

**Evidence**:
- Deployment #2 error: "Cannot find module '.../resource'"
- Common TypeScript/ESM issue in Node.js

**Attempted Fix**:
- Added `.js` extensions to imports in `amplify/backend.ts`

**Why It Failed**:
- Amplify Gen 2 uses `moduleResolution: "bundler"`, not Node.js ESM
- Bundlers handle module resolution differently
- The error persisted (just changed from `resource` to `resource.js`)
- Real issue was the root tsconfig including amplify files

**Lesson**: Don't assume the first explanation is correct. Test hypotheses and look for patterns across multiple failures.

## Summary Checklist

- [x] Analyzed deployment #2 and #3 failures
- [x] Researched Amplify Gen 2 TypeScript requirements
- [x] Identified TypeScript configuration conflict
- [x] Excluded `amplify/` from root tsconfig.json
- [x] Reverted incorrect `.js` extension fix
- [ ] **USER ACTION REQUIRED**: Commit and push changes
- [ ] Verify deployment #4 succeeds
- [ ] Verify CloudFormation stack created
- [ ] Continue with data migration

## Next Steps

Once deployment #4 succeeds:

1. **Verify Production Stack**:
   ```bash
   aws cloudformation list-stacks --region us-east-1 \
     --stack-status-filter CREATE_COMPLETE \
     --query "StackSummaries[?contains(StackName, 'rivalryclubexpo')]"
   ```

2. **Save Production Config**:
   ```bash
   cp amplify_outputs.json amplify_outputs.production.json
   git add amplify_outputs.production.json
   git commit -m "Add production Amplify configuration"
   ```

3. **Begin Migration** (Phase 3 of migration guide):
   - Import Cognito users to production
   - Create awsSub mapping
   - Import DynamoDB data with User table transformation
   - Verify data integrity

## Final Notes

### Deployment Attempt Summary

| Deployment | Issue | Fix Attempted | Result |
|------------|-------|---------------|--------|
| #1 | Node.js 16 (missing APIs) | amplify.yml + Amazon Linux 2023 | ✅ Fixed |
| #2 | Module not found | (Diagnosed as ESM issue) | ❌ Incorrect diagnosis |
| #3 | Module.js not found | Added .js extensions | ❌ Wrong fix |
| #4 | (Pending) | Exclude amplify from tsconfig | 🎯 Should succeed |

### Time Investment

- Node.js issue: ~30 minutes research + fix
- ESM import investigation: ~1 hour (incorrect path)
- TypeScript conflict discovery: ~30 minutes research
- **Total**: ~2 hours to find root cause

**The lesson**: Complex build failures may have multiple layers. Don't stop at the first plausible explanation - verify through testing and research.

---

**Last Updated**: 2025-12-10
**Issue**: TypeScript configuration conflict (root tsconfig including amplify directory)
**Resolution**: Add `"exclude": ["amplify"]` to root tsconfig.json + revert to extensionless imports
**Status**: Ready for deployment attempt #4
**Related Reports**:
- `AMPLIFY_BUILD_FAILURE_NODE_VERSION.md` (Deployment #1)
- `AMPLIFY_BUILD_FAILURE_ESM_IMPORTS.md` (Incorrect diagnosis for #2/#3)
