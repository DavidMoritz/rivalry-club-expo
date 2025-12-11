import React, { ReactNode, useEffect, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';

import { MTierList, TIERS } from '../../../models/m-tier-list';
import { MTierSlot } from '../../../models/m-tier-slot';
import { MGame } from '../../../models/m-game';
import { useGame } from '../../../providers/game';
import { fighterByIdFromGame } from '../../../utils';
import { CharacterDisplay } from '../../common/CharacterDisplay';

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
  const [positionedSlots, setPositionedSlots] = useState<MTierSlot[]>([]);
  const [unknownSlots, setUnknownSlots] = useState<MTierSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<MTierSlot | null>(null);

  useEffect(() => {
    if (!tierList.slots?.length) return;

    const allSlots = tierList.slots;

    // UNKNOWN TIER: Separate positioned and unknown fighters
    const positioned = allSlots.filter(
      (slot) => slot.position !== null && slot.position !== undefined
    );
    const unknown = allSlots.filter(
      (slot) => slot.position === null || slot.position === undefined
    );

    // Sort only positioned fighters
    const sortedPositioned = positioned.sort((a, b) => (a?.position || 0) - (b?.position || 0));

    setPositionedSlots(sortedPositioned);
    setUnknownSlots(unknown);
  }, [tierList]);

  const moveSlot = (fromIndex: number, toIndex: number, isFromUnknown = false) => {
    if (!isFromUnknown && fromIndex === toIndex) return;

    console.log('[moveSlot] START', {
      fromIndex,
      toIndex,
      isFromUnknown,
      positionedSlotsLength: positionedSlots.length,
      selectedSlotId: selectedSlot?.id
    });

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    let newSlots: MTierSlot[];
    let newUnknownSlots = [...unknownSlots];

    if (isFromUnknown) {
      // Moving from unknown tier to positioned tier
      const unknownIndex = unknownSlots.findIndex((s) => s.id === selectedSlot?.id);
      if (unknownIndex === -1) return;

      const [movedSlot] = newUnknownSlots.splice(unknownIndex, 1);

      // Create array sorted by position for insertion
      const sortedSlots = [...positionedSlots].sort(
        (a, b) => (a.position || 0) - (b.position || 0)
      );

      // Insert the moved slot at the target index
      // toIndex represents the desired final position in the sequential array
      sortedSlots.splice(toIndex, 0, movedSlot);

      // Now reindex all slots sequentially to handle any collisions
      newSlots = sortedSlots.map((slot, index) => ({
        ...slot,
        position: index
      }));

      console.log('[moveSlot] isFromUnknown - inserted and reindexed', {
        toIndex,
        movedSlotId: movedSlot.id,
        newSlotsLength: newSlots.length,
        firstFewPositions: newSlots.slice(0, 5).map((s) => ({ id: s.id, position: s.position }))
      });

      setUnknownSlots(newUnknownSlots);
    } else {
      // Moving within positioned fighters
      newSlots = [...positionedSlots];
      const [movedSlot] = newSlots.splice(fromIndex, 1);
      newSlots.splice(toIndex, 0, movedSlot);
    }

    // Always reindex sequentially to ensure no collisions
    const updatedSlots = newSlots.map((slot, index) => ({
      ...slot,
      position: index
    }));

    console.log('[moveSlot] After processing', {
      updatedSlotsLength: updatedSlots.length,
      firstFewPositions: updatedSlots.slice(0, 5).map((s) => ({ id: s.id, position: s.position })),
      lastFewPositions: updatedSlots.slice(-5).map((s) => ({ id: s.id, position: s.position }))
    });

    setPositionedSlots(updatedSlots);

    // Update the tier list's internal slots (positioned + unknown)
    const allUpdatedSlots = [
      ...updatedSlots.map((slot) => ({
        ...tierList.slots.find((s) => s.id === slot.id)!,
        position: slot.position
      })),
      ...newUnknownSlots.map((slot) => ({
        ...tierList.slots.find((s) => s.id === slot.id)!
      }))
    ];

    tierList.slots = allUpdatedSlots;

    onChange();
  };

  const handleSelectSlot = (slot: MTierSlot) => {
    setSelectedSlot(slot);
  };

  const handleMoveToPosition = (toIndex: number) => {
    if (!selectedSlot) return;

    const fromIndex = positionedSlots.findIndex((s) => s.id === selectedSlot.id);
    const isFromUnknown = fromIndex === -1;

    // If moving from positioned tier
    if (!isFromUnknown) {
      // If clicking on the same slot, just deselect
      if (fromIndex === toIndex) {
        setSelectedSlot(null);
        return;
      }
      // Move within positioned slots
      moveSlot(fromIndex, toIndex, false);
    } else {
      // Moving from unknown tier to positioned tier
      moveSlot(-1, toIndex, true);
    }

    // Clear selection after move
    setSelectedSlot(null);
  };

  const handleTierLabelClick = (tierIndex: number) => {
    if (!selectedSlot) return;

    // Sort slots to find actual occupied positions
    const sortedSlots = [...positionedSlots].sort((a, b) => (a.position || 0) - (b.position || 0));

    // Calculate tier boundaries based on fighter count
    const tierStartPosition = TIERS.slice(0, tierIndex).reduce(
      (sum, t) => sum + t.fightersCount,
      0
    );

    // Find which array index corresponds to the first slot in this tier
    // We want to insert before the first slot that belongs to this tier
    let targetIndex = sortedSlots.length; // Default to end if no slots in or after this tier
    for (let i = 0; i < sortedSlots.length; i++) {
      const slotPos = sortedSlots[i].position || 0;
      if (slotPos >= tierStartPosition) {
        targetIndex = i; // Insert before this slot
        break;
      }
    }

    console.log('[handleTierLabelClick]', {
      tierIndex,
      tierStartPosition,
      targetIndex,
      sortedSlotsLength: sortedSlots.length,
      selectedSlot: selectedSlot.id
    });

    // Move the unknown fighter to the start of the tier (insert at targetIndex)
    moveSlot(-1, targetIndex, true);

    // Clear selection after move
    setSelectedSlot(null);
  };

  const handleTierBackgroundClick = (tierIndex: number) => {
    if (!selectedSlot) return;

    // Check if selected slot is from unknown tier
    const isFromUnknown = unknownSlots.findIndex((s) => s.id === selectedSlot.id) !== -1;
    if (!isFromUnknown) return; // Only allow moving unknown fighters via tier background

    // Sort slots to find actual occupied positions
    const sortedSlots = [...positionedSlots].sort((a, b) => (a.position || 0) - (b.position || 0));

    // Calculate tier boundaries based on fighter count
    const tierStartPosition = TIERS.slice(0, tierIndex).reduce(
      (sum, t) => sum + t.fightersCount,
      0
    );
    const tierEndPosition = tierStartPosition + TIERS[tierIndex].fightersCount - 1;

    // Find which array index corresponds to "after the last slot in this tier"
    // We want to insert right after the last slot that belongs to this tier
    let targetIndex = 0;
    for (let i = 0; i < sortedSlots.length; i++) {
      const slotPos = sortedSlots[i].position || 0;
      if (slotPos <= tierEndPosition) {
        targetIndex = i + 1; // Insert after this slot
      } else {
        break; // We've gone past this tier
      }
    }

    console.log('[handleTierBackgroundClick]', {
      tierIndex,
      tierStartPosition,
      tierEndPosition,
      targetIndex,
      sortedSlotsLength: sortedSlots.length,
      selectedSlot: selectedSlot.id
    });

    // Move the unknown fighter to the end of the tier (insert at targetIndex)
    moveSlot(-1, targetIndex, true);

    // Clear selection after move
    setSelectedSlot(null);
  };

  const renderCharacter = (slot: MTierSlot, index: number) => {
    const fighter = fighterByIdFromGame(game, slot.fighterId);
    if (!fighter) return null;

    const isSelected = selectedSlot?.id === slot.id;

    return (
      <View
        key={slot.id}
        style={{
          opacity: isSelected ? 0.5 : 1,
          transform: [{ scale: isSelected ? 0.9 : 1 }],
          borderWidth: isSelected ? 1 : 0,
          borderColor: '#3b82f6',
          borderRadius: 4,
          margin: isSelected ? -1 : 0
        }}
      >
        <CharacterDisplay
          fighter={fighter}
          hideName={true}
          height={45}
          zoomMultiplier={0.65}
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
        />
      </View>
    );
  };

  return (
    <ScrollView style={{ flex: 1 }}>
      {TIERS.map((tier, tierIndex) => {
        // Calculate cumulative start index based on previous tiers' fighter counts
        const startIdx = TIERS.slice(0, tierIndex).reduce((sum, t) => sum + t.fightersCount, 0);
        const endIdx = startIdx + tier.fightersCount;

        // Check if an unknown fighter is selected
        const isUnknownSelected =
          selectedSlot && unknownSlots.findIndex((s) => s.id === selectedSlot.id) !== -1;
        const TierLabelContainer = isUnknownSelected ? TouchableOpacity : View;
        const TierBackgroundContainer = isUnknownSelected ? TouchableOpacity : View;

        return (
          <View key={tier.label}>
            <View
              style={{
                flexDirection: 'row',
                borderBottomWidth: 1,
                borderBottomColor: '#374151',
                backgroundColor: tier.color,
                minHeight: 40
              }}
            >
              <TierLabelContainer
                style={{
                  width: 60,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRightWidth: 2,
                  borderRightColor: '#1f2937',
                  backgroundColor: isUnknownSelected
                    ? 'rgba(31, 41, 55, 0.5)'
                    : 'rgb(31, 41, 55, 0.2)'
                }}
                onPress={isUnknownSelected ? () => handleTierLabelClick(tierIndex) : undefined}
              >
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: 'black', opacity: 1 }}>
                  {tier.label}
                </Text>
              </TierLabelContainer>
              <TierBackgroundContainer
                style={{
                  flex: 1,
                  paddingVertical: 4,
                  paddingHorizontal: 4,
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 4
                }}
                onPress={isUnknownSelected ? () => handleTierBackgroundClick(tierIndex) : undefined}
              >
                {Array.from({ length: endIdx - startIdx }, (_, i) => {
                  const position = startIdx + i;
                  const slot = positionedSlots.find((s) => s.position === position);
                  return slot ? renderCharacter(slot, position) : null;
                })}
              </TierBackgroundContainer>
            </View>
          </View>
        );
      })}

      {/* UNKNOWN TIER: Display unknown fighters at bottom */}
      {unknownSlots.length > 0 && (
        <View>
          <View
            style={{
              flexDirection: 'row',
              borderBottomWidth: 1,
              borderBottomColor: '#374151',
              backgroundColor: 'hsl(0, 0%, 50%)',
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
                backgroundColor: 'rgb(31, 41, 55, 0.2)'
              }}
            >
              <Text style={{ fontSize: 32, fontWeight: 'bold', color: 'black', opacity: 1 }}>
                U
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
              {unknownSlots.map((slot) => {
                const fighter = fighterByIdFromGame(game, slot.fighterId);
                if (!fighter) return null;

                const isSelected = selectedSlot?.id === slot.id;

                return (
                  <View
                    key={slot.id}
                    style={{
                      opacity: isSelected ? 0.5 : 1,
                      transform: [{ scale: isSelected ? 0.9 : 1 }],
                      borderWidth: isSelected ? 1 : 0,
                      borderColor: '#3b82f6',
                      borderRadius: 4,
                      margin: isSelected ? -1 : 0
                    }}
                  >
                    <CharacterDisplay
                      fighter={fighter}
                      hideName={true}
                      height={45}
                      zoomMultiplier={0.65}
                      onPress={() => {
                        if (selectedSlot && selectedSlot.id !== slot.id) {
                          // Deselect - can't move unknown fighters to unknown tier
                          setSelectedSlot(null);
                        } else if (selectedSlot && selectedSlot.id === slot.id) {
                          // If clicking the same slot, deselect it
                          setSelectedSlot(null);
                        } else {
                          // No slot selected, select this unknown fighter
                          handleSelectSlot(slot);
                        }
                      }}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
