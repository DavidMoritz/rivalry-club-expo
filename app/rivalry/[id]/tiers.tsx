import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

import gameQuery from '../../../assets/cache/game-query.json';
import { Button } from '../../../src/components/common/Button';
import { HamburgerMenu } from '../../../src/components/common/HamburgerMenu';
import { TierListsDisplay } from '../../../src/components/screens/parts/TierListsDisplay';
import { getMGame } from '../../../src/models/m-game';
import { getMRivalry, MRivalry } from '../../../src/models/m-rivalry';
import { getMUser } from '../../../src/models/m-user';
import { GameProvider } from '../../../src/providers/game';
import { RivalryProvider } from '../../../src/providers/rivalry';
import { SyncedScrollViewContext, syncedScrollViewState } from '../../../src/providers/scroll-view';
import { darkStyles, styles } from '../../../src/utils/styles';

const client = generateClient<Schema>();

export default function TiersRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rivalryId = params.id as string;
  const userId = params.userId as string | undefined;
  const userAName = params.userAName as string | undefined;
  const userBName = params.userBName as string | undefined;

  const [unlinked, setUnLinked] = useState<boolean>(false);
  const [rivalry, setRivalry] = useState<MRivalry | null>(null);

  // Load game from cache - since there's only one game in the DB
  const game = useMemo(() => {
    const games = gameQuery.data?.listGames?.items;
    if (games && games.length > 0) {
      return getMGame(games[0] as any);
    }

    return null;
  }, []);

  const { isLoading, isError, error } = useQuery({
    enabled: !!rivalryId,
    queryKey: ['rivalryTiers', rivalryId],
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
        console.error('[TiersRoute] GraphQL errors loading rivalry:', errors);
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

      setRivalry(mRivalry);

      return mRivalry;
    }
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Tier Lists' }} />
      <HamburgerMenu />
      <RivalryProvider
        rivalry={rivalry}
        userAName={userAName}
        userBName={userBName}
        userId={userId}
      >
        <GameProvider value={game}>
          <SyncedScrollViewContext.Provider value={syncedScrollViewState}>
            <SafeAreaView style={[styles.container, darkStyles.container]}>
              {isLoading && (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={[styles.text, darkStyles.text, { fontSize: 18 }]}>
                    Loading Tier Lists...
                  </Text>
                </View>
              )}

              {isError && (
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
                      { fontSize: 18, fontWeight: 'bold', color: '#ef4444', marginBottom: 16 }
                    ]}
                  >
                    Error
                  </Text>
                  <Text
                    style={[styles.text, darkStyles.text]}
                  >{`Error loading tier lists: ${error?.message}`}</Text>
                </View>
              )}

              {!isLoading && !isError && !rivalry && (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={[styles.text, darkStyles.text, { fontSize: 18 }]}>
                    Waiting for tier lists...
                  </Text>
                  <Text
                    style={[
                      styles.text,
                      darkStyles.text,
                      { fontSize: 12, marginTop: 8, color: '#999' }
                    ]}
                  >
                    Check console logs for details
                  </Text>
                </View>
              )}

              {!isLoading && !isError && rivalry && (
                <>
                  <View
                    style={{
                      width: '100%',
                      alignItems: 'center',
                      marginStart: 16,
                      zIndex: 10
                    }}
                  >
                    <Button
                      style={{ width: '40%' }}
                      onPress={() => {
                        router.push({
                          pathname: `/rivalry/${rivalryId}/tierListEdit`,
                          params: { userId, userAName, userBName }
                        });
                      }}
                      text="Edit Tier List"
                    />
                  </View>

                  <TierListsDisplay rivalry={rivalry} unlinked={unlinked} />

                  <Button
                    onPress={() => setUnLinked(!unlinked)}
                    text={unlinked ? 'Unlinked' : 'Linked'}
                  />
                </>
              )}
            </SafeAreaView>
          </SyncedScrollViewContext.Provider>
        </GameProvider>
      </RivalryProvider>
      <StatusBar style="light" />
    </>
  );
}
