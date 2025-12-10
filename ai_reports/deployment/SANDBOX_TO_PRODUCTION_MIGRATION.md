# Amplify Gen 2: Sandbox to Production Migration Guide

**Date Created**: 2025-12-09
**Status**: Ready for execution when user is prepared
**Data Volume**: Large (1000+ records across all tables)
**Risk Level**: Low (with proper backup and verification)

## Executive Summary

This guide provides a complete, step-by-step process to migrate your Amplify Gen 2 sandbox environment to a production environment with **zero data loss**. The migration involves exporting all DynamoDB data and Cognito users, deploying a new production environment, and importing all data into the new infrastructure.

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Why Migration is Required](#why-migration-is-required)
3. [Migration Strategy Overview](#migration-strategy-overview)
4. [Prerequisites](#prerequisites)
5. [Step-by-Step Migration Process](#step-by-step-migration-process)
6. [Scripts Reference](#scripts-reference)
7. [Verification Procedures](#verification-procedures)
8. [Rollback Plan](#rollback-plan)
9. [Post-Migration Tasks](#post-migration-tasks)

---

## Current State Analysis

### Infrastructure Overview

**Environment Type**: Amplify Gen 2 Sandbox
**CloudFormation Stack**: `amplify-rivalryclubexpo-davidmoritz-sandbox-68bbd7792c`
**Region**: us-east-1
**Deployment Method**: `npm run amplify:sandbox`

### Current Resources

#### Authentication (AWS Cognito)
- **User Pool ID**: `us-east-1_nYamFUrp4`
- **User Pool Client ID**: `659m3kp3pe8cddq5isd5vbtjp5`
- **Identity Pool ID**: `us-east-1:c977861d-b1e5-4ac9-b5fb-6b053313dd62`
- **Test User**: t@t.t (password: 12345678)

#### Data Layer (GraphQL API + DynamoDB)
- **AppSync API URL**: `https://swxspqulh5aafmyg4b3ppxrfii.appsync-api.us-east-1.amazonaws.com/graphql`
- **API Key**: `da2-fgncqwcblze6jj2s5v7u74eooa`
- **Authorization**: API_KEY (default), with Cognito and IAM support

#### Data Models
1. **Game** - Fighting games (SSBU, etc.)
2. **Fighter** - Characters in games
3. **User** - App users
4. **Rivalry** - Competitions between users
5. **Contest** - Individual matches
6. **TierList** - User rankings
7. **TierSlot** - Fighter positions in tier lists

### DynamoDB Tables
Each model has a corresponding table named: `{ModelName}-{apiId}-NONE`

Example: `Game-swxspqulh5aafmyg4b3ppxrfii-NONE`

---

## Why Migration is Required

### Amplify Gen 2 Architecture

Amplify Gen 2 uses **distinct deployment types** that cannot be converted:

1. **Sandbox Deployments**
   - Temporary, developer-specific environments
   - Tied to individual developer username
   - Stack naming: `amplify-{project}-{username}-sandbox-{id}`
   - Designed for rapid iteration and testing
   - **Can be accidentally destroyed or expire**

2. **Production Deployments**
   - Permanent, git-branch-based infrastructure
   - Stack naming: `amplify-{project}-{branch}-{id}`
   - Managed through CI/CD pipelines or `npx ampx pipeline-deploy`
   - **Stable and protected**

### Why Tables Don't Transfer

When you deploy production, Amplify will:

1. ✅ Create a **new CloudFormation stack** (different name)
2. ✅ Provision **new DynamoDB tables** (different table names)
3. ✅ Create a **new AppSync API** (different endpoint URL)
4. ✅ Create a **new Cognito User Pool** (different pool IDs)
5. ✅ Generate **new `amplify_outputs.json`** (all new resource IDs)

**Your sandbox tables will remain separate and untouched.**

### Why Export/Import is the Safest Approach

**Alternative approaches considered:**
- ❌ **Renaming tables**: Not supported by CloudFormation/Amplify
- ❌ **Stack parameter updates**: Sandbox stacks cannot be converted
- ❌ **Manual AWS Console table copy**: Complex, error-prone, no rollback
- ✅ **Export → Deploy → Import**: Clean, verifiable, with safety net

**Benefits of Export/Import:**
- 🛡️ Complete local backup of all data
- ✅ Production environment can be verified before data import
- 🔄 Easy rollback if issues occur
- 📊 Data integrity verification at each step
- 🗂️ Audit trail of all migrated data

---

## ⚠️ CRITICAL: The awsSub Problem

**Before we begin, understand this critical issue:**

Your User table has an `awsSub` field that links database users to Cognito authentication:

```
Cognito User: { sub: "abc-123-old", email: "t@t.t" }
         ↓
User Table: { id: "user-1", awsSub: "abc-123-old", email: "t@t.t" }
```

**The Problem:**
- When you create a new Cognito User Pool, AWS generates **NEW sub values**
- Your exported User table has the **OLD awsSub values**
- If you import without updating, auth breaks: User signs in → App can't find their User record

**The Solution:**
1. Import Cognito users to production (get NEW sub values)
2. Create mapping: old sub → new sub
3. Import User table with UPDATED awsSub values
4. All other tables import as-is (they use User IDs, not awsSub)

**This is handled automatically by the migration scripts**, but you must run them in the correct order!

## Migration Strategy Overview

### High-Level Process

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: BACKUP (No changes to sandbox)                        │
├─────────────────────────────────────────────────────────────────┤
│ 1. Export all DynamoDB tables to JSON files                    │
│ 2. Export Cognito users to JSON                                │
│ 3. Verify backup integrity                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: DEPLOY PRODUCTION (Sandbox still running)             │
├─────────────────────────────────────────────────────────────────┤
│ 1. Deploy production environment via pipeline                  │
│ 2. Verify new resources created successfully                   │
│ 3. Test new API connectivity                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: IMPORT DATA (CRITICAL ORDER!)                         │
├─────────────────────────────────────────────────────────────────┤
│ 1. Import Cognito users to production (get NEW awsSub values)  │
│ 2. Create awsSub mapping (old sub → new sub)                   │
│ 3. Import DynamoDB data (User table uses mapping)              │
│ 4. Verify data integrity and awsSub alignment                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 4: CUTOVER (Switch app to production)                    │
├─────────────────────────────────────────────────────────────────┤
│ 1. Update app to use production amplify_outputs.json           │
│ 2. Test thoroughly                                             │
│ 3. Decommission sandbox (optional)                             │
└─────────────────────────────────────────────────────────────────┘
```

### Estimated Timeline

- **Phase 1 (Backup)**: 15-30 minutes
- **Phase 2 (Deploy)**: 10-20 minutes
- **Phase 3 (Import)**: 30-60 minutes (depending on data volume)
- **Phase 4 (Cutover)**: 5-10 minutes
- **Total**: ~1-2 hours

---

## Prerequisites

### Required Tools & Access

- [x] AWS CLI installed and configured
- [x] AWS credentials with appropriate permissions
- [x] Node.js and npm installed
- [x] Amplify CLI (`@aws-amplify/backend-cli` in devDependencies)
- [x] Git repository access

### Required AWS Permissions

Your AWS user/role needs:
- DynamoDB: `Scan`, `BatchWriteItem`, `DescribeTable`
- CloudFormation: `DescribeStacks`, `DescribeStackResources`
- Cognito: `ListUsers`, `AdminCreateUser`, `AdminSetUserPassword`
- AppSync: Read access to verify API

### Verify Prerequisites

```bash
# Check AWS CLI authentication
aws sts get-caller-identity

# Verify you can access DynamoDB
aws dynamodb list-tables --region us-east-1

# Verify you can access Cognito
aws cognito-idp list-users --user-pool-id us-east-1_nYamFUrp4 --region us-east-1 --max-results 1

# Check Node.js and npm
node --version
npm --version
```

---

## Step-by-Step Migration Process

### PHASE 1: BACKUP ALL DATA

#### Step 1.1: Export DynamoDB Tables

The export script has already been created at: `scripts/migration/export-sandbox-data.js`

**Run the export:**

```bash
# Install AWS SDK dependencies if not already installed
npm install

# Make the script executable
chmod +x scripts/migration/export-sandbox-data.js

# Run the export
node scripts/migration/export-sandbox-data.js
```

**Expected output:**
```
🚀 Starting Amplify Sandbox Data Export
============================================================
🔍 Searching for sandbox CloudFormation stack...
📋 Fetching table names from stack: amplify-rivalryclubexpo-davidmoritz-sandbox-68bbd7792c
✅ Found 7 DynamoDB tables

📦 Exporting table: Game-swxspqulh5aafmyg4b3ppxrfii-NONE
  📊 Scan 1: Retrieved 5 items (Total: 5)
✅ Exported 5 items from Game-swxspqulh5aafmyg4b3ppxrfii-NONE
💾 Saved to: Game-2025-12-09T12-00-00-000Z.json

[... exports for all 7 tables ...]

============================================================
📊 EXPORT SUMMARY
============================================================
Game: 5 items
Fighter: 300 items
User: 10 items
Rivalry: 50 items
Contest: 500 items
TierList: 100 items
TierSlot: 1500 items
------------------------------------------------------------
TOTAL: 2465 items across 7 tables

✅ All data exported to: /path/to/data-backup
📄 Summary saved to: export-summary.json
```

**Verify backups:**

```bash
# Check backup files
ls -lh data-backup/

# View summary
cat data-backup/export-summary.json | jq '.'

# Spot check one file
cat data-backup/Game-*.json | jq '.items | length'
```

#### Step 1.2: Export Cognito Users

**Create Cognito export script:**

```bash
# Script location: scripts/migration/export-cognito-users.js
node scripts/migration/export-cognito-users.js
```

See [Scripts Reference](#cognito-export-script) for the complete script.

**Expected output:**
```
🚀 Starting Cognito User Export
============================================================
👥 Exporting users from pool: us-east-1_nYamFUrp4
✅ Exported 10 users
💾 Saved to: cognito-users-2025-12-09T12-00-00-000Z.json
```

#### Step 1.3: Create Backup Archive (Optional but Recommended)

```bash
# Create timestamped archive
cd data-backup
tar -czf ../backup-$(date +%Y%m%d-%H%M%S).tar.gz .
cd ..

# Store in safe location (S3, external drive, etc.)
aws s3 cp backup-*.tar.gz s3://your-backup-bucket/rivalry-club-migration/
```

---

### PHASE 2: DEPLOY PRODUCTION ENVIRONMENT

#### Step 2.1: Configure Production Deployment

**Option A: Using Amplify Hosting + Pipeline (Recommended)**

1. Push your code to GitHub (if not already)
2. Connect your repository to Amplify Hosting in AWS Console
3. Amplify will auto-deploy on git push

**Option B: Direct Deployment (What you chose)**

```bash
# Deploy production environment
npm run amplify:deploy
```

This will:
- Create a new CloudFormation stack
- Provision new DynamoDB tables (empty)
- Create new Cognito User Pool (empty)
- Generate new AppSync API
- Output new `amplify_outputs.json`

**Important:** The deploy command will create `amplify_outputs.json` in your project root. **DO NOT** commit this to git yet or overwrite it. Save it as `amplify_outputs.production.json` for now:

```bash
# After deployment completes, save production config
cp amplify_outputs.json amplify_outputs.production.json
# Restore sandbox config temporarily
git checkout amplify_outputs.json
```

#### Step 2.2: Verify Production Resources

```bash
# The deploy output will show:
# - New CloudFormation stack name
# - New User Pool ID
# - New AppSync API URL
# - New API Key

# Verify stack exists
aws cloudformation describe-stacks --stack-name amplify-rivalryclubexpo-main-XXXXXX --region us-east-1

# List new tables
aws dynamodb list-tables --region us-east-1 | grep "Game-.*-NONE"

# Test GraphQL API
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_NEW_API_KEY" \
  -d '{"query": "query { listGames { items { id name } } }"}' \
  YOUR_NEW_APPSYNC_URL
```

**Expected:** Empty result set (tables are empty).

---

### PHASE 3: IMPORT DATA TO PRODUCTION

**⚠️ CRITICAL: Import Order Matters!**

The User table has an `awsSub` field that must match Cognito user `sub` values. Since production Cognito generates NEW sub values, we must:

1. Import Cognito users FIRST
2. Create awsSub mapping (old sub → new sub)
3. Import User table with UPDATED awsSub values
4. Import other tables

#### Step 3.1: Import Cognito Users (DO THIS FIRST!)

**Create and run Cognito import script:**

```bash
# Script: scripts/migration/import-cognito-users.js
# Update PRODUCTION_USER_POOL_ID first (from amplify_outputs.production.json)
node scripts/migration/import-cognito-users.js
```

See [Scripts Reference](#cognito-import-script) for the complete script.

**Expected output:**
```
🚀 Starting Cognito User Import
============================================================
👥 Importing to pool: us-east-1_NEWPOOLID
✅ User 1/10: t@t.t
✅ User 2/10: user2@example.com
[... continues ...]
✅ Imported 10/10 users successfully

⚠️  NOTE: Users will need to reset their passwords on first login
```

**IMPORTANT:** After import, each user now has a NEW `sub` value in production Cognito!

#### Step 3.2: Create awsSub Mapping

This step creates a mapping between old and new Cognito `sub` values.

```bash
# Script: scripts/migration/create-awssub-mapping.js
# Update PRODUCTION_USER_POOL_ID first
node scripts/migration/create-awssub-mapping.js
```

**Expected output:**
```
🚀 Creating Cognito awsSub Mapping
============================================================
📥 Step 1: Fetch users from sandbox pool...
✅ Found 10 users

📥 Step 2: Fetch users from production pool...
✅ Found 10 users

🔗 Step 3: Create mapping...
  ✅ t@t.t: abc123... → xyz789...
  ✅ user2@example.com: def456... → uvw012...
  [... continues ...]

📊 Mapping results:
  ✅ Matched: 10 users
  ⚠️  Unmatched: 0 users

💾 Saved mapping to: awssub-mapping.json
```

This creates `data-backup/awssub-mapping.json` used by the next step.

#### Step 3.3: Get Production Table Names

**Create helper script:**

```bash
# Script: scripts/migration/get-production-tables.js
node scripts/migration/get-production-tables.js
```

This will output a mapping file: `data-backup/table-mapping.json`

```json
{
  "Game": "Game-NEWAPPSYNCID-NONE",
  "Fighter": "Fighter-NEWAPPSYNCID-NONE",
  "User": "User-NEWAPPSYNCID-NONE",
  ...
}
```

#### Step 3.4: Import DynamoDB Data (With awsSub Transformation)

**CRITICAL:** Use the UPDATED import script that handles awsSub mapping:

```bash
# Script: scripts/migration/import-production-data-UPDATED.js
node scripts/migration/import-production-data-UPDATED.js
```

This script will:
- ✅ Load the awsSub mapping from Step 3.2
- ✅ Update User table records with NEW awsSub values
- ✅ Keep User IDs the same (so foreign keys work)
- ✅ Import all other tables as-is

See [Scripts Reference](#dynamodb-import-script-updated) for the complete script.

**Expected output:**
```
🚀 Starting Data Import to Production
============================================================
⚠️  CRITICAL: Cognito users must be imported FIRST!
============================================================

📋 Loading table mappings...
✅ Loaded table mappings

📋 Loading awsSub mappings...
✅ Loaded awsSub mapping for 10 users

📦 Importing Game data...
  📄 Loaded 5 items from backup
  ✅ Batch 1: Imported 5 items (5/5)
✅ Imported 5 items to Game-NEWID-NONE

📦 Importing Fighter data...
  📄 Loaded 300 items from backup
  ✅ Batch 1: Imported 25 items (25/300)
  [... batches continue ...]
✅ Imported 300 items to Fighter-NEWID-NONE

📦 Importing User data...
  📄 Loaded 10 items from backup
  🔑 Transforming User records with new Cognito awsSub values...
  🔄 Transformed 10 User records with new awsSub values
  ✅ Batch 1: Imported 10 items (10/10)
✅ Imported 10 items to User-NEWID-NONE

📦 Importing Rivalry data...
  📄 Loaded 50 items from backup
  ✅ Batch 1: Imported 25 items (25/50)
  ✅ Batch 2: Imported 25 items (50/50)
✅ Imported 50 items to Rivalry-NEWID-NONE

[... remaining tables ...]

============================================================
📊 IMPORT SUMMARY
============================================================
Game: 5 items ✅
Fighter: 300 items ✅
User: 10 items ✅ (awsSub values updated)
Rivalry: 50 items ✅
TierList: 100 items ✅
TierSlot: 1500 items ✅
Contest: 500 items ✅
------------------------------------------------------------
TOTAL: 2465 items imported successfully ✅
```

**What happened to the User table?**
- ✅ User IDs remained the same (e.g., "user-1")
- ✅ awsSub values updated to match new Cognito subs
- ✅ All other data (email, name, etc.) unchanged
- ✅ Foreign keys in other tables still work (they reference User IDs, not awsSub)

#### Step 3.5: Verify awsSub Mapping Worked

**Quick verification:**

```bash
# Check a sample user in DynamoDB
aws dynamodb get-item \
  --table-name User-NEWAPPSYNCID-NONE \
  --key '{"id": {"S": "USER_ID_HERE"}}' \
  --region us-east-1

# Verify the awsSub matches Cognito
aws cognito-idp list-users \
  --user-pool-id us-east-1_NEWPOOLID \
  --filter "email = \"t@t.t\"" \
  --region us-east-1
```

The `sub` from Cognito should match the `awsSub` in the User table record!

**Create Cognito import script:**

```bash
# Script: scripts/migration/import-cognito-users.js
node scripts/migration/import-cognito-users.js
```

See [Scripts Reference](#cognito-import-script) for the complete script.

**Important Notes:**
- Users will need to reset passwords on first login (Cognito limitation)
- Or use `AdminSetUserPassword` with `Permanent: true` in script
- Email addresses must be unique

**Expected output:**
```
🚀 Starting Cognito User Import
============================================================
👥 Importing to pool: us-east-1_NEWPOOLID
✅ User 1/10: t@t.t
✅ User 2/10: user2@example.com
[... continues ...]
✅ Imported 10/10 users successfully
```

---

### PHASE 4: CUTOVER TO PRODUCTION

#### Step 4.1: Verify Data Integrity

**Run verification script:**

```bash
# Script: scripts/migration/verify-migration.js
node scripts/migration/verify-migration.js
```

This script will:
- Count items in each production table
- Compare counts to backup summary
- Sample random records to verify data structure
- Test GraphQL queries

**Expected output:**
```
🔍 Verifying Migration
============================================================
✅ Game: 5 items (matches backup)
✅ Fighter: 300 items (matches backup)
✅ User: 10 items (matches backup)
✅ Rivalry: 50 items (matches backup)
✅ Contest: 500 items (matches backup)
✅ TierList: 100 items (matches backup)
✅ TierSlot: 1500 items (matches backup)

🧪 Testing GraphQL API...
✅ listGames query successful (5 results)
✅ listFighters query successful (300 results)
✅ Relationships intact (Fighter → Game)

============================================================
✅ ALL CHECKS PASSED - Migration Successful!
============================================================
```

#### Step 4.2: Update Application Configuration

```bash
# Replace sandbox config with production config
cp amplify_outputs.production.json amplify_outputs.json

# Commit the production config
git add amplify_outputs.json
git commit -m "Switch to production Amplify environment"
```

#### Step 4.3: Test Application

**Run the app with production backend:**

```bash
npm run ios
```

**Test checklist:**
- [ ] User can sign in with existing credentials (t@t.t)
- [ ] Games load correctly
- [ ] Rivalries display with correct data
- [ ] Contests show historical data
- [ ] Tier lists render properly
- [ ] New contests can be created
- [ ] Data persists after app restart

#### Step 4.4: Deploy to TestFlight/Production

**CRITICAL: You MUST publish a new app version**

The current app builds have sandbox credentials embedded. After migration, you need to rebuild and republish.

```bash
# Build for production with new config
npm run build:ios

# The app will now use production backend
```

**App Store Strategy:**

1. **Submit to TestFlight immediately**
   - Build with production config
   - Test thoroughly in TestFlight
   - Submit to App Store review

2. **User Communication**
   - Notify users an update is required
   - Consider force-update mechanism
   - Old app versions will fail to connect (if sandbox deleted)

3. **Transition Period**
   - Keep sandbox running until most users update (7-14 days)
   - Monitor sandbox usage (CloudWatch)
   - Delete sandbox when usage drops to zero

**Version Compatibility Matrix:**

| App Version | Backend | Status |
|-------------|---------|--------|
| ≤ Build 22 (old) | Sandbox | Works until sandbox deleted |
| ≥ Build 23 (new) | Production | Always works |

**What happens to users who don't update:**
- ✅ If sandbox still running: App works with stale data
- ❌ If sandbox deleted: Connection errors, can't sign in
- 💡 Recommendation: Implement version check + force update

---

### PHASE 5: CLEANUP (Optional)

#### Step 5.1: Decommission Sandbox

**Only do this after confirming production is working 100%!**

```bash
# Delete sandbox CloudFormation stack
aws cloudformation delete-stack \
  --stack-name amplify-rivalryclubexpo-davidmoritz-sandbox-68bbd7792c \
  --region us-east-1

# This will delete:
# - All sandbox DynamoDB tables
# - Sandbox Cognito User Pool
# - Sandbox AppSync API
```

**Cost savings:** Sandbox resources will no longer incur charges.

#### Step 5.2: Archive Backups

```bash
# Keep backups for at least 30 days
# Move to cold storage (S3 Glacier, etc.) after 90 days
aws s3 cp backup-*.tar.gz s3://your-archive-bucket/ \
  --storage-class GLACIER
```

---

## Scripts Reference

All scripts will be created in `scripts/migration/` directory.

### Export Script (Already Created)

**Location:** `scripts/migration/export-sandbox-data.js`

This script is already created and ready to use. It:
- Finds the sandbox CloudFormation stack
- Scans all DynamoDB tables
- Exports to JSON files with timestamps
- Creates a summary report

### Cognito Export Script

**Location:** `scripts/migration/export-cognito-users.js`

```javascript
#!/usr/bin/env node

/**
 * Export Cognito users from sandbox user pool
 */

const { CognitoIdentityProviderClient, ListUsersCommand, AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const fs = require('fs');
const path = require('path');

const REGION = 'us-east-1';
const USER_POOL_ID = 'us-east-1_nYamFUrp4'; // Sandbox pool
const BACKUP_DIR = path.join(__dirname, '../../data-backup');

const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });

async function exportUsers() {
  console.log('🚀 Starting Cognito User Export');
  console.log('='.repeat(60));
  console.log(`👥 Exporting users from pool: ${USER_POOL_ID}`);

  let users = [];
  let paginationToken = undefined;

  try {
    do {
      const command = new ListUsersCommand({
        UserPoolId: USER_POOL_ID,
        PaginationToken: paginationToken
      });

      const response = await cognitoClient.send(command);
      users = users.concat(response.Users || []);
      paginationToken = response.PaginationToken;

      console.log(`  📊 Retrieved ${response.Users?.length || 0} users (Total: ${users.length})`);

    } while (paginationToken);

    console.log(`✅ Exported ${users.length} users`);

    // Save to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `cognito-users-${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);

    const backupData = {
      userPoolId: USER_POOL_ID,
      exportDate: new Date().toISOString(),
      userCount: users.length,
      users: users.map(user => ({
        username: user.Username,
        email: user.Attributes?.find(a => a.Name === 'email')?.Value,
        emailVerified: user.Attributes?.find(a => a.Name === 'email_verified')?.Value === 'true',
        enabled: user.Enabled,
        userStatus: user.UserStatus,
        userCreateDate: user.UserCreateDate,
        attributes: user.Attributes
      }))
    };

    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
    console.log(`💾 Saved to: ${filename}`);

  } catch (error) {
    console.error('❌ Error exporting users:', error);
    throw error;
  }
}

exportUsers().catch(console.error);
```

### awsSub Mapping Script

**Location:** `scripts/migration/create-awssub-mapping.js`

This script is CRITICAL! It creates the mapping between old and new Cognito `sub` values.

The complete script is already created in your repo at the location above. Key features:

- Fetches users from both sandbox and production Cognito pools
- Matches users by email address
- Creates mapping: `oldSub → newSub`
- Saves to `data-backup/awssub-mapping.json`
- Used by the import script to update User table

**Usage:**
1. Run AFTER importing Cognito users to production
2. Update `PRODUCTION_USER_POOL_ID` in script first
3. Run: `node scripts/migration/create-awssub-mapping.js`

### DynamoDB Import Script (UPDATED)

**Location:** `scripts/migration/import-production-data-UPDATED.js`

This is the UPDATED version that handles awsSub transformation.

```javascript
#!/usr/bin/env node

/**
 * Import data from backup files to production DynamoDB tables
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
const fs = require('fs');
const path = require('path');

const REGION = 'us-east-1';
const BACKUP_DIR = path.join(__dirname, '../../data-backup');
const BATCH_SIZE = 25; // DynamoDB BatchWriteItem limit

const dynamoClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

/**
 * Load table name mappings
 * This file should map model names to production table names
 * Example: { "Game": "Game-newappsyncid-NONE", ... }
 */
function loadTableMappings() {
  const mappingFile = path.join(BACKUP_DIR, 'table-mapping.json');
  if (!fs.existsSync(mappingFile)) {
    throw new Error('table-mapping.json not found. Run get-production-tables.js first.');
  }
  return JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
}

/**
 * Find the most recent backup file for a model
 */
function findBackupFile(modelName) {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith(`${modelName}-`) && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error(`No backup file found for ${modelName}`);
  }

  return path.join(BACKUP_DIR, files[0]);
}

/**
 * Import items in batches
 */
async function importBatch(tableName, items) {
  const putRequests = items.map(item => ({
    PutRequest: { Item: item }
  }));

  const command = new BatchWriteCommand({
    RequestItems: {
      [tableName]: putRequests
    }
  });

  return await docClient.send(command);
}

/**
 * Import all items for a model
 */
async function importModel(modelName, tableName) {
  console.log(`\n📦 Importing ${modelName} data...`);

  const backupFile = findBackupFile(modelName);
  const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
  const items = backup.items;

  console.log(`  📄 Loaded ${items.length} items from backup`);

  let imported = 0;
  let batchNum = 0;

  // Process in batches of 25 (DynamoDB limit)
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    batchNum++;
    const batch = items.slice(i, i + BATCH_SIZE);

    try {
      await importBatch(tableName, batch);
      imported += batch.length;
      console.log(`  ✅ Batch ${batchNum}: Imported ${batch.length} items (${imported}/${items.length})`);

      // Small delay to avoid throttling
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`  ❌ Error in batch ${batchNum}:`, error.message);
      throw error;
    }
  }

  console.log(`✅ Imported ${imported} items to ${tableName}`);
  return imported;
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Starting Data Import to Production');
  console.log('='.repeat(60));

  try {
    // Load mappings
    console.log('📋 Loading table mappings...');
    const tableMappings = loadTableMappings();

    // Import each model
    const results = {};
    const modelOrder = ['Game', 'Fighter', 'User', 'Rivalry', 'TierList', 'TierSlot', 'Contest'];

    for (const modelName of modelOrder) {
      const tableName = tableMappings[modelName];
      if (!tableName) {
        console.log(`⚠️  Skipping ${modelName} (no table mapping)`);
        continue;
      }

      const count = await importModel(modelName, tableName);
      results[modelName] = count;
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(60));

    let totalItems = 0;
    Object.entries(results).forEach(([model, count]) => {
      console.log(`${model}: ${count} items ✅`);
      totalItems += count;
    });

    console.log('-'.repeat(60));
    console.log(`TOTAL: ${totalItems} items imported successfully ✅`);

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
```

### Cognito Import Script

**Location:** `scripts/migration/import-cognito-users.js`

```javascript
#!/usr/bin/env node

/**
 * Import Cognito users to production user pool
 */

const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');
const fs = require('fs');
const path = require('path');

const REGION = 'us-east-1';
const PRODUCTION_USER_POOL_ID = 'REPLACE_WITH_PRODUCTION_POOL_ID'; // Get from amplify_outputs.production.json
const BACKUP_DIR = path.join(__dirname, '../../data-backup');

const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });

/**
 * Find the most recent Cognito backup file
 */
function findCognitoBackup() {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('cognito-users-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error('No Cognito backup file found');
  }

  return path.join(BACKUP_DIR, files[0]);
}

/**
 * Create a user in the production pool
 */
async function createUser(user) {
  try {
    // Create user
    const createCommand = new AdminCreateUserCommand({
      UserPoolId: PRODUCTION_USER_POOL_ID,
      Username: user.email,
      UserAttributes: user.attributes,
      MessageAction: 'SUPPRESS' // Don't send welcome email
    });

    await cognitoClient.send(createCommand);

    // Set permanent password (if you have it)
    // WARNING: You'll need to handle password migration separately
    // Users will need to reset their passwords

    console.log(`  ✅ Created: ${user.email}`);

  } catch (error) {
    if (error.name === 'UsernameExistsException') {
      console.log(`  ⚠️  Already exists: ${user.email}`);
    } else {
      console.error(`  ❌ Error creating ${user.email}:`, error.message);
      throw error;
    }
  }
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Starting Cognito User Import');
  console.log('='.repeat(60));
  console.log(`👥 Importing to pool: ${PRODUCTION_USER_POOL_ID}`);

  try {
    const backupFile = findCognitoBackup();
    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    console.log(`📄 Loaded ${backup.userCount} users from backup`);

    for (let i = 0; i < backup.users.length; i++) {
      console.log(`\n👤 User ${i + 1}/${backup.userCount}: ${backup.users[i].email}`);
      await createUser(backup.users[i]);

      // Small delay to avoid throttling
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Imported ${backup.userCount} users successfully`);
    console.log('\n⚠️  NOTE: Users will need to reset their passwords on first login');

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
```

### Get Production Tables Script

**Location:** `scripts/migration/get-production-tables.js`

```javascript
#!/usr/bin/env node

/**
 * Get production table names and create mapping file
 */

const { CloudFormationClient, DescribeStackResourcesCommand } = require('@aws-sdk/client-cloudformation');
const fs = require('fs');
const path = require('path');

const REGION = 'us-east-1';
const PRODUCTION_STACK_NAME = 'REPLACE_WITH_PRODUCTION_STACK_NAME'; // e.g., amplify-rivalryclubexpo-main-abcdef
const BACKUP_DIR = path.join(__dirname, '../../data-backup');
const MODEL_NAMES = ['Game', 'Fighter', 'User', 'Rivalry', 'Contest', 'TierList', 'TierSlot'];

const cfnClient = new CloudFormationClient({ region: REGION });

async function getProductionTables() {
  console.log('🔍 Getting production table names...');
  console.log(`📋 Stack: ${PRODUCTION_STACK_NAME}`);

  try {
    const command = new DescribeStackResourcesCommand({
      StackName: PRODUCTION_STACK_NAME
    });

    const response = await cfnClient.send(command);
    const tableNames = response.StackResources
      .filter(resource => resource.ResourceType === 'AWS::DynamoDB::Table')
      .map(resource => resource.PhysicalResourceId);

    console.log(`✅ Found ${tableNames.length} tables`);

    // Create mapping
    const mapping = {};
    MODEL_NAMES.forEach(modelName => {
      const table = tableNames.find(t => t.includes(modelName));
      if (table) {
        mapping[modelName] = table;
        console.log(`  ${modelName} → ${table}`);
      }
    });

    // Save mapping
    const mappingFile = path.join(BACKUP_DIR, 'table-mapping.json');
    fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2));
    console.log(`\n💾 Saved mapping to: table-mapping.json`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

getProductionTables().catch(console.error);
```

### Verification Script

**Location:** `scripts/migration/verify-migration.js`

```javascript
#!/usr/bin/env node

/**
 * Verify migration was successful
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const fs = require('fs');
const path = require('path');

const REGION = 'us-east-1';
const BACKUP_DIR = path.join(__dirname, '../../data-backup');

const dynamoClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

async function verifyTable(modelName, tableName, expectedCount) {
  try {
    const command = new ScanCommand({
      TableName: tableName,
      Select: 'COUNT'
    });

    const response = await docClient.send(command);
    const actualCount = response.Count;

    if (actualCount === expectedCount) {
      console.log(`✅ ${modelName}: ${actualCount} items (matches backup)`);
      return true;
    } else {
      console.log(`❌ ${modelName}: ${actualCount} items (expected ${expectedCount})`);
      return false;
    }

  } catch (error) {
    console.error(`❌ ${modelName}: Error - ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Verifying Migration');
  console.log('='.repeat(60));

  const mappingFile = path.join(BACKUP_DIR, 'table-mapping.json');
  const summaryFile = path.join(BACKUP_DIR, 'export-summary.json');

  const tableMappings = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
  const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));

  let allPassed = true;

  for (const result of summary.results) {
    const tableName = tableMappings[result.modelName];
    if (!tableName) continue;

    const passed = await verifyTable(result.modelName, tableName, result.itemCount);
    if (!passed) allPassed = false;
  }

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ ALL CHECKS PASSED - Migration Successful!');
  } else {
    console.log('❌ VERIFICATION FAILED - Check errors above');
    process.exit(1);
  }
}

main().catch(console.error);
```

---

## Verification Procedures

### Data Integrity Checks

1. **Row Count Verification**
   - Each table's item count must match backup
   - Use verification script

2. **Sample Data Verification**
   - Randomly sample 10 records from each table
   - Verify all attributes present
   - Verify data types correct

3. **Relationship Verification**
   - Test foreign key relationships
   - Verify `belongsTo` and `hasMany` associations work
   - Example: Fighter → Game, Contest → Rivalry

4. **GraphQL API Verification**
   - Test all list queries
   - Test all get queries
   - Test filtering and sorting
   - Test nested relationships

### API Testing Checklist

```bash
# Test queries
curl -X POST -H "Content-Type: application/json" -H "x-api-key: YOUR_API_KEY" \
  -d '{"query": "query { listGames { items { id name fighters { items { name } } } } }"}' \
  YOUR_APPSYNC_URL

curl -X POST -H "Content-Type: application/json" -H "x-api-key: YOUR_API_KEY" \
  -d '{"query": "query { listRivalries { items { id contestCount contests { items { id } } } } }"}' \
  YOUR_APPSYNC_URL
```

### Application Testing Checklist

- [ ] Sign in works
- [ ] Game selection works
- [ ] Rivalries display
- [ ] Contest history loads
- [ ] Tier lists render
- [ ] Create new contest
- [ ] Update tier list
- [ ] Data persists

---

## Rollback Plan

### If Issues Occur During Migration

**Before cutover (app still using sandbox):**
- ✅ No rollback needed - sandbox still active
- Simply debug and retry production import

**After cutover (app using production):**

1. **Immediate rollback:**
   ```bash
   # Restore sandbox config
   git checkout amplify_outputs.json
   # Redeploy app
   npm run build:ios
   ```

2. **Fix production data:**
   - Production tables remain
   - Can re-run import scripts
   - Data is idempotent (can import multiple times)

3. **Start over:**
   ```bash
   # Delete production stack
   aws cloudformation delete-stack --stack-name PRODUCTION_STACK_NAME
   # Redeploy fresh
   npm run amplify:deploy
   # Re-import data
   ```

### Backup Retention

**Keep backups for:**
- 7 days: Hot backups (local + S3 Standard)
- 30 days: Warm backups (S3 Standard)
- 90 days: Cold backups (S3 Glacier)
- 1 year: Compliance archives (S3 Glacier Deep Archive)

---

## Post-Migration Tasks

### Update Documentation

- [ ] Update CLAUDE.md with production credentials
- [ ] Update README with new backend URLs
- [ ] Document production environment variables

### Update CI/CD

- [ ] Update deployment pipelines to use production
- [ ] Configure environment-specific builds
- [ ] Set up monitoring and alerts

### Security Hardening

- [ ] Rotate API keys (30-day expiry)
- [ ] Enable CloudWatch logging
- [ ] Set up AWS CloudTrail
- [ ] Configure backup policies for production tables
- [ ] Enable point-in-time recovery on DynamoDB tables

### Monitoring Setup

```bash
# Enable PITR on all tables
for table in $(aws dynamodb list-tables --region us-east-1 --query 'TableNames[*]' --output text | grep "YOUR_API_ID"); do
  aws dynamodb update-continuous-backups \
    --table-name $table \
    --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
    --region us-east-1
done
```

### Cost Optimization

- [ ] Review DynamoDB capacity settings
- [ ] Enable auto-scaling if needed
- [ ] Set up cost alerts in AWS Budgets
- [ ] Delete sandbox resources (after 30-day safety period)

---

## Common Issues & Troubleshooting

### Issue: Export script fails with "AccessDenied"

**Solution:**
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Add required DynamoDB permissions to your IAM user/role
```

### Issue: Import fails with "ThrottlingException"

**Solution:**
- Increase delay between batches (change 100ms to 500ms)
- Reduce BATCH_SIZE from 25 to 10
- Request DynamoDB capacity increase

### Issue: Production deployment hangs

**Solution:**
```bash
# Check CloudFormation events
aws cloudformation describe-stack-events \
  --stack-name YOUR_STACK_NAME \
  --region us-east-1 \
  --max-items 20

# Common causes:
# - IAM permissions missing
# - Resource limits exceeded
# - Nested stack failures
```

### Issue: Cognito users can't sign in

**Solution:**
- Cognito passwords cannot be migrated
- Users must reset passwords
- Implement password reset flow in app
- Or manually set passwords via AWS Console

### Issue: GraphQL relationships broken

**Solution:**
- Verify foreign key IDs match
- Check that parent records exist before children
- Import order matters: Game → Fighter, Rivalry → TierList → Contest

---

## Additional Resources

### AWS Documentation

- [Amplify Gen 2 Docs](https://docs.amplify.aws/gen2/)
- [DynamoDB BatchWriteItem](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchWriteItem.html)
- [Cognito User Migration](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-import-users.html)

### Internal Documentation

- `CLAUDE.md` - Project overview and architecture
- `ai_reports/auth/AMPLIFY_GEN2_SETUP.md` - Amplify Gen 2 setup guide
- GraphQL schema: `amplify/data/resource.ts`

---

## Summary Checklist

Use this checklist when executing the migration:

### Pre-Migration
- [ ] AWS CLI authenticated
- [ ] Backups directory created
- [ ] All scripts installed and tested
- [ ] Stakeholders notified of planned downtime (if any)

### Phase 1: Backup
- [ ] Export all DynamoDB tables
- [ ] Export Cognito users
- [ ] Verify backup files
- [ ] Create backup archive
- [ ] Upload to S3 (optional)

### Phase 2: Deploy Production
- [ ] Run `npm run amplify:deploy`
- [ ] Save `amplify_outputs.production.json`
- [ ] Verify CloudFormation stack created
- [ ] Verify tables created (empty)
- [ ] Test API connectivity

### Phase 3: Import Data (IN THIS ORDER!)
- [ ] Import Cognito users to production FIRST
- [ ] Create awsSub mapping (run create-awssub-mapping.js)
- [ ] Verify awsSub mapping file created
- [ ] Get production table names
- [ ] Create table mapping file
- [ ] Import DynamoDB data with UPDATED script
- [ ] Verify User table awsSub values updated
- [ ] Run verification script

### Phase 4: Cutover
- [ ] Update `amplify_outputs.json`
- [ ] Test app with production backend
- [ ] Deploy to TestFlight
- [ ] Verify in production

### Phase 5: Cleanup
- [ ] Monitor for 7 days
- [ ] Delete sandbox stack (after 30 days)
- [ ] Archive backups
- [ ] Update documentation

---

**Last Updated**: 2025-12-09
**Next Review**: Before execution

**Questions? Issues?**
Consult this document and the scripts in `scripts/migration/`. All scripts are designed to be safe, idempotent, and include extensive logging.
