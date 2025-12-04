import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo } from 'react';

import { ConnectedRivalryView } from '../../src/components/screens/ConnectedRivalryView';
import { getMRivalry } from '../../src/models/m-rivalry';
import { GameProvider } from '../../src/providers/game';
import { RivalryProvider, useRivalry } from '../../src/providers/rivalry';

export default function RivalryDetailRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rivalryId = params.id as string;

  // Create a minimal rivalry object to initialize the provider
  // The actual data will be loaded by useRivalryWithAllInfoQuery in ConnectedRivalryView
  const initialRivalry = useMemo(() => {
    console.log('[RivalryDetailRoute] Creating initial rivalry for ID:', rivalryId);

    if (!rivalryId) {
      console.log('[RivalryDetailRoute] No rivalry ID provided');

      return null;
    }

    const rivalry = getMRivalry({ rivalry: { id: rivalryId } as any });
    console.log('[RivalryDetailRoute] Created rivalry:', rivalry.displayTitle());

    return rivalry;
  }, [rivalryId]);

  // Create navigation object compatible with ConnectedRivalryView
  // Adapted to use Expo Router instead of React Navigation
  const navigation = {
    navigate: (screen: string) => {
      // Map old screen names to new routes
      if (screen === 'RivalryTiersView') {
        router.push(`/rivalry/${rivalryId}/tiers`);
      } else if (screen === 'ContestHistory') {
        router.push(`/rivalry/${rivalryId}/history`);
      }
    },
    setOptions: (_options: { title?: string; headerTitle?: string }) => {
      // In Expo Router, we can use Stack.Screen to set options
      // For now, we'll handle this with Stack.Screen below
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <RivalryProvider rivalry={initialRivalry}>
        <GameProviderWrapper navigation={navigation} />
      </RivalryProvider>
      <StatusBar style="light" />
    </>
  );
}

// Wrapper component to provide game context from rivalry
function GameProviderWrapper({ navigation }: { navigation: any }) {
  const rivalry = useRivalry();

  return (
    <GameProvider value={rivalry?.game || null}>
      <ConnectedRivalryView navigation={navigation} />
    </GameProvider>
  );
}
