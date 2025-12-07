// Import @testing-library/jest-native matchers for enhanced assertions
import '@testing-library/jest-native/extend-expect';

// Mock react-native-worklets to avoid Babel plugin issues
jest.mock('react-native-worklets', () => ({
  useSharedValue: jest.fn((value) => ({ value })),
  useAnimatedStyle: jest.fn((fn) => fn()),
  withTiming: jest.fn((value) => value),
  withSpring: jest.fn((value) => value),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Expo modules
jest.mock('expo-secure-store');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');
jest.mock('expo-status-bar');

// Mock Expo winter runtime
global.__ExpoImportMetaRegistry = {
  add: jest.fn(),
  get: jest.fn(),
};

// Polyfill structuredClone for tests
global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));

// Mock SafeAreaView
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  SafeAreaProvider: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock NativeWind
jest.mock('nativewind', () => ({
  styled: (component) => component,
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

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
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
