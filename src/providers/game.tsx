import React, { createContext, ReactNode, useContext, useState } from 'react';

import { MGame } from '../models/m-game';

interface GameContextValue {
  game: MGame | null;
  setGame: (game: MGame | null) => void;
}

const GameContext = createContext<GameContextValue>({
  game: null,
  setGame: () => {}
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
  game: initialGame
}: {
  children: ReactNode;
  game: MGame | null;
}) => {
  const [game, setGame] = useState<MGame | null>(initialGame);

  console.log('[GameProvider] Rendering with', game?.fighters?.items?.length || 0, 'fighters');

  return (
    <GameContext.Provider value={{ game, setGame }}>
      {children}
    </GameContext.Provider>
  );
};
