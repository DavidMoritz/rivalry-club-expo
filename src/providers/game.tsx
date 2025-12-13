import { useQuery } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/data';
import React, {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { Schema } from '../../amplify/data/resource';
import { getMGame, type MGame } from '../models/m-game';

// Lazy client initialization
let client: ReturnType<typeof generateClient<Schema>> | null = null;

function getClient() {
  if (!client) {
    client = generateClient<Schema>();
  }
  return client;
}

// Hardcoded game ID
const GAME_ID = '73ed69cf-2775-43d6-bece-aed10da3e25a';

interface GameContextValue {
  game: MGame | null;
  setGame: (game: MGame | null) => void;
}

const GameContext = createContext<GameContextValue>({
  game: null,
  setGame: () => {},
});

export const useGame = () => {
  const context = useContext(GameContext);
  return context.game;
};

export const useUpdateGame = () => {
  const context = useContext(GameContext);
  return context.setGame;
};

export const GameProvider = ({
  children,
  game: initialGame,
}: {
  children: ReactNode;
  game: MGame | null;
}) => {
  const [game, setGame] = useState<MGame | null>(initialGame);

  // Fetch game with fighters from DB on mount if not already loaded
  const { data: fetchedGame } = useQuery({
    queryKey: ['game-with-fighters', GAME_ID],
    queryFn: async () => {
      const { data: fighters, errors } = await getClient().models.Fighter.list({
        filter: {
          gameId: {
            eq: GAME_ID,
          },
        },
        selectionSet: [
          'id',
          'name',
          'gamePosition',
          'winCount',
          'contestCount',
        ],
      });

      if (errors) {
        console.error('[GameProvider] Error fetching fighters:', errors);
        throw new Error('Failed to fetch fighters');
      }

      // Calculate win percentages and rank fighters
      const fightersWithRanks = fighters.map(fighter => {
        const winRate =
          fighter.contestCount &&
          fighter.contestCount > 0 &&
          fighter.winCount !== null &&
          fighter.winCount !== undefined
            ? (fighter.winCount / fighter.contestCount) * 100
            : 0;
        return { ...fighter, winRate };
      });

      // Sort by win rate (descending) and assign ranks
      fightersWithRanks.sort((a, b) => b.winRate - a.winRate);

      const rankedFighters = fightersWithRanks.map((fighter, index) => ({
        ...fighter,
        rank: index + 1,
      }));

      return {
        id: GAME_ID,
        name: 'Super Smash Bros. Ultimate',
        fighters: { items: rankedFighters },
      };
    },
    enabled: !game, // Only fetch if game is not already loaded
  });

  // Update state when game data is fetched
  useEffect(() => {
    if (fetchedGame && !game) {
      const mGame = getMGame(fetchedGame as any);
      setGame(mGame);
    }
  }, [fetchedGame, game]);

  return (
    <GameContext.Provider value={{ game, setGame }}>
      {children}
    </GameContext.Provider>
  );
};
