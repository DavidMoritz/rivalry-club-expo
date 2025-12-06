import React from 'react';
import { Text, View } from 'react-native';

import { useRivalry, useRivalryContext } from '../../../providers/rivalry';
import { darkStyles, styles } from '../../../utils/styles';
import { Button } from '../../common/Button';

interface RivalryViewProps {
  navigation: {
    navigate: (screen: string) => void;
  };
}

export function RivalryView({ navigation }: RivalryViewProps): JSX.Element {
  const rivalry = useRivalry();
  const { isUserA, isUserB } = useRivalryContext();

  const getUserRole = () => {
    if (isUserA) return 'You are User A';
    if (isUserB) return 'You are User B';

    console.warn('[RivalryView] User is neither User A nor User B');

    return null;
  };

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
      {getUserRole() && (
        <View style={{ marginTop: 8 }}>
          <Text style={[styles.text, darkStyles.text, { fontSize: 14, opacity: 0.7 }]}>
            {getUserRole()}
          </Text>
        </View>
      )}
    </>
  );
}
