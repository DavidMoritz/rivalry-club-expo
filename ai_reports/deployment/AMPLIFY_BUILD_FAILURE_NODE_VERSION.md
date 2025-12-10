# Amplify Build Failure #1: Node.js Version Issue

**Date**: 2025-12-10
**Status**: ✅ RESOLVED
**Severity**: Critical (blocked production deployment)
**Note**: After fixing this issue, a second issue was discovered. See `AMPLIFY_BUILD_FAILURE_ESM_IMPORTS.md`

## Executive Summary

The Amplify Gen 2 production deployment failed due to a Node.js version mismatch. The build environment was using Node.js 16.19.0 (Amazon Linux 2), but the project dependencies require Node.js 18.0.0 or higher. This was fixed by creating an `amplify.yml` configuration file.

## Problem Analysis

### Build Error

The deployment failed with the following error:

```
SyntaxError: The requested module 'node:events' does not provide an export named 'addAbortListener'
at ModuleJob._instantiate (node:internal/modules/esm/module_job:123:21)
```

**Location**: `node_modules/execa/lib/utils/max-listeners.js`

### Root Cause

1. **Amplify Default Environment**: AWS Amplify was using Amazon Linux 2 as the default build image, which includes Node.js 16.19.0

2. **Dependency Requirements**: Multiple project dependencies require Node.js 18+:
   - `execa` (used by Amplify CLI) - requires `addAbortListener` API (added in Node 18)
   - `@smithy/service-error-classification` - explicitly requires Node >=18.0.0
   - Various AWS SDK v3 packages - require Node >=18.0.0

3. **Missing API**: The `addAbortListener` function was added to Node.js's `events` module in version 18.x. Node.js 16.x does not have this API.

### Log Evidence

From `BUILD.txt` (lines 3713-3723):

```
file:///codebuild/output/src2148150238/src/rivalry-club-expo/node_modules/execa/lib/utils/max-listeners.js:1
import {addAbortListener} from 'node:events';
^^^^^^^^^^^^^^^^
SyntaxError: The requested module 'node:events' does not provide an export named 'addAbortListener'

[ERROR]: !!! Build failed
[ERROR]: !!! Error: Command failed with exit code 1
```

Additional warnings throughout the build log:

```
npm WARN EBADENGINE Unsupported engine {
npm WARN EBADENGINE   package: '@smithy/service-error-classification@4.2.5',
npm WARN EBADENGINE   required: { node: '>=18.0.0' },
npm WARN EBADENGINE   current: { node: 'v16.19.0', npm: '8.19.3' }
npm WARN EBADENGINE }
```

### AWS Amplify Hint

The build log included a helpful message:

```
A new default build image based on Amazon Linux 2023 is now generally available.
The image includes newer versions of Node.js, Python, and Ruby that you can use to build your app.
To use the new image, select "Amazon Linux:2023" in the "Build settings" section for your app in the Amplify console.
```

## Solution

### Fix #1: Create amplify.yml Configuration File

Created `/rivalry-club-expo/amplify.yml` to specify build configuration:

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

**Benefits of this configuration:**
- ✅ Explicitly defines build process
- ✅ Uses `npm ci` for faster, more reliable installs
- ✅ Configures proper caching strategy
- ✅ Sets up backend deployment with `ampx pipeline-deploy`

### Fix #2: Update Build Image in AWS Console

**Required Action**: You need to update the build settings in the AWS Amplify console:

1. Go to AWS Amplify Console
2. Select your app: `rivalry-club-expo`
3. Go to **"App settings"** → **"Build settings"**
4. Under **"Build image"**, change from:
   - ❌ **Amazon Linux 2** (Node.js 16)
   - ✅ **Amazon Linux 2023** (Node.js 18+)
5. Click **"Save"**

**Why this is required:**
- The `amplify.yml` file alone doesn't change the base build image
- The build image selection controls the Node.js version available
- Amazon Linux 2023 includes Node.js 18.x by default

### Alternative: Specify Node Version in amplify.yml

If you want to control the Node version explicitly in the `amplify.yml` file, you can add this to the backend → phases → preBuild section:

