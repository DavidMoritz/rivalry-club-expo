import { library } from '@fortawesome/fontawesome-svg-core';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Text, View } from 'react-native';

import './global.css';
import Home from './src/components/screens/Home';
import { iconsInProject } from './src/utils/icons';

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
    if (!game) return;

    setEntering(true);
    setSelectedGame(game);
  }

  return entering ? (
    // This will eventually show the authenticated app with navigation
    <View className="flex-1 bg-black items-center justify-center">
      <Text className="text-white text-2xl font-bold">
        {selectedGame?.name || 'Rivalry Club'}
      </Text>
      <Text className="text-gray-400 mt-4">
        Authentication and main app coming soon!
      </Text>
      <StatusBar style="light" />
    </View>
  ) : (
    <>
      <Home onEnterClick={handleEnterClick} />
      <StatusBar style="light" />
    </>
  );
}
