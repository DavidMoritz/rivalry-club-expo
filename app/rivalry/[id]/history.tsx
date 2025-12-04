import { useLocalSearchParams, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useMemo, useCallback } from 'react';
import { SafeAreaView, Text, View, FlatList, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

import gameQuery from '../../../assets/cache/game-query.json';
import { darkStyles, styles, contestStyles } from '../../../src/utils/styles';
import { ContestRow } from '../../../src/components/common/ContestRow';
import { getMContest, MContest } from '../../../src/models/m-contest';
import { getMGame, MGame } from '../../../src/models/m-game';
import { getMRivalry, MRivalry } from '../../../src/models/m-rivalry';
import { getMUser } from '../../../src/models/m-user';

const client = generateClient<Schema>();

export default function HistoryRoute() {
  const params = useLocalSearchParams();
  const rivalryId = params.id as string;
  const [contests, setContests] = useState<MContest[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [rivalry, setRivalry] = useState<MRivalry | null>(null);

  const game = useMemo(() => {
    const games = gameQuery.data?.listGames?.items;
    if (games && games.length > 0) {
      return getMGame(games[0] as any);
    }

    return null;
  }, []);

  console.log('[HistoryRoute] rivalryId:', rivalryId);
  console.log('[HistoryRoute] rivalry:', rivalry?.id, rivalry?.displayTitle());
  console.log('[HistoryRoute] game:', game?.id, game?.name);

  const {
    data: rivalryData,
    isLoading: isLoadingRivalry,
    error: rivalryError
  } = useQuery({
    enabled: !!rivalryId,
    queryKey: ['rivalryWithInfo', rivalryId],
    queryFn: async () => {
      console.log('[HistoryRoute] Loading rivalry data for ID:', rivalryId);

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

      // Load user data separately
      const [userAResult, userBResult] = await Promise.all([
        client.models.User.get({ id: rivalryData.userAId }),
        client.models.User.get({ id: rivalryData.userBId }),
      ]);

      if (userAResult.data) {
        mRivalry.userA = getMUser({ user: userAResult.data as any });
      }
      if (userBResult.data) {
        mRivalry.userB = getMUser({ user: userBResult.data as any });
      }

      console.log('[HistoryRoute] Loaded rivalry:', mRivalry.displayTitle());
      console.log(
        '[HistoryRoute] Rivalry has tierLists:',
        !!mRivalry.tierListA,
        !!mRivalry.tierListB
      );
      console.log('[HistoryRoute] Rivalry has users:', !!mRivalry.userA, !!mRivalry.userB);

      setRivalry(mRivalry);

      return mRivalry;
    }
  });

  const {
    data,
    isLoading: isLoadingContests,
    error
  } = useQuery({
    enabled: !!rivalryId && !!rivalry && !!game,
    queryKey: ['rivalryContests', rivalryId],
    queryFn: async () => {
      console.log('[HistoryRoute] queryFn starting - rivalryId:', rivalryId);
      console.log(
        '[HistoryRoute] queryFn - rivalry has tierLists:',
        !!rivalry?.tierListA,
        !!rivalry?.tierListB
      );

      const {
        data: contestData,
        errors,
        nextToken: newNextToken
      } = await client.models.Contest.list({
        filter: { rivalryId: { eq: rivalryId } },
        limit: 100
      });

      if (errors) {
        console.error('[HistoryRoute] GraphQL errors:', errors);
        throw new Error(errors[0]?.message || 'Failed to fetch contests');
      }

      console.log('[HistoryRoute] queryFn - fetched contests:', contestData.length);

      const mContests = contestData.map((c) => {
        const mContest = getMContest(c as any);
        if (rivalry) {
          mContest.setRivalryAndSlots(rivalry);
        }

        return mContest;
      });

      console.log('[HistoryRoute] queryFn - processed contests:', mContests.length);
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

      setContests((prev) => [...prev, ...mContests]);
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
