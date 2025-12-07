import type { Schema } from '../../amplify/data/resource';
import { MGame } from './m-game';

// Extract Gen 2 type
type Fighter = Schema['Fighter']['type'];

export interface MFighter extends Fighter {
  baseFighter: Fighter;
  _mGame: MGame | null;
  game: MGame | null;
}

export function getMFighter(fighter: Fighter): MFighter {
  const mFighter = {
    ...fighter,
    _mGame: null as MGame | null,
    baseFighter: fighter,
  };

  Object.defineProperty(mFighter, 'game', {
    get(): MGame | null {
      return this._mGame;
    },
    set(mGame: MGame) {
      this._mGame = mGame;
    },
    enumerable: true,
    configurable: true,
  });

  return mFighter as MFighter;
}
