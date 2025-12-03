import { createContext } from 'react';
import { Animated } from 'react-native';

/**
 * Video tutorial: https://www.youtube.com/watch?v=9tE32G7WGj4
 * Source Repo: https://github.com/MaximilianDietel03/react-native-synced-scroll-views
 * ----------------------------------------------------------------------------
 */

export const syncedScrollViewState = {
  activeScrollView: new Animated.Value(0),
  offsetPercent: new Animated.Value(0),
};

export const SyncedScrollViewContext = createContext(syncedScrollViewState);
