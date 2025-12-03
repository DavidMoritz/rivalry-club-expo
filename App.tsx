import { Authenticator, ThemeProvider } from '@aws-amplify/ui-react-native';
import { library } from '@fortawesome/fontawesome-svg-core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Amplify } from 'aws-amplify';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';

import outputs from './amplify_outputs.json';
import './global.css';
import { AuthenticatorHeader } from './src/components/common/AuthenticatorHeader';
import { Access } from './src/components/screens/Access';
import Home from './src/components/screens/Home';
import { iconsInProject } from './src/utils/icons';

const queryClient = new QueryClient();

// Configure Amplify
Amplify.configure(outputs);
console.log('[App] Amplify configured with auth:', outputs.auth ? 'YES' : 'NO');
console.log('[App] Amplify configured with data:', outputs.data ? 'YES' : 'NO');

// Register FontAwesome icons
// @ts-ignore - FontAwesome type mismatch between packages
library.add(...iconsInProject);

// Temporary Game type - will be replaced with GraphQL type later
interface Game {
  id: string;
  name: string;
}

export default function App() {
  const [entering, setEntering] = useState<boolean>(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  function handleEnterClick(game: Game) {
    console.log('[App] Enter button clicked for game:', game.name);
    if (!game) return;

    setEntering(true);
    setSelectedGame(game);
    console.log('[App] State updated - entering:', true, 'selectedGame:', game.name);
  }

  console.log('[App] Rendering - entering:', entering, 'selectedGame:', selectedGame?.name);

  return entering ? (
    <Authenticator.Provider>
      <ThemeProvider>
        <Authenticator
          Header={AuthenticatorHeader}
          signUpAttributes={['email']}
        >
          {({ user: authUser }) => {
            console.log('[App] Authenticator rendered with user:', authUser?.username);
            return (
              <QueryClientProvider client={queryClient}>
                <Access selectedGame={selectedGame} />
                <StatusBar style="light" />
              </QueryClientProvider>
            );
          }}
        </Authenticator>
      </ThemeProvider>
    </Authenticator.Provider>
  ) : (
    <>
      <Home onEnterClick={handleEnterClick} />
      <StatusBar style="light" />
    </>
  );
}
