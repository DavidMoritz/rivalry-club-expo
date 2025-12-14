import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';

import type { Schema } from '../../amplify/data/resource';
import { HamburgerMenu } from '../../src/components/common/HamburgerMenu';
import { ConnectedRivalryView } from '../../src/components/screens/ConnectedRivalryView';
import { getMRivalry } from '../../src/models/m-rivalry';
import { RivalryProvider } from '../../src/providers/rivalry';

export default function RivalryDetailRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rivalryId = params.id as string;
  const userAName = params.userAName as string | undefined;
  const userBName = params.userBName as string | undefined;
  const userId = params.userId as string | undefined;

  // Create a minimal rivalry object to initialize the provider
  // The actual data will be loaded by useRivalryWithAllInfoQuery in ConnectedRivalryView
  const initialRivalry = useMemo(() => {
    if (!rivalryId) {
      console.warn('[RivalryDetailRoute] No rivalry ID provided');

      return null;
    }

    const rivalry = getMRivalry({
      rivalry: { id: rivalryId } as unknown as Schema['Rivalry']['type'],
    });

    return rivalry;
  }, [rivalryId]);

  // Create navigation object compatible with ConnectedRivalryView
  // Adapted to use Expo Router instead of React Navigation
  const navigation = {
    navigate: (screen: string) => {
      // Map old screen names to new routes
      if (screen === 'RivalryTiersView') {
        router.push({
          pathname: `/rivalry/${rivalryId}/tiers`,
          params: { userId, userAName, userBName },
        });
      } else if (screen === 'ContestHistory') {
        router.push({
          pathname: `/rivalry/${rivalryId}/history`,
          params: { userId, userAName, userBName },
        });
      }
    },
    setOptions: (_options: { title?: string; headerTitle?: string }) => {
      // In Expo Router, we can use Stack.Screen to set options
      // For now, we'll handle this with Stack.Screen below
    },
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <RivalryProvider
        rivalry={initialRivalry}
        userAName={userAName}
        userBName={userBName}
        userId={userId}
      >
        <ConnectedRivalryView navigation={navigation} />
        <HamburgerMenu />
      </RivalryProvider>
      <StatusBar style="light" />
    </>
  );
}
