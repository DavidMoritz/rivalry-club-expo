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
  hiddenByA?: boolean;
  hiddenByB?: boolean;
}

interface RivalriesTableProps {
  rivalries: Rivalry[];
  currentUserId?: string;
  onSelectRivalry: (rivalry: Rivalry) => void;
  showHidden?: boolean;
}

export function RivalriesTable({
  rivalries,
  currentUserId,
  onSelectRivalry,
  showHidden = false
}: RivalriesTableProps) {
  const router = useRouter();
  const { pendingRivalries } = useAllRivalries();
  const hasPendingRivalries = pendingRivalries.awaitingAcceptance.length > 0;

  // Filter rivalries based on showHidden prop
  const visibleRivalries = rivalries.filter((rivalry) => {
    const isUserA = rivalry.userAId === currentUserId;
    const isHidden = isUserA ? rivalry.hiddenByA : rivalry.hiddenByB;

    // If showHidden is true, show only hidden rivalries
    // If showHidden is false, show only non-hidden rivalries
    return showHidden ? isHidden : !isHidden;
  });

  return (
    <>
      {visibleRivalries && visibleRivalries.length > 0 && (
        <FlatList
          data={visibleRivalries}
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

      {(!visibleRivalries || visibleRivalries.length === 0) && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <TouchableOpacity
            onPress={() => router.push('/how-to-play')}
            style={{
              backgroundColor: '#fbbf24',
              paddingHorizontal: 24,
              paddingVertical: 12,
              marginTop: 20,
              borderRadius: 8,
              alignItems: 'center'
            }}
          >
            <Text style={[styles.text, { fontSize: 16, fontWeight: 'bold', color: '#222' }]}>
              How to Play
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}
