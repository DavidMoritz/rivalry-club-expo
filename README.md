# Rivalry Club

A mobile app for ranking fighting game characters through competitive tier lists. Challenge your friends to settle which character truly belongs at the top!

## 🎮 What is Rivalry Club?

Rivalry Club is a React Native mobile app where users compete to build the ultimate tier list for fighting games. Instead of simply ranking characters, you face off against your rivals in head-to-head "contests" where characters from your tier lists battle it out. Winners rise, losers fall, and over time the best tier list emerges.

### Core Mechanics

1. **Select a Game**: Choose from Super Smash Bros Ultimate and other fighting games
2. **Create a Rivalry**: Challenge another user to compete in the same game
3. **Contests**: The app randomly selects fighters from both tier lists to face off
4. **Ranking System**:
   - Each contest adjusts fighter positions based on the outcome
   - Characters start at the bottom (position 85) as "Unknown Tier"
   - Through contests, fighters earn their place in the tier list
   - Winning moves a fighter up, losing moves them down
5. **Tier Lists**: Your rankings organize into tiers (S, A, B, C, etc.) based on position
6. **Standing**: Track your overall record against rivals

### Key Features

- **Anonymous Play**: Start playing immediately without account creation
- **Optional Account Linking**: Create an account later to save progress across devices
- **Profile System**: View your rivalries, manage account settings
- **Pending Rivalries**: Accept or decline incoming rivalry challenges
- **Contest History**: Review past matchups and see how your tier list evolved
- **Individual Reshuffle**: Don't like one of the matchup fighters? Reshuffle just that side!

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- iOS Simulator (for iOS development) or Android Studio (for Android development)
- AWS credentials configured (for backend deployment)
- Expo CLI (`npm install -g expo-cli`)

### Installation

```bash
# Install dependencies
npm install

# iOS: Install pods
cd ios && npx pod-install && cd ..

# Run on iOS
npm run ios

# Run on Android
npm run android
```

### Test Credentials

For testing production builds, use:
- **Email**: `t@t.t`
- **Password**: `12345678`

*Note: After running the password reset script, all production users have password `qwerqwer`*

## 📱 Production Builds

### iOS (TestFlight)

Build and submit to TestFlight in one command:

```bash
npm run build:ios:local
```

This will:
- Increment the build number automatically
- Build the iOS app locally
- Submit to App Store Connect
- Move the `.ipa` file to `ios_builds/` directory

**View on TestFlight**: The build appears in ~15 minutes after completion.

**App Store Details**:
- Bundle ID: `club.rivalry.app`
- Apple ID: `davidmoritz@gmail.com`
- ASC App ID: `6740737367`
- Team ID: `FVG6A24S96`

### Android (Google Play)

Build for Android:

```bash
npm run build:android
```

