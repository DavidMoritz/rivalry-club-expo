import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';
import { fighterImages } from './index';
import { getCharacterZoomStyle } from './useCharacterZoom';

interface CharacterFaceProps {
  characterKey: string;
  size?: number;
  width?: number;
  height?: number;
  style?: ViewStyle;
  zoomMultiplier?: number;
}

/**
 * Component that displays a zoomed-in view of a character's face
 *
 * @example
 * <CharacterFace characterKey="mario" size={100} />
 *
 * @example
 * // Show more of the character by zooming out
 * <CharacterFace characterKey="mario" size={100} zoomMultiplier={0.8} />
 *
 * @example
 * // Use independent width and height for non-square displays
 * <CharacterFace characterKey="mario" width={120} height={140} zoomMultiplier={1.25} />
 */
export const CharacterFace: React.FC<CharacterFaceProps> = ({
  characterKey,
  size = 100,
  width,
  height,
  style,
  zoomMultiplier = 1.0,
}) => {
  const imageSource = fighterImages[characterKey];

  // Use width/height if provided, otherwise fall back to size
  const displayWidth = width ?? size;
  const displayHeight = height ?? size;

  const zoomStyle = getCharacterZoomStyle(characterKey, displayWidth, displayHeight, zoomMultiplier);

  if (!imageSource) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: displayWidth,
          height: displayHeight,
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
