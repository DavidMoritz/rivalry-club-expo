# AWS Amplify Gen 2 Setup Guide

This guide walks you through setting up AWS Amplify Gen 2 for the Rivalry Club Expo app.

## What is Amplify Gen 2?

Amplify Gen 2 uses:
- **TypeScript-based configuration** instead of CLI prompts
- **Code-first approach** with full type safety
- **Git-based deployments** - push to deploy
- **Sandbox environments** for local development

## Prerequisites

1. **AWS Account** - You need an AWS account (https://aws.amazon.com)
2. **AWS CLI configured** - Run `aws configure` and enter your credentials
3. **Node.js 18+** - Already installed

## Project Structure

```
amplify/
├── backend.ts              # Main backend definition
├── auth/
│   └── resource.ts         # Cognito authentication config
├── data/
│   └── resource.ts         # GraphQL API & DynamoDB schema
└── tsconfig.json           # TypeScript config for Amplify
```

## Quick Start

### Option 1: Sandbox (Local Development)

Run a cloud sandbox for development:

```bash
npm run amplify:sandbox
```

This will:
1. Deploy a personal cloud sandbox environment
2. Watch for file changes and auto-deploy
3. Generate TypeScript types to `amplify/data/resource.ts`
4. Create `amplify_outputs.json` with connection info

### Option 2: Deploy to AWS

For production deployment:

```bash
# First time: Initialize the project
npx ampx generate config

# Deploy to AWS
npm run amplify:deploy --branch main --app-id <your-app-id>
```

## Configure Your App

Once the sandbox is running or after deployment, update `App.tsx`:

```typescript
import { Amplify } from 'aws-amplify';
import outputs from './amplify_outputs.json';

Amplify.configure(outputs);
```

## Data Schema Highlights

Our schema (`amplify/data/resource.ts`) includes:

### Models
- **Game** - Fighting games (e.g., Super Smash Bros. Ultimate)
- **Fighter** - Characters in each game
- **User** - App users (linked to Cognito)
- **Rivalry** - Competition between two users
- **TierList** - User's ranking of fighters
- **TierSlot** - Individual fighter position in tier list
- **Contest** - Match between two tier lists

### Relationships
- Game **hasMany** Fighters
- Rivalry **hasMany** Contests
- TierList **hasMany** TierSlots
- Fighter **belongsTo** Game

### Authorization
- Most models: `publicApiKey()` for testing
- User model: `owner()` for user privacy
- **For production**: Update to more restrictive rules

## Authentication

Authentication is configured in `amplify/auth/resource.ts`:

```typescript
export const auth = defineAuth({
  loginWith: {
    email: true,  // Email-based authentication
  },
});
```

Users can sign up and sign in with email/password via Cognito.

## Working with the Sandbox

### Start Sandbox
```bash
npm run amplify:sandbox
```

### Stop Sandbox
Press `Ctrl+C` or:
```bash
npx ampx sandbox delete
```

### View Logs
Sandbox automatically shows deployment logs and errors.

### Generated Files

After sandbox starts, you'll have:
- `amplify_outputs.json` - Connection configuration (gitignored)
- Type-safe client in `amplify/data/resource.ts`

## Making Schema Changes

1. Edit `amplify/data/resource.ts`
2. Save the file
3. Sandbox automatically redeploys
4. Types are regenerated

Example - Adding a field:

```typescript
Fighter: a.model({
  // ... existing fields
  description: a.string(), // New field
})
```

## Using the GraphQL API

### Query Data

```typescript
import { generateClient } from 'aws-amplify/data';
import type { Schema } from './amplify/data/resource';

const client = generateClient<Schema>();

// List all games
const { data: games } = await client.models.Game.list();

// Get a specific fighter
const { data: fighter } = await client.models.Fighter.get({ id: 'fighter-id' });

// Create a new rivalry
const { data: rivalry } = await client.models.Rivalry.create({
  userAId: 'user1',
  userBId: 'user2',
  gameId: 'game-id',
  contestCount: 0,
});
```

### Subscriptions (Real-time)

```typescript
// Subscribe to new contests
const subscription = client.models.Contest.onCreate().subscribe({
  next: (data) => console.log('New contest:', data),
  error: (error) => console.error(error),
});

// Unsubscribe later
subscription.unsubscribe();
```

## CI/CD with Git

### Set up Pipeline

1. Connect your repo to Amplify Console
2. Amplify auto-detects the Gen 2 project
3. Every `git push` triggers a deployment

### Branch Environments

- `main` branch → production
- `dev` branch → staging
- Feature branches → preview environments

## Common Commands

```bash
# Start sandbox
npm run amplify:sandbox

# Deploy to production
npm run amplify:deploy --branch main

# Generate outputs only
npx ampx generate outputs

# View backend status
npx ampx sandbox status

# Delete sandbox
npx ampx sandbox delete
```

## Seeding Data

To match the rn-app, you'll need to seed:
- Game data (Super Smash Bros. Ultimate)
- All 84 fighters

You can use the cached data in `assets/cache/game-query.json` as a reference and create a script to seed via the GraphQL API.

## Differences from Gen 1

| Gen 1 | Gen 2 |
|-------|-------|
| `amplify init` | `npx ampx sandbox` |
| `amplify push` | `git push` (auto-deploy) |
| GraphQL schema file | TypeScript schema definition |
| `aws-exports.js` | `amplify_outputs.json` |
| CLI-based | Code-first |

## Troubleshooting

### Sandbox won't start
- Ensure AWS credentials are configured: `aws configure`
- Check you're in the project root
- Try: `npx ampx sandbox delete` then start again

### TypeScript errors
- Ensure `amplify/tsconfig.json` exists
- Check that generated types are up to date
- Try clearing cache: `npx expo start --clear`

### Authentication not working
- Verify `Amplify.configure(outputs)` is called before any API calls
- Check `amplify_outputs.json` exists
- Ensure polyfills are imported in `index.ts`

## Resources

- [Amplify Gen 2 Docs](https://docs.amplify.aws/gen2/)
- [Data Modeling](https://docs.amplify.aws/gen2/build-a-backend/data/)
- [Authentication](https://docs.amplify.aws/gen2/build-a-backend/auth/)
- [TypeScript Client](https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-api/)
