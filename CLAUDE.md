# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rivalry Club is an Expo-based React Native mobile application for managing fighting game character tier lists and rivalries between users. The app uses **AWS Cognito for authentication** and **AWS Amplify for the GraphQL API**. It supports iOS deployment. Users can compete in "contests" where they rank game characters in tier lists, with the system tracking wins, losses, and character statistics.

This is the primary and only version of the Rivalry Club mobile app.

## Development Commands

### Setup
```bash
npm install
cd ios && npx pod-install
```

### Running the App
```bash
npm run ios              # Run iOS (default)
npm run ios:debug        # Run iOS in debug mode
npm run ios:release      # Run iOS in release mode
npm run android          # Run Android
npm start:rn             # Start React Native packager
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run lint:fix         # Run ESLint with auto-fix
npm test                 # Run Jest tests
```

### AWS Amplify (GraphQL API only)
```bash
amplify push             # Push GraphQL schema changes to AWS (requires AWS authentication)
```

### AWS Cognito (Authentication)
- Authentication is handled through AWS Cognito
- Configured via Amplify Gen 2 (`amplify/auth/resource.ts`)

## Architecture

### Application Flow

1. **Entry Point** (`App.tsx`): The app starts with a `Home` component where users select a game
2. **Authentication**: After game selection, users authenticate via custom `Auth` component using AWS Cognito
3. **Main Navigation** (`src/components/pages/access.tsx`): Authenticated users see a native stack navigator with routes:
   - `Rivalries` → `RivalryIndex` (landing page showing user's rivalries)
   - `ConnectedRivalryView` → View specific rivalry details
   - `RivalryTiersView` → View tier lists
   - `ContestHistory` → View contest history

### Context Providers

The app uses React Context for state management:

- **GameProvider** (`src/providers/game.ts`): Provides selected game (MGame) throughout the app
- **RivalryProvider** (`src/providers/rivalry.tsx`): Provides current rivalry (MRivalry) and update function
- **QueryClientProvider**: Wraps the app for React Query data fetching

### Data Layer

**GraphQL Schema** (`amplify/backend/api/rivalryclub/schema.graphql`):
- `Game`: Fighting game with fighters and rivalries
- `Fighter`: Character in a game (tracks wins, losses, tier position)
- `Rivalry`: Competition between two users in a specific game
- `TierList`: User's ranking of fighters (belongs to rivalry)
- `TierSlot`: Individual fighter position in tier list
- `Contest`: Single match in a rivalry between two tier lists

**Models** (`src/models/`):
- Extend GraphQL types with computed properties and utility methods
- Prefix: `M` (e.g., `MGame`, `MRivalry`, `MContest`)
- Example: `MGame` adds `abbr`, `title` computed properties

**Controllers** (`src/controllers/`):
- Handle data fetching and mutations using React Query
- `c-rivalry.ts`: Primary controller for rivalry operations (contests, tier lists)
- `c-user.ts`: User-related queries
- `c-fighter.ts`: Fighter queries
- Use custom hooks pattern: `useRivalryQuery`, `useCreateContestMutation`, etc.

**Custom GraphQL Operations** (`src/graphql/custom-queries.ts`):
- `getRivalryWithAllInfo`: Fetches rivalry with nested contests, tier lists, fighters
- `updateContestTierLists`: Batch updates tier lists after contest
- `generateUpdateMultipleTierSlotsQuery`: Dynamic query generation for bulk tier slot updates

**REST API Layer** (`src/axios/`):
- Axios instance configured for AWS Lambda endpoint
- Used for operations not suitable for GraphQL

### Component Structure

```
src/components/
├── common/           # Reusable UI components (Button, CharacterDisplay, LoadingSpinner, etc.)
├── layout/          # Layout components
├── pages/           # Screen-level components (Access, Home, RivalryIndex, etc.)
│   └── parts/       # Page-specific sub-components (RivalriesTable, TierListDisplay, etc.)
└── examples/        # Example/reference components
```

### Styling

- **React Native StyleSheet**: Uses React Native's built-in `StyleSheet.create()` for component styling
- Inline styles for component-specific styling needs
- Global styles in `src/utils/styles.ts` (`styles`, `darkStyles`, `lightStyles`)
- Dark mode enabled by default (see `isDarkMode` in components)

### Authentication

- **AWS Cognito** for authentication (`src/lib/amplify-auth.ts`)
- Custom `Auth` component (`src/components/screens/Auth.tsx`) for sign-in/sign-up
- Supports email/password authentication with session management
- Configured via Amplify Gen 2 (`amplify/auth/resource.ts`)

## Important Conventions

### Code Style

The project follows these conventions:

- **Styling**: Uses React Native StyleSheet and inline styles (no CSS-in-JS libraries)
- **Single quotes**: Preferred for strings
- **Trailing commas**: Recommended for multi-line structures

### TypeScript

- Strict mode enabled
- Uses `@tsconfig/react-native` base config
- ESM module resolution

### Testing

- Jest configured with React Native preset
- Test files in `__tests__/` directory

## Key Patterns

### React Query Usage

Controllers export custom hooks that wrap `useQuery` and `useMutation`:

```typescript
// Querying data
const { data: rivalry } = useRivalryQuery({
  rivalry: currentRivalry,
  onSuccess: (populatedRivalry) => { /* ... */ }
});

// Mutating data
const { mutate: createContest } = useCreateContestMutation({
  rivalry: currentRivalry,
  onSuccess: (contest) => { /* ... */ }
});
```

### Model Pattern

Models extend API types with computed properties:

```typescript
export interface MGame extends Game {
  abbr: string;      // Computed from name
  title: string;     // Formatted title
  baseGame: Game;    // Original API type
}
```

### Provider Pattern

Contexts provide both value and update function:

```typescript
const rivalry = useRivalry();          // Get current value
const updateRivalry = useUpdateRivalry(); // Get update function
```

## Troubleshooting

### "Already booted" error
Open simulator manually, swipe left, click Rivalry Club app

### "No bundle URL present" error
```bash
sh node_modules/react-native/scripts/launchPackager.command
```
Then press "i" to run in iOS, or reload in simulator

### xcodebuild error
```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

### FlipperKit errors
```bash
cd ios && NO_FLIPPER=1 npx pod-install && cd -
```

## Assets

- Fighter images: `src/assets/images/games/` (organized by game, e.g., `ssbu/`)
- Icons: FontAwesome (configured in `src/assets/icons.ts`)
- Cached assets: `src/assets/cache/`

## Test Credentials

**AWS Cognito:**
Email: t@t.t
Password: 12345678

## Backend Services

- **Authentication**: AWS Cognito (email/password, session management)
- **GraphQL API**: AWS Amplify (data layer for games, fighters, rivalries, tier lists, contests)
- **Storage**: AWS S3 (fighter images, assets)

## AI Reports

The `ai_reports/` directory contains technical reports and documentation generated during development.

**Important**:
- Always consult `ai_reports/index.md` when working on tasks to see if existing reports can help
- When generating new reports, place them in `ai_reports/` (or appropriate subfolder) and update `index.md`
- The index provides quick summaries of each report's topic and when to use it
