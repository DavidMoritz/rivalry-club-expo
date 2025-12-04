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

  return (
    <>
      <Button
        className="h-12 px-12 w-64"
        onPress={() => {
          navigation.navigate('RivalryTiersView');
        }}
        text="View Tier Lists"
      />
      <Button
        className="h-12 px-12 w-64"
        onPress={() => {
          navigation.navigate('ContestHistory');
        }}
        text={`View ${rivalry?.contestCount || 0} Contests`}
      />
    </>
  );
}