After the build completes:
1. Download from [Expo Dashboard](https://expo.dev/accounts/davisomalley/projects/rivalry-club-expo/builds)
2. Upload to [Google Play Console](https://play.google.com/console/u/0/developers/8278992728250171737/app/4974178153621674209/app-dashboard)
3. Create a new release and share the Play Store link with testers

**App Details**:
- Package: `club.rivalry.app`
- Current Version: `1.3.0`
- Version Code: `1`

## 🏗️ Project Structure

```
rivalry-club-expo/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── CharacterDisplay.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ...
│   │   ├── screens/         # Screen-level components
│   │   │   ├── Home.tsx     # Game selection
│   │   │   ├── Auth.tsx     # Sign in/sign up
│   │   │   ├── RivalryIndex.tsx  # Rivalries list
│   │   │   ├── ConnectedRivalryView.tsx  # Active rivalry view
│   │   │   ├── Profile.tsx  # User profile & settings
│   │   │   └── parts/       # Screen sub-components
│   │   │       ├── CurrentContest.tsx
│   │   │       ├── RivalryView.tsx
│   │   │       ├── TierListDisplay.tsx
│   │   │       └── ...
│   ├── controllers/         # React Query hooks for data
│   │   ├── c-rivalry.ts     # Rivalry queries & mutations
│   │   ├── c-user.ts        # User queries
│   │   └── c-fighter.ts     # Fighter queries
│   ├── models/              # Extended GraphQL types
│   │   ├── m-game.ts
│   │   ├── m-rivalry.ts
│   │   ├── m-contest.ts
│   │   ├── m-tier-list.ts
│   │   ├── m-tier-slot.ts
│   │   ├── m-fighter.ts
│   │   └── m-user.ts
│   ├── providers/           # React Context providers
│   │   ├── game.ts          # Selected game context
│   │   ├── rivalry.tsx      # Current rivalry context
│   │   └── all-rivalries.tsx
│   ├── graphql/             # Custom GraphQL operations
│   ├── lib/                 # Core libraries
│   │   ├── amplify-auth.ts  # Cognito authentication
│   │   └── amplify-data.ts  # Data client setup
│   ├── utils/               # Utility functions & styles
│   └── axios/               # REST API client
├── amplify/                 # AWS Amplify Gen 2 backend
│   ├── auth/                # Cognito configuration
│   ├── data/                # GraphQL schema & resolvers
│   │   └── resource.ts      # Schema definition
│   └── backend.ts           # Backend configuration
├── scripts/                 # Utility scripts
│   ├── create-test-user.js  # Create Cognito users
│   ├── reset-cognito-passwords.js  # Reset all passwords
│   └── increment-build.js   # Auto-increment build numbers
├── assets/                  # Images, icons, fighter sprites
├── App.tsx                  # App entry point
└── app.json                 # Expo configuration
```

## 🛠️ Tech Stack

### Frontend
- **React Native** `0.81.5` - Mobile framework
- **Expo** `~54.0` - Development platform
- **TypeScript** `~5.9` - Type safety
- **React Navigation** - Native stack navigation
- **React Query** `^5.90` - Data fetching & caching

### Backend
- **AWS Amplify Gen 2** - Backend infrastructure
  - **Cognito** - User authentication
  - **AppSync** - GraphQL API
  - **DynamoDB** - Database
  - **S3** - Asset storage
- **GraphQL** - API query language

### Styling
- **React Native StyleSheet** - Component styling
- **Inline styles** - Dynamic styling

### State Management
- **React Context** - Global state (Game, Rivalry)
- **React Query** - Server state
- **React Hooks** - Local component state

### Development Tools
- **Jest** - Testing framework
- **ESLint** - Code linting
- **Patch-package** - NPM package patching
- **EAS Build** - Cloud builds
- **AWS SDK** - Backend scripts

## 🔐 Authentication

The app uses **AWS Cognito** for authentication with a flexible approach:

### Anonymous Users
- Users can start playing immediately without creating an account
- Progress is stored locally on the device
- Perfect for trying out the app

### Account Creation
- Optional: Users can create an account at any time via the Profile screen
- Accounts preserve progress across devices
- Email/password authentication
- Session management with automatic token refresh

### Authentication Flow

1. **No Auth Required**: Users start in the app immediately after game selection
2. **Optional Link**: "Link Account" option in Profile screen
3. **Sign In/Sign Up**: Custom auth UI (`Auth.tsx`)
4. **Session Persistence**: Secure token storage via Expo SecureStore

### Implementation Details

**Auth Library**: `src/lib/amplify-auth.ts`
- `signIn()` - Email/password sign in
- `signUp()` - Create new account
- `signOut()` - End session
- `getCurrentUser()` - Get authenticated user
- `confirmSignUp()` - Email verification
- `resetPassword()` - Password reset flow

**User Record**: After authentication, the app automatically creates a `User` record in DynamoDB with:
- `id` - UUID
- `email` - User's email
- `awsSub` - Cognito user ID
- `firstName`, `lastName` - Optional display names
- `role` - User role (0 = standard user)

## 📊 Data Models

### Core Models (GraphQL Schema)

**Game**
- Fighting game (e.g., "Super Smash Bros. Ultimate")
- Has many Fighters and Rivalries

**Fighter**
- Character in a game
- Tracks aggregate stats across all users
- Has game position, contest count, win count, tier breakdown

**User**
- App user account
- Links to Cognito via `awsSub`
- Can have multiple Rivalries and TierLists

**Rivalry**
- Competition between two users in a specific game
- Tracks contest count, current contest, accepted status
- Each user has one TierList for this rivalry

**TierList**
- User's ranking of all fighters in a game (for a specific rivalry)
- Has 86 TierSlots (one per fighter in SSBU)
- Tracks standing (wins/losses against rival)

**TierSlot**
- Single fighter's position in a TierList
- Position: 0-85 (0 = top, 85 = bottom) or null (unknown)
- Tracks contestCount and winCount for this fighter in this tier list

**Contest**
- Single matchup between two fighters from rival tier lists
- Stores result (positive = user A won, negative = user B won)
- Stores bias (tier difference between fighters)

### Model Extensions

The app extends GraphQL types with computed properties and utility methods:

**Models**: `src/models/m-*.ts`
- Prefix `M` indicates extended model (e.g., `MRivalry`)
- Add computed properties (e.g., `game.abbr`, `tierList.prestigeDisplay`)
- Add utility methods (e.g., `rivalry.adjustStanding()`, `tierList.sampleEligibleSlot()`)

## 🎯 Key Algorithms

### Contest Resolution

When a contest is resolved:

1. **Update Contest Record**: Store result and bias in database
2. **Adjust Standings**: Update each TierList's `standing` based on outcome
3. **Update Fighter Positions**:
   - Winner moves up by `result × STEPS_PER_STOCK × -1` positions
   - Loser moves down by `result × STEPS_PER_STOCK` positions
   - Unknown fighters (position = null) are positioned at bottom first
4. **Update Fighter Stats**: Increment global stats for both fighters
5. **Create New Contest**: Automatically sample next matchup

### Tier Slot Positioning

**Unknown Fighter Positioning** (`positionUnknownFighter`):
- Places fighter at target position
- If occupied, finds first empty slot going UP (towards position 0)
- Shifts consecutive fighters UP by 1 position (85→84, 84→83, etc.)
- Used when fighters are positioned or repositioned

**Bottom Positioning** (`positionFighterAtBottom`):
- Places fighter at position 85 (bottom)
- If occupied, finds first empty slot going UP
- Shifts consecutive fighters UP by 1 position (85→84, 84→83)
- Used when moving fighters to the bottom during reshuffle

**Collision Handling**: Both methods shift UP (towards position 0) and only shift consecutive occupied positions, preserving gaps in the tier list.

### Sampling Algorithm

When selecting fighters for a contest (`sampleEligibleSlot`):

1. Filter to "eligible" slots:
   - Must have a position (not null)
   - contestCount < 20 (fighters need more data), OR
   - winCount / contestCount between 0.35 and 0.65 (competitive fighters)
2. If no eligible slots, broaden criteria to include all positioned slots
3. Randomly sample from eligible set

### Reshuffle Logic

Individual reshuffle (new in v1.3):
- User clicks reshuffle button for one side of the contest
- NEW fighter is sampled and keeps its current position (whatever it is, including null)
- OLD fighter moves to position 85 using `positionFighterAtBottom()`
- Other side remains unchanged
- Prevents seeing the same matchup repeatedly

## 🔧 Development

### Environment Files

- `amplify_outputs.json` - Auto-generated Amplify configuration (development)
- `amplify_outputs.production.json` - Production Amplify configuration
- App automatically uses production config when built with `eas build`

### Scripts

#### User Management
```bash
# Create test user in Cognito + DynamoDB
node scripts/create-test-user.js user@example.com --first=John --last=Doe

# Confirm/reset user password
node scripts/confirm-user.js user@example.com --password=newpass

# Reset ALL production user passwords to 'qwerqwer'
node scripts/reset-cognito-passwords.js
```

#### Build Management
```bash
# Increment iOS build number
node scripts/increment-build.js

# Find DynamoDB tables
node scripts/find-tables.js
```

See `scripts/README.md` for detailed documentation.

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Generate coverage report
npm test:coverage
```

### Backend Deployment

Deploy schema changes to AWS:

```bash
# Deploy to production
npm run amplify:deploy

# Start local sandbox (development)
npm run amplify:sandbox
```

**Note**: Schema changes require backend deployment before the app can use new fields.

## 🐛 Troubleshooting

### "Already booted" error (iOS Simulator)

1. Open iOS Simulator manually (don't use `npm run ios`)
2. Swipe left on home screen
3. Click the "Rivalry Club" app icon

### "No bundle URL present" error

The React Native packager isn't running:

```bash
# Start the packager manually
sh node_modules/react-native/scripts/launchPackager.command
```

Then press "i" to run on iOS, or reload in the simulator.

### xcodebuild error

Set the correct Xcode path:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

### FlipperKit errors during iOS build

Disable Flipper and reinstall pods:

```bash
cd ios
NO_FLIPPER=1 npx pod-install
cd ..
```

### TypeScript errors after schema changes

1. Deploy backend changes: `npm run amplify:deploy`
2. Restart TypeScript server in your IDE
3. Clear watchman cache if needed: `watchman watch-del-all`

### Authentication issues

Check Cognito user status:

```bash
# List all users in production pool
aws cognito-idp list-users \
  --user-pool-id us-east-1_8f6RCLauy \
  --region us-east-1

# Check specific user
aws cognito-idp admin-get-user \
  --user-pool-id us-east-1_8f6RCLauy \
  --username user@example.com \
  --region us-east-1
```

## 📚 Additional Documentation

- **Developer Guide**: See `CLAUDE.md` for detailed architecture and conventions
- **Scripts Documentation**: See `scripts/README.md` for utility scripts
- **AI Reports**: See `ai_reports/index.md` for technical implementation reports

## 🎨 Assets

Fighter images are organized by game:

```
src/assets/images/games/
└── ssbu/                    # Super Smash Bros. Ultimate
    ├── bayonetta.png
    ├── bowser.png
    ├── captain-falcon.png
    └── ... (86 fighters total)
```

Icons use FontAwesome (configured in `src/assets/icons.ts`).

## 📝 Version History

### v1.3.0 (Current)
- Individual reshuffle buttons for each contest slot
- Improved bottom positioning with upward collision shifting
- Profile screen enhancements
- Password reset script for production users

### v1.2.0
- Contest history view
- Tier list visualization improvements
- Profile management system
- Bug fixes and performance improvements

### v1.1.0
- Anonymous user support
- Account linking functionality
- Rivalry creation and management
- Contest system implementation

### v1.0.0
- Initial release
- Basic rivalry functionality
- Tier list system
- AWS Amplify Gen 2 integration

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

## 📄 License

Copyright © 2025 Rivalry Club. All rights reserved.
