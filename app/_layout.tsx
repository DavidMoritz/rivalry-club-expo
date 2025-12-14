import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Amplify } from 'aws-amplify';
import { Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import outputs from '../amplify-config';
import { AllRivalriesProvider } from '../src/providers/all-rivalries';
import { GameProvider } from '../src/providers/game';
import { colors } from '../src/utils/colors';
import { preloadAssets } from '../src/utils/preload-assets';

const queryClient = new QueryClient();

// Configure Amplify immediately at module load time, BEFORE any React components render
// This prevents TurboModule crashes when components try to use AWS Amplify auth
// IMPORTANT: Do NOT configure Amplify at module load time in React Native!
// Amplify.configure calls native modules that aren't ready until after app initialization
// We'll configure it in RootLayout after a delay to ensure native modules are ready
let amplifyConfigured = false;

export default function RootLayout() {
  const [_assetsLoaded, setAssetsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initialize() {
      try {
        if (!amplifyConfigured) {
          Amplify.configure(outputs);
          amplifyConfigured = true;
          console.log('[RootLayout] Amplify configured successfully');
        }

        await preloadAssets();
        setAssetsLoaded(true);
        setIsReady(true);
      } catch (error) {
        console.error('[RootLayout] Initialization error:', error);
        setLoadingError(
          error instanceof Error ? error.message : 'Unknown error'
        );
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
      <View
        style={{
          flex: 1,
          backgroundColor: colors.black,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.white} size="large" />
        <Text style={{ color: colors.white, marginTop: 16, fontSize: 16 }}>
          Initializing...
        </Text>
      </View>
    );
  }

  if (loadingError) {
    console.warn(
      '[RootLayout] Assets failed to preload, but continuing anyway:',
      loadingError
    );
  }

  // Don't pass userId here - let RivalryIndex handle it with the correct user.id
  return (
    <QueryClientProvider client={queryClient}>
      <GameProvider game={null}>
        <AllRivalriesProvider>
          <Slot />
        </AllRivalriesProvider>
      </GameProvider>
    </QueryClientProvider>
  );
}
