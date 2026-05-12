import { useQuery } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/data';
import {
  Stack,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { Schema } from '../../../amplify/data/resource';

import { LoadingWithCharacter } from '../../../src/components/common/LoadingWithCharacter';
import { TierListEditDisplay } from '../../../src/components/screens/parts/TierListEditDisplay';
import { useUpdateTierSlotsMutation } from '../../../src/controllers/c-rivalry';
import { getStoredUuid } from '../../../src/lib/user-identity';
import { getMRivalry, type MRivalry } from '../../../src/models/m-rivalry';
import type { MTierList } from '../../../src/models/m-tier-list';
import { getMUser } from '../../../src/models/m-user';
import { useSetHeader } from '../../../src/providers/header';
import { RivalryProvider } from '../../../src/providers/rivalry';
import { useUnsavedChanges } from '../../../src/providers/unsaved-changes';
import { colors } from '../../../src/utils/colors';
import { bold, center, darkStyles, styles } from '../../../src/utils/styles';

// Type definitions for GraphQL response data
type TierSlotData = Schema['TierSlot']['type'];
type TierListData = Schema['TierList']['type'] & {
  tierSlots?: AsyncIterable<TierSlotData>;
};
type RivalryData = Schema['Rivalry']['type'] & {
  tierLists?: AsyncIterable<TierListData>;
};
type UserData = Schema['User']['type'];
type ProcessedTierList = Omit<TierListData, 'tierSlots'> & {
  tierSlots: { items: TierSlotData[] };
};

// Lazy client initialization to avoid crashes when Amplify isn't configured
let client: ReturnType<typeof generateClient<Schema>> | null = null;

function getClient() {
  if (!client) {
    client = generateClient<Schema>();
  }

  return client;
}

/**
 * Process tier lists from GraphQL lazy-loaded data into the format expected by getMRivalry
 */
async function processTierLists(
  tierLists: AsyncIterable<TierListData> | undefined
) {
  const tierListsArray: ProcessedTierList[] = [];

  if (!tierLists) return { items: tierListsArray };

  for await (const tierListData of tierLists) {
    const tierSlotsArray: TierSlotData[] = [];

    if (tierListData.tierSlots) {
      for await (const tierSlot of tierListData.tierSlots) {
        tierSlotsArray.push(tierSlot);
      }
    }

    const { tierSlots: _tierSlots, ...rest } = tierListData;
    tierListsArray.push({
      ...rest,
      tierSlots: { items: tierSlotsArray },
    });
  }

  return { items: tierListsArray };
}

/**
 * Fetch rivalry data and transform it into MRivalry
 */
async function fetchRivalryData(
  rivalryId: string,
  setRivalry: (rivalry: MRivalry) => void
): Promise<MRivalry> {
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
        'tierLists.tierSlots.*',
      ],
    }
  );

  if (errors) {
    console.error('[TierListEditRoute] GraphQL errors:', errors);
    throw new Error(errors[0]?.message || 'Failed to fetch rivalry');
  }

  if (!rivalryData) {
    throw new Error('Rivalry not found');
  }

  const tierLists = await processTierLists(
    (rivalryData as unknown as RivalryData).tierLists
  );
  const mRivalry = getMRivalry({
    rivalry: rivalryData as unknown as Schema['Rivalry']['type'],
  });
  mRivalry.setMTierLists(
    tierLists as unknown as Parameters<MRivalry['setMTierLists']>[0]
  );

  // Load user data
  const [userAResult, userBResult] = await Promise.all([
    getClient().models.User.get({ id: rivalryData.userAId }),
    getClient().models.User.get({ id: rivalryData.userBId }),
  ]);

  if (userAResult.data) {
    mRivalry.userA = getMUser({
      user: userAResult.data as unknown as UserData,
    });
  }

  if (userBResult.data) {
    mRivalry.userB = getMUser({
      user: userBResult.data as unknown as UserData,
    });
  }

  setRivalry(mRivalry);

  return mRivalry;
}

/**
 * Custom hook to load userId from storage if not provided in params
 */
function useUserIdFromStorage(userIdParam: string | undefined) {
  const [userId, setUserId] = useState<string | undefined>(userIdParam);

  useEffect(() => {
    async function loadUserIdFromStorage() {
      if (userId) return;

      const storedUserId = await getStoredUuid();

      if (storedUserId) {
        setUserId(storedUserId);
      } else {
        console.warn('[TierListEditRoute] No userId found in storage either!');
      }
    }

    loadUserIdFromStorage();
  }, [userId]);

  return userId;
}

/**
 * Custom hook to determine which tier list belongs to the current user
 */
