import { useLocalSearchParams, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useCallback } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

import { darkStyles, styles } from '../../../src/utils/styles';
import { HamburgerMenu } from '../../../src/components/common/HamburgerMenu';
import { ContestHistoryTable } from '../../../src/components/screens/parts/ContestHistoryTable';
import { getMContest, MContest } from '../../../src/models/m-contest';
import { MGame } from '../../../src/models/m-game';
import { getMRivalry, MRivalry } from '../../../src/models/m-rivalry';
import { getMUser } from '../../../src/models/m-user';
import { RivalryProvider } from '../../../src/providers/rivalry';
import { useGame } from '../../../src/providers/game';
import { useDeleteMostRecentContestMutation } from '../../../src/controllers/c-rivalry';

// Lazy client initialization to avoid crashes when Amplify isn't configured
let client: ReturnType<typeof generateClient<Schema>> | null = null;

function getClient() {
  if (!client) {
    client = generateClient<Schema>();
  }

  return client;
}

export default function HistoryRoute() {
  const params = useLocalSearchParams();
  const rivalryId = params.id as string;
  const userId = params.userId as string | undefined;
  const userAName = params.userAName as string | undefined;
  const userBName = params.userBName as string | undefined;
  const queryClient = useQueryClient();
  const [contests, setContests] = useState<MContest[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [rivalry, setRivalry] = useState<MRivalry | null>(null);
  const [hideUndoButton, setHideUndoButton] = useState(false);

  const deleteMostRecentContestMutation = useDeleteMostRecentContestMutation({
    rivalry,
    onSuccess: () => {
      // Invalidate queries to refetch contests after undo
      queryClient.invalidateQueries({ queryKey: ['rivalryContests', rivalryId] });
      queryClient.invalidateQueries({ queryKey: ['rivalryWithInfo', rivalryId] });
    }
  });

  // Get game from global GameProvider (includes fighter stats)
  const game = useGame();

  const {
    data: rivalryData,
    isLoading: isLoadingRivalry,
    error: rivalryError
  } = useQuery({
    enabled: !!rivalryId,
    queryKey: ['rivalryWithInfo', rivalryId],
    structuralSharing: false,
    queryFn: async () => {
      const { data: rivalryData, errors } = await getClient().models.Rivalry.get(
        { id: rivalryId },
        {
          selectionSet: [
            'id',
            'userAId',
            'userBId',
            'gameId',
            'contestCount',
            'currentContestId',
            'createdAt',
            'updatedAt',
            'deletedAt',
            'tierLists.*',
            'tierLists.tierSlots.*'
          ]
        }
      );

      if (errors) {
        console.error('[HistoryRoute] GraphQL errors loading rivalry:', errors);
        throw new Error(errors[0]?.message || 'Failed to fetch rivalry');
      }

      if (!rivalryData) {
        throw new Error('Rivalry not found');
      }

      const tierListsArray: any[] = [];
      if (rivalryData.tierLists) {
        for await (const tierListData of rivalryData.tierLists) {
          const tierSlotsArray: any[] = [];
          if (tierListData.tierSlots) {
            for await (const tierSlot of tierListData.tierSlots) {
              tierSlotsArray.push(tierSlot);
            }
          }
          tierListsArray.push({ ...tierListData, tierSlots: { items: tierSlotsArray } });
        }
      }
      const tierLists = { items: tierListsArray };

      const mRivalry = getMRivalry({ rivalry: rivalryData as any });
      mRivalry.setMTierLists(tierLists as any);

      // Use user names from context if available, otherwise fetch
      if (userAName && userBName) {
        // Split full names into first and last names
        const [firstNameA, ...lastNamePartsA] = userAName.split(' ');
        const [firstNameB, ...lastNamePartsB] = userBName.split(' ');

        mRivalry.userA = getMUser({
          user: {
            id: rivalryData.userAId,
            firstName: firstNameA,
            lastName: lastNamePartsA.join(' ')
          } as any
        });
        mRivalry.userB = getMUser({
          user: {
            id: rivalryData.userBId,
            firstName: firstNameB,
            lastName: lastNamePartsB.join(' ')
          } as any
        });
      } else {
        // Load user data separately if not in context
        const [userAResult, userBResult] = await Promise.all([
          getClient().models.User.get({ id: rivalryData.userAId }),
          getClient().models.User.get({ id: rivalryData.userBId })
        ]);

        if (userAResult.data) {
          mRivalry.userA = getMUser({ user: userAResult.data as any });
        }
        if (userBResult.data) {
          mRivalry.userB = getMUser({ user: userBResult.data as any });
        }
      }

      setRivalry(mRivalry);

      return mRivalry;
    }
  });

  const { isLoading: isLoadingContests, error } = useQuery({
    enabled: !!rivalryId && !!rivalry && !!game,
    queryKey: ['rivalryContests', rivalryId],
    structuralSharing: false,
    queryFn: async () => {
      // Use the GSI query for efficient sorting by createdAt
      let allContests: any[] = [];
      let currentNextToken: string | null | undefined = undefined;
      let pageCount = 0;
      const maxPages = 10; // Safety limit

      do {
        const {
          data: pageData,
          errors,
          nextToken: pageNextToken
        } = await getClient().models.Contest.contestsByRivalryIdAndCreatedAt({
          rivalryId: rivalryId,
          sortDirection: 'DESC', // Most recent first
          limit: 100,
          nextToken: currentNextToken
        });

        if (errors) {
          console.error('[HistoryRoute] GraphQL errors:', errors);
          throw new Error(errors[0]?.message || 'Failed to fetch contests');
        }

        allContests = [...allContests, ...pageData];
        currentNextToken = pageNextToken;
        pageCount++;
      } while (currentNextToken && pageCount < maxPages);

      const contestData = allContests;
      const newNextToken = currentNextToken;
      const mContests = contestData.map((c) => {
        const mContest = getMContest(c as any);
        if (rivalry) {
          mContest.setRivalryAndSlots(rivalry);
        }

        return mContest;
      });

      // Set contests on rivalry for the delete mutation
      // Use the processed mContests with rivalry and slots attached
      if (rivalry) {
        rivalry.mContests = mContests;
      }

      setContests(mContests);
      setNextToken(newNextToken || null);

      return mContests;
    }
  });

  const isLoading = isLoadingRivalry || isLoadingContests;

  const handleUndoClick = useCallback(() => {
    setHideUndoButton(true);
    deleteMostRecentContestMutation.mutate();
  }, [deleteMostRecentContestMutation]);

  const loadMore = useCallback(async () => {
    if (!nextToken || isLoadingMore || !rivalry) return;

    setIsLoadingMore(true);
    try {
      const {
        data: contestData,
        errors,
        nextToken: newNextToken
      } = await getClient().models.Contest.list({
        filter: { rivalryId: { eq: rivalryId } },
        limit: 100,
        nextToken
      });

      if (errors) {
        console.error('[HistoryRoute] loadMore GraphQL errors:', errors);

        return;
      }

      const mContests = contestData.map((c) => {
        const mContest = getMContest(c as any);
        mContest.setRivalryAndSlots(rivalry);

        return mContest;
      });

      // Sort the new contests before adding them
      mContests.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();

        return dateB - dateA; // Descending order
      });

      setContests((prev) => {
        // Combine and re-sort to maintain order
        const combined = [...prev, ...mContests];
        combined.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();

          return dateB - dateA;
        });

        return combined;
      });
      setNextToken(newNextToken || null);
    } catch (error) {
      console.error('[HistoryRoute] loadMore error:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextToken, isLoadingMore, rivalryId, rivalry]);

  if (isLoading || !rivalry) {
    return (
      <>
        <Stack.Screen options={{ title: 'Contest History' }} />
        <SafeAreaView style={[styles.container, darkStyles.container]}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={[styles.text, { marginTop: 16 }]}>
              {isLoadingRivalry ? 'Loading rivalry data...' : 'Loading contests...'}
            </Text>
          </View>
        </SafeAreaView>
        <StatusBar style="light" />
      </>
    );
  }

  if (error || rivalryError) {
    return (
      <>
        <Stack.Screen options={{ title: 'Contest History' }} />
        <SafeAreaView style={[styles.container, darkStyles.container]}>
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 16
            }}
          >
            <Text style={[styles.text, { fontSize: 18, color: '#ff6b6b', marginBottom: 8 }]}>
              Error loading data
            </Text>
            <Text style={[styles.text, { color: '#999' }]}>
              {(error instanceof Error ? error.message : null) ||
                (rivalryError instanceof Error ? rivalryError.message : 'Unknown error')}
            </Text>
          </View>
        </SafeAreaView>
        <StatusBar style="light" />
      </>
    );
  }

  if (!game) {
    return (
      <>
        <Stack.Screen options={{ title: 'Contest History' }} />
        <SafeAreaView style={[styles.container, darkStyles.container]}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[styles.text, { color: '#999' }]}>Game data not available</Text>
          </View>
        </SafeAreaView>
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Contest History' }} />
      <HamburgerMenu />
      <RivalryProvider
        rivalry={rivalry}
        userAName={userAName}
        userBName={userBName}
        userId={userId}
      >
        <SafeAreaView style={[styles.container, darkStyles.container]} edges={['left', 'right', 'bottom']}>
          <View style={{ paddingTop: 72 }}>
            <ContestHistoryTable
              contests={contests}
              game={game as MGame}
              rivalry={rivalry}
              deleteMostRecentContestMutation={deleteMostRecentContestMutation}
              loadMore={loadMore}
              isLoadingMore={isLoadingMore}
              hideUndoButton={hideUndoButton}
              onUndoClick={handleUndoClick}
            />
          </View>
        </SafeAreaView>
      </RivalryProvider>
      <StatusBar style="light" />
    </>
  );
}
