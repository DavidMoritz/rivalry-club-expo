import { ImageSourcePropType } from 'react-native';

// Note: Fighter and Game types will be defined later when we set up GraphQL
// For now, using basic types
type Fighter = {
  id: string;
  name: string;
};

type Game = {
  id: string;
  name: string;
  fighters?: { items: (Fighter | null)[] } | null;
};

export const s3Bucket = 'https://rivalry-club.s3.amazonaws.com';

export const s3Images = `${s3Bucket}/images`;

export const s3Logos = `${s3Images}/logos`;
export const s3Favicons = `${s3Images}/favicons`;
export const s3Fighters = `${s3Images}/fighters`;

export function contrast(isDarkMode: boolean): 'white' | 'black' {
  return isDarkMode ? 'white' : 'black';
}

export function cWarn(warnObj: string | Record<string, unknown>, note = '') {
  if (typeof warnObj === 'string') {
    console.warn(warnObj, note);

    return;
  }

  const name = Object.keys(warnObj)[0];
  const value = warnObj[name];

  console.warn(name, value, note);
}

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

export function fighterByIdFromGame(game: Game, fighterId: string): Fighter | null {
  return (
    (game.fighters?.items.find(
      thisFighter => thisFighter?.id === fighterId,
    ) as Fighter) || null
  );
}

export function scoreDisplay(result: number): string {
  return result > 0 ? `${result} - 0` : `0 - ${Math.abs(result)}`;
}

export function sourceCase(name: string): string {
  // Simple snake_case conversion without lodash dependency
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\w]/g, '')
    .replace('é', 'e');
}

export function lastItem<T>(arr?: T[] | null): T | null {
  return arr ? arr[arr.length - 1] : null;
}
