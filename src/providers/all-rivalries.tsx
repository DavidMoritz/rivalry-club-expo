import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import { MRivalry } from '../models/m-rivalry';

interface RivalryWithUsers extends MRivalry {
  userAName?: string;
  userBName?: string;
}

interface AllRivalriesContextValue {
  rivalries: RivalryWithUsers[];
  pendingRivalries: {
    awaitingAcceptance: RivalryWithUsers[];
    initiated: RivalryWithUsers[];
  };
  acceptedRivalries: RivalryWithUsers[];
}

interface AllRivalriesUpdateContextValue {
  setRivalries: (rivalries: RivalryWithUsers[]) => void;
  addRivalry: (rivalry: RivalryWithUsers) => void;
  updateRivalry: (rivalryId: string, updates: Partial<RivalryWithUsers>) => void;
  removeRivalry: (rivalryId: string) => void;
}

const AllRivalriesContext = createContext<AllRivalriesContextValue>({
  rivalries: [],
  pendingRivalries: {
    awaitingAcceptance: [],
    initiated: []
  },
  acceptedRivalries: []
});

const AllRivalriesUpdateContext = createContext<AllRivalriesUpdateContextValue>({
  setRivalries: () => undefined,
  addRivalry: () => undefined,
  updateRivalry: () => undefined,
  removeRivalry: () => undefined
});

export const useAllRivalries = () => useContext(AllRivalriesContext);
export const useAllRivalriesUpdate = () => useContext(AllRivalriesUpdateContext);

export const AllRivalriesProvider = ({
  children,
  userId
}: {
  children: ReactNode;
  userId?: string;
}) => {
  const [rivalries, setRivalriesState] = useState<RivalryWithUsers[]>([]);

  const setRivalries = useCallback((newRivalries: RivalryWithUsers[]) => {
    setRivalriesState(newRivalries);
  }, []);

  const addRivalry = useCallback((rivalry: RivalryWithUsers) => {
    setRivalriesState(prev => {
      // Check if rivalry already exists
      const exists = prev.some(r => r.id === rivalry.id);
      if (exists) {
        // Update existing rivalry
        return prev.map(r => r.id === rivalry.id ? rivalry : r);
      }
      // Add new rivalry
      return [...prev, rivalry];
    });
  }, []);

  const updateRivalry = useCallback((rivalryId: string, updates: Partial<RivalryWithUsers>) => {
    setRivalriesState(prev =>
      prev.map(r => r.id === rivalryId ? { ...r, ...updates } : r)
    );
  }, []);

  const removeRivalry = useCallback((rivalryId: string) => {
    setRivalriesState(prev => prev.filter(r => r.id !== rivalryId));
  }, []);

  // Compute derived data
  const { pendingRivalries, acceptedRivalries } = useMemo(() => {
    if (!userId) {
      return {
        pendingRivalries: { awaitingAcceptance: [], initiated: [] },
        acceptedRivalries: []
      };
    }

    const pending = rivalries.filter(r => !r.accepted);
    const accepted = rivalries.filter(r => r.accepted);

    return {
      pendingRivalries: {
        awaitingAcceptance: pending.filter(r => r.userBId === userId),
        initiated: pending.filter(r => r.userAId === userId)
      },
      acceptedRivalries: accepted
    };
  }, [rivalries, userId]);

  const contextValue = useMemo(
    () => ({
      rivalries,
      pendingRivalries,
      acceptedRivalries
    }),
    [rivalries, pendingRivalries, acceptedRivalries]
  );

  const updateContextValue = useMemo(
    () => ({
      setRivalries,
      addRivalry,
      updateRivalry,
      removeRivalry
    }),
    [setRivalries, addRivalry, updateRivalry, removeRivalry]
  );

  return (
    <AllRivalriesContext.Provider value={contextValue}>
      <AllRivalriesUpdateContext.Provider value={updateContextValue}>
        {children}
      </AllRivalriesUpdateContext.Provider>
    </AllRivalriesContext.Provider>
  );
};
