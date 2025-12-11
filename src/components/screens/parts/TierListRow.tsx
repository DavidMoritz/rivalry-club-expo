import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { fighterByIdFromGame } from '../../../utils';
import { MGame } from '../../../models/m-game';
import { MTierSlot } from '../../../models/m-tier-slot';
import { useGame } from '../../../providers/game';
import { CharacterDisplay } from '../../common/CharacterDisplay';

interface TierListRowProps {
  color: string;
  label: string;
  active: boolean;
  slots: MTierSlot[];
  onTierClick?: () => void;
  onTierBackgroundClick?: () => void;
  onSlotClick?: (slotId: string) => void;
  selectedSlotId?: string | null;
}

const TierListRow: React.FC<TierListRowProps> = (props) => {
  const game = useGame() as MGame;

  const TierLabel = props.onTierClick ? TouchableOpacity : View;
  const TierBackground = props.onTierBackgroundClick ? TouchableOpacity : View;

  return (
    <View
      style={{
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
        backgroundColor: props.color
      }}
    >
      <TierLabel
        onPress={props.onTierClick}
        style={{
          width: 60,
          justifyContent: 'center',
          alignItems: 'center',
          borderRightWidth: 2,
          borderRightColor: '#1f2937',
          backgroundColor: props.onTierClick ? 'rgb(31, 41, 55, 0.4)' : 'rgb(31, 41, 55, 0.2)',
          marginRight: 4
        }}
      >
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: 'black' }}>{props.label}</Text>
      </TierLabel>
      <TierBackground
        onPress={props.onTierBackgroundClick}
        style={{ flex: 1, paddingVertical: 4 }}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {props.slots.map((slot) => {
            const fighter = fighterByIdFromGame(game, slot.fighterId);
            const isSelected = props.selectedSlotId === slot.id;

            return fighter ? (
              <TouchableOpacity
                key={slot.id}
                onPress={() => props.onSlotClick?.(slot.id)}
                disabled={!props.onSlotClick}
                style={{
                  borderWidth: isSelected ? 3 : 0,
                  borderColor: isSelected ? '#fbbf24' : 'transparent',
                  borderRadius: 4
                }}
              >
                <CharacterDisplay
                  fighter={fighter}
                  hideName={true}
                  height={50}
                  zoomMultiplier={0.65}
                />
              </TouchableOpacity>
            ) : null;
          })}
        </View>
      </TierBackground>
    </View>
  );
};

export default TierListRow;
