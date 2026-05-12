import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { incrementFighterStats } from '../../controllers/c-increment-stats';
import {
  useCreateContestMutation,
  useRivalryWithAllInfoQuery,
  useUpdateContestMutation,
  useUpdateContestTierListsMutation,
  useUpdateCurrentContestShuffleTierSlotsMutation,
  useUpdateRivalryMutation,
  useUpdateTierSlotsMutation,
} from '../../controllers/c-rivalry';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import type { MContest } from '../../models/m-contest';
import type { MFighter } from '../../models/m-fighter';
import { PROVISIONAL_THRESHOLD, STEPS_PER_STOCK } from '../../models/m-game';
import type { MRivalry } from '../../models/m-rivalry';
import { useGame } from '../../providers/game';
import {
  useRivalry,
  useRivalryContext,
  useUpdateRivalry,
} from '../../providers/rivalry';
import { fighterByIdFromGame } from '../../utils';
import { colors } from '../../utils/colors';
import { center, darkStyles, styles } from '../../utils/styles';
import { Button } from '../common/Button';
import { LoadingWithCharacter } from '../common/LoadingWithCharacter';
import { OfflineModal } from '../common/OfflineModal';
import { BattleResults } from './parts/BattleResults';
import { CurrentContest } from './parts/CurrentContest';
import { RivalryView } from './parts/RivalryView';

const RANDOM_SEED_RANGE = 86;

interface ConnectedRivalryViewProps {
  navigation: {
    navigate: (screen: string) => void;
    setOptions: (options: { title?: string; headerTitle?: string }) => void;
  };
}

// Helper: Update fighter stats if threshold is met
async function maybeIncrementFighterStats(
  tierSlot: { fighterId: string; contestCount?: number | null } | undefined,
  isWinner: boolean,
  fighterLabel: string
): Promise<void> {
  if (!tierSlot) return;
  if ((tierSlot.contestCount ?? 0) < PROVISIONAL_THRESHOLD) return;

  try {
    await incrementFighterStats(tierSlot.fighterId, isWinner);
  } catch (statsError) {
    console.error(
      `[Fighter Stats] Failed to update ${fighterLabel}:`,
      statsError
    );
  }
}

// Helper component: Error message
function ErrorMessage({ message }: { message: string }): React.ReactElement {
  return (
    <View style={errorContainerStyle}>
      <Text style={errorTitleStyle}>Error</Text>
      <Text style={[styles.text, darkStyles.text]}>{message}</Text>
    </View>
  );
}

interface RivalryViewContentProps {
  battleResults: {
    contest: MContest;
    fighterA: MFighter;
    fighterB: MFighter;
    winnerPosition: number | null;
    loserPosition: number | null;
  } | null;
  canShowMainContent: boolean;
  canShuffle: boolean;
  createContestError: Error | null;
  handlePressShuffle: (slot: 'A' | 'B') => void;
  handleResolveContest: () => void;
  isCreatingContest: boolean;
  isError: boolean;
  isLoading: boolean;
  isUserB: boolean;
  loadingError: Error | null;
  navigation: ConnectedRivalryViewProps['navigation'];
  onCreateContest: () => void;
  rivalry: MRivalry | null;
  seed: number;
  setCanShuffle: (value: boolean) => void;
  showBattleResults: boolean;
  showCreateButton: boolean;
  showCreatingContest: boolean;
  showCurrentContest: boolean;
  showPreparingTiers: boolean;
  showResolvingContest: boolean;
  showRivalryView: boolean;
  shufflingSlot: 'A' | 'B' | null;
  tiersReady: boolean;
}

// Helper component: Renders all conditional content
function RivalryViewContent({
  battleResults,
  canShowMainContent,
  canShuffle,
  createContestError,
  handlePressShuffle,
  handleResolveContest,
  isError,
  isLoading,
  isUserB,
  loadingError,
  navigation,
  onCreateContest,
  rivalry,
  seed,
  setCanShuffle,
  showBattleResults,
  showCreateButton,
  showCreatingContest,
  showCurrentContest,
  showPreparingTiers,
  showResolvingContest,
  showRivalryView,
  shufflingSlot,
}: RivalryViewContentProps): React.ReactElement {
  return (
    <>
      {/* Priority 1: Battle Results Screen */}
      {showBattleResults && battleResults && rivalry && (
        <BattleResults
          contest={battleResults.contest}
          fighterA={battleResults.fighterA}
          fighterB={battleResults.fighterB}
          isUserB={isUserB}
          loserPosition={battleResults.loserPosition}
          rivalry={rivalry}
          winnerPosition={battleResults.winnerPosition}
        />
      )}

      {/* Priority 2: Resolving Contest */}
      {showResolvingContest && (
        <LoadingWithCharacter message="Resolving Contest..." seed={seed} />
      )}

      {/* Priority 3: Creating Contest */}
      {showCreatingContest && (
        <LoadingWithCharacter message="Creating Contest..." seed={seed} />
      )}

      {/* Errors */}
      {canShowMainContent && createContestError && (
        <ErrorMessage
          message={`Error creating contest: ${createContestError.message}`}
        />
      )}

      {canShowMainContent && isLoading && (
        <LoadingWithCharacter message="Loading Rivalry..." seed={seed} />
      )}

      {canShowMainContent && isError && loadingError && (
        <ErrorMessage
          message={`Error loading rivalry: ${loadingError.message}`}
        />
      )}

      {showCurrentContest && (
        <CurrentContest
          canShuffle={canShuffle}
          onPressShuffle={handlePressShuffle}
          onResolveContest={handleResolveContest}
          setCanShuffle={setCanShuffle}
          shufflingSlot={shufflingSlot}
        />
      )}

      {showCreateButton && (
        <Button
          onPress={onCreateContest}
          style={createButtonStyle}
          text="+ Create new contest"
        />
      )}

      {showRivalryView && <RivalryView navigation={navigation} />}

      {/* Priority 4: Preparing Tiers */}
      {showPreparingTiers && (
        <LoadingWithCharacter message="Preparing Tiers..." seed={seed} />
      )}
    </>
  );
}

