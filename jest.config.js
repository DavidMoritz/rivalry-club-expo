process.env.REANIMATED_JEST_SKIP_WORKLETS = '1';

module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  testTimeout: 10000, // Increased from default 5000ms for async React Query tests
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
    '!src/custom-api.ts',
  ],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '.*\\.debug\\.test\\.(ts|tsx)$', // Exclude debug tests from normal runs
  ],
  moduleNameMapper: {
    // Mock static assets
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
    '\\.(css)$': '<rootDir>/__mocks__/styleMock.js',
    // Mock react-native-reanimated
    '^react-native-reanimated$': '<rootDir>/__mocks__/react-native-reanimated.js',
  },
};
