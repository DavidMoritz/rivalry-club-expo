import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo } from 'react';

import gameQuery from '../../assets/cache/game-query.json';
import { HamburgerMenu } from '../../src/components/common/HamburgerMenu';
import { ConnectedRivalryView } from '../../src/components/screens/ConnectedRivalryView';
import { getMGame } from '../../src/models/m-game';
import { getMRivalry } from '../../src/models/m-rivalry';
import { GameProvider } from '../../src/providers/game';
import { RivalryProvider } from '../../src/providers/rivalry';

export default function RivalryDetailRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rivalryId = params.id as string;
  const userAName = params.userAName as string | undefined;
  const userBName = params.userBName as string | undefined;
  const userId = params.userId as string | undefined;
  console.log('[Rivalry] USER:', userId);

  // Load game from cache - since there's only one game in the DB
  const game = useMemo(() => {
    const games = gameQuery.data?.listGames?.items;
    if (games && games.length > 0) {
      return getMGame(games[0] as any);
    }

    return null;
  }, []);

  // Create a minimal rivalry object to initialize the provider
  // The actual data will be loaded by useRivalryWithAllInfoQuery in ConnectedRivalryView
  const initialRivalry = useMemo(() => {
    if (!rivalryId) {
      console.warn('[RivalryDetailRoute] No rivalry ID provided');

      return null;
    }

    const rivalry = getMRivalry({ rivalry: { id: rivalryId } as any });

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
          params: { userId, userAName, userBName }
        });
      } else if (screen === 'ContestHistory') {
        router.push({
          pathname: `/rivalry/${rivalryId}/history`,
          params: { userId, userAName, userBName }
        });
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
      <RivalryProvider
        rivalry={initialRivalry}
        userAName={userAName}
        userBName={userBName}
        userId={userId}
      >
        <GameProviderWrapper navigation={navigation} game={game} />
        <HamburgerMenu />
      </RivalryProvider>
      <StatusBar style="light" />
    </>
  );
}

// Wrapper component to provide game context
function GameProviderWrapper({ navigation, game }: { navigation: any; game: any }) {
  return (
    <GameProvider value={game}>
      <ConnectedRivalryView navigation={navigation} />
    </GameProvider>
  );
}
