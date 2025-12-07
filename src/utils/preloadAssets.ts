import { Asset } from 'expo-asset';
import { Image } from 'react-native';
import { fighterImages } from '../../assets/images/games/ssbu';

/**
 * Preload all fighter images to cache them in memory
 * This ensures instant loading when navigating between screens
 */
export async function preloadFighterImages(): Promise<void> {
  try {
    // Get all image sources from the fighterImages object
    const imageSources = Object.values(fighterImages);
    console.log(`[preloadAssets] Starting to preload ${imageSources.length} fighter images...`);

    // Preload using both Asset.loadAsync and Image.prefetch for better caching
    // Asset.loadAsync works with require() modules
    const assetPromises = imageSources.map(async (source, index) => {
      try {
        if (typeof source === 'number') {
          // Local require() image - use Asset.loadAsync
          await Asset.loadAsync(source);
        }
      } catch (err) {
        console.warn(`[preloadAssets] Failed to preload image ${index}:`, err);
      }
    });

    // Also use Image.prefetch for React Native's image cache
    const prefetchPromises = imageSources.map(async (source, index) => {
      try {
        if (typeof source === 'object' && source !== null && 'uri' in source) {
          await Image.prefetch(source.uri as string);
        }
      } catch (err) {
        console.warn(`[preloadAssets] Failed to prefetch image ${index}:`, err);
      }
    });

    await Promise.all([...assetPromises, ...prefetchPromises]);

    console.log(`[preloadAssets] Successfully preloaded ${imageSources.length} fighter images`);
  } catch (error) {
    console.error('[preloadAssets] Error preloading fighter images:', error);
    throw error;
  }
}

/**
 * Preload all assets needed for the app
 */
export async function preloadAssets(): Promise<void> {
  await Promise.all([
    preloadFighterImages(),
    // Add other asset preloading here if needed
  ]);
}
