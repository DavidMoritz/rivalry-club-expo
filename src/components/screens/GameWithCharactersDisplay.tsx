import React, { useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  View
} from 'react-native';

import { logoImage } from '../../../assets/images/games/ssbu';
import { styles } from '../../utils/styles';
import { CharacterDisplay } from '../common/CharacterDisplay';

// Temporary types - will be replaced with GraphQL types later
interface Fighter {
  id: string;
  name: string;
  gamePosition?: number;
}

interface Game {
  id: string;
  name: string;
  fighters?: { items: (Fighter | null)[] };
}

interface GameWithCharactersDisplayProps {
  game: Game;
}

export function GameWithCharactersDisplay({
  game,
}: GameWithCharactersDisplayProps) {
  const [showFullImage, setShowFullImage] = useState(false);
  const screenWidth = Dimensions.get('window').width;

  return (
    <>
      <Pressable
        onLongPress={() => setShowFullImage(true)}
        delayLongPress={300}
      >
        <Image style={styles.gameLogoImage} source={logoImage} />
      </Pressable>

      <Modal
        visible={showFullImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullImage(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          onPress={() => setShowFullImage(false)}
        >
          <Image
            style={{
              width: screenWidth,
              height: screenWidth,
              resizeMode: 'contain'
            }}
            source={logoImage}
          />
        </Pressable>
      </Modal>

      <FlatList
        key="id"
        data={game.fighters?.items || []}
        renderItem={({ item }) => item && <CharacterDisplay fighter={item} />}
        style={styles.fightersContainer}
        numColumns={3}
        keyExtractor={(item) => item?.id || ''}
      />
    </>
  );
}
