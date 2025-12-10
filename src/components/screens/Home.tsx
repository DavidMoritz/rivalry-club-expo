import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
  SafeAreaView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

import gameQuery from '../../../assets/cache/game-query.json';
import { darkStyles, lightStyles, styles } from '../../utils/styles';
import { s3Favicons } from '../../utils';
import { Button } from '../common/Button';
import { GameWithCharactersDisplay } from './GameWithCharactersDisplay';
import { useAuthUser } from '../../hooks/useAuthUser';

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
  onHowToPlayClick?: () => void;
}

export default function Home({ onEnterClick, onHowToPlayClick }: HomeProps) {
  const [games, setGames] = useState<Game[]>([]);

  // Initialize user immediately on home screen (creates anonymous user in background)
  const { user } = useAuthUser();

  useEffect(() => {
    // Load game data from cached query
    const loadedGames = gameQuery.data?.listGames?.items;
    if (loadedGames?.length) {
      setGames(loadedGames as Game[]);
    }
  }, []);

  useEffect(() => {
    if (user) {
      console.log('[Home] User ready:', user.firstName, 'ID:', user.id);
    }
  }, [user]);

  const isDarkMode = true;

  if (!games.length) {
    return (
      <SafeAreaView
        style={[styles.container, isDarkMode ? darkStyles.container : lightStyles.container]}
      >
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: 'white', fontSize: 20 }}>Loading games...</Text>
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
          style={{ marginTop: 4, marginBottom: 8, width: '50%', paddingVertical: 0 }}
        />
      </View>
      <View style={styles.viewLower}>
        <FlatList
          key="id"
          data={games}
          renderItem={({ item }) => <GameWithCharactersDisplay game={item} />}
          ListFooterComponent={
            <View
              style={{
                paddingTop: 12,
                paddingBottom: 24,
                paddingHorizontal: 16,
                alignItems: 'center'
              }}
            >
              <Text style={{ color: '#999', fontSize: 17, textAlign: 'center' }}>
                Custom artwork provided by
              </Text>
              <TouchableOpacity
                onPress={() => Linking.openURL('https://www.deviantart.com/professorfandango')}
              >
                <Text style={{ color: '#60a5fa', fontSize: 17, textDecorationLine: 'underline' }}>
                  Professor Fandango
                </Text>
              </TouchableOpacity>

              {onHowToPlayClick && (
                <Button
                  text="How to Play"
                  onPress={onHowToPlayClick}
                  style={{ marginTop: 26, width: '60%', paddingVertical: 0 }}
                />
              )}
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
