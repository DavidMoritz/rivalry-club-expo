import { useEffect, useState } from 'react';
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
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useGame } from '../../providers/game';
import { colors } from '../../utils/colors';
import { center, darkStyles, styles } from '../../utils/styles';
import { Button } from '../common/Button';
import { OfflineModal } from '../common/OfflineModal';
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

  // Network status detection
  const { isConnected, hasShownOfflineModal, setHasShownOfflineModal } =
    useNetworkStatus();
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  // Show offline modal when app opens without connection (only once per disconnection)
  useEffect(() => {
    if (!isConnected && !hasShownOfflineModal) {
      setShowOfflineModal(true);
      setHasShownOfflineModal(true);
    }
    // Close modal when connection is restored
    if (isConnected) {
      setShowOfflineModal(false);
    }
  }, [isConnected, hasShownOfflineModal, setHasShownOfflineModal]);

  return (
    <SafeAreaView style={[styles.container, darkStyles.container]}>
      <OfflineModal
        onClose={() => setShowOfflineModal(false)}
        visible={showOfflineModal}
      />
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
          style={enterButtonStyle}
          text="Enter"
        />
      </View>
      {!game && <Image source={logoImage} style={styles.gameLogoImage} />}
      <View style={viewLowerStyle}>
        {isLoading && (
          <View style={loadingContainerStyle}>
            <ActivityIndicator color={colors.blue400} size="large" />
            <Text style={loadingTextStyle}>Loading fighters...</Text>
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

const enterButtonStyle = {
  marginTop: 4,
  marginBottom: 8,
  width: '50%' as const,
  paddingVertical: 0,
};

const loadingContainerStyle = {
  flex: 1,
  alignItems: center,
  justifyContent: center,
  paddingTop: 40,
};

const loadingTextStyle = {
  color: colors.gray400,
  fontSize: 16,
  marginTop: 16,
};

const siteLogoImageStyle = {
  alignSelf: center,
  aspectRatio: 1,
  flex: 1,
  resizeMode: 'contain' as const,
};

const titleContainerStyle = {
  alignItems: center,
  bottom: 20,
  justifyContent: center,
  position: 'absolute' as const,
  top: 0,
};

const viewUpperStyle = {
  flex: 1,
  alignItems: center,
  justifyContent: 'space-between' as const,
  width: '100%' as const,
};

const viewLowerStyle = {
  flex: 3,
};
