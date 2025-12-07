import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Amplify } from 'aws-amplify';
import Constants from 'expo-constants';
import { Slot } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import outputs from '../amplify_outputs.json';
import '../global.css';
import { preloadAssets } from '../src/utils/preloadAssets';

const queryClient = new QueryClient();

const isExpoGo = Constants.appOwnership === 'expo';

// Configure Amplify immediately at module load time, BEFORE any React components render
// This prevents TurboModule crashes when components try to use AWS Amplify auth
try {
  console.log('[_layout module] Configuring Amplify at module load...');
  Amplify.configure(outputs);
  console.log('[_layout module] Amplify configured successfully');
} catch (err) {
  console.error('[_layout module] Amplify configuration failed:', err);
  // In Expo Go mode, this might fail but auth will be bypassed anyway
}

export default function RootLayout() {
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAssets() {
      try {
        await preloadAssets();
        setAssetsLoaded(true);
      } catch (error) {
        console.error('[RootLayout] Error preloading assets:', error);
        setLoadingError(error instanceof Error ? error.message : 'Unknown error');
        // Still show the app even if preloading fails
        setAssetsLoaded(true);
      }
    }

    loadAssets();
  }, []);

  // Show loading screen while assets load
  if (!assetsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 16, fontSize: 16 }}>
          Loading assets...
        </Text>
      </View>
    );
  }

  if (loadingError) {
    console.warn('[RootLayout] Assets failed to preload, but continuing anyway:', loadingError);
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Slot />
    </QueryClientProvider>
  );
}
