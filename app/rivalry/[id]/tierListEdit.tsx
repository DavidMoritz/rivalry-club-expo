import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

import gameQuery from '../../../assets/cache/game-query.json';
import { HamburgerMenu } from '../../../src/components/common/HamburgerMenu';
import { TierListEditDisplay } from '../../../src/components/screens/parts/TierListEditDisplay';
import { useUpdateTierSlotsMutation } from '../../../src/controllers/c-rivalry';
import { getMGame } from '../../../src/models/m-game';
import { getMRivalry, MRivalry } from '../../../src/models/m-rivalry';
import { MTierList } from '../../../src/models/m-tier-list';
import { getMUser } from '../../../src/models/m-user';
import { GameProvider } from '../../../src/providers/game';
import { RivalryProvider } from '../../../src/providers/rivalry';
import { darkStyles, styles } from '../../../src/utils/styles';

const client = generateClient<Schema>();

export default function TierListEditRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rivalryId = params.id as string;
  const userId = params.userId as string | undefined;
  const userAName = params.userAName as string | undefined;
  const userBName = params.userBName as string | undefined;

  const [rivalry, setRivalry] = useState<MRivalry | null>(null);
  const [userTierList, setUserTierList] = useState<MTierList | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load game from cache
  const game = useMemo(() => {
    const games = gameQuery.data?.listGames?.items;
    if (games && games.length > 0) {
      return getMGame(games[0] as any);
    }

    return null;
  }, []);

  const { isLoading, isError, error } = useQuery({
    enabled: !!rivalryId,
    queryKey: ['rivalryTierEdit', rivalryId],
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
        console.error('[TierListEditRoute] GraphQL errors:', errors);
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

      // Load user data
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

  // Determine which tier list belongs to the current user
  useEffect(() => {
    if (!rivalry || !userId) return;

    if (rivalry.tierListA?.userId === userId) {
      setUserTierList(rivalry.tierListA);
    } else if (rivalry.tierListB?.userId === userId) {
      setUserTierList(rivalry.tierListB);
    }
  }, [rivalry, userId]);

  const { mutate: saveTierSlots, isPending } = useUpdateTierSlotsMutation({
    rivalry,
    tierListSignifier: userTierList?.userId === rivalry?.userAId ? 'A' : 'B',
    onSuccess: () => {
      setHasChanges(false);

      // Navigate back to tiers page
      router.push({
        pathname: `/rivalry/${rivalryId}/tiers`,
        params: { userId, userAName, userBName }
      });
    }
  });

  const handleSave = () => {
    saveTierSlots();
  };

  const handleTierListChange = () => {
    setHasChanges(true);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Tier List' }} />
      <HamburgerMenu />
      <RivalryProvider rivalry={rivalry} userAName={userAName} userBName={userBName} userId={userId}>
        <GameProvider value={game}>
          <SafeAreaView style={[styles.container, darkStyles.container]}>
            {isLoading && (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="white" />
                <Text style={[styles.text, darkStyles.text, { fontSize: 18, marginTop: 16 }]}>
                  Loading Tier List...
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
                >{`Error loading tier list: ${error?.message}`}</Text>
              </View>
            )}

            {!isLoading && !isError && rivalry && userTierList && (
              <View style={{ flex: 1, padding: 16 }}>
                <Text
                  style={[
                    darkStyles.text,
                    { fontSize: 24, fontWeight: 'bold', marginBottom: 16 }
                  ]}
                >
                  Edit Your Tier List
                </Text>

                <View style={{ flex: 1 }}>
                  <TierListEditDisplay tierList={userTierList} onChange={handleTierListChange} />
                </View>

                <TouchableOpacity
                  onPress={handleSave}
                  disabled={!hasChanges || isPending}
                  style={{
                    backgroundColor: hasChanges && !isPending ? '#3b82f6' : '#6b7280',
                    padding: 16,
                    borderRadius: 8,
                    alignItems: 'center',
                    marginTop: 16
                  }}
                >
                  {isPending ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                      {hasChanges ? 'Save List' : 'No Changes'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {!isLoading && !isError && (!rivalry || !userTierList) && (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={[styles.text, darkStyles.text, { fontSize: 18 }]}>
                  Could not load tier list
                </Text>
              </View>
            )}
          </SafeAreaView>
        </GameProvider>
      </RivalryProvider>
      <StatusBar style="light" />
    </>
  );
}
