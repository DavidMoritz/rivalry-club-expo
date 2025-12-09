import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

import Home from '../src/components/screens/Home';

interface Game {
  id: string;
  name: string;
}

export default function IndexRoute() {
  const router = useRouter();

  function handleEnterClick(game: Game) {
    if (!game) return;

    // Navigate to auth screen with game data
    router.push({
      pathname: '/auth',
      params: { gameId: game.id, gameName: game.name }
    });
  }

  function handleHowToPlayClick() {
    router.push('/how-to-play');
  }

  return (
    <>
      <Home onEnterClick={handleEnterClick} onHowToPlayClick={handleHowToPlayClick} />
      <StatusBar style="light" />
    </>
  );
}
