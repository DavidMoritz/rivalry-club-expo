import React, { createContext, ReactNode, useContext, useState } from 'react';

import { MRivalry } from '../models/m-rivalry';

const RivalryContext = createContext<MRivalry | null>(null);
const RivalryUpdateContext = createContext<
  (newRivalry: MRivalry | null) => void
>(() => undefined);

export const useRivalry = () => useContext(RivalryContext);
export const useUpdateRivalry = () => useContext(RivalryUpdateContext);

export const RivalryProvider = ({
  children,
  rivalry,
}: {
  children: ReactNode;
  rivalry: MRivalry | null;
}) => {
  const [currentRivalry, setCurrentRivalry] = useState<MRivalry | null>(
    rivalry || null,
  );

  const updateRivalry = (newRivalry: MRivalry | null) => {
    setCurrentRivalry(newRivalry);
  };

  return (
    <RivalryContext.Provider value={currentRivalry}>
      <RivalryUpdateContext.Provider value={updateRivalry}>
        {children}
      </RivalryUpdateContext.Provider>
    </RivalryContext.Provider>
  );
};
