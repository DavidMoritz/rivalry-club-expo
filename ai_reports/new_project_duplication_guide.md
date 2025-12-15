# New Project Duplication Guide

**Author**: Claude Code
**Date**: 2025-12-15
**Purpose**: Complete guide for setting up a new Expo + AWS Amplify Gen 2 + React Native project using the Rivalry Club stack

---

## Table of Contents

1. [Technology Stack Overview](#technology-stack-overview)
2. [Project Initialization](#project-initialization)
3. [Essential Configuration Files](#essential-configuration-files)
4. [AWS Amplify Gen 2 Setup](#aws-amplify-gen-2-setup)
5. [Project Structure](#project-structure)
6. [Architectural Patterns](#architectural-patterns)
7. [Development Workflow](#development-workflow)
8. [Testing Setup](#testing-setup)
9. [Key Learnings & Best Practices](#key-learnings--best-practices)

---

## Technology Stack Overview

### Core Technologies

- **Expo SDK 54** - React Native framework with managed workflow
- **React Native 0.81.5** - Mobile development framework
- **TypeScript 5.9.2** - Type-safe JavaScript
- **Expo Router 6.0** - File-based routing system

### Backend Services

- **AWS Amplify Gen 2** - Backend infrastructure
- **AWS Cognito** - Authentication (email/password)
- **AWS AppSync** - GraphQL API (via Amplify Data)
- **AWS DynamoDB** - NoSQL database (via Amplify Data)

### State Management & Data

- **React Query (@tanstack/react-query 5.90)** - Server state management
- **React Context** - Client state management
- **Axios** - REST API calls (when needed outside GraphQL)

### Developer Tools

- **Biome 2.3.8** - Linting and formatting (replaces ESLint + Prettier)
- **Jest 29.7** - Testing framework
- **React Testing Library** - Component testing
- **Patch-package** - NPM package patching

---

## Project Initialization

### Step 1: Create Expo Project

```bash
# Create new Expo project with TypeScript template
npx create-expo-app@latest my-new-app --template expo-template-blank-typescript

cd my-new-app
```

### Step 2: Install Core Dependencies

```bash
# Expo and React Native essentials
npm install expo@~54.0.29
npm install react@19.1.0 react-dom@19.1.0 react-native@0.81.5
npm install expo-router@~6.0.19 expo-status-bar@~3.0.9
npm install react-native-safe-area-context@^5.6.2
npm install react-native-screens@~4.16.0
npm install react-native-gesture-handler@~2.28.0

# AWS Amplify Gen 2
npm install aws-amplify@^6.15.8
npm install @aws-amplify/react-native@^1.3.0
npm install @react-native-async-storage/async-storage@^2.2.0
npm install react-native-get-random-values@^1.11.0
npm install react-native-url-polyfill@^3.0.0
npm install expo-secure-store@~15.0.8

# State Management
npm install @tanstack/react-query@^5.90.11

# Utilities
npm install lodash@^4.17.21
npm install axios@^1.13.2
npm install @react-native-community/netinfo@^11.4.1

# SVG Support
npm install react-native-svg@15.12.1
```

### Step 3: Install Dev Dependencies

```bash
# Amplify CLI and Backend
npm install --save-dev @aws-amplify/backend@^1.18.0
npm install --save-dev @aws-amplify/backend-cli@^1.8.0
npm install --save-dev aws-cdk-lib@^2.232.1
npm install --save-dev constructs@^10.4.3
npm install --save-dev tsx@^4.21.0

# AWS SDK (for scripts/advanced usage)
npm install --save-dev @aws-sdk/client-cloudformation@^3.943.0
npm install --save-dev @aws-sdk/client-cognito-identity-provider@^3.943.0
npm install --save-dev @aws-sdk/client-dynamodb@^3.943.0
npm install --save-dev @aws-sdk/lib-dynamodb@^3.943.0

# Biome (linter/formatter)
npm install --save-dev @biomejs/biome@^2.3.8

# Testing
npm install --save-dev jest@~29.7.0
npm install --save-dev jest-expo@~54.0.16
npm install --save-dev @testing-library/react-native@^13.3.3
npm install --save-dev @testing-library/jest-native@^5.4.3
npm install --save-dev @types/jest@^29.5.14
npm install --save-dev react-test-renderer@19.1.0
npm install --save-dev babel-jest@^29.7.0

# Utilities
npm install --save-dev patch-package@^8.0.1
npm install --save-dev @types/react@~19.1.10
npm install --save-dev typescript@~5.9.2
npm install --save-dev babel-preset-expo@~54.0.0
npm install --save-dev @react-native-community/cli@^20.0.2
```

### Step 4: Add React 19 Overrides

Add to `package.json`:

```json
{
  "overrides": {
    "react": "19.1.0",
    "react-dom": "19.1.0"
  }
}
```

### Step 5: Initialize Amplify Gen 2

```bash
# Initialize Amplify backend
npx ampx sandbox

# This creates:
# - amplify/ directory with backend configuration
# - amplify_outputs.json for local development
```

---

## Essential Configuration Files

### 1. tsconfig.json

Copy from `rivalry-club-expo/tsconfig.json`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "resolveJsonModule": true
  },
  "include": ["**/*.ts", "**/*.tsx", "**/*.json", "nativewind-env.d.ts"],
  "exclude": ["amplify"]
}
```

**Key points**:
- Extends Expo's base config
- Strict mode enabled
- Excludes `amplify/` directory (it's backend code, not app code)

### 2. biome.jsonc

Copy the entire file from `rivalry-club-expo/biome.jsonc`

**Important customizations** (marked with `~Meritas` comments):
- React Native project structure overrides (line 49-56)
- No console.log errors (line 681) - allowed for React Native dev
- File naming conventions for Expo Router (line 27-29)
- Jest globals configured (line 837-848)
- Single quotes preferred (line 854)

**Key sections**:
- `files.includes` - Excludes amplify, scripts, autogenerated files
- `overrides` - Special rules for tests, App.tsx, Expo Router files
- `javascript.formatter` - Code style (single quotes, semicolons, etc.)
- `linter.rules` - Comprehensive rule set from Ultracite config

### 3. jest.config.js

Copy from `rivalry-club-expo/jest.config.js`:

```javascript
process.env.REANIMATED_JEST_SKIP_WORKLETS = '1';

module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  testTimeout: 10_000,
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': [
      'babel-jest',
      {
        presets: ['babel-preset-expo'],
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@supabase/.*|@aws-amplify/.*|lodash|@tanstack/.*)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/graphql/**/*',
    '!src/API.ts',
  ],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
    '\\.(css)$': '<rootDir>/__mocks__/styleMock.js',
    '^react-native-reanimated$':
      '<rootDir>/__mocks__/react-native-reanimated.js',
  },
};
```

### 4. jest.setup.js

Create with proper mocks:

```javascript
// Import @testing-library/jest-native matchers
import '@testing-library/jest-native/extend-expect';

// Mock Expo modules
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
}));

jest.mock('expo-status-bar');

// Mock Expo winter runtime
global.__ExpoImportMetaRegistry = {
  add: jest.fn(),
  get: jest.fn(),
};

// Polyfill structuredClone for tests
global.structuredClone = obj => JSON.parse(JSON.stringify(obj));

// Mock SafeAreaView
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  SafeAreaProvider: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock AWS Amplify
jest.mock('aws-amplify/data', () => ({
  generateClient: jest.fn(),
}));

jest.mock('aws-amplify', () => ({
  Amplify: {
    configure: jest.fn(),
  },
}));

// Suppress console logs in tests (unless in verbose mode)
if (!process.argv.includes('--verbose')) {
  global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };
}
```

**Critical**: NetInfo mock must return Promises, not undefined!

### 5. Create Mock Files

Create `__mocks__/` directory:

```bash
mkdir __mocks__
```

**__mocks__/fileMock.js**:
```javascript
module.exports = 'test-file-stub';
```

**__mocks__/styleMock.js**:
```javascript
module.exports = {};
```

**__mocks__/react-native-reanimated.js**:
```javascript
module.exports = {
  ...jest.requireActual('react-native-reanimated/mock'),
};
```

### 6. app.json

Configure Expo:

```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug",
    "scheme": "yourappscheme",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "newArchEnabled": false,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.yourcompany.yourapp",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.yourcompany.yourapp",
      "versionCode": 1
    },
    "plugins": [
      "expo-router"
    ]
  }
}
```

### 7. package.json Scripts

Add these scripts:

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "amplify:sandbox": "npx ampx sandbox",
    "amplify:deploy": "npx ampx pipeline-deploy",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "postinstall": "patch-package"
  }
}
```

