import { createContext, useContext } from 'react';

import { MGame } from '../models/m-game';

const GameContext = createContext<MGame | null>(null);

export const useGame = () => useContext(GameContext);

export const GameProvider = GameContext.Provider;
