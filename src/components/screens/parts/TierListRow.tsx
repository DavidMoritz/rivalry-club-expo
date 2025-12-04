import React from 'react';
import { Text, View } from 'react-native';

import type { Schema } from '../../../../amplify/data/resource';
import { fighterByIdFromGame } from '../../../utils';
import { MGame } from '../../../models/m-game';
import { useGame } from '../../../providers/game';
import { CharacterDisplay } from '../../common/CharacterDisplay';

type TierSlot = Schema['TierSlot']['type'];

interface TierListRowProps {
  color: string;
  label: string;
  active: boolean;
  slots: TierSlot[];
}

const TierListRow: React.FC<TierListRowProps> = (props) => {
  const game = useGame() as MGame;

  return (
    <View
      style={{
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
        backgroundColor: props.color
      }}
    >
      <View
        style={{
          width: 60,
          justifyContent: 'center',
          alignItems: 'center',
          borderRightWidth: 2,
          borderRightColor: '#1f2937',
          backgroundColor: '#1f2937'
        }}
      >
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: 'white' }}>{props.label}</Text>
      </View>
      <View style={{ flex: 1, paddingVertical: 4 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {props.slots.map((slot) => {
            const fighter = fighterByIdFromGame(game, slot.fighterId);

            return fighter ? (
              <CharacterDisplay key={slot.id} fighter={fighter} hideName={true} height={50} />
            ) : null;
          })}
        </View>
      </View>
    </View>
  );
};

export default TierListRow;
