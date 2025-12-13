import React from 'react';
import {
  FlatList,
  Image,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { logoImage } from '../../../assets/images/games/ssbu';
import type { MFighter } from '../../models/m-fighter';
import type { MGame } from '../../models/m-game';
import { colors } from '../../utils/colors';
import { styles } from '../../utils/styles';
import { Button } from '../common/Button';
import { CharacterDisplay } from '../common/CharacterDisplay';

interface GameWithCharactersDisplayProps {
  game: MGame;
  onHowToPlayClick?: () => void;
}

export function GameWithCharactersDisplay({
  game,
  onHowToPlayClick,
}: GameWithCharactersDisplayProps) {
  // Cast fighters to access items (LazyLoader type)
  const fighters = (game.fighters as any)?.items || [];

  return (
    <>
      <FlatList
        columnWrapperStyle={{ justifyContent: 'space-evenly' }}
        contentContainerStyle={{ flexGrow: 1 }}
        data={fighters}
        key="id"
        keyExtractor={item => item?.id || ''}
        ListFooterComponent={
          <View
            style={{
              paddingTop: 12,
              paddingBottom: 24,
              paddingHorizontal: 16,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: colors.gray400,
                fontSize: 17,
                textAlign: 'center',
              }}
            >
              Custom artwork provided by
            </Text>
            <TouchableOpacity
              onPress={() =>
                Linking.openURL('https://www.deviantart.com/professorfandango')
              }
            >
              <Text
                style={{
                  color: colors.blue400,
                  fontSize: 17,
                  textDecorationLine: 'underline',
                }}
              >
                Professor Fandango
              </Text>
            </TouchableOpacity>

            {onHowToPlayClick && (
              <Button
                onPress={onHowToPlayClick}
                style={{ marginTop: 26, width: '60%', paddingVertical: 0 }}
                text="How to Play"
              />
            )}
          </View>
        }
        ListHeaderComponent={
          <Image source={logoImage} style={styles.gameLogoImage} />
        }
        numColumns={3}
        renderItem={({ item }) =>
          item && <CharacterDisplay fighter={item as MFighter} />
        }
        style={{ flex: 1 }}
      />
    </>
  );
}
