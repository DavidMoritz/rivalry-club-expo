import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { useState } from 'react';
import {
  FlatList,
  Image,
  SafeAreaView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { darkStyles, lightStyles, styles } from '../../utils/styles';
import { s3Favicons } from '../../utils';
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
  // For now, we'll use mock data. This will be replaced with GraphQL query later
  const [games] = useState<Game[]>([
    {
      id: '1',
      name: 'Super Smash Bros. Ultimate',
      fighters: { items: [] },
    },
  ]);

  const isDarkMode = true;

  // Note: This will use 'shuffle' icon since we don't have Pro 'swords' icon yet
  const buttonIcon = <FontAwesomeIcon icon="shuffle" color="white" />;

  return (
    <SafeAreaView
      style={[
        styles.container,
        isDarkMode ? darkStyles.container : lightStyles.container,
      ]}>
      <View style={styles.viewUpper}>
        <TouchableWithoutFeedback onPress={() => onEnterClick(games[0])}>
          <Image
            style={styles.siteLogoImage}
            source={{
              uri: `${s3Favicons}/swords-144.png`,
            }}
          />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={() => onEnterClick(games[0])}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Rivalry Club</Text>
          </View>
        </TouchableWithoutFeedback>
        <TouchableOpacity
          onPress={() => onEnterClick(games[0])}
          className="self-center w-1/2 my-2 text-center bg-purple-900 border rounded-full border-slate-300 h-9">
          <View className="flex-row items-center justify-center">
            {buttonIcon}
            <Text className="mt-1 ml-4 text-lg text-white">Enter</Text>
          </View>
        </TouchableOpacity>
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
