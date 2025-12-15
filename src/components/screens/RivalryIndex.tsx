import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthUser } from '../../hooks/useAuthUser';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useUserRivalries } from '../../hooks/useUserRivalries';
import { useAllRivalriesUpdate } from '../../providers/all-rivalries';
import { colors } from '../../utils/colors';
import { darkStyles, styles } from '../../utils/styles';
import { OfflineModal } from '../common/OfflineModal';
import { RivalriesTable } from './parts/RivalriesTable';

interface Rivalry {
  id: string;
  userAId: string;
  userBId: string;
  updatedAt: string;
  userAName?: string;
  userBName?: string;
  contestCount?: number;
  hiddenByA?: boolean | null;
  hiddenByB?: boolean | null;
}

export function RivalryIndex() {
  const router = useRouter();
  const { user, isLoading: userLoading, error: userError } = useAuthUser();
  const {
    rivalries,
    allRivalries,
    isLoading: rivalriesLoading,
    error: rivalriesError,
    refetch,
  } = useUserRivalries(user?.id);
  const { setRivalries } = useAllRivalriesUpdate();
  const [showHiddenRivalries, setShowHiddenRivalries] = useState(false);
  const [providerInitialized, setProviderInitialized] = useState(false);
  const { isConnected, hasShownOfflineModal, setHasShownOfflineModal } =
    useNetworkStatus();
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  // Refetch rivalries when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
      setShowHiddenRivalries(false);
      setProviderInitialized(false);
    }, [refetch])
  );

  // Populate the AllRivalriesProvider when rivalries are loaded
  useEffect(() => {
    // Mark as initialized once rivalries query completes (even if empty)
    if (!rivalriesLoading && user?.id) {
      if (allRivalries.length > 0) {
        // Type assertion needed: hook returns simplified RivalryWithUsers,
        // provider expects MRivalry-based type (structurally compatible for this use)
        setRivalries(
          allRivalries as Parameters<typeof setRivalries>[0],
          user.id
        );
      }
      setProviderInitialized(true);
    }
  }, [allRivalries, rivalriesLoading, user?.id, setRivalries]);

  // Show offline modal when connection is lost or network error occurs (only once per disconnection)
  useEffect(() => {
    const isNetworkError = error?.message?.toLowerCase().includes('network');
    if ((!isConnected || isNetworkError) && !hasShownOfflineModal) {
      setShowOfflineModal(true);
      setHasShownOfflineModal(true);
    }
    // Close modal when connection is restored
    if (isConnected && !isNetworkError) {
      setShowOfflineModal(false);
    }
  }, [isConnected, hasShownOfflineModal, setHasShownOfflineModal, error]);

  // Check if there are any hidden rivalries
  const hasHiddenRivalries = useMemo(() => {
    return rivalries.some(rivalry => {
      const isUserA = rivalry.userAId === user?.id;
      return isUserA ? rivalry.hiddenByA : rivalry.hiddenByB;
    });
  }, [rivalries, user?.id]);

  function handleSelectRivalry(rivalry: Rivalry) {
    // Navigate to rivalry detail view using Expo Router with user names
    router.push({
      pathname: `/rivalry/${rivalry.id}`,
      params: {
        userAName: rivalry.userAName,
        userBName: rivalry.userBName,
        userId: user?.id,
      },
    });
  }

  function handleCreateRivalry() {
    // Get gameId from the first rivalry, or use the default game
    // TODO: In the future, let users select from multiple games
    const gameId =
      rivalries[0]?.gameId || '73ed69cf-2775-43d6-bece-aed10da3e25a';

    // Check if user has no rivalries (accepted or pending)
    const hasNoRivalries = allRivalries.length === 0;

    // Navigate to create rivalry screen using Expo Router
    router.push({
      pathname: '/rivalry/create',
      params: {
        gameId,
        autoSearchNpc: hasNoRivalries ? 'true' : undefined,
      },
    });
  }

  const error = userError || rivalriesError;
  // Check for errors before provider initialization to avoid stuck loading state
  const isLoading =
    userLoading || rivalriesLoading || !(providerInitialized || error);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, darkStyles.container]}>
        <OfflineModal
          onClose={() => setShowOfflineModal(false)}
          visible={showOfflineModal}
        />
        <View style={centeredContainerStyle}>
          <Text style={loadingTextStyle}>Loading rivalries...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, darkStyles.container]}>
        <OfflineModal
          onClose={() => setShowOfflineModal(false)}
          visible={showOfflineModal}
        />
        <View style={errorContainerStyle}>
          <Text style={errorTitleStyle}>Error</Text>
          <Text style={styles.text}>{error.message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.container, darkStyles.container]}
    >
      <OfflineModal
        onClose={() => setShowOfflineModal(false)}
        visible={showOfflineModal}
      />

      <View style={headerContainerStyle}>
        <Text style={welcomeTextStyle}>
          Welcome{user?.firstName ? `, ${user.firstName}` : ''}!
        </Text>
        <Text style={subtitleTextStyle}>Select a rivalry to continue</Text>

        <TouchableOpacity
          onPress={handleCreateRivalry}
          style={createButtonStyle}
          testID="create-rivalry-button"
        >
          <Text style={createButtonTextStyle}>Create New Rivalry</Text>
        </TouchableOpacity>
      </View>

      {showHiddenRivalries && (
        <View style={hiddenHeaderStyle}>
          <Text style={hiddenHeaderTextStyle}>Hidden Rivalries</Text>
        </View>
      )}
      <RivalriesTable
        currentUserId={user?.id}
        onSelectRivalry={handleSelectRivalry}
        rivalries={rivalries as Rivalry[]}
        showHidden={showHiddenRivalries}
      />

      {hasHiddenRivalries && (
        <View style={toggleContainerStyle}>
          <TouchableOpacity
            onPress={() => setShowHiddenRivalries(!showHiddenRivalries)}
            style={toggleButtonStyle}
          >
            <Text style={toggleButtonTextStyle}>
              Show {!showHiddenRivalries && 'Hidden '}Rivalries
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
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
  fontSize: 18,
  fontWeight: bold,
  color: colors.red600,
  marginBottom: 16,
};

const headerContainerStyle = {
  paddingHorizontal: 16,
  paddingVertical: 16,
  borderBottomWidth: 1,
  borderBottomColor: colors.gray750,
};

const welcomeTextStyle = {
  ...styles.text,
  fontSize: 24,
  fontWeight: bold,
};

const subtitleTextStyle = {
  ...styles.text,
  marginTop: 4,
  color: colors.gray400,
};

const createButtonStyle = {
  backgroundColor: colors.purple900,
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: 8,
  marginTop: 16,
  alignItems: center,
};

const createButtonTextStyle = {
  ...styles.text,
  fontSize: 16,
  fontWeight: bold,
};

const hiddenHeaderStyle = {
  paddingHorizontal: 16,
  paddingTop: 8,
};

const hiddenHeaderTextStyle = {
  ...styles.text,
  fontSize: 18,
  fontWeight: bold,
  color: colors.gray400,
};

const toggleContainerStyle = {
  paddingHorizontal: 16,
  paddingBottom: 16,
};

const toggleButtonStyle = {
  backgroundColor: colors.gray700,
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: 8,
  alignItems: center,
};

const toggleButtonTextStyle = {
  ...styles.text,
  fontSize: 16,
  fontWeight: bold,
};
