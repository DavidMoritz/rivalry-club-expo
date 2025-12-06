import React from 'react';
import { FlatList, Text, View } from 'react-native';

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
  if (!rivalries || rivalries.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Text style={[styles.text, { fontSize: 16, textAlign: 'center', color: '#999' }]}>
          No rivalries found. Create your first rivalry to get started!
        </Text>
      </View>
    );
  }

  return (
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
  );
}