---

## AWS Amplify Gen 2 Setup

### Directory Structure

Create `amplify/` directory structure:

```
amplify/
├── auth/
│   └── resource.ts
├── data/
│   └── resource.ts
└── backend.ts
```

### 1. amplify/backend.ts

```typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';

/**
 * @see https://docs.amplify.aws/gen2/build-a-backend/
 */
export const backend = defineBackend({
  auth,
  data,
});
```

### 2. amplify/auth/resource.ts

```typescript
import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
  },
  accountRecovery: 'EMAIL_ONLY',
  multifactor: {
    mode: 'OFF',
  },
  // By not specifying autoVerifiedAttributes, email verification is disabled
  // This allows immediate sign-in after sign-up for faster development
});
```

**Key points**:
- Email/password authentication
- No email verification (for faster development - add in production!)
- Account recovery via email

### 3. amplify/data/resource.ts

Define your GraphQL schema using Amplify Gen 2 syntax:

```typescript
import { a, type ClientSchema, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // Example: User model
  User: a
    .model({
      email: a.string().required(),
      firstName: a.string(),
      lastName: a.string(),
      createdAt: a.datetime(),
      deletedAt: a.datetime(),
    })
    .authorization(allow => [allow.publicApiKey()]),

  // Add your models here...
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    },
  },
});
```

