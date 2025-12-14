import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { logoImage } from '../../../assets/images/games/ssbu';
import { useAuthUser } from '../../hooks/useAuthUser';
import { useGame } from '../../providers/game';
import { colors } from '../../utils/colors';
import { darkStyles, styles } from '../../utils/styles';
import { Button } from '../common/Button';
import { GameWithCharactersDisplay } from './GameWithCharactersDisplay';

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
  useAuthUser();

  // Get game from global GameProvider (fetched automatically by provider)
  const game = useGame();
  const isLoading = !game;

  return (
    <SafeAreaView style={[styles.container, darkStyles.container]}>
      <View style={viewUpperStyle}>
        <TouchableWithoutFeedback onPress={() => game && onEnterClick(game)}>
          <Image
            source={require('../../../assets/icon-blank.png')}
            style={siteLogoImageStyle}
          />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={() => game && onEnterClick(game)}>
          <View style={titleContainerStyle}>
            <Text style={styles.title}>Rivalry Club</Text>
          </View>
        </TouchableWithoutFeedback>
        <Button
          onPress={() => game && onEnterClick(game)}
          style={{
            marginTop: 4,
            marginBottom: 8,
            width: '50%',
            paddingVertical: 0,
          }}
          text="Enter"
        />
      </View>
      {!game && <Image source={logoImage} style={styles.gameLogoImage} />}
      <View style={viewLowerStyle}>
        {isLoading && (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 40,
            }}
          >
            <ActivityIndicator color={colors.blue400} size="large" />
            <Text
              style={{ color: colors.gray400, fontSize: 16, marginTop: 16 }}
            >
              Loading fighters...
            </Text>
          </View>
        )}
        {game && (
          <GameWithCharactersDisplay
            game={game}
            onHowToPlayClick={onHowToPlayClick}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const siteLogoImageStyle = {
  alignSelf: 'center' as const,
  aspectRatio: 1,
  flex: 1,
  resizeMode: 'contain' as const,
};

const titleContainerStyle = {
  alignItems: 'center' as const,
  bottom: 20,
  justifyContent: 'center' as const,
  position: 'absolute' as const,
  top: 0,
};

const viewUpperStyle = {
  flex: 1,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  width: '100%' as const,
};

const viewLowerStyle = {
  flex: 3,
};
