import { library } from '@fortawesome/fontawesome-svg-core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Amplify } from 'aws-amplify';
import { Slot } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect } from 'react';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import outputs from '../amplify_outputs.json';
import '../global.css';
import { iconsInProject } from '../src/utils/icons';

const queryClient = new QueryClient();

// Configure custom storage adapter for Expo
const storage = {
  async setItem(key: string, value: string) {
    await SecureStore.setItemAsync(key, value);
  },
  async getItem(key: string) {
    return await SecureStore.getItemAsync(key);
  },
  async removeItem(key: string) {
    await SecureStore.deleteItemAsync(key);
  },
  async clear() {
    // SecureStore doesn't have a clear all method
    // This is a limitation but shouldn't cause issues
  }
};

// Configure Amplify with the full outputs file
try {
  Amplify.configure(outputs);
} catch (configErr) {
  console.error('[App] Amplify.configure failed:', configErr);
}

// Test storage
(async () => {
  try {
    await storage.setItem('test-key', 'test-value');
    const value = await storage.getItem('test-key');
    console.log('[App] Storage test:', value === 'test-value' ? 'PASSED' : 'FAILED');
    await storage.removeItem('test-key');
  } catch (storageErr) {
    console.error('[App] Storage test failed:', storageErr);
  }
})();

// Register FontAwesome icons
// @ts-ignore - FontAwesome type mismatch between packages
library.add(...iconsInProject);

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Slot />
    </QueryClientProvider>
  );
}
