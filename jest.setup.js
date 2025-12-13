// Import @testing-library/jest-native matchers for enhanced assertions
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
jest.mock('@react-native-community/netinfo');
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
