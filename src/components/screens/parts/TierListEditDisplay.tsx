import { type ReactNode, useEffect, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import type { MGame } from '../../../models/m-game';
import { type MTierList, TIERS } from '../../../models/m-tier-list';
import type { MTierSlot } from '../../../models/m-tier-slot';
import { useGame } from '../../../providers/game';
import { useRivalryContext } from '../../../providers/rivalry';
import { fighterByIdFromGame } from '../../../utils';
import { colors } from '../../../utils/colors';
import { CharacterDisplay } from '../../common/CharacterDisplay';
import {
  generateShareCode,
  isShareCodeAvailable,
  useCloneSnapshotMutation,
  useCreateSnapshotMutation,
  useSnapshotByShareCodeQuery,
  useUserSnapshotsQuery
} from '../../../controllers/c-snapshot';
import type { SnapshotArrangement } from '../../../models/m-tier-list-snapshot';

// Style constants for selected state
const SELECTED_OPACITY = 0.5;
const SELECTED_SCALE = 0.9;

// Maximum tier position (total slots across all tiers minus 1)
const MAX_TIER_POSITION = 85;

interface TierListEditDisplayProps {
  tierList: MTierList;
  onChange: () => void;
}

interface MoveSlotOptions {
  fromIndex: number;
  toIndex: number;
  isFromUnknown?: boolean;
  shiftDirection?: 'up' | 'down';
  customPositionedSlots?: MTierSlot[];
  customUnknownSlots?: MTierSlot[];
}

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function TierListEditDisplay({ tierList, onChange }: TierListEditDisplayProps): ReactNode {
  const game = useGame() as MGame;
  const { userId } = useRivalryContext();
  const [positionedSlots, setPositionedSlots] = useState<MTierSlot[]>([]);
  const [unknownSlots, setUnknownSlots] = useState<MTierSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<MTierSlot | null>(null);

  // Snapshot states
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [shareCodeInput, setShareCodeInput] = useState('');
  const [importError, setImportError] = useState('');

  // Snapshot hooks
  const { data: userSnapshots = [] } = useUserSnapshotsQuery({
    userId,
    gameId: game?.id
  });
  const { mutate: createSnapshot } = useCreateSnapshotMutation({
    onSuccess: (snapshot) => {
      Alert.alert(
        'Snapshot Saved!',
        `Your tier list has been saved with code: ${snapshot.shareCode}\n\nShare this code with others to let them import your tier list!`,
        [{ text: 'OK' }]
      );
      setShowSaveDialog(false);
      setSnapshotName('');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    }
  });
  const { mutate: cloneSnapshot } = useCloneSnapshotMutation({
    onSuccess: () => {
      Alert.alert('Success', 'Snapshot imported to your collection!');
      setShowImportDialog(false);
      setShareCodeInput('');
      setImportError('');
    },
    onError: (error) => {
      setImportError('Not found');
    }
  });

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

  // Helper: Find first available position in a direction
  const findFirstAvailablePosition = (
    occupiedPositions: Set<number | null | undefined>,
    startPos: number,
    direction: 'up' | 'down'
  ): number => {
    let pos = startPos;
    if (direction === 'down') {
      while (occupiedPositions.has(pos) && pos <= MAX_TIER_POSITION) {
        pos++;
      }
    } else {
      while (occupiedPositions.has(pos) && pos >= 0) {
        pos--;
      }
    }
    return pos;
  };

  // Helper: Build position shift map for cascade
  const buildPositionShiftMap = (
    slots: MTierSlot[],
    toIndex: number,
    firstAvailablePos: number,
    direction: 'up' | 'down'
  ): Map<number, number> => {
    const newPositionMap = new Map<number, number>();
    const delta = direction === 'down' ? 1 : -1;

    const fightersToShift = slots.filter((s) => {
      const pos = s.position ?? 0;
      return direction === 'down'
        ? pos >= toIndex && pos < firstAvailablePos
        : pos > firstAvailablePos && pos <= toIndex;
    });

    for (const fighter of fightersToShift) {
      const oldPos = fighter.position ?? 0;
      newPositionMap.set(oldPos, oldPos + delta);
    }

    return newPositionMap;
  };

  // Helper: Apply position map to slots
  const applyPositionMap = (slots: MTierSlot[], positionMap: Map<number, number>): MTierSlot[] => {
    return slots.map((slot) => {
      const oldPos = slot.position ?? 0;
      const newPos = positionMap.get(oldPos);
      if (newPos !== undefined) {
        return { ...slot, position: newPos };
      }
      return slot;
    });
  };

  // Helper: Handle collision when placing a slot
  const handleSlotCollision = (options: {
    currentPositionedSlots: MTierSlot[];
    toIndex: number;
    shiftDirection: 'up' | 'down';
    movedSlot: MTierSlot;
    newUnknownSlots: MTierSlot[];
    unknownIndex: number;
  }): MTierSlot[] | null => {
    const {
      currentPositionedSlots,
      toIndex,
      shiftDirection,
      movedSlot,
      newUnknownSlots,
      unknownIndex
    } = options;
    const occupiedPositions = new Set(currentPositionedSlots.map((s) => s.position));

    const firstAvailablePos = findFirstAvailablePosition(
      occupiedPositions,
      toIndex,
      shiftDirection
    );

    const isOutOfBounds =
      shiftDirection === 'down' ? firstAvailablePos > MAX_TIER_POSITION : firstAvailablePos < 0;

    if (isOutOfBounds) {
      const range = shiftDirection === 'down' ? `[toIndex, ${MAX_TIER_POSITION}]` : '[0, toIndex]';
      console.warn(`[moveSlot] Cannot place fighter - no empty slots in range ${range}`, {
        toIndex
      });
      newUnknownSlots.splice(unknownIndex, 0, movedSlot);
      return null;
    }

    const positionMap = buildPositionShiftMap(
      currentPositionedSlots,
      toIndex,
      firstAvailablePos,
      shiftDirection
    );

    return applyPositionMap(currentPositionedSlots, positionMap);
  };

  // Helper: Update tier list with new slots
  const updateTierListSlots = (updatedSlots: MTierSlot[], newUnknownSlots: MTierSlot[]): void => {
    const findSlotById = (id: string) =>
      tierList.slots.find((s) => s.id === id) ?? ({} as MTierSlot);

    const allUpdatedSlots = [
      ...updatedSlots.map((slot) => ({
        ...findSlotById(slot.id),
        position: slot.position
      })),
      ...newUnknownSlots.map((slot) => ({
        ...findSlotById(slot.id)
      }))
    ];

    tierList.slots = allUpdatedSlots;
  };

  const moveSlot = (options: MoveSlotOptions): boolean => {
    const {
      fromIndex,
      toIndex,
      isFromUnknown = false,
      shiftDirection = 'down',
      customPositionedSlots,
      customUnknownSlots
    } = options;

    if (!isFromUnknown && fromIndex === toIndex) return false;

    // Use custom arrays if provided (for when we've already updated state)
    const currentPositionedSlots = customPositionedSlots ?? positionedSlots;
    const currentUnknownSlots = customUnknownSlots ?? unknownSlots;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (!isFromUnknown) {
      // This shouldn't happen - we only support moving FROM unknown tier
      console.warn('[moveSlot] Unexpected: moving within positioned fighters not supported');
      return false;
    }

    // Moving from unknown tier to positioned tier
    const unknownIndex = currentUnknownSlots.findIndex((s) => s.id === selectedSlot?.id);
    if (unknownIndex === -1) return false;

    const newUnknownSlots = [...currentUnknownSlots];
    const [movedSlot] = newUnknownSlots.splice(unknownIndex, 1);

    // Handle collision: check if there's already a slot at toIndex
    const existingSlotAtPosition = currentPositionedSlots.find((s) => s.position === toIndex);

    let newSlots: MTierSlot[];
    if (existingSlotAtPosition) {
      const result = handleSlotCollision({
        currentPositionedSlots,
        toIndex,
        shiftDirection,
        movedSlot,
        newUnknownSlots,
        unknownIndex
      });
      if (result === null) return false;
      newSlots = result;
    } else {
      newSlots = [...currentPositionedSlots];
    }

    // Set the slot's position to the target position
    movedSlot.position = toIndex;

    // Add the moved slot and sort by position
    const updatedSlots = [...newSlots, movedSlot].sort(
      (a, b) => (a.position || 0) - (b.position || 0)
    );

    setUnknownSlots(newUnknownSlots);
    setPositionedSlots(updatedSlots);
    updateTierListSlots(updatedSlots, newUnknownSlots);

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
    let success = moveSlot({
      fromIndex: -1,
      toIndex,
      isFromUnknown: true,
      shiftDirection: 'down',
      customPositionedSlots: updatedPositioned,
      customUnknownSlots: updatedUnknown
    });

    // If that failed (no room going down), try 'up' direction
    if (!success) {
      success = moveSlot({
        fromIndex: -1,
        toIndex,
        isFromUnknown: true,
        shiftDirection: 'up',
        customPositionedSlots: updatedPositioned,
        customUnknownSlots: updatedUnknown
      });
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
    const success = moveSlot({
      fromIndex: -1,
      toIndex: targetPosition,
      isFromUnknown: true,
      shiftDirection: 'down',
      customPositionedSlots: updatedPositioned,
      customUnknownSlots: updatedUnknown
    });

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
    const success = moveSlot({
      fromIndex: -1,
      toIndex: targetPosition,
      isFromUnknown: true,
      shiftDirection: 'up',
      customPositionedSlots: updatedPositioned,
      customUnknownSlots: updatedUnknown
    });

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

  const handleSaveSnapshot = async () => {
    if (!snapshotName.trim()) {
      Alert.alert('Error', 'Please enter a name for your snapshot');
      return;
    }

    if (!userId || !game?.id) {
      Alert.alert('Error', 'Missing user or game information');
      return;
    }

    // Build arrangement from positioned slots
    const arrangement: SnapshotArrangement[] = positionedSlots.map((slot) => ({
      fighterId: slot.fighterId,
      position: slot.position ?? 0
    }));

    // Generate share code
    const isFirst = userSnapshots.length === 0;
    let shareCode = generateShareCode(userId, isFirst);

    // Ensure uniqueness
    let attempts = 0;
    while (!(await isShareCodeAvailable(shareCode)) && attempts < 10) {
      shareCode = generateShareCode(userId, false);
      attempts++;
    }

    createSnapshot({
      userId,
      gameId: game.id,
      name: snapshotName.trim(),
      arrangement,
      shareCode
    });
  };

  const handleImportByCode = async () => {
    if (!shareCodeInput.trim()) {
      setImportError('Please enter a share code');
      return;
    }

    if (!game?.id) {
      setImportError('Game information missing');
      return;
    }

    try {
      // Query the snapshot by share code
      const client = (await import('aws-amplify/data')).generateClient<
        typeof import('../../../amplify/data/resource')
      >();
      const { data, errors } = await client.models.TierListSnapshot.snapshotByShareCode({
        shareCode: shareCodeInput.toUpperCase()
      });

      if (errors || !data || data.length === 0) {
        setImportError('Not found');
        return;
      }

      const snapshot = data[0];

      // Validate game match
      if (snapshot.gameId !== game.id) {
        setImportError('Not found');
        return;
      }

      // Parse arrangement and apply to tier list
      const arrangement = JSON.parse(snapshot.arrangement as string) as SnapshotArrangement[];

      // Create a map of fighterId to position from the snapshot
      const positionMap = new Map(arrangement.map((item) => [item.fighterId, item.position]));

      // Update all slots with the new positions
      const updatedSlots = tierList.slots.map((slot) => {
        const newPosition = positionMap.get(slot.fighterId);
        return {
          ...slot,
          position: newPosition ?? null
        };
      });

      // Update tierList
      tierList.slots = updatedSlots;

      // Update local state
      const positioned = updatedSlots
        .filter((slot) => slot.position !== null && slot.position !== undefined)
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      const unknown = updatedSlots.filter(
        (slot) => slot.position === null || slot.position === undefined
      );

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setPositionedSlots(positioned);
      setUnknownSlots(unknown);

      // Notify parent of changes
      onChange();

      // Close dialog and show success
      setShowImportDialog(false);
      setShareCodeInput('');
      setImportError('');
      Alert.alert('Success!', `Imported tier list: ${snapshot.name}`);
    } catch (error) {
      console.error('[handleImportByCode] Error:', error);
      setImportError('Not found');
    }
  };

  const renderCharacter = (slot: MTierSlot, index: number) => {
    const fighter = fighterByIdFromGame(game, slot.fighterId);
    if (!fighter) return null;

    const isSelected = selectedSlot?.id === slot.id;

    return (
      <View
        key={slot.id}
        style={{
          opacity: isSelected ? SELECTED_OPACITY : 1,
          transform: [{ scale: isSelected ? SELECTED_SCALE : 1 }],
          borderWidth: isSelected ? 1 : 0,
          borderColor: colors.blue500,
          borderRadius: 4,
          margin: isSelected ? -1 : 0
        }}
      >
        <CharacterDisplay
          fighter={fighter}
          height={45}
          hideName={true}
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
          tierSlot={slot}
          zoomMultiplier={0.65}
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
                onPress={isAnyFighterSelected ? () => handleTierLabelClick(tierIndex) : undefined}
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
              >
                <Text
                  style={{
                    fontSize: 32,
                    fontWeight: 'bold',
                    color: colors.black,
                    opacity: 1
                  }}
                >
                  {tier.label}
                </Text>
              </TierLabelContainer>
              <TierBackgroundContainer
                onPress={
                  isAnyFighterSelected ? () => handleTierBackgroundClick(tierIndex) : undefined
                }
                style={{
                  flex: 1,
                  paddingVertical: 4,
                  paddingHorizontal: 4,
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 4
                }}
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
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: 'bold',
                  color: colors.black,
                  opacity: 1
                }}
              >
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
                      opacity: isSelected ? SELECTED_OPACITY : 1,
                      transform: [{ scale: isSelected ? SELECTED_SCALE : 1 }],
                      borderWidth: isSelected ? 1 : 0,
                      borderColor: colors.blue500,
                      borderRadius: 4,
                      margin: isSelected ? -1 : 0
                    }}
                  >
                    <CharacterDisplay
                      fighter={fighter}
                      height={45}
                      hideName={true}
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
                      tierSlot={slot}
                      zoomMultiplier={0.65}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* SNAPSHOT BUTTONS */}
      {positionedSlots.length > 0 && (
        <View style={{ marginTop: 16, marginHorizontal: 16, gap: 12 }}>
          {/* Import Snapshot Button - Only show if user has snapshots */}
          {userSnapshots.length > 0 && (
            <TouchableOpacity
              onPress={() => setShowImportDialog(true)}
              style={{
                backgroundColor: colors.blue500,
                padding: 16,
                borderRadius: 8,
                alignItems: 'center'
              }}
            >
              <Text
                style={{
                  color: colors.white,
                  fontSize: 16,
                  fontWeight: 'bold'
                }}
              >
                Import Snapshot
              </Text>
            </TouchableOpacity>
          )}

          {/* Save Snapshot Button */}
          {!showSaveDialog && (
            <TouchableOpacity
              onPress={() => setShowSaveDialog(true)}
              style={{
                backgroundColor: colors.green700,
                padding: 16,
                borderRadius: 8,
                alignItems: 'center'
              }}
            >
              <Text style={{ color: colors.white, fontSize: 16, fontWeight: 'bold' }}>
                Save Snapshot
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Save Snapshot Dialog */}
      {showSaveDialog && (
        <View
          style={{
            marginTop: 16,
            marginHorizontal: 16,
            padding: 16,
            backgroundColor: colors.gray800,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: colors.green700
          }}
        >
          <Text
            style={{
              color: colors.white,
              fontSize: 18,
              fontWeight: 'bold',
              marginBottom: 12
            }}
          >
            Save Snapshot
          </Text>
          <Text style={{ color: colors.gray400, marginBottom: 8 }}>
            Enter a name for this tier list:
          </Text>
          <TextInput
            value={snapshotName}
            onChangeText={setSnapshotName}
            placeholder="e.g., My Best Tier List"
            placeholderTextColor={colors.gray500}
            style={{
              backgroundColor: colors.gray700,
              color: colors.white,
              padding: 12,
              borderRadius: 4,
              marginBottom: 12
            }}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => {
                setShowSaveDialog(false);
                setSnapshotName('');
              }}
              style={{
                flex: 1,
                backgroundColor: colors.gray600,
                padding: 12,
                borderRadius: 4,
                alignItems: 'center'
              }}
            >
              <Text style={{ color: colors.white, fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveSnapshot}
              style={{
                flex: 1,
                backgroundColor: colors.green700,
                padding: 12,
                borderRadius: 4,
                alignItems: 'center'
              }}
            >
              <Text style={{ color: colors.white, fontWeight: 'bold' }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Import Snapshot Dialog */}
      {showImportDialog && (
        <View
          style={{
            marginTop: 16,
            marginHorizontal: 16,
            padding: 16,
            backgroundColor: colors.gray800,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: colors.blue500
          }}
        >
          <Text
            style={{
              color: colors.white,
              fontSize: 18,
              fontWeight: 'bold',
              marginBottom: 12
            }}
          >
            Import Snapshot
          </Text>
          <Text style={{ color: colors.gray400, marginBottom: 8 }}>Enter share code:</Text>
          <TextInput
            value={shareCodeInput.toUpperCase()}
            onChangeText={(text) => {
              setShareCodeInput(text.toUpperCase());
              setImportError('');
            }}
            placeholder="e.g., A315A"
            placeholderTextColor={colors.gray500}
            autoCapitalize="characters"
            style={{
              backgroundColor: colors.gray700,
              color: colors.white,
              padding: 12,
              borderRadius: 4,
              marginBottom: 8
            }}
          />
          {importError && (
            <Text style={{ color: colors.red500, marginBottom: 8, fontSize: 14 }}>
              {importError}
            </Text>
          )}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => {
                setShowImportDialog(false);
                setShareCodeInput('');
                setImportError('');
              }}
              style={{
                flex: 1,
                backgroundColor: colors.gray600,
                padding: 12,
                borderRadius: 4,
                alignItems: 'center'
              }}
            >
              <Text style={{ color: colors.white, fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleImportByCode}
              style={{
                flex: 1,
                backgroundColor: colors.blue500,
                padding: 12,
                borderRadius: 4,
                alignItems: 'center'
              }}
            >
              <Text style={{ color: colors.white, fontWeight: 'bold' }}>Import</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* RESET BUTTON: Shows whenever there are positioned fighters */}
      {positionedSlots.length > 0 && (
        <TouchableOpacity
          onPress={handleResetAllFighters}
          style={{
            backgroundColor: colors.yellow500,
            padding: 16,
            marginTop: 16,
            marginHorizontal: 16,
            borderRadius: 8,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: colors.black, fontSize: 16, fontWeight: 'bold' }}>
            ⚠️ Reset all fighters
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
