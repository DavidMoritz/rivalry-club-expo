import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';
import { fighterImages } from './index';
import { getCharacterZoomStyle } from './useCharacterZoom';

interface CharacterFaceProps {
  characterKey: string;
  size?: number;
  style?: ViewStyle;
}

/**
 * Component that displays a zoomed-in view of a character's face
 *
 * @example
 * <CharacterFace characterKey="mario" size={100} />
 */
export const CharacterFace: React.FC<CharacterFaceProps> = ({
  characterKey,
  size = 100,
  style,
}) => {
  const imageSource = fighterImages[characterKey];
  const zoomStyle = getCharacterZoomStyle(characterKey, size);

  if (!imageSource) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
        style,
      ]}
    >
      <Image
        source={imageSource}
        style={[styles.image, zoomStyle]}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#666',
  },
  image: {
    position: 'absolute',
  },
});

/**
 * Example usage component showing multiple character faces
 */
export const CharacterFaceGrid: React.FC = () => {
  const characters = [
    'mario',
    'link',
    'samus',
    'dark_samus',
    'yoshi',
    'kirby',
    'fox',
    'pikachu',
    'donkey_kong',
  ];

  return (
    <View style={gridStyles.container}>
      {characters.map((char) => (
        <CharacterFace key={char} characterKey={char} size={120} style={gridStyles.face} />
      ))}
    </View>
  );
};

const gridStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  face: {
    margin: 8,
  },
});
