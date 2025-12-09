import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import { useAllRivalries } from '../../../providers/all-rivalries';
import { styles } from '../../../utils/styles';
import { RivalryRow } from './RivalryRow';

interface Rivalry {
  id: string;
  updatedAt: string;
  userAId: string;
  userBId: string;
  userAName?: string;
  userBName?: string;
  contestCount?: number;
}

interface RivalriesTableProps {
  rivalries: Rivalry[];
  currentUserId?: string;
  onSelectRivalry: (rivalry: Rivalry) => void;
}

export function RivalriesTable({ rivalries, currentUserId, onSelectRivalry }: RivalriesTableProps) {
  const router = useRouter();
  const { pendingRivalries } = useAllRivalries();
  const hasPendingRivalries = pendingRivalries.awaitingAcceptance.length > 0;

  return (
    <>
      {rivalries && rivalries.length > 0 && (
        <FlatList
          data={rivalries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            // Determine opponent's name based on current user
            const isUserA = item.userAId === currentUserId;
            const opponentName = isUserA ? item.userBName : item.userAName;

            return (
              <RivalryRow
                updatedAt={item.updatedAt}
                opponentName={opponentName}
                contestCount={item.contestCount}
                onPress={() => onSelectRivalry(item)}
              />
            );
          }}
          contentContainerStyle={{ padding: 16 }}
        />
      )}

      {hasPendingRivalries && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <TouchableOpacity
            onPress={() => router.push('/pending')}
            style={{
              backgroundColor: '#fbbf24',
              paddingHorizontal: 24,
              paddingVertical: 12,
              marginTop: 8,
              borderRadius: 8,
              alignItems: 'center'
            }}
          >
            <Text style={[styles.text, { fontSize: 16, fontWeight: 'bold', color: '#222' }]}>
              Pending Rivalry Found
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {(!rivalries || rivalries.length === 0) && (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}
        >
          <Text style={[styles.text, { fontSize: 16, textAlign: 'center', color: '#999' }]}>
            No rivalries found. Create your first rivalry to get started!
          </Text>
        </View>
      )}
    </>
  );
}
