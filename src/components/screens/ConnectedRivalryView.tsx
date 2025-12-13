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
import { MFighter } from '../../models/m-fighter';
import { PROVISIONAL_THRESHOLD, STEPS_PER_STOCK } from '../../models/m-game';
import { MRivalry } from '../../models/m-rivalry';
import { useGame } from '../../providers/game';
import { useRivalry, useRivalryContext, useUpdateRivalry } from '../../providers/rivalry';
import { fighterByIdFromGame } from '../../utils';
import { darkStyles, styles } from '../../utils/styles';
import { colors } from '../../utils/colors';
import { Button } from '../common/Button';
import { BattleResults } from './parts/BattleResults';
import { CurrentContest } from './parts/CurrentContest';
import { RivalryView } from './parts/RivalryView';

interface ConnectedRivalryViewProps {
  navigation: {
    navigate: (screen: string) => void;
    setOptions: (options: { title?: string; headerTitle?: string }) => void;
  };
}

export function ConnectedRivalryView({
  navigation
}: ConnectedRivalryViewProps): React.ReactElement {
  const updateRivalryProvider = useUpdateRivalry();
  const rivalry = useRivalry();
  const game = useGame();
  const { isUserB } = useRivalryContext();

  const [tiersReady, setTiersReady] = useState<boolean>(false);
  const [isResolvingContest, setIsResolvingContest] = useState<boolean>(false);
  const [shufflingSlot, setShufflingSlot] = useState<'A' | 'B' | null>(null);
  const [canShuffle, setCanShuffle] = useState<boolean>(false);
  const [battleResults, setBattleResults] = useState<{
    contest: MContest;
    fighterA: MFighter;
    fighterB: MFighter;
    winnerPosition: number | null;
    loserPosition: number | null;
  } | null>(null);

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

      // Re-enable the query to fetch the new contest data
      // This prevents the race condition where early refetches show stale contest data
      setIsResolvingContest(false);
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

    if (!rivalry?.currentContest || !game) return;

    const isATheWinner = (rivalry.currentContest.result || 0) > 0;

    // Capture battle results data for the results screen with calculated new positions
    const gameData = (game as any).baseGame || game;
    const foundFighterA = fighterByIdFromGame(
      gameData,
      rivalry.currentContest.tierSlotA?.fighterId || ''
    );
    const foundFighterB = fighterByIdFromGame(
      gameData,
      rivalry.currentContest.tierSlotB?.fighterId || ''
    );

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

    const standingResult = rivalry.adjustStanding();

    if (foundFighterA && foundFighterB && standingResult) {
      setBattleResults({
        contest: rivalry.currentContest,
        fighterA: foundFighterA,
        fighterB: foundFighterB,
        winnerPosition: standingResult.winnerPosition,
        loserPosition: standingResult.loserPosition
      });
    }

    resolveContestMutation.mutate();
  }

  const {
    data: _,
    isLoading,
    isError,
    error
  } = useRivalryWithAllInfoQuery({
    rivalry,
    enabled: !isResolvingContest,
    onSuccess: (populatedRivalry: MRivalry) => {
      updateRivalryProvider(populatedRivalry);
      setIsResolvingContest(false);
      setTiersReady(true);
      setBattleResults(null); // Clear battle results when new contest is ready
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
      {/* Priority 1: Battle Results Screen */}
      {battleResults && rivalry && (
        <BattleResults
          contest={battleResults.contest}
          fighterA={battleResults.fighterA}
          fighterB={battleResults.fighterB}
          rivalry={rivalry}
          isUserB={isUserB}
          winnerPosition={battleResults.winnerPosition}
          loserPosition={battleResults.loserPosition}
        />
      )}

      {/* Priority 2: Resolving Contest */}
      {!battleResults && isResolvingContest && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[styles.text, darkStyles.text, { fontSize: 18 }]}>Resolving Contest...</Text>
        </View>
      )}

      {/* Priority 3: Creating Contest */}
      {!battleResults && !isResolvingContest && createContestMutation.isPending && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[styles.text, darkStyles.text, { fontSize: 18 }]}>Creating Contest...</Text>
        </View>
      )}

      {/* Errors */}
      {!battleResults &&
        !isResolvingContest &&
        !createContestMutation.isPending &&
        createContestMutation.isError && (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 16
            }}
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

      {!battleResults && !isResolvingContest && !createContestMutation.isPending && isLoading && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[styles.text, darkStyles.text, { fontSize: 18 }]}>Loading Rivalry...</Text>
        </View>
      )}

      {!battleResults && !isResolvingContest && !createContestMutation.isPending && isError && (
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

      {!battleResults &&
        tiersReady &&
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

      {!battleResults &&
        tiersReady &&
        !rivalry?.currentContest &&
        !createContestMutation.isPending && (
          <Button
            text="+ Create new contest"
            onPress={() => {
              createContestMutation.mutate();
            }}
            style={{ height: 56, paddingHorizontal: 32, width: 256 }}
          />
        )}

      {!battleResults && tiersReady && !createContestMutation.isPending && (
        <RivalryView navigation={navigation} />
      )}

      {/* Priority 4: Preparing Tiers */}
      {!battleResults &&
        !isResolvingContest &&
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
