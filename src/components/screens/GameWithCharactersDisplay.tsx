import React from 'react';
import { FlatList, Image } from 'react-native';

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
  return (
    <>
      <Image style={styles.gameLogoImage} source={logoImage} />
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