export function ConnectedRivalryView({
  navigation,
}: ConnectedRivalryViewProps): React.ReactElement {
  const updateRivalryProvider = useUpdateRivalry();
  const rivalry = useRivalry();
  const game = useGame();
  const { isUserB } = useRivalryContext();

  const [seed, setSeed] = useState<number>(0);
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
  const { isConnected, hasShownOfflineModal, setHasShownOfflineModal } =
    useNetworkStatus();
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  // Track if we've already auto-created a contest for this rivalry
  const hasAutoCreatedContestRef = useRef<string | null>(null);

  const updateRivalryMutation = useUpdateRivalryMutation({
    rivalry,
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
        contestCount: newContestCount,
      });

      // Re-enable the query to fetch the new contest data
      // This prevents the race condition where early refetches show stale contest data
      setIsResolvingContest(false);
    },
  });

  const updateTierSlotsAMutation = useUpdateTierSlotsMutation({
    rivalry,
    tierListSignifier: 'A',
  });

  const updateTierSlotsBMutation = useUpdateTierSlotsMutation({
    rivalry,
    tierListSignifier: 'B',
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
    },
  });

  const resolveContestMutation = useUpdateContestMutation({
    rivalry,
    onSuccess: () => {
      if (!(rivalry?.tierListA && rivalry.tierListB)) return;

      if (
        !(
          rivalry.currentContest?.tierSlotA && rivalry.currentContest?.tierSlotB
        )
      ) {
        return;
      }

      rivalry.currentContest.tierSlotA.tierList = rivalry.tierListA;
      rivalry.currentContest.tierSlotB.tierList = rivalry.tierListB;

      updateTierListsMutation.mutate();
    },
    onAlreadyResolved: () => {
      // Contest was already resolved by other player
      // Clear battle results to refresh UI with current contest
      setBattleResults(null);
      setIsResolvingContest(false);
    },
  });

  const updateCurrentContestShuffleTierSlotsMutation =
    useUpdateCurrentContestShuffleTierSlotsMutation({
      rivalry,
      onSuccess: (currentContest: MContest) => {
        if (!rivalry) return;

        rivalry.currentContest = currentContest;
        setShufflingSlot(null); // Clear shuffling state when done
        // Note: CurrentContest component will clear winner state via useEffect
      },
    });

  async function handleResolveContest() {
    setIsResolvingContest(true);
    setTiersReady(false);
    setCanShuffle(false); // Reset shuffle state when contest is resolved

    if (!(rivalry?.currentContest && game)) return;

    const isATheWinner = (rivalry.currentContest.result || 0) > 0;

    // Capture battle results data for the results screen with calculated new positions
    const gameData =
      (game as unknown as { baseGame?: typeof game })?.baseGame || game;
    const foundFighterA = fighterByIdFromGame(
      gameData,
      rivalry.currentContest.tierSlotA?.fighterId || ''
    );
    const foundFighterB = fighterByIdFromGame(
      gameData,
      rivalry.currentContest.tierSlotB?.fighterId || ''
    );

    // Update fighter stats in parallel
    await Promise.all([
      maybeIncrementFighterStats(
        rivalry.currentContest.tierSlotA,
        isATheWinner,
        'Fighter A'
      ),
      maybeIncrementFighterStats(
        rivalry.currentContest.tierSlotB,
        !isATheWinner,
        'Fighter B'
      ),
    ]);

    const standingResult = rivalry.adjustStanding();

    if (foundFighterA && foundFighterB && standingResult) {
      setBattleResults({
        contest: rivalry.currentContest,
        fighterA: foundFighterA,
        fighterB: foundFighterB,
        winnerPosition: standingResult.winnerPosition,
        loserPosition: standingResult.loserPosition,
      });
    }

    resolveContestMutation.mutate();
  }

  const {
    data: _,
    isLoading,
    isError,
    error,
  } = useRivalryWithAllInfoQuery({
    rivalry,
    enabled: !(isResolvingContest || shufflingSlot),
    onSuccess: (populatedRivalry: MRivalry) => {
      updateRivalryProvider(populatedRivalry);
      setIsResolvingContest(false);
      setTiersReady(true);
      setBattleResults(null); // Clear battle results when new contest is ready
    },
  });

  useEffect(() => {
    navigation.setOptions({
      headerTitle: rivalry?.displayTitle() || 'Header Title',
    });
  }, [navigation, rivalry]);

  useEffect(() => {
    setSeed(Math.floor(Math.random() * RANDOM_SEED_RANGE));
  }, []);

  // Show offline modal when connection is lost (only once per disconnection)
  useEffect(() => {
    if (!(isConnected || hasShownOfflineModal)) {
      setShowOfflineModal(true);
      setHasShownOfflineModal(true);
    }
    // Close modal when connection is restored
    if (isConnected) {
      setShowOfflineModal(false);
    }
  }, [isConnected, hasShownOfflineModal, setHasShownOfflineModal]);

  // Auto-create first contest for brand new rivalries
  useEffect(() => {
    // Only auto-create if:
    // 1. Rivalry exists and has an ID
    // 2. Tiers are ready
    // 3. There's no current contest
    // 4. The rivalry has 0 or 1 contests (brand new)
    // 5. We haven't already auto-created a contest for this rivalry
    // 6. We're not currently creating a contest
    if (
      rivalry?.id &&
      tiersReady &&
      !rivalry.currentContest &&
      (rivalry.contestCount === 0 || rivalry.contestCount === 1) &&
      hasAutoCreatedContestRef.current !== rivalry.id &&
      !createContestMutation.isPending
    ) {
      hasAutoCreatedContestRef.current = rivalry.id;
      createContestMutation.mutate();
    }
  }, [
    rivalry?.id,
    rivalry?.currentContest,
    rivalry?.contestCount,
    tiersReady,
    createContestMutation,
  ]);

  const handlePressShuffle = (slot: 'A' | 'B') => {
    setShufflingSlot(slot); // Track which slot is being shuffled
    updateCurrentContestShuffleTierSlotsMutation.mutate(slot);
  };

  // Derived UI state - reduces complexity in JSX by pre-computing conditions
  const showBattleResults = Boolean(battleResults && rivalry);
  const isCreatingContest = createContestMutation.isPending;
  const showResolvingContest = !battleResults && isResolvingContest;
  const isBlocked = Boolean(battleResults || isResolvingContest);
  const showCreatingContest = !isBlocked && isCreatingContest;
  const canShowMainContent = !(isBlocked || isCreatingContest);
  const showCurrentContest =
    canShowMainContent && tiersReady && Boolean(rivalry?.currentContestId);
  const showCreateButton =
    canShowMainContent && tiersReady && !rivalry?.currentContest;
  const showRivalryView = !battleResults && tiersReady && !isCreatingContest;
  const showPreparingTiers =
    canShowMainContent && !tiersReady && !isLoading && !isError;

  return (
    <View style={{ flex: 1 }}>
      <OfflineModal
        onClose={() => setShowOfflineModal(false)}
        visible={showOfflineModal}
      />

      <RivalryViewContent
        battleResults={battleResults}
        canShowMainContent={canShowMainContent}
        canShuffle={canShuffle}
        createContestError={
          createContestMutation.isError ? createContestMutation.error : null
        }
        handlePressShuffle={handlePressShuffle}
        handleResolveContest={handleResolveContest}
        isCreatingContest={isCreatingContest}
        isError={isError}
        isLoading={isLoading}
        isUserB={isUserB}
        loadingError={isError ? error : null}
        navigation={navigation}
        onCreateContest={() => createContestMutation.mutate()}
        rivalry={rivalry}
        seed={seed}
        setCanShuffle={setCanShuffle}
        showBattleResults={showBattleResults}
        showCreateButton={showCreateButton}
        showCreatingContest={showCreatingContest}
        showCurrentContest={showCurrentContest}
        showPreparingTiers={showPreparingTiers}
        showResolvingContest={showResolvingContest}
        showRivalryView={showRivalryView}
        shufflingSlot={shufflingSlot}
        tiersReady={tiersReady}
      />
    </View>
  );
}

// Style constants
const errorContainerStyle = {
  flex: 1,
  alignItems: center,
  justifyContent: center,
  paddingHorizontal: 16,
};

const errorTitleStyle = [
  styles.text,
  darkStyles.text,
  {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: colors.red600,
    marginBottom: 16,
  },
];

const createButtonStyle = {
  height: 56,
  paddingHorizontal: 32,
  width: 256,
};
