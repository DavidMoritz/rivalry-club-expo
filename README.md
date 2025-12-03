# Rivalry Club (Expo)

Modern rebuild of Rivalry Club using Expo and current Amplify/GraphQL standards.

## Quick Start

```bash
npm install
npm run ios     # Run on iOS
npm run android # Run on Android
```

## Project Structure

```
rivalry-club-expo/
├── src/
│   ├── components/
│   │   ├── common/       # Reusable UI components
│   │   ├── screens/      # Screen components
│   │   └── navigation/   # Navigation setup
│   ├── providers/        # React Context providers
│   ├── models/           # Data models (extending GraphQL types)
│   ├── controllers/      # Data fetching/mutations with React Query
│   ├── graphql/          # GraphQL queries/mutations
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── App.tsx               # Entry point
└── global.css            # Tailwind styles
```

## Tech Stack

- **Expo** - Development framework
- **TypeScript** - Type safety
- **NativeWind v4** - Tailwind CSS for React Native
- **React Navigation** - Native stack navigation
- **Supabase** - Authentication (Expo Go compatible)
- **AWS Amplify Gen 2** - Backend services (GraphQL API, AppSync, DynamoDB)
- **React Query** - Data fetching and state management

## Authentication

This app uses **Supabase** for authentication instead of AWS Cognito because:
- ✅ Works seamlessly in Expo Go (no native module issues)
- ✅ Simpler setup and configuration
- ✅ Better developer experience for mobile apps

**Important:** User authentication is handled by Supabase, but all game data (fighters, rivalries, contests, tier lists) is stored in AWS DynamoDB via AppSync GraphQL API.

### Supabase Configuration

**Project Details:**
- Project URL: `https://ybmcuqkllbmqmwtpsgbj.supabase.co`
- Configuration file: `src/lib/supabase.ts`

**Making Changes to Authentication:**

1. **Supabase Dashboard:** [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Email Settings:** Authentication → Providers → Email
   - Email confirmation is disabled for instant sign-up
   - To enable email verification: Toggle "Confirm email" and save
3. **User Management:** Authentication → Users
   - View all registered users
   - Manually verify/delete users if needed

**How It Works:**
1. Users sign up/sign in through Supabase
2. Supabase user ID is stored in the AppSync `User` table's `awsSub` field
3. The `useAuthUser` hook automatically creates a User record in AppSync after Supabase authentication
4. All game data queries use the AppSync User record

### AWS Amplify (Data Only)

The app uses Amplify Gen 2 for the GraphQL API and data storage, but NOT for authentication.

**Configuration:**
- Backend outputs: `amplify_outputs.json`
- GraphQL schema: `amplify/data/resource.ts`
- API endpoint: AppSync in `us-east-1`

**To deploy backend changes:**
```bash
npm run amplify:deploy
```

## Development Status

✅ Basic Expo app created
✅ NativeWind configured
✅ AWS Amplify Gen 2 backend connected
✅ GraphQL schema configured
✅ Supabase authentication integrated
✅ Navigation structure
⏳ Core features (in progress)
