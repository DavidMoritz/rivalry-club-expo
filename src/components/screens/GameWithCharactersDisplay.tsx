import React from 'react';
import { FlatList, Image, Linking, Text, TouchableOpacity, View } from 'react-native';

import { logoImage } from '../../../assets/images/games/ssbu';
import { styles } from '../../utils/styles';
import { CharacterDisplay } from '../common/CharacterDisplay';
import { Button } from '../common/Button';

// Temporary types - will be replaced with GraphQL types later
interface Fighter {
  id: string;
  name: string;
  gamePosition?: number;
  winCount?: number | null;
  contestCount?: number | null;
  rank?: number;
}

interface Game {
  id: string;
  name: string;
  fighters?: { items: (Fighter | null)[] };
}

interface GameWithCharactersDisplayProps {
  game: Game;
  onHowToPlayClick?: () => void;
}

export function GameWithCharactersDisplay({
  game,
  onHowToPlayClick
}: GameWithCharactersDisplayProps) {
  // Log game data to verify stats are present
  React.useEffect(() => {
    if (game?.fighters?.items && game.fighters.items.length > 0) {
      const firstFighter = game.fighters.items[0];
    }
  }, [game]);

  return (
    <>
      <FlatList
        key="id"
        data={game.fighters?.items || []}
        renderItem={({ item }) => item && <CharacterDisplay fighter={item} />}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        numColumns={3}
        columnWrapperStyle={{ justifyContent: 'space-evenly' }}
        keyExtractor={(item) => item?.id || ''}
        ListHeaderComponent={<Image style={styles.gameLogoImage} source={logoImage} />}
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
    </>
  );
}
