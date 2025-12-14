import type React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { MGame } from '../../../models/m-game';
import type { MTierSlot } from '../../../models/m-tier-slot';
import { useGame } from '../../../providers/game';
import { fighterByIdFromGame } from '../../../utils';
import { colors } from '../../../utils/colors';
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

const TierListRow: React.FC<TierListRowProps> = props => {
  const game = useGame() as MGame;

  const TierLabel = props.onTierClick ? TouchableOpacity : View;
  const TierBackground = props.onTierBackgroundClick ? TouchableOpacity : View;

  return (
    <View style={[rowContainerStyle, { backgroundColor: props.color }]}>
      <TierLabel
        onPress={props.onTierClick}
        style={[
          tierLabelStyle,
          {
            backgroundColor: props.onTierClick
              ? colors.tierRowDark
              : colors.tierRowLight,
          },
        ]}
      >
        <Text style={tierLabelTextStyle}>{props.label}</Text>
      </TierLabel>
      <TierBackground
        onPress={props.onTierBackgroundClick}
        style={tierBackgroundStyle}
      >
        <View style={slotsContainerStyle}>
          {props.slots.map(slot => {
            const fighter = fighterByIdFromGame(game, slot.fighterId);
            const isSelected = props.selectedSlotId === slot.id;

            return fighter ? (
              <TouchableOpacity
                disabled={!props.onSlotClick}
                key={slot.id}
                onPress={() => props.onSlotClick?.(slot.id)}
                style={[
                  slotWrapperStyle,
                  {
                    borderWidth: isSelected ? SELECTED_BORDER_WIDTH : 0,
                    borderColor: isSelected ? colors.amber400 : colors.white,
                  },
                ]}
              >
                <CharacterDisplay
                  fighter={fighter}
                  height={50}
                  hideName={true}
                  tierSlot={slot}
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

const center = 'center' as const;
const row = 'row' as const;
const bold = 'bold' as const;
const wrap = 'wrap' as const;
const SELECTED_BORDER_WIDTH = 3;

const rowContainerStyle = {
  flexDirection: row,
  borderBottomWidth: 1,
  borderBottomColor: colors.gray700,
};

const tierLabelStyle = {
  width: 60,
  justifyContent: center,
  alignItems: center,
  borderRightWidth: 2,
  borderRightColor: colors.slate800,
  marginRight: 4,
};

const tierLabelTextStyle = {
  fontSize: 32,
  fontWeight: bold,
  color: colors.black,
};

const tierBackgroundStyle = {
  flex: 1,
  paddingVertical: 4,
};

const slotsContainerStyle = {
  flexDirection: row,
  flexWrap: wrap,
  gap: 4,
};

const slotWrapperStyle = {
  borderRadius: 4,
};

export default TierListRow;
