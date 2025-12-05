import { ImageStyle } from 'react-native';
import { characterZoomMap, CharacterZoomData } from './index';

/**
 * Get zoom/crop styling for a character image to focus on their face
 *
 * @param characterKey - The character identifier (e.g., 'mario', 'link')
 * @param displayWidth - The width of the container displaying the image
 * @param displayHeight - The height of the container displaying the image
 * @param zoomMultiplier - Optional multiplier to adjust zoom level (default: 1.0, <1.0 zooms out, >1.0 zooms in)
 * @returns Style object with transform and positioning to zoom into the character's face
 *
 * @example
 * const zoomStyle = getCharacterZoomStyle('mario', 100, 100);
 * <Image source={fighterImages.mario} style={[styles.image, zoomStyle]} />
 *
 * @example
 * // Zoom out to show more of the character
 * const zoomStyle = getCharacterZoomStyle('mario', 100, 100, 0.8);
 *
 * @example
 * // Non-square display
 * const zoomStyle = getCharacterZoomStyle('mario', 120, 140, 1.25);
 */
export function getCharacterZoomStyle(
  characterKey: string,
  displayWidth: number,
  displayHeight: number,
  zoomMultiplier: number = 1.0
): ImageStyle {
  const zoomData: CharacterZoomData | undefined = characterZoomMap[characterKey];

  if (!zoomData) {
    // Fallback: no zoom data, return centered style
    return {
      width: displayWidth,
      height: displayHeight,
    };
  }

  const { faceCenter, scale } = zoomData;

  // All source images are 250x250
  const sourceImageSize = 250;

  // Calculate the scaled image size with the zoom multiplier applied
  const adjustedScale = scale * zoomMultiplier;
  const scaledImageSize = sourceImageSize * adjustedScale;

  // Calculate translation to center the face in the display area
  // We need to move the image so the faceCenter aligns with the center of the display
  const translateX = displayWidth / 2 - faceCenter.x * adjustedScale;
  const translateY = displayHeight / 2 - faceCenter.y * adjustedScale;

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
 * @param displayWidth - The width of the container
 * @param displayHeight - The height of the container
 * @param zoomMultiplier - Optional multiplier to adjust zoom level (default: 1.0)
 * @returns Style object with zoom transformation
 */
export function useCharacterZoom(
  characterKey: string,
  displayWidth: number,
  displayHeight: number,
  zoomMultiplier: number = 1.0
): ImageStyle {
  return getCharacterZoomStyle(characterKey, displayWidth, displayHeight, zoomMultiplier);
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
