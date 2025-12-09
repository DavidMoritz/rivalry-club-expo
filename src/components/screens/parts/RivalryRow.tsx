import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { darkStyles, styles } from '../../../utils/styles';

interface RivalryRowProps {
  updatedAt: string;
  opponentName?: string;
  onPress: () => void;
  contestCount?: number;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return 'Today';
  }

  if (diffInDays === 1) {
    return 'Yesterday';
  }

  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }

  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);

    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }

  return date.toLocaleDateString();
}

export function RivalryRow({
  updatedAt,
  opponentName,
  onPress,
  contestCount = 0
}: RivalryRowProps) {
  const [updatedDisplay, setUpdatedDisplay] = useState<string>('');

  useEffect(() => {
    if (!updatedAt) return;

    setUpdatedDisplay(formatDate(updatedAt));
  }, [updatedAt]);

  return (
    <TouchableOpacity onPress={onPress} style={[styles.rivalryRow, darkStyles.container]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.text, { fontSize: 18, fontWeight: '600', marginBottom: 4 }]}>
            vs. {opponentName || 'Unknown'}
          </Text>
          <Text style={[styles.text, { fontSize: 12, color: '#999' }]}>
            {updatedDisplay} • {contestCount} contest{contestCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <View
          style={{
            width: 24,
            height: 24,
            borderWidth: 2,
            borderColor: '#10b981',
            borderRadius: 4,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Text style={{ color: '#10b981', fontSize: 10 }}>✓</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
