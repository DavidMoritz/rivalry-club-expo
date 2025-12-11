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
import { getStoredUuid } from '../../../src/lib/user-identity';

// Lazy client initialization to avoid crashes when Amplify isn't configured
let client: ReturnType<typeof generateClient<Schema>> | null = null;

function getClient() {
  if (!client) {
    client = generateClient<Schema>();
  }

  return client;
}

export default function TierListEditRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rivalryId = params.id as string;
  const userIdParam = params.userId as string | undefined;
  const userAName = params.userAName as string | undefined;
  const userBName = params.userBName as string | undefined;

  const [userId, setUserId] = useState<string | undefined>(userIdParam);
  const [rivalry, setRivalry] = useState<MRivalry | null>(null);
  const [userTierList, setUserTierList] = useState<MTierList | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fallback: Load userId from storage if not provided in URL params
  useEffect(() => {
    async function loadUserIdFromStorage() {
      if (userId) {
        return; // Already have userId from params
      }

      const storedUserId = await getStoredUuid();

      if (storedUserId) {
        setUserId(storedUserId);
      } else {
        console.warn('[TierListEditRoute] No userId found in storage either!');
      }
    }

    loadUserIdFromStorage();
  }, [userIdParam]);

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
        getClient().models.User.get({ id: rivalryData.userAId }),
        getClient().models.User.get({ id: rivalryData.userBId })
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
    if (!rivalry) {
      return;
    }

    if (!userId) {
      console.warn('[TierListEditRoute] userId param is missing!');
      return;
    }

    console.log(
      `[TierListEditRoute] Matching userId ${userId} against tierListA.userId=${rivalry.tierListA?.userId}, tierListB.userId=${rivalry.tierListB?.userId}`
    );

    if (rivalry.tierListA?.userId === userId) {
      setUserTierList(rivalry.tierListA);
    } else if (rivalry.tierListB?.userId === userId) {
      setUserTierList(rivalry.tierListB);
    } else {
      console.error(
        `[TierListEditRoute] No tier list found for userId ${userId}! Available: ${rivalry.tierListA?.userId}, ${rivalry.tierListB?.userId}`
      );
    }
  }, [rivalry, userId]);

  const { mutate: saveTierSlots, isPending } = useUpdateTierSlotsMutation({
    rivalry,
    tierListSignifier: userTierList?.userId === rivalry?.userAId ? 'A' : 'B',
    onSuccess: () => {
      setHasChanges(false);

      // Navigate back
      router.back();
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
      <RivalryProvider
        rivalry={rivalry}
        userAName={userAName}
        userBName={userBName}
        userId={userId}
      >
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
                  style={[darkStyles.text, { fontSize: 24, fontWeight: 'bold', marginBottom: 16 }]}
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

            {!isLoading && !isError && !rivalry && (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={[styles.text, darkStyles.text, { fontSize: 18 }]}>
                  Could not load rivalry
                </Text>
              </View>
            )}

            {!isLoading && !isError && rivalry && !userTierList && (
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
                    { fontSize: 18, fontWeight: 'bold', color: '#f59e0b', marginBottom: 16 }
                  ]}
                >
                  Could not load tier list
                </Text>
                <Text
                  style={[styles.text, darkStyles.text, { textAlign: 'center', marginBottom: 8 }]}
                >
                  {!userId
                    ? 'User ID is missing from navigation params'
                    : `Your user ID (${userId}) doesn't match either tier list`}
                </Text>
                {userId && rivalry.tierListA && rivalry.tierListB && (
                  <Text
                    style={[
                      styles.text,
                      darkStyles.text,
                      { fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 16 }
                    ]}
                  >
                    TierList A: {rivalry.tierListA.userId}
                    {'\n'}
                    TierList B: {rivalry.tierListB.userId}
                  </Text>
                )}
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={{
                    backgroundColor: '#3b82f6',
                    padding: 12,
                    borderRadius: 8,
                    marginTop: 24
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 16 }}>Go Back</Text>
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        </GameProvider>
      </RivalryProvider>
      <StatusBar style="light" />
    </>
  );
}
