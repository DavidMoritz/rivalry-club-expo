module.exports = function (api) {
  api.cache(true);

  const isTest = process.env.NODE_ENV === 'test';

  return {
    presets: ['babel-preset-expo'],
    plugins: isTest
      ? [
          // Disable worklets plugin in test environment
        ]
      : [],
    env: {
      test: {
        plugins: [
          // Override to disable worklets in tests
          ['react-native-worklets/plugin', { enabled: false }],
        ],
      },
    },
  };
};