**Schema patterns**:
- Use `a.model()` for DynamoDB tables
- Use `a.hasMany()` and `a.belongsTo()` for relationships
- Use `.secondaryIndexes()` for GSIs (Global Secondary Indexes)
- Use `.authorization()` to configure access

**Example relationship**:
```typescript
Post: a
  .model({
    title: a.string().required(),
    authorId: a.id().required(),
    author: a.belongsTo('User', 'authorId'),
  })
  .authorization(allow => [allow.publicApiKey()]),

User: a
  .model({
    name: a.string().required(),
    posts: a.hasMany('Post', 'authorId'),
  })
  .authorization(allow => [allow.publicApiKey()]),
```

**Example secondary index** (for efficient queries):
```typescript
Post: a
  .model({
    authorId: a.id().required(),
    createdAt: a.datetime(),
  })
  .secondaryIndexes(index => [
    index('authorId')
      .sortKeys(['createdAt'])
      .queryField('postsByAuthorAndDate'),
  ])
  .authorization(allow => [allow.publicApiKey()]),
```

### 4. Configure Amplify in App

Create `amplify-config.ts`:

```typescript
import { Amplify } from 'aws-amplify';
import outputs from './amplify_outputs.json';

Amplify.configure(outputs);
```

Import in `App.tsx`:

```typescript
import './amplify-config';
```

### 5. Running Amplify Sandbox

```bash
# Start sandbox (creates backend resources in AWS)
npm run amplify:sandbox

# This generates:
# - amplify_outputs.json (local config)
# - Deploys backend to your AWS account
```

**Important**: Add `amplify_outputs.json` to `.gitignore`

---

## Project Structure

### Directory Layout

