import { Fighter } from '../API';
import { MGame } from './m-game';

export interface MFighter extends Fighter {
  baseFighter: Fighter;
  _mGame: MGame | null;
  game: MGame | null;
}

export function getMFighter(fighter: Fighter): MFighter {
  return {
    ...fighter,
    _mGame: null,
    baseFighter: fighter,

    set game(mGame: MGame) {
      this._mGame = mGame;
    },

    get game(): MGame | null {
      if (this._mGame) return this._mGame;

      return null;
    },
  };
}