function useUserTierList(rivalry: MRivalry | null, userId: string | undefined) {
  const [userTierList, setUserTierList] = useState<MTierList | null>(null);

  useEffect(() => {
    if (!(rivalry && userId)) {
      if (rivalry && !userId) {
        console.warn('[TierListEditRoute] userId param is missing!');
      }
      return;
    }

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

  return userTierList;
}

/**
 * Renders the content based on loading/error/success state
 */
function renderContent({
  isLoading,
  isError,
  error,
  rivalry,
  userTierList,
  userId,
  hasChanges,
  isPending,
  handleSave,
  handleTierListChange,
  setHasUnsavedChanges,
  router,
}: {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  rivalry: MRivalry | null;
  userTierList: MTierList | null;
  userId: string | undefined;
  hasChanges: boolean;
  isPending: boolean;
  handleSave: () => void;
  handleTierListChange: () => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  router: ReturnType<typeof useRouter>;
}) {
  if (isLoading) {
    return <LoadingWithCharacter message="Loading Tier List..." />;
  }

  if (isError) {
    return (
      <View style={errorContainerStyle}>
        <Text style={errorTitleStyle}>Error</Text>
        <Text
          style={[styles.text, darkStyles.text]}
        >{`Error loading tier list: ${error?.message}`}</Text>
      </View>
    );
  }

  if (!rivalry) {
    return <LoadingWithCharacter message="Loading rivalry..." />;
  }

  if (!userTierList) {
    return (
      <View style={errorContainerStyle}>
        <Text style={warningTitleStyle}>Could not load tier list</Text>
        <Text style={warningBodyStyle}>
          {userId
            ? `Your user ID (${userId}) doesn't match either tier list`
            : 'User ID is missing from navigation params'}
        </Text>
        {userId && rivalry.tierListA && rivalry.tierListB && (
          <Text style={debugInfoStyle}>
            {`TierList A: ${rivalry.tierListA.userId}\nTierList B: ${rivalry.tierListB.userId}`}
          </Text>
        )}
        <TouchableOpacity
          onPress={() => router.back()}
          style={goBackButtonStyle}
        >
          <Text style={goBackButtonTextStyle}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={editContainerStyle}>
      <View style={editDisplayContainerStyle}>
        <TierListEditDisplay
          onChange={handleTierListChange}
          onUnsavedChangesChange={setHasUnsavedChanges}
          tierList={userTierList}
        />
      </View>

      <TouchableOpacity
        disabled={!hasChanges || isPending}
        onPress={handleSave}
        style={[
          saveButtonBaseStyle,
          {
            backgroundColor:
              hasChanges && !isPending ? colors.blue500 : colors.slate500,
          },
        ]}
      >
        {isPending ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={saveButtonTextStyle}>
            {hasChanges ? 'Save List' : 'No Changes'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function TierListEditRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rivalryId = params.id as string;
  const userIdParam = params.userId as string | undefined;
  const userAName = params.userAName as string | undefined;
  const userBName = params.userBName as string | undefined;

  useSetHeader({ title: 'Edit Tier List' });

  const [rivalry, setRivalry] = useState<MRivalry | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const userId = useUserIdFromStorage(userIdParam);
  const userTierList = useUserTierList(rivalry, userId);
  const navigation = useNavigation();
  const { hasUnsavedChanges, setHasUnsavedChanges } = useUnsavedChanges();

  const { isLoading, isError, error } = useQuery({
    enabled: !!rivalryId,
    queryKey: ['rivalryTierEdit', rivalryId],
    structuralSharing: false,
    queryFn: () => fetchRivalryData(rivalryId, setRivalry),
  });

  const { mutate: saveTierSlots, isPending } = useUpdateTierSlotsMutation({
    rivalry,
    tierListSignifier: userTierList?.userId === rivalry?.userAId ? 'A' : 'B',
    onSuccess: () => {
      setHasChanges(false);
      setHasUnsavedChanges(false);
      router.back();
    },
  });

  const handleSave = useCallback(() => {
    saveTierSlots();
  }, [saveTierSlots]);

  const handleTierListChange = () => {
    setHasChanges(true);
  };

  // Navigation interception for unsaved changes
  useEffect(() => {
    const beforeRemove = (e: {
      preventDefault: () => void;
      data: { action: Parameters<typeof navigation.dispatch>[0] };
    }) => {
      if (!hasUnsavedChanges) {
        return; // No unsaved changes, allow navigation
      }

      // Prevent default navigation
      e.preventDefault();

      // Show confirmation dialog
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. What would you like to do?',
        [
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setHasUnsavedChanges(false);
              navigation.dispatch(e.data.action);
            },
          },
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Save Changes',
            onPress: () => {
              handleSave();
              // Navigation handled by onSuccess callback in saveTierSlots
            },
          },
        ]
      );
    };

    navigation.addListener('beforeRemove', beforeRemove);
    return () => navigation.removeListener('beforeRemove', beforeRemove);
  }, [navigation, hasUnsavedChanges, setHasUnsavedChanges, handleSave]);

  // Reset unsaved changes when component unmounts
  useEffect(() => {
    return () => {
      setHasUnsavedChanges(false);
    };
  }, [setHasUnsavedChanges]);

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Tier List' }} />
      <RivalryProvider
        rivalry={rivalry}
        userAName={userAName}
        userBName={userBName}
        userId={userId}
      >
        <SafeAreaView style={[styles.container, darkStyles.container]}>
          {renderContent({
            isLoading,
            isError,
            error,
            rivalry,
            userTierList,
            userId,
            hasChanges,
            isPending,
            handleSave,
            handleTierListChange,
            setHasUnsavedChanges,
            router,
          })}
        </SafeAreaView>
      </RivalryProvider>
      <StatusBar style="light" />
    </>
  );
}

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

const editContainerStyle = {
  flex: 1,
  padding: 16,
};

const editDisplayContainerStyle = {
  flex: 1,
};

const saveButtonBaseStyle = {
  padding: 16,
  borderRadius: 8,
  alignItems: center,
  marginTop: 16,
};

const saveButtonTextStyle = {
  color: colors.white,
  fontSize: 18,
  fontWeight: bold,
};

const warningTitleStyle = {
  ...styles.text,
  ...darkStyles.text,
  fontSize: 18,
  fontWeight: bold,
  color: colors.amber400,
  marginBottom: 16,
};

const warningBodyStyle = {
  ...styles.text,
  ...darkStyles.text,
  textAlign: center,
  marginBottom: 8,
};

const debugInfoStyle = {
  ...styles.text,
  ...darkStyles.text,
  fontSize: 12,
  color: colors.gray300,
  textAlign: center,
  marginTop: 16,
};

const goBackButtonStyle = {
  backgroundColor: colors.blue500,
  padding: 12,
  borderRadius: 8,
  marginTop: 24,
};

const goBackButtonTextStyle = {
  color: colors.white,
  fontSize: 16,
};
