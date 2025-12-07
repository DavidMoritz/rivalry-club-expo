# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rivalry Club is a React Native mobile application for managing fighting game character tier lists and rivalries between users. The app uses AWS Amplify for backend services (authentication, GraphQL API) and supports iOS deployment. Users can compete in "contests" where they rank game characters in tier lists, with the system tracking wins, losses, and character statistics.

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

### AWS Amplify
```bash
amplify push             # Push schema changes to AWS (requires AWS authentication)
```

## Architecture

### Application Flow

1. **Entry Point** (`App.tsx`): The app starts with a `Home` component where users select a game
2. **Authentication**: After game selection, users authenticate via AWS Amplify's `Authenticator` component
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

- **NativeWind v4**: Tailwind CSS for React Native (configured in `tailwind.config.js`)
- Uses `className` prop with Tailwind utility classes
- Global styles in `global.css`
- Dark mode enabled by default (see `isDarkMode` in components)

### Authentication

- AWS Amplify Authenticator with custom theme (dark mode)
- Custom `AuthenticatorHeader` component
- Configuration in `src/aws-exports.ts` (auto-generated)

## Important Conventions

### ESLint Rules

The project has strict ESLint rules configured in `.eslintrc.js`:

- **Import sorting**: Uses `simple-import-sort` plugin - imports must be ordered
- **Padding lines**: Required blank lines before/after blocks, functions, returns, throws
- **Newline before return**: Always required
- **No inline styles**: Prefer NativeWind classes
- **Unused vars**: Allowed if prefixed with `_`
- **Single quotes**: Enforced
- **Trailing commas**: Required

Auto-generated files are ignored: `src/API.ts`, `src/aws*`, `src/graphql/**/*`

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

Email: t@t.t
Password: 12345678