```
your-app/
├── app/                          # Expo Router pages (file-based routing)
│   ├── _layout.tsx              # Root layout
│   ├── index.tsx                # Home page (/)
│   └── [dynamic].tsx            # Dynamic route
│
├── src/                          # Application code
│   ├── components/              # React components
│   │   ├── common/              # Reusable UI components
│   │   ├── screens/             # Screen-level components
│   │   │   └── parts/           # Screen sub-components
│   │   └── navigation/          # Navigation components
│   │
│   ├── controllers/             # React Query hooks (data layer)
│   │   ├── c-user.ts           # User queries/mutations
│   │   └── c-posts.ts          # Post queries/mutations
│   │
│   ├── models/                  # Domain models (extend API types)
│   │   ├── m-user.ts           # User model
│   │   └── m-post.ts           # Post model
│   │
│   ├── providers/               # React Context providers
│   │   ├── auth.tsx            # Auth context
│   │   └── theme.tsx           # Theme context
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── useTheme.ts
│   │
│   ├── utils/                   # Utility functions
│   │   ├── styles.ts           # Global styles
│   │   ├── colors.ts           # Color palette
│   │   └── helpers.ts          # Helper functions
│   │
│   ├── types/                   # TypeScript type definitions
│   │   └── index.ts
│   │
│   ├── lib/                     # Third-party library configs
│   │   └── amplify-auth.ts     # Amplify auth helpers
│   │
│   └── axios/                   # REST API layer (if needed)
│       └── index.ts
│
├── amplify/                      # Amplify Gen 2 backend
│   ├── auth/
│   │   └── resource.ts
│   ├── data/
│   │   └── resource.ts
│   └── backend.ts
│
├── __tests__/                    # Test files
│   ├── models/                  # Model tests
│   ├── controllers/             # Controller tests
│   └── integration/             # Integration tests
│
├── __mocks__/                    # Jest mocks
│
├── assets/                       # Static assets
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── ai_reports/                   # AI-generated documentation
│   ├── index.md                 # Report index
│   └── REFACTORING_PREFERENCES.md
│
├── amplify-config.ts            # Amplify configuration
├── App.tsx                       # Entry point
├── app.json                      # Expo configuration
├── package.json                  # Dependencies
├── tsconfig.json                # TypeScript config
├── biome.jsonc                  # Biome config
├── jest.config.js               # Jest config
├── jest.setup.js                # Jest setup
└── CLAUDE.md                    # Project guide for Claude Code
```

### Naming Conventions

**Files**:
- `kebab-case.ts` for most files
- `PascalCase.tsx` for React components
- `[param].tsx` for Expo Router dynamic routes
- Prefix models with `m-` (e.g., `m-user.ts`)
- Prefix controllers with `c-` (e.g., `c-user.ts`)

**Components**:
- PascalCase for component names
- Descriptive names (e.g., `UserProfileCard`, not `Card`)

**Types**:
- Prefix interfaces/types with `M` for models (e.g., `MUser`, `MPost`)
- Use `Props` suffix for component props (e.g., `UserCardProps`)

---

## Architectural Patterns

### 1. Model Pattern (M prefix)

**Purpose**: Extend API types with computed properties and business logic

**Location**: `src/models/`

**Example** (`m-user.ts`):

```typescript
import type { Schema } from '../../amplify/data/resource';

// Base API type
type User = Schema['User']['type'];

// Extended model with computed properties
export interface MUser extends User {
  fullName: string;
  initials: string;
  baseUser: User;
}

// Factory function to create model instances
export function getMUser({ user }: { user: User }): MUser {
  return {
    ...user,
    baseUser: user,

    // Computed property
    get fullName() {
      return `${user.firstName} ${user.lastName}`.trim();
    },

    // Computed property
    get initials() {
      const first = user.firstName?.charAt(0) || '';
      const last = user.lastName?.charAt(0) || '';
      return `${first}${last}`.toUpperCase();
    },
  };
}
```

**Key points**:
- Models extend GraphQL types
- Add computed properties via getters
- Store original API type in `baseUser`
- Use factory functions (`getMUser`) to create instances
- Keep business logic separate from API layer

