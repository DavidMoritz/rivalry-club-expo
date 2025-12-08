import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Amplify } from 'aws-amplify';
import Constants from 'expo-constants';
import { Slot } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import outputs from '../amplify_outputs.json';
import { preloadAssets } from '../src/utils/preloadAssets';

const queryClient = new QueryClient();

const isExpoGo = Constants.appOwnership === 'expo';

// Configure Amplify immediately at module load time, BEFORE any React components render
// This prevents TurboModule crashes when components try to use AWS Amplify auth
// IMPORTANT: Do NOT configure Amplify at module load time in React Native!
// Amplify.configure calls native modules that aren't ready until after app initialization
// We'll configure it in RootLayout after a delay to ensure native modules are ready
let amplifyConfigured = false;

export default function RootLayout() {
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initialize() {
      try {
        if (!amplifyConfigured) {
          console.log('[RootLayout] Configuring Amplify...');
          console.log('[RootLayout] Amplify outputs:', JSON.stringify(outputs, null, 2));

          try {
            Amplify.configure(outputs);
            amplifyConfigured = true;
            console.log('[RootLayout] Amplify configured successfully');
          } catch (amplifyError) {
            console.error('[RootLayout] Amplify configuration FAILED:', amplifyError);
            console.error('[RootLayout] Error details:', JSON.stringify(amplifyError, Object.getOwnPropertyNames(amplifyError)));
            throw amplifyError;
          }
        }

        await preloadAssets();
        setAssetsLoaded(true);
        setIsReady(true);
      } catch (error) {
        console.error('[RootLayout] Initialization error:', error);
        console.error('[RootLayout] Error stack:', error instanceof Error ? error.stack : 'No stack');
        setLoadingError(error instanceof Error ? error.message : 'Unknown error');
        // Still show the app even if initialization fails
        setAssetsLoaded(true);
        setIsReady(true);
      }
    }

    initialize();
  }, []);

  // Show loading screen until fully initialized
  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 16, fontSize: 16 }}>
          Initializing...
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
