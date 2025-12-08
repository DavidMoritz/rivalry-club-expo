import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAcceptRivalryMutation } from '../../controllers/c-rivalry';
import { useAuthUser } from '../../hooks/useAuthUser';
import { MRivalry } from '../../models/m-rivalry';
import { useAllRivalries, useAllRivalriesUpdate } from '../../providers/all-rivalries';
import { darkStyles, styles } from '../../utils/styles';

export function PendingRivalries() {
  const router = useRouter();
  const { user } = useAuthUser();
  const [acceptingRivalryId, setAcceptingRivalryId] = useState<string | null>(null);

  const { pendingRivalries } = useAllRivalries();
  const { updateRivalry } = useAllRivalriesUpdate();

  const { mutate: acceptRivalry } = useAcceptRivalryMutation({
    onSuccess: () => {
      // Update the rivalry in the provider to mark it as accepted
      if (acceptingRivalryId) {
        updateRivalry(acceptingRivalryId, { accepted: true });
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

  const renderRivalryItem = ({ item, isAwaitingAcceptance }: { item: any; isAwaitingAcceptance: boolean }) => {
    const isUserA = item.userAId === user?.id;
    const otherUserName = isUserA ? item.userBName : item.userAName;
    const displayName = otherUserName || 'Unknown User';

    return (
      <View
        style={{
          paddingVertical: 16,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#333',
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
          <Text style={[styles.text, { fontSize: 14, color: '#999', marginTop: 4 }]}>
            {isAwaitingAcceptance ? 'Waiting for you to accept' : 'Waiting for acceptance'}
          </Text>
        </View>

        {isAwaitingAcceptance && (
          <TouchableOpacity
            onPress={() => handleAcceptRivalry(item.id)}
            disabled={acceptingRivalryId === item.id}
            style={{
              backgroundColor: acceptingRivalryId === item.id ? '#475569' : '#10b981',
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
                <Text style={{ fontSize: 14, color: 'white', marginRight: 8 }}>✓</Text>
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
      <View style={{ paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#333' }}>
        <Text style={[styles.text, { fontSize: 24, fontWeight: 'bold' }]}>
          Pending Rivalries
        </Text>
        <Text style={[styles.text, { marginTop: 4, color: '#999' }]}>
          Challenges waiting for acceptance
        </Text>
      </View>

      {awaitingAcceptance.length === 0 && initiated.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 48, color: '#666', marginBottom: 16 }}>📥</Text>
          <Text style={[styles.text, { fontSize: 18, color: '#999', textAlign: 'center' }]}>
            No pending rivalries
          </Text>
          <Text style={[styles.text, { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8 }]}>
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
                  <View style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: '#1e293b'
                  }}>
                    <Text style={[styles.text, { fontSize: 14, fontWeight: 'bold', color: '#94a3b8' }]}>
                      {item.section === 'awaitingAcceptance' ? 'AWAITING YOUR ACCEPTANCE' : 'SENT BY YOU'}
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
