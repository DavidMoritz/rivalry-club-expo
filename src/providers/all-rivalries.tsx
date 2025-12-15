import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import type { MRivalry } from '../models/m-rivalry';

export interface RivalryWithUsers extends MRivalry {
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
  setRivalries: (rivalries: RivalryWithUsers[], userId?: string) => void;
  addRivalry: (rivalry: RivalryWithUsers) => void;
  updateRivalry: (
    rivalryId: string,
    updates: Partial<RivalryWithUsers>
  ) => void;
  removeRivalry: (rivalryId: string) => void;
  setUserId: (userId: string) => void;
}

const AllRivalriesContext = createContext<AllRivalriesContextValue>({
  rivalries: [],
  pendingRivalries: {
    awaitingAcceptance: [],
    initiated: [],
  },
  acceptedRivalries: [],
});

const AllRivalriesUpdateContext = createContext<AllRivalriesUpdateContextValue>(
  {
    setRivalries: () => {
      // noop - default context placeholder
    },
    addRivalry: () => {
      // noop - default context placeholder
    },
    updateRivalry: () => {
      // noop - default context placeholder
    },
    removeRivalry: () => {
      // noop - default context placeholder
    },
    setUserId: () => {
      // noop - default context placeholder
    },
  }
);

export const useAllRivalries = () => useContext(AllRivalriesContext);
export const useAllRivalriesUpdate = () =>
  useContext(AllRivalriesUpdateContext);

export const AllRivalriesProvider = ({
  children,
  userId,
}: {
  children: ReactNode;
  userId?: string;
}) => {
  const [rivalries, setRivalriesState] = useState<RivalryWithUsers[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(
    userId
  );

  const setRivalries = useCallback(
    (newRivalries: RivalryWithUsers[], newUserId?: string) => {
      setRivalriesState(newRivalries);
      if (newUserId) {
        setCurrentUserId(newUserId);
      }
    },
    []
  );

  const setUserId = useCallback((newUserId: string) => {
    setCurrentUserId(newUserId);
  }, []);

  const addRivalry = useCallback((rivalry: RivalryWithUsers) => {
    setRivalriesState(prev => {
      // Check if rivalry already exists
      const exists = prev.some(r => r.id === rivalry.id);
      if (exists) {
        // Update existing rivalry
        return prev.map(r => (r.id === rivalry.id ? rivalry : r));
      }
      // Add new rivalry
      return [...prev, rivalry];
    });
  }, []);

  const updateRivalry = useCallback(
    (rivalryId: string, updates: Partial<RivalryWithUsers>) => {
      setRivalriesState(prev =>
        prev.map(r => (r.id === rivalryId ? { ...r, ...updates } : r))
      );
    },
    []
  );

  const removeRivalry = useCallback((rivalryId: string) => {
    setRivalriesState(prev => prev.filter(r => r.id !== rivalryId));
  }, []);

  // Compute derived data
  const { pendingRivalries, acceptedRivalries } = useMemo(() => {
    if (!currentUserId) {
      return {
        pendingRivalries: { awaitingAcceptance: [], initiated: [] },
        acceptedRivalries: [],
      };
    }

    const pending = rivalries.filter(r => !r.accepted);
    const accepted = rivalries.filter(r => r.accepted);

    return {
      pendingRivalries: {
        awaitingAcceptance: pending.filter(r => r.userBId === currentUserId),
        initiated: pending.filter(r => r.userAId === currentUserId),
      },
      acceptedRivalries: accepted,
    };
  }, [rivalries, currentUserId]);

  const contextValue = useMemo(
    () => ({
      rivalries,
      pendingRivalries,
      acceptedRivalries,
    }),
    [rivalries, pendingRivalries, acceptedRivalries]
  );

  const updateContextValue = useMemo(
    () => ({
      setRivalries,
      addRivalry,
      updateRivalry,
      removeRivalry,
      setUserId,
    }),
    [setRivalries, addRivalry, updateRivalry, removeRivalry, setUserId]
  );

  return (
    <AllRivalriesContext.Provider value={contextValue}>
      <AllRivalriesUpdateContext.Provider value={updateContextValue}>
        {children}
      </AllRivalriesUpdateContext.Provider>
    </AllRivalriesContext.Provider>
  );
};