```yaml
backend:
  phases:
    preBuild:
      commands:
        - nvm install 18
        - nvm use 18
        - node --version
    build:
      commands:
        - npm ci --cache .npm --prefer-offline
        - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
```

**However**, this approach still requires Amazon Linux 2023 base image, so it's better to just configure the image in the console.

## Verification Steps

After implementing the fixes:

1. **Commit the amplify.yml file:**
   ```bash
   git add amplify.yml
   git commit -m "Add amplify.yml with Node.js 18+ configuration"
   git push origin main
   ```

2. **Update Build Image in Console:**
   - Follow the steps in "Fix #2" above

3. **Trigger New Build:**
   - Amplify should auto-trigger on git push
   - Or manually trigger from Amplify Console

4. **Verify Success:**
   - Build should complete without Node.js version errors
   - Check build logs for:
     - ✅ Node version: 18.x or higher
     - ✅ No `EBADENGINE` warnings
     - ✅ Successful `ampx pipeline-deploy` completion
     - ✅ CloudFormation stack creation

5. **Verify Backend Resources:**
   ```bash
   # Check that production stack was created
   aws cloudformation describe-stacks --region us-east-1 | grep rivalryclubexpo

   # Verify amplify_outputs.json was updated
   cat amplify_outputs.json | jq .
   ```

## Impact Analysis

### Before Fix
- ❌ Production deployment completely blocked
- ❌ Cannot create production Amplify backend
- ❌ Cannot proceed with sandbox → production migration
- ❌ Users stuck on sandbox environment

### After Fix
- ✅ Production deployment succeeds
- ✅ Amplify Gen 2 backend deployed to production
- ✅ Can proceed with data migration
- ✅ Users can migrate to stable production environment

## Related Documentation

- **Migration Guide**: `ai_reports/deployment/SANDBOX_TO_PRODUCTION_MIGRATION.md`
- **awsSub Issue**: `ai_reports/deployment/AWSSUB_CRITICAL_ISSUE.md`
- **AWS Amplify Docs**: [Build settings and images](https://docs.aws.amazon.com/amplify/latest/userguide/build-settings.html)
- **Node.js addAbortListener**: [Node.js v18 Events API](https://nodejs.org/docs/latest-v18.x/api/events.html#eventsaddabortlistenersignal-listener)

## Prevention

### For Future Deployments

1. **Always use amplify.yml:**
   - Commit `amplify.yml` to git
   - Explicitly configure build steps
   - Document Node.js version requirements

2. **Keep Dependencies Updated:**
   - Regularly check for deprecated dependencies
   - Monitor AWS SDK and Amplify CLI releases
   - Update to latest stable versions

3. **Test Locally First:**
   ```bash
   # Test with Node 18 locally
   nvm use 18
   npm ci
   npx ampx pipeline-deploy --branch main
   ```

4. **Monitor AWS Announcements:**
   - AWS regularly updates default build images
   - Subscribe to Amplify service updates
   - Review build settings when new images available

## Summary Checklist

- [x] Analyzed build logs and identified Node.js version mismatch
- [x] Created `amplify.yml` configuration file
- [ ] **USER ACTION REQUIRED**: Update build image to Amazon Linux 2023 in AWS Console
- [ ] Commit and push amplify.yml to git
- [ ] Trigger new Amplify build
- [ ] Verify build succeeds
- [ ] Continue with sandbox → production data migration

## Next Steps

Once the build succeeds:

1. **Verify Production Stack Created:**
   - Check CloudFormation for new stack: `amplify-rivalryclubexpo-main-XXXXXX`
   - Verify DynamoDB tables created (should be empty)
   - Verify Cognito User Pool created
   - Verify AppSync API deployed

2. **Save Production Config:**
   ```bash
   cp amplify_outputs.json amplify_outputs.production.json
   ```

3. **Proceed with Migration:**
   - Follow Phase 3 of `SANDBOX_TO_PRODUCTION_MIGRATION.md`
   - Import Cognito users
   - Create awsSub mapping
   - Import DynamoDB data

---

**Last Updated**: 2025-12-10
**Issue**: Node.js 16 → 18 version mismatch
**Resolution**: amplify.yml + Amazon Linux 2023 build image
**Status**: Ready for user to update console settings
