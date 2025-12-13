import type { Schema } from '../../amplify/data/resource';
import type { MGame } from './m-game';

// Extract Gen 2 type
type Fighter = Schema['Fighter']['type'];

export interface MFighter extends Omit<Fighter, 'game'> {
  baseFighter: Fighter;
  _mGame: MGame | null;
  game: MGame | null;
  rank?: number;
}

export function getMFighter(fighter: Fighter): MFighter {
  const { game: _originalGame, ...fighterWithoutGame } = fighter;

  const mFighter = {
    ...fighterWithoutGame,
    _mGame: null as MGame | null,
    baseFighter: fighter,
    game: null as MGame | null,
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
