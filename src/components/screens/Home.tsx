import React from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  Text,
  TouchableWithoutFeedback,
  View
} from 'react-native';

import { logoImage } from '../../../assets/images/games/ssbu';
import { darkStyles, lightStyles, styles } from '../../utils/styles';
import { s3Favicons } from '../../utils';
import { Button } from '../common/Button';
import { GameWithCharactersDisplay } from './GameWithCharactersDisplay';
import { useAuthUser } from '../../hooks/useAuthUser';
import { useGame } from '../../providers/game';

interface Game {
  id: string;
  name: string;
}

interface HomeProps {
  onEnterClick: (game: Game) => void;
  onHowToPlayClick?: () => void;
}

export default function Home({ onEnterClick, onHowToPlayClick }: HomeProps) {
  // Initialize user immediately on home screen (creates anonymous user in background)
  const { user } = useAuthUser();

  // Get game from global GameProvider (fetched automatically by provider)
  const game = useGame();
  const isLoading = !game;

  const isDarkMode = true;

  return (
    <SafeAreaView
      style={[styles.container, isDarkMode ? darkStyles.container : lightStyles.container]}
    >
      <View style={styles.viewUpper}>
        <TouchableWithoutFeedback onPress={() => game && onEnterClick(game)}>
          <Image
            style={styles.siteLogoImage}
            source={{
              uri: `${s3Favicons}/swords-144.png`
            }}
          />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={() => game && onEnterClick(game)}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Rivalry Club</Text>
          </View>
        </TouchableWithoutFeedback>
        <Button
          text="Enter"
          onPress={() => game && onEnterClick(game)}
          style={{ marginTop: 4, marginBottom: 8, width: '50%', paddingVertical: 0 }}
        />
      </View>
      {!game && <Image style={styles.gameLogoImage} source={logoImage} />}
      <View style={styles.viewLower}>
        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 }}>
            <ActivityIndicator size="large" color="#60a5fa" />
            <Text style={{ color: '#999', fontSize: 16, marginTop: 16 }}>Loading fighters...</Text>
          </View>
        ) : game ? (
          <GameWithCharactersDisplay game={game} onHowToPlayClick={onHowToPlayClick} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}
