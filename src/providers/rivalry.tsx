import React, {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react';

import type { MRivalry } from '../models/m-rivalry';

interface RivalryContextValue {
  rivalry: MRivalry | null;
  userAName?: string;
  userBName?: string;
  userId?: string;
  isUserA: boolean;
  isUserB: boolean;
}

const RivalryContext = createContext<RivalryContextValue>({
  rivalry: null,
  userAName: undefined,
  userBName: undefined,
  userId: undefined,
  isUserA: false,
  isUserB: false,
});

const RivalryUpdateContext = createContext<
  (newRivalry: MRivalry | null, userAName?: string, userBName?: string) => void
>(() => {});

export const useRivalry = () => {
  const context = useContext(RivalryContext);

  return context.rivalry;
};

export const useRivalryContext = () => useContext(RivalryContext);
export const useUpdateRivalry = () => useContext(RivalryUpdateContext);

export const RivalryProvider = ({
  children,
  rivalry,
  userAName: initialUserAName,
  userBName: initialUserBName,
  userId,
}: {
  children: ReactNode;
  rivalry: MRivalry | null;
  userAName?: string;
  userBName?: string;
  userId?: string;
}) => {
  const [currentRivalry, setCurrentRivalry] = useState<MRivalry | null>(
    rivalry || null
  );
  const [userAName, setUserAName] = useState<string | undefined>(
    initialUserAName
  );
  const [userBName, setUserBName] = useState<string | undefined>(
    initialUserBName
  );
  const currentUserId = userId;

  // Force re-evaluation by extracting the IDs we need to compare
  const userAId = currentRivalry?.userAId;
  const userBId = currentRivalry?.userBId;

  const isUserA = useMemo(
    () => Boolean(currentUserId && userAId === currentUserId),
    [currentUserId, userAId]
  );

  const isUserB = useMemo(
    () => Boolean(currentUserId && userBId === currentUserId),
    [currentUserId, userBId]
  );

  const updateRivalry = (
    newRivalry: MRivalry | null,
    newUserAName?: string,
    newUserBName?: string
  ) => {
    // Force state update even if it's the same object reference
    setCurrentRivalry(prev => {
      if (newRivalry === prev) {
        // Same reference - create a shallow copy to trigger re-render
        return newRivalry ? { ...newRivalry } : null;
      }

      return newRivalry;
    });
    if (newUserAName !== undefined) {
      setUserAName(newUserAName);
    }
    if (newUserBName !== undefined) {
      setUserBName(newUserBName);
    }
  };

  const contextValue = useMemo(
    () => ({
      rivalry: currentRivalry,
      userAName,
      userBName,
      userId: currentUserId,
      isUserA,
      isUserB,
    }),
    [currentRivalry, userAName, userBName, currentUserId, isUserA, isUserB]
  );

  return (
    <RivalryContext.Provider value={contextValue}>
      <RivalryUpdateContext.Provider value={updateRivalry}>
        {children}
      </RivalryUpdateContext.Provider>
    </RivalryContext.Provider>
  );
};
