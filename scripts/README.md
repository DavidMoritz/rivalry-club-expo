# Scripts

This directory contains utility scripts for managing the Rivalry Club application.

## Prerequisites

All scripts require AWS credentials to be configured. Ensure you have:

```bash
# Install dependencies
npm install

# Configure AWS credentials (if not already done)
aws configure
```

---

## create-test-user.js

Creates a test user in AWS Cognito with a permanent password and verified email.

### Setup

Set your Cognito User Pool ID:
```bash
export COGNITO_USER_POOL_ID=your-user-pool-id
```

You can find your User Pool ID in the AWS Cognito console or by running:
```bash
aws cognito-idp list-user-pools --max-results 10
```

### Usage

**Basic usage** (generates random first/last names based on email's first letter):
```bash
node scripts/create-test-user.js a@a.com
```

**With custom first name**:
```bash
node scripts/create-test-user.js b@b.com --first=Bob
```

**With custom last name**:
```bash
node scripts/create-test-user.js c@c.com --last=Cooper
```

**With custom password** (default is 'qwerqwer'):
```bash
node scripts/create-test-user.js d@d.com --password=mypassword123
```

**Full customization**:
```bash
node scripts/create-test-user.js test@example.com --first=John --last=Doe --password=securepass123
```

### Features

- Automatically generates realistic random names based on email's first letter if not provided
- Sets email as verified (no confirmation needed)
- Sets password as permanent (no forced password change on first login)
- Suppresses welcome email
- **Automatically adds user to DynamoDB Users table** with all required fields
- **Automatically adds user to `src/lib/dev/dev-users.json`** for Expo Go development
- Default password: 'qwerqwer'

### What it does

1. Creates user in AWS Cognito with verified email
2. Sets permanent password (no forced change on login)
3. **Adds user to DynamoDB Users table** with:
   - Generated UUID as `id`
   - Email, firstName, lastName
   - `awsSub` from Cognito
   - Default `role: 0`
   - Timestamps (`createdAt`, `updatedAt`)
4. Adds user to `dev-users.json` for Expo Go development

### Examples

```bash
# Create user with email 'a@a.com', generates names starting with 'A'
node scripts/create-test-user.js a@a.com

# Output:
# ✓ User created successfully
# ✓ Password set to permanent
# ✓ Added user to DynamoDB Users table
# ✓ Added new entry to dev-users.json
#
# Email: a@a.com
# First Name: Alice
# Last Name: Adamson
# User Sub (awsSub): b4b824e8-5051-70db-70dc-92384a31bfd6
# DynamoDB User ID: 12345678-1234-5678-1234-567812345678
# Password: qwerqwer

# Create user with custom details
node scripts/create-test-user.js test@rivalry.club --first=Test --last=User --password=password123
```

---

## confirm-user.js

Confirms an existing Cognito user account, sets a permanent password, and marks their email as verified.

### Usage

**Basic usage** (uses default password 'qwerqwer'):
```bash
node scripts/confirm-user.js test@example.com
```

**With user sub/ID**:
```bash
node scripts/confirm-user.js 1418a4b8-f0c1-7098-1701-79f095e17e61
```

**With custom password**:
```bash
node scripts/confirm-user.js test@example.com --password=mypass123
```

### What it does

1. Gets the current user status from Cognito
2. Sets a permanent password (confirms users in FORCE_CHANGE_PASSWORD state)
3. Marks email as verified
4. Confirms sign-up if user is in UNCONFIRMED state

### Use cases

- Fix users stuck in FORCE_CHANGE_PASSWORD state
- Confirm users who haven't verified their email
- Reset a user's password to a known value for testing

### Features

- Handles users in any status (UNCONFIRMED, FORCE_CHANGE_PASSWORD, CONFIRMED)
- Sets permanent password (no forced change on next login)
- Marks email as verified
- Default password: 'qwerqwer'

---

## find-tables.js

Lists all DynamoDB tables in the AWS account, showing recent tables and filtering for Rivalry Club model tables.

### Usage

```bash
node scripts/find-tables.js
```

### What it does

1. Lists all DynamoDB tables in the `us-east-1` region
2. Displays the 20 most recently created tables with timestamps
3. Filters and shows tables matching Rivalry Club models (Game, Fighter, User, Rivalry, Contest, TierList, TierSlot)

### Output example

```
Found 45 tables total

Recent tables (last 20):
================================================================================
2025-12-04T10:30:00.000Z: TierList-eufbm2g2krhd3kvltqwnkdayb4-NONE
2025-12-04T10:29:58.000Z: User-eufbm2g2krhd3kvltqwnkdayb4-NONE
...

Tables matching Game/Fighter/User/etc:
================================================================================
2025-12-04T10:30:00.000Z: Game-eufbm2g2krhd3kvltqwnkdayb4-NONE
2025-12-04T10:29:59.000Z: Fighter-eufbm2g2krhd3kvltqwnkdayb4-NONE
...
```

---

## increment-build.js

Increments the iOS build number in `app.json` for App Store submissions.

### Usage

```bash
node scripts/increment-build.js
```

This script is automatically run as part of the iOS build process via the `build:ios` and `build:ios:local` npm scripts.

### What it does

1. Reads the current iOS build number from `app.json`
2. Increments it by 1
3. Writes the updated build number back to `app.json`

### Output example

```
✅ Build number incremented: 42 → 43
```

---

## fix-missing-awssub.js

**⚠️ Legacy Script** - Used for one-time data migration.

Fixes User records in DynamoDB that are missing the `awsSub` field by setting placeholder values.

### Usage

```bash
node scripts/fix-missing-awssub.js
```

### What it does

1. Scans the User table for records without `awsSub`
2. Sets `awsSub` to `placeholder-{userId}` for each missing record
3. Reports the number of users fixed

**Note:** This script uses a hardcoded table name and was created for a specific migration scenario.

---

## migrate-dynamodb.js

**⚠️ Legacy Script** - Used for one-time data migration.

Migrates all Rivalry Club data from an old staging environment (2023) to a new sandbox environment.

### Usage

```bash
node scripts/migrate-dynamodb.js
```

### What it does

1. Verifies source and target table mappings
2. Migrates data for all models in order: Game → Fighter → User → Rivalry → TierList → Contest → TierSlot
3. Updates the test user email to `t@t.com`
4. Clears old `awsSub` values
5. Sets new `awsSub` values from `external/data/users.csv`

### Table mappings

- **Source suffix:** `-zgox4hnry5aeblka7pk4mzmqle-staging`
- **Target suffix:** `-eufbm2g2krhd3kvltqwnkdayb4-NONE`

**Note:** Table suffixes are hardcoded and specific to the migration performed in December 2025.

---

## restore-tierlists.js

**⚠️ Legacy Script** - Used for one-time data migration.

Restores TierList and TierSlot data from staging to the current environment while preserving existing data.

### Usage

```bash
node scripts/restore-tierlists.js
```

### What it does

1. Scans existing TierLists and TierSlots in the target environment
2. Gets TierLists and TierSlots from the source (staging) environment
3. Filters out items that already exist in the target
4. Batch writes only the missing items to avoid duplicates
5. Provides a summary of preserved vs. restored items

### Table mappings

- **Source suffix:** `-zgox4hnry5aeblka7pk4mzmqle-staging`
- **Target suffix:** `-eufbm2g2krhd3kvltqwnkdayb4-NONE`

**Note:** This was used to recover TierList data after a migration issue in December 2025.

---

## reset-cognito-passwords.js

Resets all user passwords in the production Cognito user pool to a standard value.

### Usage

```bash
node scripts/reset-cognito-passwords.js
```

### Configuration

The script is configured with:
- **User Pool ID**: `us-east-1_8f6RCLauy` (from `amplify_outputs.production.json`)
- **Region**: `us-east-1`
- **New Password**: `qwerqwer`
- **Permanent**: `true` (users won't be forced to change password on next login)

To modify these values, edit the constants at the top of `reset-cognito-passwords.js`.

### What it does

1. Lists all users in the specified Cognito user pool
2. Displays the users that will be updated
3. Waits 3 seconds for confirmation (Ctrl+C to cancel)
4. Updates each user's password to the configured value
5. Sets passwords as permanent (no forced change required)
6. Displays a summary of successful/failed updates

### Output example

```
========================================
Cognito Password Reset Script
========================================
User Pool: us-east-1_8f6RCLauy
Region: us-east-1
New Password: qwerqwer
Permanent: true
========================================

Listing all users in user pool: us-east-1_8f6RCLauy
Found 5 users

Users to be updated:
  1. user1@example.com (user1@example.com)
  2. user2@example.com (user2@example.com)
  3. user3@example.com (user3@example.com)

⚠️  WARNING: This will update passwords for ALL users listed above!
Press Ctrl+C to cancel, or the script will continue in 3 seconds...

Updating passwords...

✓ Updated password for: user1@example.com
✓ Updated password for: user2@example.com
✓ Updated password for: user3@example.com

========================================
Summary
========================================
Total users: 3
Successfully updated: 3
Failed: 0
========================================
```

### Security Notes

⚠️ **WARNING**: This script will update passwords for ALL users in the production user pool. Use with caution!

- The script includes a 3-second delay before execution to allow cancellation
- All operations are logged to the console
- Failed updates are reported with error messages
- Consider backing up user data before running bulk operations

---

## update-fighter-positions.js

Updates the `gamePosition` field for all fighters in both production and sandbox databases based on values from `assets/cache/game-query.json`.

### Usage

**Dry run (preview changes without applying):**
```bash
node scripts/update-fighter-positions.js
```

**Apply changes to both production and sandbox:**
```bash
node scripts/update-fighter-positions.js --apply
```

### What it does

1. Reads fighter data from `assets/cache/game-query.json`
2. Extracts fighter IDs and gamePosition values
3. Updates the Fighter table in both:
   - **Production** database (using `amplify_outputs.production.json`)
   - **Sandbox** database (using `data-backup/amplify_outputs.sandbox.backup.json`)
4. **Only updates the `gamePosition` field** - all other fighter data (name, contestCount, winCount, etc.) remains unchanged

### Safety Features

- **Dry run by default**: Running without `--apply` shows what would be updated without making changes
- **Progress feedback**: Shows each fighter being updated with success/error status
- **Error handling**: Continues processing all fighters even if some updates fail
- **Rate limiting**: Adds 100ms delays between requests to avoid overwhelming the API
- **Summary report**: Shows total successes and errors for each environment

### Output example

```
Fighter gamePosition Update Script
===================================
MODE: DRY RUN (preview only)
To apply changes, run: node scripts/update-fighter-positions.js --apply

Reading game-query.json...
Found 86 fighters to update

Reading configuration files...

=== Preview Production environment ===
API URL: https://3nqbfghjnreungdjaafttjstbi.appsync-api.us-east-1.amazonaws.com/graphql
Total fighters to update: 86
⚠️  DRY RUN MODE - No changes will be made

○ [1/86] Would update Mario (ID: 483cfead-6301-11ee-a22d-169ccb685861) → gamePosition: 1
○ [2/86] Would update Donkey Kong (ID: 483d0208-6301-11ee-a22d-169ccb685861) → gamePosition: 2
...

Production Summary:
  Success: 86
  Errors: 0
  Total: 86

=== Preview Sandbox environment ===
...

✅ Dry run completed! No changes were made.
To apply these changes, run: node scripts/update-fighter-positions.js --apply
```

---

## Notes

- All DynamoDB scripts use the `us-east-1` region
- Legacy migration scripts have hardcoded table names/suffixes
- For current development, you'll primarily use `create-test-user.js`, `increment-build.js`, and `find-tables.js`
