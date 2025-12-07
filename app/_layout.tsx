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

export default function RootLayout() {
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [amplifyConfigured, setAmplifyConfigured] = useState(false);
  const [amplifyError, setAmplifyError] = useState<string | null>(null);

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

  // Configure Amplify synchronously on mount to avoid race conditions with hooks
  useEffect(() => {
    if (!amplifyConfigured) {
      try {
        console.log('[RootLayout] Configuring Amplify...');
        Amplify.configure(outputs);
        console.log('[RootLayout] Amplify configured successfully');
        setAmplifyConfigured(true);
      } catch (configErr) {
        const errorMsg = configErr instanceof Error ? configErr.message : 'Unknown error';
        console.error('[RootLayout] Amplify.configure failed:', errorMsg);
        setAmplifyError(errorMsg);
        // Set as configured even on error to prevent infinite loading
        // In Expo Go mode, auth will be bypassed anyway
        setAmplifyConfigured(true);
      }
    }
  }, [amplifyConfigured]);

  // Show loading screen while assets or Amplify are loading
  if (!assetsLoaded || !amplifyConfigured) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 16, fontSize: 16 }}>
          {!assetsLoaded ? 'Loading assets...' : 'Initializing...'}
        </Text>
      </View>
    );
  }

  if (loadingError) {
    console.warn('[RootLayout] Assets failed to preload, but continuing anyway:', loadingError);
  }

  if (amplifyError) {
    console.warn('[RootLayout] Amplify configuration had errors, but continuing:', amplifyError);
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Slot />
    </QueryClientProvider>
  );
}
