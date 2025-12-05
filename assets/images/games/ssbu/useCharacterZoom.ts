import { ImageStyle } from 'react-native';
import { characterZoomMap, CharacterZoomData } from './index';

/**
 * Get zoom/crop styling for a character image to focus on their face
 *
 * @param characterKey - The character identifier (e.g., 'mario', 'link')
 * @param displaySize - The size of the container displaying the image (width = height)
 * @returns Style object with transform and positioning to zoom into the character's face
 *
 * @example
 * const zoomStyle = getCharacterZoomStyle('mario', 100);
 * <Image source={fighterImages.mario} style={[styles.image, zoomStyle]} />
 */
export function getCharacterZoomStyle(
  characterKey: string,
  displaySize: number
): ImageStyle {
  const zoomData: CharacterZoomData | undefined = characterZoomMap[characterKey];

  if (!zoomData) {
    // Fallback: no zoom data, return centered style
    return {
      width: displaySize,
      height: displaySize,
    };
  }

  const { faceCenter, scale } = zoomData;

  // All source images are 250x250
  const sourceImageSize = 250;

  // Calculate the scaled image size
  const scaledImageSize = sourceImageSize * scale;

  // Calculate translation to center the face in the display area
  // We need to move the image so the faceCenter aligns with the center of displaySize
  const translateX = displaySize / 2 - faceCenter.x * scale;
  const translateY = displaySize / 2 - faceCenter.y * scale;

  return {
    width: scaledImageSize,
    height: scaledImageSize,
    transform: [
      { translateX },
      { translateY },
    ],
  };
}

/**
 * React hook version of getCharacterZoomStyle for use in components
 *
 * @param characterKey - The character identifier
 * @param displaySize - The size of the container
 * @returns Style object with zoom transformation
 */
export function useCharacterZoom(
  characterKey: string,
  displaySize: number
): ImageStyle {
  return getCharacterZoomStyle(characterKey, displaySize);
}

/**
 * Get the character zoom data directly
 *
 * @param characterKey - The character identifier
 * @returns The zoom data object or undefined if not found
 */
export function getCharacterZoomData(characterKey: string): CharacterZoomData | undefined {
  return characterZoomMap[characterKey];
}
