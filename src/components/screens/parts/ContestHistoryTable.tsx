import { ReactNode, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { UseMutationResult } from '@tanstack/react-query';

import { MContest } from '../../../models/m-contest';
import { MGame } from '../../../models/m-game';
import { MRivalry } from '../../../models/m-rivalry';
import { useRivalryContext } from '../../../providers/rivalry';
import { contestStyles, styles } from '../../../utils/styles';
import { Button } from '../../common/Button';
import { ContestRow } from '../../common/ContestRow';

interface ContestHistoryTableProps {
  contests: MContest[];
  game: MGame;
  rivalry: MRivalry;
  deleteMostRecentContestMutation: UseMutationResult<any, Error, void, unknown>;
  loadMore: () => void;
  isLoadingMore: boolean;
  hideUndoButton: boolean;
  onUndoClick: () => void;
}

export function ContestHistoryTable({
  contests,
  game,
  rivalry,
  deleteMostRecentContestMutation,
  loadMore,
  isLoadingMore,
  hideUndoButton,
  onUndoClick
}: ContestHistoryTableProps): ReactNode {
  const { userId } = useRivalryContext();
  const isUserB = userId === rivalry.userBId;
  const [fadingContestId, setFadingContestId] = useState<string | null>(null);

  const handleUndoClick = () => {
    // Get the ID of the first contest with a result (the one being deleted)
    const contestToDelete = contests.find((c) => c.result);

    if (!contestToDelete) return;

    setFadingContestId(contestToDelete.id);

    // Trigger the deletion immediately - it will complete around the same time as the fade
    onUndoClick();

    // Reset fading state after animation completes
    setTimeout(() => {
      setFadingContestId(null);
    }, 2000);
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#fff" />
      </View>
    );
  };

  return (
    <View style={tableWrapperStyle}>
      {!hideUndoButton && (
        <View style={{ alignSelf: 'flex-start', marginBottom: 8, marginTop: -14 }}>
          <Button
            style={{ paddingVertical: 0 }}
            onPress={handleUndoClick}
            text="↺ Undo Recent Contest"
            disabled={
              deleteMostRecentContestMutation.isPending ||
              !contests.length ||
              !contests.some((c) => c.result)
            }
          />
        </View>
      )}
      {hideUndoButton && <View style={{ alignSelf: 'flex-start', marginBottom: 8 }} />}

      {deleteMostRecentContestMutation.isError && (
        <View
          style={{ marginBottom: 16, padding: 12, backgroundColor: '#7f1d1d', borderRadius: 8 }}
        >
          <Text style={[styles.text, { color: '#fca5a5' }]}>
            Error reversing contest:{' '}
            {deleteMostRecentContestMutation.error?.message || 'Unknown error'}
          </Text>
        </View>
      )}

      <View style={[contestStyles.row, tableHeaderRowStyle]}>
        <View style={contestStyles.item}>
          <Text style={[tableHeaderStyle, { color: 'white' }]}>Date</Text>
        </View>
        <View style={contestStyles.item}>
          <Text style={[tableHeaderStyle, { color: 'white' }]}>
            {isUserB ? rivalry.displayUserBName() : rivalry.displayUserAName()}
          </Text>
        </View>
        <View style={contestStyles.item}>
          <Text style={[tableHeaderStyle, { color: 'white' }]}>Score</Text>
        </View>
        <View style={contestStyles.item}>
          <Text style={[tableHeaderStyle, { color: 'white' }]}>
            {isUserB ? rivalry.displayUserAName() : rivalry.displayUserBName()}
          </Text>
        </View>
      </View>
      <FlatList
        data={contests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ContestRow
            contest={item}
            game={game}
            rivalry={rivalry}
            flip={isUserB}
            shouldFadeOut={fadingContestId === item.id}
          />
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <Text style={[styles.text, { color: '#999' }]}>No contests yet</Text>
          </View>
        }
      />
    </View>
  );
}

const tableWrapperStyle = {
  padding: 10
};

const tableHeaderStyle = {
  fontWeight: 'bold' as const,
  fontSize: 20
};

const tableHeaderRowStyle = {
  borderBottomWidth: 2,
  borderBottomColor: 'yellow'
};
