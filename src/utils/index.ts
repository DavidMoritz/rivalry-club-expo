import type { Schema } from '../../amplify/data/resource';
import type { MFighter } from '../models/m-fighter';
import type { MGame } from '../models/m-game';

type Fighter = Schema['Fighter']['type'];

type Game = {
  id: string;
  name: string;
  fighters?: { items: (Fighter | null)[] } | null;
};

export function dateDisplay(dateString: string): string {
  const today = new Date();
  const updatedDate = new Date(dateString);
  const year =
    today.getFullYear() !== updatedDate.getFullYear() ? 'numeric' : undefined;

  return updatedDate.toLocaleDateString('en', {
    day: '2-digit',
    month: '2-digit',
    year,
  });
}

export function fighterByIdFromGame(
  game: Game | MGame,
  fighterId: string
): MFighter | null {
  // Handle both Game and MGame types - fighters might be LazyLoader or { items: ... }
  const fighters = game.fighters as any;
  const fightersItems = fighters?.items || [];
  const fighter = fightersItems.find(
    (thisFighter: Fighter | null) => thisFighter?.id === fighterId
  ) as Fighter | null;

  if (!fighter) return null;

  return {
    ...fighter,
    baseFighter: fighter,
    _mGame: null,
    game: null,
  } as MFighter;
}

export function scoreDisplay(result: number): string {
  return result > 0 ? `${result} - 0` : `0 - ${Math.abs(result)}`;
}

export function sourceCase(name: string): string {
  // Convert to snake_case and handle special characters
  return name
    .toLowerCase()
    .replace('é', 'e')
    .replace(/[^\w\s]/g, '_') // Replace all special characters with underscore
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .replace(/_+/g, '_') // Replace multiple consecutive underscores with single underscore
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}
