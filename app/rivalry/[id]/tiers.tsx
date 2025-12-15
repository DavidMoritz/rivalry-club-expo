import { useQuery } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/data';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import type { Schema } from '../../../amplify/data/resource';

import { Button } from '../../../src/components/common/Button';
import { HamburgerMenu } from '../../../src/components/common/HamburgerMenu';
import { TierListsDisplay } from '../../../src/components/screens/parts/TierListsDisplay';
import { getMRivalry, type MRivalry } from '../../../src/models/m-rivalry';
import { getMUser } from '../../../src/models/m-user';

// Type definitions for tier list data structures
type TierSlotData = Schema['TierSlot']['type'];
type TierListData = {
  id: string;
  tierSlots?: AsyncIterable<TierSlotData>;
  [key: string]: unknown;
};
type TierListWithItems = {
  items: Array<TierListData & { tierSlots: { items: TierSlotData[] } }>;
};

import { RivalryProvider } from '../../../src/providers/rivalry';
import {
  SyncedScrollViewContext,
  syncedScrollViewState,
} from '../../../src/providers/scroll-view';
import { colors } from '../../../src/utils/colors';
import { darkStyles, styles } from '../../../src/utils/styles';

// Lazy client initialization to avoid crashes when Amplify isn't configured
let client: ReturnType<typeof generateClient<Schema>> | null = null;

function getClient() {
  if (!client) {
    client = generateClient<Schema>();
  }

  return client;
}

// Helper function to process tier slots from async iterable
async function processTierSlots(
  tierSlots: AsyncIterable<TierSlotData> | undefined
): Promise<TierSlotData[]> {
  const tierSlotsArray: TierSlotData[] = [];
  if (tierSlots) {
    for await (const tierSlot of tierSlots) {
      tierSlotsArray.push(tierSlot);
    }
  }
  return tierSlotsArray;
}

// Helper function to process tier lists from async iterable
async function processTierLists(
  tierLists: AsyncIterable<TierListData> | undefined
): Promise<TierListWithItems> {
  const tierListsArray: Array<
    TierListData & { tierSlots: { items: TierSlotData[] } }
  > = [];
  if (tierLists) {
    for await (const tierListData of tierLists) {
      const tierSlotsArray = await processTierSlots(tierListData.tierSlots);
      tierListsArray.push({
        ...tierListData,
        tierSlots: { items: tierSlotsArray } as any,
      });
    }
  }
  return { items: tierListsArray };
}

// Helper function to load user data for a rivalry
async function loadUserData(
  mRivalry: MRivalry,
  userAId: string,
  userBId: string
): Promise<void> {
  const [userAResult, userBResult] = await Promise.all([
    getClient().models.User.get({ id: userAId }),
    getClient().models.User.get({ id: userBId }),
  ]);

  if (userAResult.data) {
    mRivalry.userA = getMUser({
      user: userAResult.data as Schema['User']['type'],
    });
  }
  if (userBResult.data) {
    mRivalry.userB = getMUser({
      user: userBResult.data as Schema['User']['type'],
    });
  }
}

export default function TiersRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rivalryId = params.id as string;
  const userId = params.userId as string | undefined;
  const userAName = params.userAName as string | undefined;
  const userBName = params.userBName as string | undefined;

  const [unlinked, setUnLinked] = useState<boolean>(false);
  const [rivalry, setRivalry] = useState<MRivalry | null>(null);

  const { isLoading, isError, error } = useQuery({
    enabled: !!rivalryId,
    queryKey: ['rivalryTiers', rivalryId],
    structuralSharing: false,
    queryFn: async () => {
      const { data: rivalryData, errors } =
        await getClient().models.Rivalry.get(
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
              'tierLists.tierSlots.*',
            ],
          }
        );

      if (errors) {
        console.error('[TiersRoute] GraphQL errors loading rivalry:', errors);
        throw new Error(errors[0]?.message || 'Failed to fetch rivalry');
      }

      if (!rivalryData) {
        throw new Error('Rivalry not found');
      }

      const tierLists = await processTierLists(
        rivalryData.tierLists as unknown as AsyncIterable<TierListData> | undefined
      );

      const mRivalry = getMRivalry({
        rivalry: rivalryData as unknown as Schema['Rivalry']['type'],
      });
      mRivalry.setMTierLists(
        tierLists as unknown as Parameters<MRivalry['setMTierLists']>[0]
      );

      // Load user data separately
      await loadUserData(mRivalry, rivalryData.userAId, rivalryData.userBId);

      setRivalry(mRivalry);

      return mRivalry;
    },
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
        <SyncedScrollViewContext.Provider value={syncedScrollViewState}>
          <SafeAreaView style={[styles.container, darkStyles.container]}>
            {isLoading && (
              <View style={centeredContainerStyle}>
                <Text style={loadingTextStyle}>Loading Tier Lists...</Text>
              </View>
            )}

            {isError && (
              <View style={errorContainerStyle}>
                <Text style={errorTitleStyle}>Error</Text>
                <Text
                  style={[styles.text, darkStyles.text]}
                >{`Error loading tier lists: ${error?.message}`}</Text>
              </View>
            )}

            {!(isLoading || isError || rivalry) && (
              <View style={centeredContainerStyle}>
                <Text style={loadingTextStyle}>Waiting for tier lists...</Text>
                <Text style={debugTextStyle}>
                  Check console logs for details
                </Text>
              </View>
            )}

            {!(isLoading || isError) && rivalry && (
              <>
                <View style={editButtonContainerStyle}>
                  <Button
                    onPress={() => {
                      router.push({
                        pathname: `/rivalry/${rivalryId}/tierListEdit`,
                        params: { userId, userAName, userBName },
                      });
                    }}
                    style={editButtonStyle}
                    text="Edit Tier List"
                  />
                </View>

                <TierListsDisplay rivalry={rivalry} unlinked={unlinked} />

                <Button
                  onPress={() => setUnLinked(!unlinked)}
                  style={linkButtonStyle}
                  text={unlinked ? 'Unlinked' : 'Linked'}
                />
              </>
            )}
          </SafeAreaView>
        </SyncedScrollViewContext.Provider>
      </RivalryProvider>
      <StatusBar style="light" />
    </>
  );
}

const center = 'center' as const;
const bold = 'bold' as const;

const centeredContainerStyle = {
  flex: 1,
  alignItems: center,
  justifyContent: center,
};

const loadingTextStyle = {
  ...styles.text,
  ...darkStyles.text,
  fontSize: 18,
};

const errorContainerStyle = {
  flex: 1,
  alignItems: center,
  justifyContent: center,
  paddingHorizontal: 16,
};

const errorTitleStyle = {
  ...styles.text,
  ...darkStyles.text,
  fontSize: 18,
  fontWeight: bold,
  color: colors.red600,
  marginBottom: 16,
};

const debugTextStyle = {
  ...styles.text,
  ...darkStyles.text,
  fontSize: 12,
  marginTop: 8,
  color: colors.gray400,
};

const editButtonContainerStyle = {
  width: '100%' as const,
  alignItems: center,
  marginStart: 16,
  zIndex: 10,
};

const editButtonStyle = {
  width: '40%' as const,
  paddingVertical: 4,
  paddingHorizontal: 0,
};

const linkButtonStyle = {
  paddingVertical: 0,
};
