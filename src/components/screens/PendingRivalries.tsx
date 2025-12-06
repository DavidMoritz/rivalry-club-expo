import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAcceptRivalryMutation, usePendingRivalriesQuery } from '../../controllers/c-rivalry';
import { useUserDataQuery } from '../../controllers/c-user';
import { useAuthUser } from '../../hooks/useAuthUser';
import { MRivalry } from '../../models/m-rivalry';
import { getMUser } from '../../models/m-user';
import { darkStyles, styles } from '../../utils/styles';

export function PendingRivalries() {
  const router = useRouter();
  const { user } = useAuthUser();
  const [acceptingRivalryId, setAcceptingRivalryId] = useState<string | null>(null);

  const { data: pendingRivalries, isLoading, refetch } = usePendingRivalriesQuery({
    userId: user?.id
  });

  const allRivalries = [
    ...(pendingRivalries?.awaitingAcceptance || []),
    ...(pendingRivalries?.initiated || [])
  ];

  const { data: users } = useUserDataQuery({
    rivalries: allRivalries as MRivalry[]
  });

  // Populate user data into rivalries
  const rivalriesWithUsers = useMemo(() => {
    if (!users || users.length === 0) return allRivalries;

    return allRivalries.map((rivalry) => {
      const userAData = users.find((u) => u?.id === rivalry.userAId);
      const userBData = users.find((u) => u?.id === rivalry.userBId);

      if (userAData) {
        rivalry.userA = getMUser({ user: userAData as any });
      }
      if (userBData) {
        rivalry.userB = getMUser({ user: userBData as any });
      }

      return rivalry;
    });
  }, [users, pendingRivalries]);

  const { mutate: acceptRivalry } = useAcceptRivalryMutation({
    rivalryId: acceptingRivalryId || '',
    onSuccess: () => {
      setAcceptingRivalryId(null);
      refetch();
    }
  });

  const handleAcceptRivalry = (rivalryId: string) => {
    setAcceptingRivalryId(rivalryId);
    acceptRivalry();
  };

  const renderRivalryItem = ({ item, isAwaitingAcceptance }: { item: MRivalry; isAwaitingAcceptance: boolean }) => {
    const otherUser = item.userAId === user?.id ? item.userB : item.userA;
    const otherUserName = otherUser
      ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email
      : 'Unknown User';

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
            {otherUserName}
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
                <FontAwesomeIcon icon="check" color="white" size={14} style={{ marginRight: 8 }} />
                <Text style={[styles.text, { fontSize: 14, fontWeight: 'bold' }]}>Accept</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, darkStyles.container]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#6b21a8" />
          <Text style={[styles.text, { fontSize: 18, marginTop: 16 }]}>
            Loading pending rivalries...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Separate rivalries into awaiting and initiated using the populated data
  const awaitingAcceptance = rivalriesWithUsers.filter(
    (r) => r.userBId === user?.id && !r.accepted
  );
  const initiated = rivalriesWithUsers.filter((r) => r.userAId === user?.id && !r.accepted);

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
          <FontAwesomeIcon icon="inbox" color="#666" size={48} style={{ marginBottom: 16 }} />
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
