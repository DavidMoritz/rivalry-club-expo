import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../utils/colors';
import { darkStyles, styles } from '../../../utils/styles';

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const MS_PER_DAY =
  MS_PER_SECOND * SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY;
const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30;

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
  const diffInDays = Math.floor(diffInMs / MS_PER_DAY);

  if (diffInDays === 0) {
    return 'Today';
  }

  if (diffInDays === 1) {
    return 'Yesterday';
  }

  if (diffInDays < DAYS_PER_WEEK) {
    return `${diffInDays} days ago`;
  }

  if (diffInDays < DAYS_PER_MONTH) {
    const weeks = Math.floor(diffInDays / DAYS_PER_WEEK);

    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }

  return date.toLocaleDateString();
}

export function RivalryRow({
  updatedAt,
  opponentName,
  onPress,
  contestCount = 0,
}: RivalryRowProps) {
  const [updatedDisplay, setUpdatedDisplay] = useState<string>('');

  useEffect(() => {
    if (!updatedAt) return;

    setUpdatedDisplay(formatDate(updatedAt));
  }, [updatedAt]);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[rivalryRowStyle, darkStyles.container]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.text,
              { fontSize: 18, fontWeight: '600', marginBottom: 4 },
            ]}
          >
            vs. {opponentName || 'Unknown'}
          </Text>
          <Text style={[styles.text, { fontSize: 12, color: colors.gray400 }]}>
            {updatedDisplay} • {contestCount} contest
            {contestCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <View
          style={{
            width: 24,
            height: 24,
            borderWidth: 2,
            borderColor: colors.green600,
            borderRadius: 4,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.green600, fontSize: 10 }}>✓</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const rivalryRowStyle = {
  borderWidth: 1,
  paddingHorizontal: 10,
  paddingVertical: 15,
};
