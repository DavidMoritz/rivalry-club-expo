import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import outputs from './amplify_outputs.json';
import './global.css';
import { Access } from './src/components/screens/Access';
import { Auth } from './src/components/screens/Auth';
import Home from './src/components/screens/Home';
import { supabase } from './src/lib/supabase';

const queryClient = new QueryClient();

// Configure Amplify with the full outputs file
// We're using Supabase for auth, but Amplify for the GraphQL API
try {
  Amplify.configure(outputs);
} catch (configErr) {
  console.error('[App] Amplify.configure failed:', configErr);
}

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

function AuthenticatedApp({ selectedGame }: { selectedGame: Game | null }) {
  const [authenticated, setAuthenticated] = useState(false);

  // Listen for auth state changes from Supabase
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthenticated(!!session);
    });

    // Subscribe to auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!authenticated) {
    return (
      <>
        <Auth onAuthSuccess={() => setAuthenticated(true)} />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Access selectedGame={selectedGame} />
      <StatusBar style="light" />
    </QueryClientProvider>
  );
}
