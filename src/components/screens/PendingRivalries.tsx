import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAcceptRivalryMutation } from '../../controllers/c-rivalry';
import { useAuthUser } from '../../hooks/useAuthUser';
import { MRivalry } from '../../models/m-rivalry';
import { useAllRivalries, useAllRivalriesUpdate } from '../../providers/all-rivalries';
import { darkStyles, styles } from '../../utils/styles';
import { colors } from '../../utils/colors';

export function PendingRivalries() {
  const router = useRouter();
  const { user } = useAuthUser();
  const [acceptingRivalryId, setAcceptingRivalryId] = useState<string | null>(null);

  const { pendingRivalries, rivalries } = useAllRivalries();
  const { updateRivalry } = useAllRivalriesUpdate();

  const { mutate: acceptRivalry } = useAcceptRivalryMutation({
    onSuccess: () => {
      // Update the rivalry in the provider to mark it as accepted
      if (acceptingRivalryId) {
        updateRivalry(acceptingRivalryId, { accepted: true });

        // Find the accepted rivalry to get user names for navigation
        const acceptedRivalry = pendingRivalries.awaitingAcceptance.find(
          (r) => r.id === acceptingRivalryId
        );

        if (acceptedRivalry) {
          // Navigate to the rivalry page
          router.push({
            pathname: `/rivalry/${acceptingRivalryId}`,
            params: {
              userAName: acceptedRivalry.userAName,
              userBName: acceptedRivalry.userBName,
              userId: user?.id
            }
          });
        }
      }
      setAcceptingRivalryId(null);
    },
    onError: (error) => {
      console.error('[PendingRivalries] Failed to accept rivalry:', error);
      setAcceptingRivalryId(null);
      // TODO: Show error toast to user
    }
  });

  const handleAcceptRivalry = (rivalryId: string) => {
    if (!rivalryId) {
      console.error('[PendingRivalries] Cannot accept rivalry with empty ID');
      return;
    }
    setAcceptingRivalryId(rivalryId);
    acceptRivalry(rivalryId);
  };

  const handleCreateRivalry = () => {
    // Get gameId from the first rivalry, or use the default game
    // TODO: In the future, let users select from multiple games
    const gameId = rivalries[0]?.gameId || '73ed69cf-2775-43d6-bece-aed10da3e25a';

    // Navigate to create rivalry screen using Expo Router
    router.push({
      pathname: '/rivalry/create',
      params: { gameId }
    });
  };

  const renderRivalryItem = ({
    item,
    isAwaitingAcceptance
  }: {
    item: any;
    isAwaitingAcceptance: boolean;
  }) => {
    const isUserA = item.userAId === user?.id;
    const otherUserName = isUserA ? item.userBName : item.userAName;
    const displayName = otherUserName || 'Unknown User';

    return (
      <View
        style={{
          paddingVertical: 16,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.gray750,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.text, { fontSize: 16, fontWeight: 'bold' }]}>
            {isAwaitingAcceptance ? 'Challenge from ' : 'Sent to '}
            {displayName}
          </Text>
          <Text style={[styles.text, { fontSize: 14, color: colors.gray400, marginTop: 4 }]}>
            {isAwaitingAcceptance ? 'Waiting for you to accept' : 'Waiting for acceptance'}
          </Text>
        </View>

        {isAwaitingAcceptance && (
          <TouchableOpacity
            onPress={() => handleAcceptRivalry(item.id)}
            disabled={acceptingRivalryId === item.id}
            style={{
              backgroundColor: acceptingRivalryId === item.id ? colors.slate600 : colors.green600,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 6,
              flexDirection: 'row',
              alignItems: 'center'
            }}
          >
            {acceptingRivalryId === item.id ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Text style={{ fontSize: 14, color: colors.white, marginRight: 8 }}>✓</Text>
                <Text style={[styles.text, { fontSize: 14, fontWeight: 'bold' }]}>Accept</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const { awaitingAcceptance, initiated } = pendingRivalries;

  return (
    <SafeAreaView style={[styles.container, darkStyles.container]} edges={['top', 'bottom']}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.gray750
        }}
      >
        <Text style={[styles.text, { fontSize: 24, fontWeight: 'bold' }]}>Pending Rivalries</Text>
        <Text style={[styles.text, { marginTop: 4, color: colors.gray400 }]}>
          Challenges waiting for acceptance
        </Text>

        {awaitingAcceptance.length === 0 && initiated.length === 0 && (
          <TouchableOpacity
            onPress={handleCreateRivalry}
            style={{
              backgroundColor: colors.purple900,
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
        )}
      </View>

      {awaitingAcceptance.length === 0 && initiated.length === 0 ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}
        >
          <Text style={{ fontSize: 48, color: colors.gray500, marginBottom: 16 }}>📥</Text>
          <Text style={[styles.text, { fontSize: 18, color: colors.gray400, textAlign: 'center' }]}>
            No pending rivalries
          </Text>
          <Text
            style={[
              styles.text,
              { fontSize: 14, color: colors.gray500, textAlign: 'center', marginTop: 8 }
            ]}
          >
            Create a new rivalry to get started!
          </Text>
        </View>
      ) : (
        <FlatList
          data={[
            { section: 'awaitingAcceptance', data: awaitingAcceptance },
            { section: 'initiated', data: initiated }
          ]}
          keyExtractor={(item) => item.section}
          renderItem={({ item }) => (
            <>
              {item.data.length > 0 && (
                <>
                  <View
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      backgroundColor: colors.slate900
                    }}
                  >
                    <Text
                      style={[
                        styles.text,
                        { fontSize: 14, fontWeight: 'bold', color: colors.slate400 }
                      ]}
                    >
                      {item.section === 'awaitingAcceptance'
                        ? 'AWAITING YOUR ACCEPTANCE'
                        : 'SENT BY YOU'}
                    </Text>
                  </View>
                  {item.data.map((rivalry) => (
                    <View key={rivalry.id}>
                      {renderRivalryItem({
                        item: rivalry,
                        isAwaitingAcceptance: item.section === 'awaitingAcceptance'
                      })}
                    </View>
                  ))}
                </>
              )}
            </>
          )}
        />
      )}
    </SafeAreaView>
  );
}