### 2. Controller Pattern (C prefix)

**Purpose**: React Query hooks for data fetching/mutations

**Location**: `src/controllers/`

**Example** (`c-user.ts`):

```typescript
import { generateClient } from 'aws-amplify/data';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Schema } from '../../amplify/data/resource';
import { getMUser, type MUser } from '../models/m-user';

const client = generateClient<Schema>();

// Query hook
export function useUserQuery(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const { data, errors } = await client.models.User.get({ id: userId });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to fetch user');
      }

      if (!data) {
        throw new Error('User not found');
      }

      return getMUser({ user: data });
    },
    enabled: !!userId,
  });
}

// Mutation hook
export function useUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, firstName, lastName }: {
      id: string;
      firstName: string;
      lastName: string;
    }) => {
      const { data, errors } = await client.models.User.update({
        id,
        firstName,
        lastName,
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to update user');
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user', data.id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// List query
export function useUsersQuery() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, errors } = await client.models.User.list();

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to fetch users');
      }

      return data.map(user => getMUser({ user }));
    },
  });
}
```

**Key points**:
- One file per domain entity
- Export custom hooks, not raw queries
- Convert API types to Models
- Handle errors consistently
- Invalidate queries after mutations
- Use `enabled` for conditional queries

### 3. Provider Pattern

**Purpose**: Global state management via React Context

**Location**: `src/providers/`

**Example** (`auth.tsx`):

```typescript
import { createContext, useContext, useState, type ReactNode } from 'react';
import type { MUser } from '../models/m-user';

interface AuthContextValue {
  user: MUser | null;
  isAuthenticated: boolean;
}

interface AuthUpdateContextValue {
  setUser: (user: MUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const AuthUpdateContext = createContext<AuthUpdateContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MUser | null>(null);

  const logout = () => {
    setUser(null);
    // Additional logout logic...
  };

  const value = {
    user,
    isAuthenticated: !!user,
  };

  const updateValue = {
    setUser,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      <AuthUpdateContext.Provider value={updateValue}>
        {children}
      </AuthUpdateContext.Provider>
    </AuthContext.Provider>
  );
}

// Consumer hooks
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function useAuthUpdate() {
  const context = useContext(AuthUpdateContext);
  if (!context) {
    throw new Error('useAuthUpdate must be used within AuthProvider');
  }
  return context;
}
```

**Key points**:
- Separate read and write contexts (performance)
- Export custom hooks, not contexts
- Throw errors if used outside provider
- Keep providers focused (single responsibility)

### 4. Styling Pattern

**Global Styles** (`src/utils/styles.ts`):

```typescript
import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  text: {
    color: colors.white,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.purple900,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  centeredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.black,
  },
  text: {
    color: colors.white,
  },
});
```

**Component Styles** (at bottom of component file):

```typescript
// Component code above...

// Extract repeated values
const center = 'center' as const;

// Define style constants at bottom
const containerStyle = {
  flex: 1,
  alignItems: center,
  justifyContent: center,
};

const headerStyle = {
  fontSize: 24,
  fontWeight: 'bold' as const,
  marginBottom: 16,
};
```

**Best practices**:
- Check `styles.ts` before creating new styles
- Extract inline styles >3 lines
- Use spread to inherit from global styles
- Extract repeated values (`center`, `absolute`, etc.)
- See `ai_reports/REFACTORING_PREFERENCES.md` for details

---

## Development Workflow

### 1. Start Development

```bash
# Terminal 1: Start Amplify sandbox (backend)
npm run amplify:sandbox

# Terminal 2: Start Expo (frontend)
npm start

# Then press 'i' for iOS or 'a' for Android
```

### 2. Making Backend Changes

**Schema changes**:
1. Edit `amplify/data/resource.ts`
2. Sandbox will auto-detect and redeploy
3. `amplify_outputs.json` auto-updates

**Auth changes**:
1. Edit `amplify/auth/resource.ts`
2. Sandbox redeploys automatically

### 3. Environment Management

