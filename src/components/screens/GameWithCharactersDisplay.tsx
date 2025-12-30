import { FlatList, Image, Linking, Text, TouchableOpacity, View } from 'react-native';

import { logoImage } from '../../../assets/images/games/ssbu';
import type { MFighter } from '../../models/m-fighter';
import type { MGame } from '../../models/m-game';
import { colors } from '../../utils/colors';
import { center, styles } from '../../utils/styles';
import { Button } from '../common/Button';
import { CharacterDisplay } from '../common/CharacterDisplay';

interface GameWithCharactersDisplayProps {
  game: MGame;
  onHowToPlayClick?: () => void;
}

export function GameWithCharactersDisplay({
  game,
  onHowToPlayClick
}: GameWithCharactersDisplayProps) {
  // Cast fighters to access items (LazyLoader type)
  const fighters = (game.fighters as { items?: MFighter[] } | undefined)?.items ?? [];

  return (
    <FlatList
      columnWrapperStyle={columnWrapperStyle}
      contentContainerStyle={contentContainerStyle}
      data={fighters}
      key="id"
      keyExtractor={(item) => item?.id || ''}
      ListFooterComponent={
        <View style={footerContainerStyle}>
          <Text style={creditsTextStyle}>Custom artwork provided by</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://www.deviantart.com/professorfandango')}
          >
            <Text style={linkTextStyle}>Professor Fandango</Text>
          </TouchableOpacity>

          {onHowToPlayClick && (
            <Button
              onPress={onHowToPlayClick}
              style={buttonStyle}
              text="How to Play"
            />
          )}
        </View>
      }
      ListHeaderComponent={<Image source={logoImage} style={styles.gameLogoImage} />}
      numColumns={3}
      renderItem={({ item }) => item && <CharacterDisplay fighter={item as MFighter} />}
      style={containerStyle}
    />
  );
}

const columnWrapperStyle = {
  justifyContent: 'space-evenly' as const
};

const contentContainerStyle = {
  flexGrow: 1
};

const containerStyle = {
  flex: 1
};

const footerContainerStyle = {
  paddingTop: 12,
  paddingBottom: 24,
  paddingHorizontal: 16,
  alignItems: center
};

const creditsTextStyle = {
  color: colors.gray400,
  fontSize: 17,
  textAlign: center
};

const linkTextStyle = {
  color: colors.blue400,
  fontSize: 17,
  textDecorationLine: 'underline' as const
};

const buttonStyle = {
  marginTop: 26,
  width: '60%' as const,
  paddingVertical: 0
};
