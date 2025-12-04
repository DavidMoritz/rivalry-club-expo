import React, { createContext, ReactNode, useContext, useState } from 'react';

import { MRivalry } from '../models/m-rivalry';

interface RivalryContextValue {
  rivalry: MRivalry | null;
  userAName?: string;
  userBName?: string;
}

const RivalryContext = createContext<RivalryContextValue>({
  rivalry: null,
  userAName: undefined,
  userBName: undefined,
});

const RivalryUpdateContext = createContext<
  (newRivalry: MRivalry | null, userAName?: string, userBName?: string) => void
>(() => undefined);

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
}: {
  children: ReactNode;
  rivalry: MRivalry | null;
  userAName?: string;
  userBName?: string;
}) => {
  const [currentRivalry, setCurrentRivalry] = useState<MRivalry | null>(
    rivalry || null,
  );
  const [userAName, setUserAName] = useState<string | undefined>(
    initialUserAName,
  );
  const [userBName, setUserBName] = useState<string | undefined>(
    initialUserBName,
  );

  const updateRivalry = (
    newRivalry: MRivalry | null,
    newUserAName?: string,
    newUserBName?: string,
  ) => {
    setCurrentRivalry(newRivalry);
    if (newUserAName !== undefined) {
      setUserAName(newUserAName);
    }
    if (newUserBName !== undefined) {
      setUserBName(newUserBName);
    }
  };

  return (
    <RivalryContext.Provider
      value={{ rivalry: currentRivalry, userAName, userBName }}
    >
      <RivalryUpdateContext.Provider value={updateRivalry}>
        {children}
      </RivalryUpdateContext.Provider>
    </RivalryContext.Provider>
  );
};
