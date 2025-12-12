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
import { darkStyles, styles } from '../../utils/styles';
import { colors } from '../../utils/colors';
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

  return (
    <SafeAreaView style={[styles.container, darkStyles.container]}>
      <View style={viewUpperStyle}>
        <TouchableWithoutFeedback onPress={() => game && onEnterClick(game)}>
          <Image style={siteLogoImageStyle} source={require('../../../assets/icon-blank.png')} />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={() => game && onEnterClick(game)}>
          <View style={titleContainerStyle}>
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
      <View style={viewLowerStyle}>
        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 }}>
            <ActivityIndicator size="large" color={colors.blue400} />
            <Text style={{ color: colors.gray400, fontSize: 16, marginTop: 16 }}>
              Loading fighters...
            </Text>
          </View>
        ) : game ? (
          <GameWithCharactersDisplay game={game} onHowToPlayClick={onHowToPlayClick} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const siteLogoImageStyle = {
  alignSelf: 'center' as const,
  aspectRatio: 1,
  flex: 1,
  resizeMode: 'contain' as const
};

const titleContainerStyle = {
  alignItems: 'center' as const,
  bottom: 20,
  justifyContent: 'center' as const,
  position: 'absolute' as const,
  top: 0
};

const viewUpperStyle = {
  flex: 1,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  width: '100%' as const
};

const viewLowerStyle = {
  flex: 3
};

const lightStyles = {
  container: {
    backgroundColor: colors.gray50,
    color: colors.black
  }
};
