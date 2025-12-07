import React, { ReactNode, useEffect, useState } from 'react';
import {
  LayoutAnimation,
  PanResponder,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';

import type { Schema } from '../../../../amplify/data/resource';
import { MTierList, TIERS } from '../../../models/m-tier-list';
import { MGame } from '../../../models/m-game';
import { useGame } from '../../../providers/game';
import { fighterByIdFromGame } from '../../../utils';
import { CharacterDisplay } from '../../common/CharacterDisplay';

type TierSlot = Schema['TierSlot']['type'];

const fightersPerTier = 12;

interface TierListEditDisplayProps {
  tierList: MTierList;
  onChange: () => void;
}

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function TierListEditDisplay({ tierList, onChange }: TierListEditDisplayProps): ReactNode {
  const game = useGame() as MGame;
  const [allSlots, setAllSlots] = useState<TierSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TierSlot | null>(null);

  useEffect(() => {
    if (!tierList.tierSlots?.items?.length) return;

    const sorted = (tierList.tierSlots.items as TierSlot[]).sort(
      (a, b) => (a?.position || 0) - (b?.position || 0)
    );

    setAllSlots(sorted);
  }, [tierList]);

  const moveSlot = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const newSlots = [...allSlots];
    const [movedSlot] = newSlots.splice(fromIndex, 1);
    newSlots.splice(toIndex, 0, movedSlot);

    // Update positions
    const updatedSlots = newSlots.map((slot, index) => ({
      ...slot,
      position: index
    }));

    setAllSlots(updatedSlots);

    // Update the tier list's internal slots
    tierList.slots = updatedSlots.map((slot) => ({
      ...tierList.slots.find((s) => s.id === slot.id)!,
      position: slot.position
    }));

    onChange();
  };

  const handleSelectSlot = (slot: TierSlot) => {
    setSelectedSlot(slot);
  };

  const handleMoveToPosition = (toIndex: number) => {
    if (!selectedSlot) return;

    const fromIndex = allSlots.findIndex((s) => s.id === selectedSlot.id);
    if (fromIndex === -1) return;

    // If clicking on the same slot, just deselect
    if (fromIndex === toIndex) {
      setSelectedSlot(null);

      return;
    }

    // Move the slot
    moveSlot(fromIndex, toIndex);

    // Clear selection after move
    setSelectedSlot(null);
  };

  const renderCharacter = (slot: TierSlot, index: number) => {
    const fighter = fighterByIdFromGame(game, slot.fighterId);
    if (!fighter) return null;

    const isSelected = selectedSlot?.id === slot.id;

    return (
      <TouchableOpacity
        key={slot.id}
        activeOpacity={1}
        onPress={() => {
          if (selectedSlot && selectedSlot.id !== slot.id) {
            // If a different slot is selected, move it here
            handleMoveToPosition(index);
          } else if (selectedSlot && selectedSlot.id === slot.id) {
            // If clicking the same slot, deselect it
            setSelectedSlot(null);
          } else {
            // No slot selected, select this one
            handleSelectSlot(slot);
          }
        }}
        style={{
          opacity: isSelected ? 0.5 : 1,
          transform: [{ scale: isSelected ? 0.9 : 1 }],
          borderWidth: isSelected ? 1 : 0,
          borderColor: '#3b82f6',
          borderRadius: 4
        }}
      >
        <CharacterDisplay fighter={fighter} hideName={true} height={45} zoomMultiplier={0.65} />
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={{ flex: 1 }}>
      {TIERS.map((tier, tierIndex) => {
        const startIdx = tierIndex * fightersPerTier;
        const endIdx = startIdx + fightersPerTier;
        const tierSlots = allSlots.slice(startIdx, endIdx);

        return (
          <View key={tier.label}>
            <View
              style={{
                flexDirection: 'row',
                borderBottomWidth: 1,
                borderBottomColor: '#374151',
                backgroundColor: tier.color,
                minHeight: 80
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
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: 'white' }}>
                  {tier.label}
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  paddingVertical: 4,
                  paddingHorizontal: 4,
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 4
                }}
              >
                {tierSlots.map((slot, idx) => renderCharacter(slot, startIdx + idx))}
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