**Sandbox vs Production**:

```json
// In package.json scripts
"env:sandbox": "cp amplify_outputs.sandbox.json amplify_outputs.json",
"env:production": "cp amplify_outputs.production.json amplify_outputs.json"
```

**Usage**:
```bash
npm run env:sandbox    # Switch to sandbox backend
npm run env:production # Switch to production backend
```

### 4. Testing Workflow

```bash
# Run all tests
npm test

# Watch mode (during development)
npm run test:watch

# Coverage report
npm run test:coverage
```

**Test file location**:
- Unit tests: `__tests__/` directory
- Component tests: Alongside components in `__tests__/` subdirectory

### 5. Code Quality

```bash
# Format and lint
npx biome check --write

# Format only
npx biome format --write

# Lint only
npx biome lint
```

---

## Testing Setup

### Test Structure

**Controller tests** (`__tests__/controllers/c-user.test.ts`):

```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserQuery } from '../../src/controllers/c-user';

// Mock Amplify client
jest.mock('aws-amplify/data', () => ({
  generateClient: jest.fn(() => ({
    models: {
      User: {
        get: jest.fn(),
        list: jest.fn(),
        update: jest.fn(),
      },
    },
  })),
}));

describe('useUserQuery', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  it('fetches user successfully', async () => {
    const mockUser = {
      id: 'user1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    const { generateClient } = require('aws-amplify/data');
    const mockClient = generateClient();
    mockClient.models.User.get.mockResolvedValue({
      data: mockUser,
      errors: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useUserQuery('user1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toMatchObject({
      id: 'user1',
      fullName: 'John Doe',
    });
  });
});
```

**Component tests**:

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { UserCard } from '../../src/components/common/UserCard';

