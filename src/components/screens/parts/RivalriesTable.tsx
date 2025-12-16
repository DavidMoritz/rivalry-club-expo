import { useRouter } from 'expo-router';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import { useAllRivalries } from '../../../providers/all-rivalries';
import { colors } from '../../../utils/colors';
import { bold, center, styles } from '../../../utils/styles';
import { RivalryRow } from './RivalryRow';

interface Rivalry {
  id: string;
  updatedAt: string;
  userAId: string;
  userBId: string;
  userAName?: string;
  userBName?: string;
  contestCount?: number;
  hiddenByA?: boolean | null;
  hiddenByB?: boolean | null;
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
  showHidden = false,
}: RivalriesTableProps) {
  const router = useRouter();
  const { pendingRivalries } = useAllRivalries();
  const hasPendingRivalries = pendingRivalries.awaitingAcceptance.length > 0;

  // Filter rivalries based on showHidden prop
  const visibleRivalries = rivalries.filter(rivalry => {
    const isUserA = rivalry.userAId === currentUserId;
    const isHidden = isUserA ? rivalry.hiddenByA : rivalry.hiddenByB;

    // If showHidden is true, show only hidden rivalries
    // If showHidden is false, show only non-hidden rivalries
    return showHidden ? isHidden : !isHidden;
  });

  return (
    <>
      {visibleRivalries.length > 0 && (
        <FlatList
          contentContainerStyle={listContainerStyle}
          data={visibleRivalries}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            // Determine opponent's name based on current user
            const isUserA = item.userAId === currentUserId;
            const opponentName = isUserA ? item.userBName : item.userAName;

            return (
              <RivalryRow
                contestCount={item.contestCount}
                onPress={() => onSelectRivalry(item)}
                opponentName={opponentName}
                updatedAt={item.updatedAt}
              />
            );
          }}
        />
      )}

      {hasPendingRivalries && (
        <View style={buttonContainerStyle}>
          <TouchableOpacity
            onPress={() => router.push('/pending')}
            style={pendingButtonStyle}
          >
            <Text style={buttonTextStyle}>Pending Rivalry Found</Text>
          </TouchableOpacity>
        </View>
      )}

      {visibleRivalries.length === 0 && (
        <View style={buttonContainerStyle}>
          <TouchableOpacity
            onPress={() => router.push('/how-to-play')}
            style={howToPlayButtonStyle}
          >
            <Text style={buttonTextStyle}>How to Play</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

const listContainerStyle = {
  padding: 16,
};

const buttonContainerStyle = {
  paddingHorizontal: 16,
  paddingBottom: 16,
};

const baseButtonStyle = {
  backgroundColor: colors.amber400,
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: 8,
  alignItems: center,
};

const pendingButtonStyle = {
  ...baseButtonStyle,
  marginTop: 8,
};

const howToPlayButtonStyle = {
  ...baseButtonStyle,
  marginTop: 20,
};

const buttonTextStyle = {
  ...styles.text,
  fontSize: 16,
  fontWeight: bold,
  color: colors.darkText2,
};
