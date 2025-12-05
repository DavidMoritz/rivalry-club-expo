import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useMemo, useCallback } from 'react';
import { SafeAreaView, Text, View, FlatList, ActivityIndicator } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

import gameQuery from '../../../assets/cache/game-query.json';
import { darkStyles, styles, contestStyles } from '../../../src/utils/styles';
import { Button } from '../../../src/components/common/Button';
import { ContestRow } from '../../../src/components/common/ContestRow';
import { getMContest, MContest } from '../../../src/models/m-contest';
import { getMGame, MGame } from '../../../src/models/m-game';
import { getMRivalry, MRivalry } from '../../../src/models/m-rivalry';
import { getMUser } from '../../../src/models/m-user';
import { useRivalryContext } from '../../../src/providers/rivalry';
import { useDeleteMostRecentContestMutation } from '../../../src/controllers/c-rivalry';

const client = generateClient<Schema>();

export default function HistoryRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rivalryId = params.id as string;
  const rivalryContext = useRivalryContext();
  const queryClient = useQueryClient();
  const [contests, setContests] = useState<MContest[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [rivalry, setRivalry] = useState<MRivalry | null>(null);

  const deleteMostRecentContestMutation = useDeleteMostRecentContestMutation({
    rivalry,
    onSuccess: () => {
      // Invalidate queries to refetch contests after deletion
      queryClient.invalidateQueries({ queryKey: ['rivalryContests', rivalryId] });
      queryClient.invalidateQueries({ queryKey: ['rivalryWithInfo', rivalryId] });
    }
  });

  const game = useMemo(() => {
    const games = gameQuery.data?.listGames?.items;
    if (games && games.length > 0) {
      return getMGame(games[0] as any);
    }

    return null;
  }, []);

  const {
    data: rivalryData,
    isLoading: isLoadingRivalry,
    error: rivalryError
  } = useQuery({
    enabled: !!rivalryId,
    queryKey: ['rivalryWithInfo', rivalryId],
    structuralSharing: false,
    queryFn: async () => {
      const { data: rivalryData, errors } = await client.models.Rivalry.get(
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
      if (rivalryContext.userAName && rivalryContext.userBName) {
        // Create minimal user objects with the names we have
        mRivalry.userA = getMUser({
          user: { id: rivalryData.userAId, firstName: rivalryContext.userAName } as any
        });
        mRivalry.userB = getMUser({
          user: { id: rivalryData.userBId, firstName: rivalryContext.userBName } as any
        });
      } else {
        // Load user data separately if not in context
        const [userAResult, userBResult] = await Promise.all([
          client.models.User.get({ id: rivalryData.userAId }),
          client.models.User.get({ id: rivalryData.userBId })
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
        } = await client.models.Contest.contestsByRivalryIdAndCreatedAt({
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

  const loadMore = useCallback(async () => {
    if (!nextToken || isLoadingMore || !rivalry) return;

    setIsLoadingMore(true);
    try {
      const {
        data: contestData,
        errors,
        nextToken: newNextToken
      } = await client.models.Contest.list({
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

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#fff" />
      </View>
    );
  };

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
      <SafeAreaView style={[styles.container, darkStyles.container]}>
        <View style={contestStyles.tableWrapper}>
          <View
            style={{ flexDirection: 'row', gap: 12, alignSelf: 'flex-start', marginBottom: 16 }}
          >
            <Button onPress={() => router.back()} text="← Back" />
            <Button
              onPress={() => deleteMostRecentContestMutation.mutate()}
              text="↺ Reverse Recent Contest"
              disabled={
                deleteMostRecentContestMutation.isPending ||
                !contests.length ||
                !contests.some((c) => c.result)
              }
            />
          </View>

          {deleteMostRecentContestMutation.isError && (
            <View
              style={{ marginBottom: 16, padding: 12, backgroundColor: '#7f1d1d', borderRadius: 8 }}
            >
              <Text style={[styles.text, { color: '#fca5a5' }]}>
                Error reversing contest:{' '}
                {deleteMostRecentContestMutation.error?.message || 'Unknown error'}
              </Text>
            </View>
          )}

          <View style={[contestStyles.row, contestStyles.tableHeaderRow]}>
            <View style={contestStyles.item}>
              <Text style={[contestStyles.tableHeader, { color: 'white' }]}>Date</Text>
            </View>
            <View style={contestStyles.item}>
              <Text style={[contestStyles.tableHeader, { color: 'white' }]}>
                {rivalry.displayUserAName()}
              </Text>
            </View>
            <View style={contestStyles.item}>
              <Text style={[contestStyles.tableHeader, { color: 'white' }]}>Score</Text>
            </View>
            <View style={contestStyles.item}>
              <Text style={[contestStyles.tableHeader, { color: 'white' }]}>
                {rivalry.displayUserBName()}
              </Text>
            </View>
          </View>
          <FlatList
            data={contests}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ContestRow contest={item} game={game as MGame} rivalry={rivalry} />
            )}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={[styles.text, { color: '#999' }]}>No contests yet</Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>
      <StatusBar style="light" />
    </>
  );
}