describe('UserCard', () => {
  it('renders user information', () => {
    const user = {
      id: 'user1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    };

    const { getByText } = render(<UserCard user={user} />);

    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('john@example.com')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const user = { id: 'user1', firstName: 'John' };

    const { getByTestId } = render(
      <UserCard user={user} onPress={onPress} />
    );

    fireEvent.press(getByTestId('user-card'));

    expect(onPress).toHaveBeenCalledWith(user);
  });
});
```

---

## Key Learnings & Best Practices

### 1. Amplify Gen 2 Best Practices

**Schema Design**:
- Use secondary indexes for queries (avoid table scans)
- Use `a.id()` for foreign keys
- Use `a.datetime()` for timestamps
- Add `deletedAt` for soft deletes

**Example GSI**:
```typescript
Contest: a
  .model({
    postId: a.id().required(),
    createdAt: a.datetime(),
  })
  .secondaryIndexes(index => [
    index('postId')
      .sortKeys(['createdAt'])
      .queryField('commentsByPostAndDate'),
  ])
```

**Authorization**:
- Start with `publicApiKey` for development
- Switch to `userPool` or custom auth for production
- Use field-level auth for sensitive data

### 2. React Query Patterns

**Query keys**:
```typescript
// Good: Hierarchical keys
['users']                    // List all users
['user', userId]            // Single user
['user', userId, 'posts']   // User's posts
```

**Invalidation**:
```typescript
// Invalidate all user queries
queryClient.invalidateQueries({ queryKey: ['user'] });

// Invalidate specific user
queryClient.invalidateQueries({ queryKey: ['user', userId] });
```

**Error handling**:
```typescript
const { data, error, isError } = useQuery({
  queryKey: ['user', userId],
  queryFn: fetchUser,
  retry: 3,  // Retry failed requests
  staleTime: 5 * 60 * 1000,  // 5 minutes
});

if (isError) {
  return <ErrorMessage error={error} />;
}
```

### 3. Performance Optimization

**React Query defaults**:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      gcTime: 10 * 60 * 1000,     // 10 minutes (formerly cacheTime)
      retry: 1,
    },
  },
});
```

**Memoization**:
```typescript
// Memoize expensive computations
const sortedUsers = useMemo(
  () => users.sort((a, b) => a.name.localeCompare(b.name)),
  [users]
);

// Memoize callbacks
const handlePress = useCallback(
  (user: MUser) => {
    navigation.navigate('UserDetail', { userId: user.id });
  },
  [navigation]
);
```

### 4. Common Pitfalls

❌ **Don't**:
```typescript
// Don't call hooks conditionally
if (condition) {
  useQuery(...);  // ERROR!
}

// Don't create styles in render
<View style={{ flex: 1, backgroundColor: 'red' }} />  // Re-created every render

// Don't forget React Query wrapper
<App />  // ERROR: QueryClient not provided
```

✅ **Do**:
```typescript
// Use enabled for conditional queries
useQuery({
  queryKey: ['user', userId],
  queryFn: fetchUser,
  enabled: !!userId,  // Only run if userId exists
});

// Extract styles
const containerStyle = { flex: 1, backgroundColor: 'red' };
<View style={containerStyle} />

// Wrap app in providers
<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

### 5. Git & Version Control

**.gitignore additions**:
```gitignore
# Amplify
amplify_outputs.json
amplify_outputs.*.json
.amplify/

# Expo
.expo/
dist/
web-build/

# React Native
.expo-shared/
ios/Pods/
ios/build/
android/build/
android/.gradle/

# Tests
coverage/

# Misc
.DS_Store
*.log
```

---

## Reference Documents

When working on the new project, refer back to these files from rivalry-club-expo:

1. **`ai_reports/REFACTORING_PREFERENCES.md`** - Code style and refactoring guidelines
2. **`biome.jsonc`** - Complete linter/formatter configuration
3. **`jest.setup.js`** - Test mocking patterns
4. **`CLAUDE.md`** - Project overview and conventions
5. **`amplify/data/resource.ts`** - GraphQL schema examples
6. **`src/models/`** - Model pattern examples
7. **`src/controllers/`** - Controller pattern examples
8. **`src/providers/`** - Provider pattern examples

---

## Quick Start Checklist

### Initial Setup
- [ ] Create Expo project with TypeScript
- [ ] Install all dependencies (core + dev)
- [ ] Copy `tsconfig.json`
- [ ] Copy `biome.jsonc`
- [ ] Copy `jest.config.js` and `jest.setup.js`
- [ ] Create `__mocks__/` directory with mock files
- [ ] Configure `app.json`

### Amplify Setup
- [ ] Create `amplify/` directory structure
- [ ] Create `backend.ts`, `auth/resource.ts`, `data/resource.ts`
- [ ] Run `npx ampx sandbox`
- [ ] Create `amplify-config.ts`
- [ ] Import config in `App.tsx`

### Project Structure
- [ ] Create `src/` directory structure
- [ ] Create `src/utils/styles.ts` and `colors.ts`
- [ ] Create `src/models/` directory
- [ ] Create `src/controllers/` directory
- [ ] Create `src/providers/` directory
- [ ] Create `ai_reports/` directory
- [ ] Copy `REFACTORING_PREFERENCES.md`

### First Components
- [ ] Create `App.tsx` with QueryClientProvider
- [ ] Create first model (e.g., `m-user.ts`)
- [ ] Create first controller (e.g., `c-user.ts`)
- [ ] Create first provider (e.g., `auth.tsx`)
- [ ] Write first test

### Documentation
- [ ] Create `CLAUDE.md` with project overview
- [ ] Document architecture decisions
- [ ] Create `ai_reports/index.md`

---

## Final Notes

This stack provides:
- ✅ Type-safe full-stack development
- ✅ Automatic GraphQL API generation
- ✅ Built-in authentication
- ✅ Optimistic updates via React Query
- ✅ File-based routing with Expo Router
- ✅ Hot reloading for rapid development
- ✅ Comprehensive testing setup
- ✅ Production-ready linting

The key to success is maintaining **consistency** across:
- File naming conventions
- Architectural patterns
- Testing approaches
- Code style (enforced by Biome)

Good luck building your new app! 🚀
