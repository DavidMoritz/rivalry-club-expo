import React, { ReactNode, useEffect, useState } from 'react';
import { View } from 'react-native';

import { MTierList, TIERS, TierWithSlots } from '../../../models/m-tier-list';
import { MTierSlot } from '../../../models/m-tier-slot';
import { SyncedScrollView } from './SyncedScrollView';
import TierListRow from './TierListRow';

export function TierListDisplay({
  tierList,
  tierListSignifier,
  unlinked = false
}: {
  tierList: MTierList;
  tierListSignifier: 'A' | 'B';
  unlinked: boolean;
}): ReactNode {
  const [tierSlotsSorted, setTierSlotsSorted] = useState<TierWithSlots[]>([]);
  const [unknownSlots, setUnknownSlots] = useState<MTierSlot[]>([]);

  useEffect(() => {
    if (!tierList.slots?.length) return;

    const allSlots = tierList.slots;

    // UNKNOWN TIER: Separate positioned and unknown fighters
    const positionedSlots = allSlots.filter(
      (slot) => slot.position !== null && slot.position !== undefined
    );
    const unknownSlots = allSlots.filter(
      (slot) => slot.position === null || slot.position === undefined
    );

    // Sort only positioned fighters
    const positionedSorted = positionedSlots.sort(
      (a, b) => (a?.position || 0) - (b?.position || 0)
    );

    // Map tiers to their slots based on position ranges
    const tiersWithSlots = TIERS.map((tier, tierIndex) => {
      const startIdx = TIERS.slice(0, tierIndex).reduce((sum, t) => sum + t.fightersCount, 0);
      const endIdx = startIdx + tier.fightersCount;

      // Find slots within this tier's position range
      const tierSlots = positionedSorted.filter(
        (slot) => slot.position !== null && slot.position >= startIdx && slot.position < endIdx
      );

      return {
        ...tier,
        slots: tierSlots
      };
    });

    setTierSlotsSorted(tiersWithSlots);
    setUnknownSlots(unknownSlots);
  }, [tierList]);

  return (
    <View style={{ flex: 1, marginVertical: 8 }}>
      <SyncedScrollView id={Math.random()} unlinked={unlinked}>
        {tierSlotsSorted.map((sortedTier: TierWithSlots, index: number) => (
          <TierListRow
            key={`${sortedTier.label}-${tierList.id}`}
            label={sortedTier.label}
            color={sortedTier.color}
            active={false}
            slots={sortedTier.slots}
          />
        ))}
        {unknownSlots.length > 0 && (
          <TierListRow
            key={`UNKNOWN-${tierList.id}`}
            label="U"
            color="hsl(0, 0%, 50%)"
            active={false}
            slots={unknownSlots}
          />
        )}
      </SyncedScrollView>
    </View>
  );
}
