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
- **React Navigation** - Navigation (to be added)
- **AWS Amplify** - Backend services (to be added)
- **GraphQL** - API layer (to be added)
- **React Query** - Data fetching (to be added)

## Development Status

✅ Basic Expo app created
✅ NativeWind configured
⏳ AWS Amplify setup (next)
⏳ GraphQL schema migration (next)
⏳ Authentication (next)
⏳ Navigation (next)
⏳ Core features (next)
