import { Game } from '../API';

export interface MGame extends Game {
  abbr: string;
  title: string;
  baseGame: Game;
}

export const STOCK = 3;
export const STEPS_PER_STOCK = 3;

export const PROVISIONAL_THRESHOLD = 10;

export function getMGame(game: Game): MGame {
  return {
    ...game,

    get abbr() {
      return `${game.name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()}`;
    },

    get baseGame() {
      return game;
    },

    get title() {
      return `${game.name} (unofficial)`;
    },
  };
}
