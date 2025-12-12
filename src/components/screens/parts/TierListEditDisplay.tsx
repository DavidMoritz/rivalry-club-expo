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
import { colors } from '../../../utils/colors';

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
    shiftDirection: 'up' | 'down' = 'down',
    customPositionedSlots?: MTierSlot[],
    customUnknownSlots?: MTierSlot[]
  ): boolean => {
    if (!isFromUnknown && fromIndex === toIndex) return false;

    // Use custom arrays if provided (for when we've already updated state)
    const currentPositionedSlots = customPositionedSlots || positionedSlots;
    const currentUnknownSlots = customUnknownSlots || unknownSlots;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    let newSlots: MTierSlot[];
    let newUnknownSlots = [...currentUnknownSlots];

    if (isFromUnknown) {
      // Moving from unknown tier to positioned tier
      const unknownIndex = currentUnknownSlots.findIndex((s) => s.id === selectedSlot?.id);
      if (unknownIndex === -1) return false;

      const [movedSlot] = newUnknownSlots.splice(unknownIndex, 1);

      // Handle collision: check if there's already a slot at toIndex
      const existingSlotAtPosition = currentPositionedSlots.find((s) => s.position === toIndex);

      if (existingSlotAtPosition) {
        // There's a collision - cascade positions until finding an empty slot
        const occupiedPositions = new Set(currentPositionedSlots.map((s) => s.position));

        if (shiftDirection === 'down') {
          // Find the first available position starting from toIndex
          let firstAvailablePos = toIndex;
          while (occupiedPositions.has(firstAvailablePos) && firstAvailablePos <= 85) {
            firstAvailablePos++;
          }

          if (firstAvailablePos > 85) {
            console.warn(
              '[moveSlot] Cannot place fighter - no empty slots in range [toIndex, 85]',
              {
                toIndex
              }
            );
            newUnknownSlots.splice(unknownIndex, 0, movedSlot);
            return false;
          }

          // Only shift fighters between toIndex and firstAvailablePos (consecutive occupied positions)
          const fightersToShift = currentPositionedSlots.filter(
            (s) => (s.position ?? 0) >= toIndex && (s.position ?? 0) < firstAvailablePos
          );

          // Shift these fighters: each gets +1 to their position
          const newPositionMap = new Map<number, number>();
          for (const fighter of fightersToShift) {
            const oldPos = fighter.position ?? 0;
            newPositionMap.set(oldPos, oldPos + 1);
          }

          // Apply the position changes
          newSlots = currentPositionedSlots.map((slot) => {
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
          const fightersToShift = currentPositionedSlots.filter(
            (s) => (s.position ?? 0) > firstAvailablePos && (s.position ?? 0) <= toIndex
          );

          // Shift these fighters: each gets -1 to their position
          const newPositionMap = new Map<number, number>();
          for (const fighter of fightersToShift) {
            const oldPos = fighter.position ?? 0;
            newPositionMap.set(oldPos, oldPos - 1);
          }

          // Apply the position changes
          newSlots = currentPositionedSlots.map((slot) => {
            const oldPos = slot.position ?? 0;
            if (newPositionMap.has(oldPos)) {
              return { ...slot, position: newPositionMap.get(oldPos)! };
            }
            return slot;
          });
        }
      } else {
        // No collision - just use existing slots
        newSlots = [...currentPositionedSlots];
      }

      // Set the slot's position to the target position
      movedSlot.position = toIndex;

      // Add the moved slot and sort by position
      newSlots = [...newSlots, movedSlot].sort((a, b) => (a.position || 0) - (b.position || 0));

      setUnknownSlots(newUnknownSlots);
    } else {
      // This shouldn't happen - we only support moving FROM unknown tier
      console.warn('[moveSlot] Unexpected: moving within positioned fighters not supported');
      return false;
    }

    const updatedSlots = newSlots;

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

    // If the selected fighter has a position, temporarily remove it
    let updatedPositioned = positionedSlots;
    let updatedUnknown = unknownSlots;
    let originalPosition: number | null | undefined = null;

    if (!isFromUnknown) {
      originalPosition = selectedSlot?.position;

      // Remove fighter from positioned slots
      updatedPositioned = positionedSlots.filter((s) => s.id !== selectedSlot.id);
      const removedFighter = { ...selectedSlot, position: null };
      updatedUnknown = [...unknownSlots, removedFighter];

      // Update the selected slot to have null position
      selectedSlot.position = null;
    }

    // Now treat as moving from unknown tier (clicking on a positioned fighter)
    // Try 'down' direction first (shift fighters down to make room)
    let success = moveSlot(-1, toIndex, true, 'down', updatedPositioned, updatedUnknown);

    // If that failed (no room going down), try 'up' direction
    if (!success) {
      success = moveSlot(-1, toIndex, true, 'up', updatedPositioned, updatedUnknown);
    }

    // If both directions failed and we had a positioned fighter, restore it
    if (!success && originalPosition !== null) {
      console.warn(
        '[handleMoveToPosition] Both shift directions failed - restoring fighter to original position',
        {
          fighterId: selectedSlot.id,
          originalPosition
        }
      );

      // Restore the fighter to its original position
      selectedSlot.position = originalPosition;
      const restoredPositioned = [...updatedPositioned, selectedSlot].sort(
        (a, b) => (a.position || 0) - (b.position || 0)
      );
      const restoredUnknown = updatedUnknown.filter((s) => s.id !== selectedSlot.id);

      setPositionedSlots(restoredPositioned);
      setUnknownSlots(restoredUnknown);
    } else if (!success) {
      console.warn('[handleMoveToPosition] Move failed - no room to place fighter');
    }

    // Clear selection after move
    setSelectedSlot(null);
  };

  const handleTierLabelClick = (tierIndex: number) => {
    if (!selectedSlot) return;

    // If the selected fighter has a position, temporarily remove it
    const fromIndex = positionedSlots.findIndex((s) => s.id === selectedSlot.id);
    const isFromUnknown = fromIndex === -1;

    let updatedPositioned = positionedSlots;
    let updatedUnknown = unknownSlots;
    let originalPosition: number | null | undefined = null;

    if (!isFromUnknown) {
      originalPosition = selectedSlot.position;

      // Remove fighter from positioned slots
      updatedPositioned = positionedSlots.filter((s) => s.id !== selectedSlot.id);
      const removedFighter = { ...selectedSlot, position: null };
      updatedUnknown = [...unknownSlots, removedFighter];
      selectedSlot.position = null;
    }

    // Calculate the start index of the clicked tier (0-based position)
    const targetPosition = TIERS.slice(0, tierIndex).reduce((sum, t) => sum + t.fightersCount, 0);

    // Move the fighter to the start of the tier
    // Shift existing characters DOWN (higher positions) to make room
    const success = moveSlot(-1, targetPosition, true, 'down', updatedPositioned, updatedUnknown);

    // If move failed and we had a positioned fighter, restore it
    if (!success && originalPosition !== null) {
      console.warn('[handleTierLabelClick] Move failed - restoring fighter to original position', {
        fighterId: selectedSlot.id,
        originalPosition
      });

      selectedSlot.position = originalPosition;
      const restoredPositioned = [...updatedPositioned, selectedSlot].sort(
        (a, b) => (a.position || 0) - (b.position || 0)
      );
      const restoredUnknown = updatedUnknown.filter((s) => s.id !== selectedSlot.id);

      setPositionedSlots(restoredPositioned);
      setUnknownSlots(restoredUnknown);
    }

    // Clear selection after move
    setSelectedSlot(null);
  };

  const handleTierBackgroundClick = (tierIndex: number) => {
    if (!selectedSlot) return;

    // If the selected fighter has a position, temporarily remove it
    const fromIndex = positionedSlots.findIndex((s) => s.id === selectedSlot.id);
    const isFromUnknown = fromIndex === -1;

    let updatedPositioned = positionedSlots;
    let updatedUnknown = unknownSlots;
    let originalPosition: number | null | undefined = null;

    if (!isFromUnknown) {
      originalPosition = selectedSlot.position;

      // Remove fighter from positioned slots
      updatedPositioned = positionedSlots.filter((s) => s.id !== selectedSlot.id);
      const removedFighter = { ...selectedSlot, position: null };
      updatedUnknown = [...unknownSlots, removedFighter];
      selectedSlot.position = null;
    }

    // Calculate the end index of the clicked tier (0-based position)
    const tierStartPosition = TIERS.slice(0, tierIndex).reduce(
      (sum, t) => sum + t.fightersCount,
      0
    );
    const targetPosition = tierStartPosition + TIERS[tierIndex].fightersCount - 1;

    // Move the fighter to the end of the tier
    // Shift existing characters UP (lower positions) to make room
    const success = moveSlot(-1, targetPosition, true, 'up', updatedPositioned, updatedUnknown);

    // If move failed and we had a positioned fighter, restore it
    if (!success && originalPosition !== null) {
      console.warn(
        '[handleTierBackgroundClick] Move failed - restoring fighter to original position',
        {
          fighterId: selectedSlot.id,
          originalPosition
        }
      );

      selectedSlot.position = originalPosition;
      const restoredPositioned = [...updatedPositioned, selectedSlot].sort(
        (a, b) => (a.position || 0) - (b.position || 0)
      );
      const restoredUnknown = updatedUnknown.filter((s) => s.id !== selectedSlot.id);

      setPositionedSlots(restoredPositioned);
      setUnknownSlots(restoredUnknown);
    }

    // Clear selection after move
    setSelectedSlot(null);
  };

  const handleResetAllFighters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    // Set all tier slots to position null
    const resetSlots = tierList.slots.map((slot) => ({
      ...slot,
      position: null
    }));

    // Update tierList
    tierList.slots = resetSlots;

    // Update local state
    setPositionedSlots([]);
    setUnknownSlots(resetSlots);
    setSelectedSlot(null);

    // Notify parent of changes
    onChange();
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
          tierSlot={slot}
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

        // Check if any fighter is selected (positioned or unknown)
        const isAnyFighterSelected = !!selectedSlot;
        const TierLabelContainer = isAnyFighterSelected ? TouchableOpacity : View;
        const TierBackgroundContainer = isAnyFighterSelected ? TouchableOpacity : View;

        return (
          <View key={tier.label}>
            <View
              style={{
                flexDirection: 'row',
                borderBottomWidth: 1,
                borderBottomColor: colors.gray700,
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
                  borderRightColor: colors.slate800,
                  backgroundColor: isAnyFighterSelected
                    ? colors.tierRowDarkAlpha
                    : colors.tierRowLight
                }}
                onPress={isAnyFighterSelected ? () => handleTierLabelClick(tierIndex) : undefined}
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
                onPress={
                  isAnyFighterSelected ? () => handleTierBackgroundClick(tierIndex) : undefined
                }
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
              borderBottomColor: colors.gray700,
              backgroundColor: colors.tierU,
              minHeight: 80
            }}
          >
            <View
              style={{
                width: 60,
                justifyContent: 'center',
                alignItems: 'center',
                borderRightWidth: 2,
                borderRightColor: colors.slate800,
                backgroundColor: colors.tierRowLight
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
                      tierSlot={slot}
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

      {/* RESET BUTTON: Shows whenever there are positioned fighters */}
      {positionedSlots.length > 0 && (
        <TouchableOpacity
          onPress={handleResetAllFighters}
          style={{
            backgroundColor: '#eab308',
            padding: 16,
            marginTop: 16,
            marginHorizontal: 16,
            borderRadius: 8,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: 'black', fontSize: 16, fontWeight: 'bold' }}>
            ⚠️ Reset all fighters
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
