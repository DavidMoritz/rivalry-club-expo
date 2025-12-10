# The awsSub Critical Issue - Summary

**Date**: 2025-12-09
**Status**: ✅ ADDRESSED in migration guide

## The Problem You Identified

You correctly identified a **critical flaw** in the original migration plan:

> "If we get a new Cognito userPool, then that means we will have whole-new awsSub values for the Users table."

## Why This Matters

### Current Sandbox Architecture
```
┌─────────────────┐
│ Cognito User    │
│ sub: "abc-123"  │ ← AWS-generated unique identifier
│ email: t@t.t    │
└────────┬────────┘
         │
         ↓ Links to database via awsSub
┌─────────────────┐
│ User Table      │
│ id: "user-1"    │
│ awsSub: "abc123"│ ← MUST match Cognito sub
│ email: t@t.t    │
└────────┬────────┘
         │
         ↓ Referenced by foreign keys
┌─────────────────┐
│ Rivalry Table   │
│ userAId: "user-1" │ ← References User.id (not awsSub)
│ userBId: "user-2" │
└─────────────────┘
```

### What Happens in Migration (WITHOUT Fix)

1. **New Cognito Pool Created**
   - Production Cognito: `sub = "xyz-789"` (NEW!)
   - Same email: `t@t.t`

2. **Old User Table Imported**
   - User record: `awsSub = "abc-123"` (OLD!)

3. **User Tries to Sign In**
   - ✅ Cognito auth succeeds (email/password correct)
   - ✅ App gets token with `sub = "xyz-789"`
   - ❌ App queries User table: `WHERE awsSub = "xyz-789"`
   - ❌ **NO MATCH FOUND** (table has "abc-123")
   - ❌ User can't use app!

## The Solution

### Three-Step Process

1. **Import Cognito Users First**
   ```bash
   node scripts/migration/import-cognito-users.js
   ```
   Result: Production Cognito now has users with NEW subs

2. **Create awsSub Mapping**
   ```bash
   node scripts/migration/create-awssub-mapping.js
   ```
   Result: `awssub-mapping.json` created:
   ```json
   {
     "abc-123-old-sub": {
       "oldSub": "abc-123-old-sub",
       "newSub": "xyz-789-new-sub",
       "email": "t@t.t"
     }
   }
   ```

3. **Import DynamoDB with Transformation**
   ```bash
   node scripts/migration/import-production-data-UPDATED.js
   ```
   Result: User table records updated:
   - `id`: "user-1" (UNCHANGED - foreign keys still work!)
   - `awsSub`: "xyz-789-new-sub" (UPDATED!)
   - `email`: "t@t.t" (UNCHANGED)

### Why This Works

**User IDs Stay the Same:**
- Rivalry still references `userAId = "user-1"` ✅
- TierList still references `userId = "user-1"` ✅
- All foreign keys intact ✅

**awsSub Values Updated:**
- User table now has NEW Cognito subs ✅
- Authentication links correctly ✅
- App can find user records after sign-in ✅

## Scripts Created/Updated

### New Scripts
1. ✅ `scripts/migration/create-awssub-mapping.js` - Creates the mapping
2. ✅ `scripts/migration/import-production-data-UPDATED.js` - Uses mapping to transform User records

### Updated Documentation
1. ✅ Migration guide: Added "CRITICAL: awsSub Problem" section
2. ✅ Phase 3 reordered: Cognito FIRST, then mapping, then DynamoDB
3. ✅ Verification steps added to check awsSub alignment
4. ✅ Checklist updated with correct order

## Data Flow During Migration

```
SANDBOX (OLD)                      PRODUCTION (NEW)
┌──────────────┐                  ┌──────────────┐
│ Cognito      │                  │ Cognito      │
│ sub: abc-123 │  ─────────>      │ sub: xyz-789 │ ← NEW sub generated
│ email: t@t.t │  (import users)  │ email: t@t.t │
└──────────────┘                  └──────────────┘
                                          │
                                          │ (mapping created)
                                          ↓
                                  ┌──────────────────┐
                                  │ awssub-mapping   │
                                  │ abc-123 → xyz-789│
                                  └──────────────────┘
                                          │
                                          │ (used during import)
                                          ↓
┌──────────────┐                  ┌──────────────┐
│ User Table   │                  │ User Table   │
│ id: user-1   │  ─────────>      │ id: user-1   │ ← Same ID!
│ awsSub:      │  (transform)     │ awsSub:      │
│   abc-123    │                  │   xyz-789    │ ← Updated!
└──────────────┘                  └──────────────┘
        │                                 │
        ↓                                 ↓
┌──────────────┐                  ┌──────────────┐
│ Rivalry      │  ─────────>      │ Rivalry      │
│ userAId:     │  (unchanged)     │ userAId:     │
│   user-1     │                  │   user-1     │ ← Still works!
└──────────────┘                  └──────────────┘
```

## Key Insights

1. **Foreign Keys Use User.id (not awsSub)**
   - This is why we can update awsSub without breaking relationships
   - User IDs remain constant across migration

2. **awsSub is for Auth Linkage Only**
   - Only used to link Cognito identity → User record
   - Not used as a foreign key anywhere else

3. **Email is the Matching Key**
   - Mapping script matches users by email
   - Assumes email is unique and consistent

## Verification

After import, verify the fix worked:

```bash
# 1. Get a user from Cognito
aws cognito-idp list-users \
  --user-pool-id PRODUCTION_POOL_ID \
  --filter "email = \"t@t.t\""
# Note the "sub" value

# 2. Get the same user from DynamoDB
aws dynamodb scan \
  --table-name User-PRODUCTION_API_ID-NONE \
  --filter-expression "email = :email" \
  --expression-attribute-values '{":email":{"S":"t@t.t"}}'
# Note the "awsSub" value

# 3. They should MATCH!
```

## What If We Didn't Fix This?

**Symptoms:**
- ✅ Users can sign in to Cognito
- ❌ App shows "User not found" error
- ❌ Can't access any user-specific data
- ❌ All rivalries, tier lists, contests appear empty
- ❌ Essentially a broken migration

**Recovery:**
Would need to:
1. Manually update all User records
2. Or re-import User table with mapping
3. Or create new User records (breaks foreign keys!)

## Conclusion

**You caught a migration-breaking bug!** The original plan would have resulted in a seemingly successful migration where:

- ✅ All data transferred
- ✅ All table relationships intact
- ❌ **But no users could actually use the app**

The updated migration process handles this automatically with the correct import order and awsSub transformation.

---

**For Future Reference:**
- Always check for identity linkages (awsSub, foreign keys, etc.)
- Consider what happens when AWS generates new IDs
- Test auth flow after any identity provider migration
