import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Hub } from 'aws-amplify/utils';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { Access } from './src/components/screens/Access';
import { Auth } from './src/components/screens/Auth';
import Home from './src/components/screens/Home';
import { getCurrentUser } from './src/lib/amplify-auth';
import { AllRivalriesProvider } from './src/providers/all-rivalries';

const queryClient = new QueryClient();

// Temporary Game type - will be replaced with GraphQL type later
interface Game {
  id: string;
  name: string;
}

export default function App() {
  const [entering, setEntering] = useState<boolean>(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  function handleEnterClick(game: Game) {
    if (!game) return;

    setEntering(true);
    setSelectedGame(game);
  }

  if (!entering) {
    return (
      <>
        <Home onEnterClick={handleEnterClick} />
        <StatusBar style="light" />
      </>
    );
  }

  return <AuthenticatedApp selectedGame={selectedGame} />;
}

function AuthenticatedApp({ selectedGame }: { selectedGame: Game | null}) {
  const [userId, setUserId] = useState<string | undefined>(undefined);

  console.log('[App] AuthenticatedApp rendering - NO AUTH SCREEN, going straight to Access');

  // Listen for auth state changes from Cognito (optional - users start as anonymous)
  useEffect(() => {
    // Check initial session
    getCurrentUser()
      .then((user) => {
        setUserId(user.userId);
      })
      .catch(() => {
        // No Cognito session - user is anonymous, userId will be set by useAuthUser
      });

    // Subscribe to auth changes via Amplify Hub
    const hubListener = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          getCurrentUser().then((user) => setUserId(user.userId));
          break;
        case 'signedOut':
          setUserId(undefined);
          break;
      }
    });

    return () => hubListener();
  }, []);

  // No Auth screen - users start as anonymous and can optionally link accounts later
  return (
    <QueryClientProvider client={queryClient}>
      <AllRivalriesProvider userId={userId}>
        <Access selectedGame={selectedGame} />
      </AllRivalriesProvider>
      <StatusBar style="light" />
    </QueryClientProvider>
  );
}
