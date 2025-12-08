import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthUser } from '../../hooks/useAuthUser';
import { useUserRivalries } from '../../hooks/useUserRivalries';
import { useAllRivalriesUpdate } from '../../providers/all-rivalries';
import { darkStyles, styles } from '../../utils/styles';
import { RivalriesTable } from './parts/RivalriesTable';

interface Rivalry {
  id: string;
  updatedAt: string;
  userAName?: string;
  userBName?: string;
  contestCount?: number;
}

export function RivalryIndex() {
  const router = useRouter();
  const { user, isLoading: userLoading, error: userError } = useAuthUser();
  const {
    rivalries,
    allRivalries,
    isLoading: rivalriesLoading,
    error: rivalriesError
  } = useUserRivalries(user?.id);
  const { setRivalries } = useAllRivalriesUpdate();

  // Populate the AllRivalriesProvider when rivalries are loaded
  useEffect(() => {
    if (allRivalries && allRivalries.length > 0) {
      setRivalries(allRivalries as any);
    }
  }, [allRivalries, setRivalries]);

  function handleSelectRivalry(rivalry: Rivalry) {
    // Navigate to rivalry detail view using Expo Router with user names
    router.push({
      pathname: `/rivalry/${rivalry.id}`,
      params: {
        userAName: rivalry.userAName,
        userBName: rivalry.userBName,
        userId: user?.id
      }
    });
  }

  function handleCreateRivalry() {
    // Get gameId from the first rivalry, or use the default game
    // TODO: In the future, let users select from multiple games
    const gameId = rivalries[0]?.gameId || '73ed69cf-2775-43d6-bece-aed10da3e25a';

    // Navigate to create rivalry screen using Expo Router
    router.push({
      pathname: '/rivalry/create',
      params: { gameId }
    });
  }

  const isLoading = userLoading || rivalriesLoading;
  const error = userError || rivalriesError;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, darkStyles.container]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[styles.text, { fontSize: 18 }]}>
            {userLoading ? 'Loading user data...' : 'Loading rivalries...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, darkStyles.container]}>
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}
        >
          <Text
            style={[
              styles.text,
              { fontSize: 18, fontWeight: 'bold', color: '#ef4444', marginBottom: 16 }
            ]}
          >
            Error
          </Text>
          <Text style={styles.text}>{error.message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, darkStyles.container]} edges={['top', 'bottom']}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#333'
        }}
      >
        <Text style={[styles.text, { fontSize: 24, fontWeight: 'bold' }]}>
          Welcome{user?.firstName ? `, ${user.firstName}` : ''}!
        </Text>
        <Text style={[styles.text, { marginTop: 4, color: '#999' }]}>
          Select a rivalry to continue
        </Text>

        <TouchableOpacity
          testID="create-rivalry-button"
          onPress={handleCreateRivalry}
          style={{
            backgroundColor: '#6b21a8',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
            marginTop: 16,
            alignItems: 'center'
          }}
        >
          <Text style={[styles.text, { fontSize: 16, fontWeight: 'bold' }]}>
            Create New Rivalry
          </Text>
        </TouchableOpacity>
      </View>

      <RivalriesTable
        rivalries={rivalries}
        currentUserId={user?.id}
        onSelectRivalry={handleSelectRivalry}
      />
    </SafeAreaView>
  );
}
