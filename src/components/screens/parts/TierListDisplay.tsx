import React, { ReactNode, useEffect, useState } from 'react';
import { View } from 'react-native';

import type { Schema } from '../../../../amplify/data/resource';
import { MTierList, TIERS, TierWithSlots } from '../../../models/m-tier-list';
import { SyncedScrollView } from './SyncedScrollView';
import TierListRow from './TierListRow';

type TierSlot = Schema['TierSlot']['type'];

const fightersPerTier = 12;

export function TierListDisplay({
  tierList,
  unlinked = false,
}: {
  tierList: MTierList;
  unlinked: boolean;
}): ReactNode {
  const [tierSlotsSorted, setTierSlotsSorted] = useState<TierWithSlots[]>([]);

  useEffect(() => {
    if (!tierList.tierSlots?.items?.length) return;

    const allSorted = (tierList.tierSlots.items as TierSlot[]).sort(
      (a, b) => (a?.position || 0) - (b?.position || 0),
    );
    const tiersWithSlots = [...TIERS];

    setTierSlotsSorted(
      tiersWithSlots.map(tier => ({
        ...tier,
        slots: allSorted.splice(0, fightersPerTier),
      })),
    );
  }, [tierList]);

  return (
    <View style={{ flex: 1, marginVertical: 8 }}>
      <SyncedScrollView id={Math.random()} unlinked={unlinked}>
        {tierSlotsSorted.map((sortedTier: TierWithSlots) => (
          <TierListRow
            key={`${sortedTier.label}-${tierList.id}`}
            label={sortedTier.label}
            color={sortedTier.color}
            active={false}
            slots={sortedTier.slots}
          />
        ))}
      </SyncedScrollView>
    </View>
  );
}
