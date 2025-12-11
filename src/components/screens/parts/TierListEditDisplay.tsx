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

  const moveSlot = (
    fromIndex: number,
    toIndex: number,
    isFromUnknown = false,
    shiftDirection: 'up' | 'down' = 'down'
  ): boolean => {
    if (!isFromUnknown && fromIndex === toIndex) return false;

    console.log('[moveSlot] START', {
      fromIndex,
      toIndex,
      isFromUnknown,
      shiftDirection,
      positionedSlotsLength: positionedSlots.length,
      selectedSlotId: selectedSlot?.id
    });

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    let newSlots: MTierSlot[];
    let newUnknownSlots = [...unknownSlots];

    if (isFromUnknown) {
      // Moving from unknown tier to positioned tier
      const unknownIndex = unknownSlots.findIndex((s) => s.id === selectedSlot?.id);
      if (unknownIndex === -1) return false;

      const [movedSlot] = newUnknownSlots.splice(unknownIndex, 1);

      // Handle collision: check if there's already a slot at toIndex
      const existingSlotAtPosition = positionedSlots.find((s) => s.position === toIndex);

      if (existingSlotAtPosition) {
        // There's a collision - cascade positions until finding an empty slot
        const occupiedPositions = new Set(positionedSlots.map((s) => s.position));

        if (shiftDirection === 'down') {
          // Find the first available position starting from toIndex
          let firstAvailablePos = toIndex;
          while (occupiedPositions.has(firstAvailablePos) && firstAvailablePos <= 85) {
            firstAvailablePos++;
          }

          if (firstAvailablePos > 85) {
            console.warn('[moveSlot] Cannot place fighter - no empty slots in range [toIndex, 85]', {
              toIndex
            });
            newUnknownSlots.splice(unknownIndex, 0, movedSlot);
            return false;
          }

          // Only shift fighters between toIndex and firstAvailablePos (consecutive occupied positions)
          const fightersToShift = positionedSlots.filter(
            (s) => (s.position ?? 0) >= toIndex && (s.position ?? 0) < firstAvailablePos
          );

          console.log('[moveSlot] Shift down analysis', {
            toIndex,
            firstAvailablePos,
            fightersToShiftCount: fightersToShift.length
          });

          // Shift these fighters: each gets +1 to their position
          const newPositionMap = new Map<number, number>();
          for (const fighter of fightersToShift) {
            const oldPos = fighter.position ?? 0;
            newPositionMap.set(oldPos, oldPos + 1);
          }

          // Apply the position changes
          newSlots = positionedSlots.map((slot) => {
            const oldPos = slot.position ?? 0;
            if (newPositionMap.has(oldPos)) {
              return { ...slot, position: newPositionMap.get(oldPos)! };
            }
            return slot;
          });
        } else {
          // Find the first available position starting from toIndex (searching downward)
          let firstAvailablePos = toIndex;
          while (occupiedPositions.has(firstAvailablePos) && firstAvailablePos >= 0) {
            firstAvailablePos--;
          }

          if (firstAvailablePos < 0) {
            console.warn('[moveSlot] Cannot place fighter - no empty slots in range [0, toIndex]', {
              toIndex
            });
            newUnknownSlots.splice(unknownIndex, 0, movedSlot);
            return false;
          }

          // Only shift fighters between firstAvailablePos and toIndex (consecutive occupied positions)
          const fightersToShift = positionedSlots.filter(
            (s) => (s.position ?? 0) > firstAvailablePos && (s.position ?? 0) <= toIndex
          );

          console.log('[moveSlot] Shift up analysis', {
            toIndex,
            firstAvailablePos,
            fightersToShiftCount: fightersToShift.length
          });

          // Shift these fighters: each gets -1 to their position
          const newPositionMap = new Map<number, number>();
          for (const fighter of fightersToShift) {
            const oldPos = fighter.position ?? 0;
            newPositionMap.set(oldPos, oldPos - 1);
          }

          // Apply the position changes
          newSlots = positionedSlots.map((slot) => {
            const oldPos = slot.position ?? 0;
            if (newPositionMap.has(oldPos)) {
              return { ...slot, position: newPositionMap.get(oldPos)! };
            }
            return slot;
          });
        }
      } else {
        // No collision - just use existing slots
        newSlots = [...positionedSlots];
      }

      // Set the slot's position to the target position
      movedSlot.position = toIndex;

      // Add the moved slot and sort by position
      newSlots = [...newSlots, movedSlot].sort((a, b) => (a.position || 0) - (b.position || 0));

      console.log('[moveSlot] isFromUnknown - handled collision', {
        toIndex,
        hadCollision: !!existingSlotAtPosition,
        shiftDirection,
        movedSlotId: movedSlot.id,
        movedSlotPosition: movedSlot.position,
        newSlotsLength: newSlots.length
      });

      setUnknownSlots(newUnknownSlots);
    } else {
      // This shouldn't happen - we only support moving FROM unknown tier
      console.warn('[moveSlot] Unexpected: moving within positioned fighters not supported');
      return false;
    }

    const updatedSlots = newSlots;

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
    return true;
  };

  const handleSelectSlot = (slot: MTierSlot) => {
    setSelectedSlot(slot);
  };

  const handleMoveToPosition = (toIndex: number) => {
    if (!selectedSlot) return;

    const fromIndex = positionedSlots.findIndex((s) => s.id === selectedSlot.id);
    const isFromUnknown = fromIndex === -1;

    // Only allow moving FROM unknown tier
    if (!isFromUnknown) {
      // If a positioned fighter is selected and user clicks another fighter, just deselect
      console.log('[handleMoveToPosition] Positioned fighter selected, deselecting');
      setSelectedSlot(null);
      return;
    }

    // Moving from unknown tier to positioned tier (clicking on a positioned fighter)
    // Try 'down' direction first (shift fighters down to make room)
    let success = moveSlot(-1, toIndex, true, 'down');

    // If that failed (no room going down), try 'up' direction
    if (!success) {
      console.log('[handleMoveToPosition] Shift down failed, trying shift up');
      success = moveSlot(-1, toIndex, true, 'up');
    }

    if (!success) {
      console.warn('[handleMoveToPosition] Both shift directions failed - no room to place fighter');
    }

    // Clear selection after move
    setSelectedSlot(null);
  };

  const handleTierLabelClick = (tierIndex: number) => {
    if (!selectedSlot) return;

    // Calculate the start index of the clicked tier (0-based position)
    const targetPosition = TIERS.slice(0, tierIndex).reduce((sum, t) => sum + t.fightersCount, 0);

    console.log('[handleTierLabelClick]', {
      tierIndex,
      targetPosition,
      selectedSlot: selectedSlot.id,
      positionedSlotsCount: positionedSlots.length
    });

    // Move the unknown fighter to the start of the tier
    // Shift existing characters DOWN (higher positions) to make room
    moveSlot(-1, targetPosition, true, 'down');

    // Clear selection after move
    setSelectedSlot(null);
  };

  const handleTierBackgroundClick = (tierIndex: number) => {
    if (!selectedSlot) return;

    // Check if selected slot is from unknown tier
    const isFromUnknown = unknownSlots.findIndex((s) => s.id === selectedSlot.id) !== -1;
    if (!isFromUnknown) return; // Only allow moving unknown fighters via tier background

    // Calculate the end index of the clicked tier (0-based position)
    const tierStartPosition = TIERS.slice(0, tierIndex).reduce(
      (sum, t) => sum + t.fightersCount,
      0
    );
    const targetPosition = tierStartPosition + TIERS[tierIndex].fightersCount - 1;

    console.log('[handleTierBackgroundClick]', {
      tierIndex,
      tierStartPosition,
      targetPosition,
      selectedSlot: selectedSlot.id,
      positionedSlotsCount: positionedSlots.length
    });

    // Move the unknown fighter to the end of the tier
    // Shift existing characters UP (lower positions) to make room
    moveSlot(-1, targetPosition, true, 'up');

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
