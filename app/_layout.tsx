import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Amplify } from 'aws-amplify';
import { Slot } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import outputs from '../amplify_outputs.json';
import '../global.css';
import { preloadAssets } from '../src/utils/preloadAssets';

const queryClient = new QueryClient();

// Configure Amplify with the full outputs file
try {
  Amplify.configure(outputs);
} catch (configErr) {
  console.error('[App] Amplify.configure failed:', configErr);
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
