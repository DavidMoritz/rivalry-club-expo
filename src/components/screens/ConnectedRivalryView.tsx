import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { incrementFighterStats } from '../../controllers/c-increment-stats';
import {
  useCreateContestMutation,
  useRivalryWithAllInfoQuery,
  useUpdateContestMutation,
  useUpdateContestTierListsMutation,
  useUpdateCurrentContestShuffleTierSlotsMutation,
  useUpdateRivalryMutation,
  useUpdateTierSlotsMutation
} from '../../controllers/c-rivalry';
import { MContest } from '../../models/m-contest';
import { PROVISIONAL_THRESHOLD, STEPS_PER_STOCK } from '../../models/m-game';
import { MRivalry } from '../../models/m-rivalry';
import { useRivalry, useUpdateRivalry } from '../../providers/rivalry';
import { darkStyles, styles } from '../../utils/styles';
import { colors } from '../../utils/colors';
import { Button } from '../common/Button';
import { CurrentContest } from './parts/CurrentContest';
import { RivalryView } from './parts/RivalryView';

interface ConnectedRivalryViewProps {
  navigation: {
    navigate: (screen: string) => void;
    setOptions: (options: { title?: string; headerTitle?: string }) => void;
  };
}

export function ConnectedRivalryView({ navigation }: ConnectedRivalryViewProps): React.ReactElement {
  const updateRivalryProvider = useUpdateRivalry();
  const rivalry = useRivalry();

  const [tiersReady, setTiersReady] = useState<boolean>(false);
  const [isResolvingContest, setIsResolvingContest] = useState<boolean>(false);
  const [shufflingSlot, setShufflingSlot] = useState<'A' | 'B' | null>(null);
  const [canShuffle, setCanShuffle] = useState<boolean>(false);

  const updateRivalryMutation = useUpdateRivalryMutation({
    rivalry
  });

  const updateRivalryProviderAndMutation = (overrides?: {
    contestCount?: number;
    currentContestId?: string | null;
  }) => {
    if (!rivalry) return;

    updateRivalryProvider(rivalry);
    updateRivalryMutation.mutate(overrides);
  };

  const createContestMutation = useCreateContestMutation({
    rivalry,
    onSuccess: (currentContest: MContest) => {
      if (!rivalry) return;

      // Don't call rivalry.setCurrentContest here - the tier slots won't be available yet
      // Let useRivalryWithAllInfoQuery refetch and populate everything properly

      const newContestCount = (rivalry.contestCount || 0) + 1;
      rivalry.contestCount = newContestCount;
      updateRivalryProviderAndMutation({
        currentContestId: currentContest.id,
        contestCount: newContestCount
      });
      // Don't set tiersReady here - let useRivalryWithAllInfoQuery.onSuccess handle it
      // after the query refetches with the new contest data
    }
  });

  const updateTierSlotsAMutation = useUpdateTierSlotsMutation({
    rivalry,
    tierListSignifier: 'A'
  });

  const updateTierSlotsBMutation = useUpdateTierSlotsMutation({
    rivalry,
    tierListSignifier: 'B'
  });

  const updateTierListsMutation = useUpdateContestTierListsMutation({
    contest: rivalry?.currentContest,
    onSuccess: () => {
      if (!rivalry) return;

      // Pass the actual POSITION values, not indices
      rivalry.tierListA?.adjustTierSlotPositionBySteps(
        rivalry.currentContest?.tierSlotA?.position as number,
        (rivalry.currentContest?.result as number) * STEPS_PER_STOCK * -1
      );
      rivalry.tierListB?.adjustTierSlotPositionBySteps(
        rivalry.currentContest?.tierSlotB?.position as number,
        (rivalry.currentContest?.result as number) * STEPS_PER_STOCK
      );

      updateTierSlotsAMutation.mutate();
      updateTierSlotsBMutation.mutate();

      createContestMutation.mutate();
    }
  });

  const resolveContestMutation = useUpdateContestMutation({
    rivalry,
    onSuccess: () => {
      if (!(rivalry && rivalry.tierListA && rivalry.tierListB)) return;

      if (!(rivalry.currentContest?.tierSlotA && rivalry.currentContest?.tierSlotB)) {
        return;
      }

      rivalry.currentContest.tierSlotA.tierList = rivalry.tierListA;
      rivalry.currentContest.tierSlotB.tierList = rivalry.tierListB;

      updateTierListsMutation.mutate();
    }
  });

  const updateCurrentContestShuffleTierSlotsMutation =
    useUpdateCurrentContestShuffleTierSlotsMutation({
      rivalry,
      onSuccess: (currentContest: MContest) => {
        if (!rivalry) return;

        rivalry.currentContest = currentContest;
        setShufflingSlot(null); // Clear shuffling state when done
      }
    });

  async function handleResolveContest() {
    setIsResolvingContest(true);
    setTiersReady(false);
    setCanShuffle(false); // Reset shuffle state when contest is resolved

    if (!rivalry?.currentContest) return;

    const isATheWinner = (rivalry.currentContest.result || 0) > 0;

    if (
      rivalry.currentContest.tierSlotA &&
      (rivalry.currentContest.tierSlotA.contestCount ?? 0) >= PROVISIONAL_THRESHOLD
    ) {
      try {
        await incrementFighterStats(rivalry.currentContest.tierSlotA.fighterId, isATheWinner);
      } catch (error) {
        console.error('[Fighter Stats] Failed to update Fighter A:', error);
      }
    }

    if (
      rivalry.currentContest.tierSlotB &&
      (rivalry.currentContest.tierSlotB.contestCount ?? 0) >= PROVISIONAL_THRESHOLD
    ) {
      try {
        await incrementFighterStats(rivalry.currentContest.tierSlotB.fighterId, !isATheWinner);
      } catch (error) {
        console.error('[Fighter Stats] Failed to update Fighter B:', error);
      }
    }

    rivalry.adjustStanding();

    resolveContestMutation.mutate();
  }

  const {
    data: _,
    isLoading,
    isError,
    error
  } = useRivalryWithAllInfoQuery({
    rivalry,
    onSuccess: (populatedRivalry: MRivalry) => {
      updateRivalryProvider(populatedRivalry);
      setIsResolvingContest(false);
      setTiersReady(true);
    }
  });

  useEffect(() => {
    navigation.setOptions({
      headerTitle: rivalry?.displayTitle() || 'Header Title'
    });
  }, [navigation, rivalry]);

  const handlePressShuffle = (slot: 'A' | 'B') => {
    setShufflingSlot(slot); // Track which slot is being shuffled
    updateCurrentContestShuffleTierSlotsMutation.mutate(slot);
  };

  return (
    <SafeAreaView
      style={[styles.container, darkStyles.container, { flex: 1, padding: 16 }]}
      edges={['top', 'bottom']}
    >
      {/* Priority 1: Resolving Contest */}
      {isResolvingContest && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[styles.text, darkStyles.text, { fontSize: 18 }]}>Resolving Contest...</Text>
        </View>
      )}

      {/* Priority 2: Creating Contest */}
      {!isResolvingContest && createContestMutation.isPending && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[styles.text, darkStyles.text, { fontSize: 18 }]}>Creating Contest...</Text>
        </View>
      )}

      {/* Errors */}
      {!isResolvingContest && !createContestMutation.isPending && createContestMutation.isError && (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}
        >
          <Text
            style={[
              styles.text,
              darkStyles.text,
              { fontSize: 18, fontWeight: 'bold', color: colors.red600, marginBottom: 16 }
            ]}
          >
            Error
          </Text>
          <Text style={[styles.text, darkStyles.text]}>
            {`Error creating contest: ${createContestMutation.error.message}`}
          </Text>
        </View>
      )}

      {!isResolvingContest && !createContestMutation.isPending && isLoading && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[styles.text, darkStyles.text, { fontSize: 18 }]}>Loading Rivalry...</Text>
        </View>
      )}

      {!isResolvingContest && !createContestMutation.isPending && isError && (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}
        >
          <Text
            style={[
              styles.text,
              darkStyles.text,
              { fontSize: 18, fontWeight: 'bold', color: colors.red600, marginBottom: 16 }
            ]}
          >
            Error
          </Text>
          <Text
            style={[styles.text, darkStyles.text]}
          >{`Error loading rivalry: ${error.message}`}</Text>
        </View>
      )}

      {tiersReady &&
        !isResolvingContest &&
        !createContestMutation.isPending &&
        rivalry?.currentContestId && (
          <CurrentContest
            onPressShuffle={handlePressShuffle}
            onResolveContest={handleResolveContest}
            shufflingSlot={shufflingSlot}
            canShuffle={canShuffle}
            setCanShuffle={setCanShuffle}
          />
        )}

      {tiersReady && !rivalry?.currentContest && !createContestMutation.isPending && (
        <Button
          text="+ Create new contest"
          onPress={() => {
            createContestMutation.mutate();
          }}
          style={{ height: 56, paddingHorizontal: 32, width: 256 }}
        />
      )}

      {tiersReady && !createContestMutation.isPending && <RivalryView navigation={navigation} />}

      {/* Priority 3: Preparing Tiers */}
      {!isResolvingContest &&
        !createContestMutation.isPending &&
        !tiersReady &&
        !isLoading &&
        !isError && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[styles.text, darkStyles.text, { fontSize: 18 }]}>Preparing Tiers...</Text>
          </View>
        )}
    </SafeAreaView>
  );
}
