import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, SafeAreaView, Text, TouchableWithoutFeedback, View } from 'react-native';

import gameQuery from '../../../assets/cache/game-query.json';
import { darkStyles, lightStyles, styles } from '../../utils/styles';
import { s3Favicons } from '../../utils';
import { Button } from '../common/Button';
import { GameWithCharactersDisplay } from './GameWithCharactersDisplay';

// Temporary Game type - will be replaced with GraphQL type later
interface Game {
  id: string;
  name: string;
  fighters?: { items: Fighter[] };
}

interface Fighter {
  id: string;
  name: string;
  gamePosition?: number;
}

interface HomeProps {
  onEnterClick: (game: Game) => void;
}

export default function Home({ onEnterClick }: HomeProps) {
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    console.log('[Home] Home screen mounted! Logs are working.');
    // Load game data from cached query
    const loadedGames = gameQuery.data?.listGames?.items;
    if (loadedGames?.length) {
      setGames(loadedGames as Game[]);
    }
  }, []);

  const isDarkMode = true;

  if (!games.length) {
    return (
      <SafeAreaView
        style={[styles.container, isDarkMode ? darkStyles.container : lightStyles.container]}
      >
        <View className="flex-1 items-center justify-center">
          <Text className="text-white text-xl">Loading games...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, isDarkMode ? darkStyles.container : lightStyles.container]}
    >
      <View style={styles.viewUpper}>
        <TouchableWithoutFeedback onPress={() => onEnterClick(games[0])}>
          <Image
            style={styles.siteLogoImage}
            source={{
              uri: `${s3Favicons}/swords-144.png`
            }}
          />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={() => onEnterClick(games[0])}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Rivalry Club</Text>
          </View>
        </TouchableWithoutFeedback>
        <Button
          text="Enter"
          onPress={() => onEnterClick(games[0])}
          className="w-1/2"
          leftContent={
            <View className="mr-2">
              <FontAwesomeIcon icon="shuffle" color="white" />
            </View>
          }
        />
      </View>
      <View style={styles.viewLower}>
        <FlatList
          key="id"
          data={games}
          renderItem={({ item }) => <GameWithCharactersDisplay game={item} />}
        />
      </View>
    </SafeAreaView>
  );
}
