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
        text={`View ${rivalry?.contestCount || 0} Contests`}
        style={{ height: 48, paddingHorizontal: 48, width: 256 }}
      />
    </>
  );
}
