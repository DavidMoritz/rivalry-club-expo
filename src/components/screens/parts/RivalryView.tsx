import React from 'react';

import { useRivalry } from '../../../providers/rivalry';
import { Button } from '../../common/Button';

interface RivalryViewProps {
  navigation: {
    navigate: (screen: string) => void;
  };
}

export function RivalryView({ navigation }: RivalryViewProps): JSX.Element {
  const rivalry = useRivalry();
  const displayCount = Math.max((rivalry?.contestCount ?? 1) - 1, 0);
  const displayContest = displayCount === 1 ? 'Contest' : 'Contests';

  return (
    <>
      <Button
        onPress={() => {
          navigation.navigate('RivalryTiersView');
        }}
        text="View Tier Lists"
        style={{ height: 48, paddingHorizontal: 48, width: 256 }}
      />
      <Button
        onPress={() => {
          navigation.navigate('ContestHistory');
        }}
        text={`View ${displayCount} ${displayContest}`}
        style={{ height: 48, paddingHorizontal: 48, width: 256 }}
      />
    </>
  );
}
