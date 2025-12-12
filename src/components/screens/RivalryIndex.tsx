import { useRouter, useFocusEffect } from 'expo-router';
import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthUser } from '../../hooks/useAuthUser';
import { useUserRivalries } from '../../hooks/useUserRivalries';
import { useAllRivalriesUpdate } from '../../providers/all-rivalries';
import { darkStyles, styles } from '../../utils/styles';
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
    refetch
  } = useUserRivalries(user?.id);
  const { setRivalries } = useAllRivalriesUpdate();
  const [showHiddenRivalries, setShowHiddenRivalries] = useState(false);

  // Refetch rivalries when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
      setShowHiddenRivalries(false);
    }, [refetch])
  );

  // Populate the AllRivalriesProvider when rivalries are loaded
  useEffect(() => {
    if (allRivalries && user?.id) {
      setRivalries(allRivalries as any, user.id);
    }
  }, [allRivalries, user?.id, setRivalries]);

  // Check if there are any hidden rivalries
  const hasHiddenRivalries = useMemo(() => {
    return rivalries.some((rivalry) => {
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
        userId: user?.id
      }
    });
  }

  function handleCreateRivalry() {
    // Get gameId from the first rivalry, or use the default game
    // TODO: In the future, let users select from multiple games
    const gameId = rivalries[0]?.gameId || '73ed69cf-2775-43d6-bece-aed10da3e25a';

    // Check if user has no rivalries (accepted or pending)
    const hasNoRivalries = allRivalries.length === 0;

    // Navigate to create rivalry screen using Expo Router
    router.push({
      pathname: '/rivalry/create',
      params: {
        gameId,
        autoSearchNpc: hasNoRivalries ? 'true' : undefined
      }
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

      {showHiddenRivalries && (
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <Text style={[styles.text, { fontSize: 18, fontWeight: 'bold', color: '#999' }]}>
            Hidden Rivalries
          </Text>
        </View>
      )}
      <RivalriesTable
        rivalries={rivalries as Rivalry[]}
        currentUserId={user?.id}
        onSelectRivalry={handleSelectRivalry}
        showHidden={showHiddenRivalries}
      />

      {hasHiddenRivalries && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <TouchableOpacity
            onPress={() => setShowHiddenRivalries(!showHiddenRivalries)}
            style={{
              backgroundColor: '#374151',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center'
            }}
          >
            <Text style={[styles.text, { fontSize: 16, fontWeight: 'bold' }]}>
              Show {!showHiddenRivalries && 'Hidden '}Rivalries
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
