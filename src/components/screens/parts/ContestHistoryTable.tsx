import type { UseMutationResult } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';

import type { MContest } from '../../../models/m-contest';
import type { MGame } from '../../../models/m-game';
import type { MRivalry } from '../../../models/m-rivalry';
import { useRivalryContext } from '../../../providers/rivalry';
import { colors } from '../../../utils/colors';
import { bold, center, contestStyles, styles } from '../../../utils/styles';
import { Button } from '../../common/Button';
import { ContestRow } from '../../common/ContestRow';

interface ContestHistoryTableProps {
  contests: MContest[];
  game: MGame;
  rivalry: MRivalry;
  deleteMostRecentContestMutation: UseMutationResult<
    unknown,
    Error,
    void,
    unknown
  >;
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
  onUndoClick,
}: ContestHistoryTableProps): ReactNode {
  const { userId } = useRivalryContext();
  const isUserB = userId === rivalry.userBId;
  const [fadingContestId, setFadingContestId] = useState<string | null>(null);

  const handleUndoClick = () => {
    // Get the ID of the first contest with a result (the one being deleted)
    const contestToDelete = contests.find(c => c.result);

    if (!contestToDelete) return;

    setFadingContestId(contestToDelete.id);

    // Trigger the deletion immediately - it will complete around the same time as the fade
    onUndoClick();

    // Reset fading state after animation completes
    setTimeout(() => {
      setFadingContestId(null);
    }, FADE_ANIMATION_DURATION_MS);
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={loaderContainerStyle}>
        <ActivityIndicator color={colors.white} size="small" />
      </View>
    );
  };

  return (
    <View style={tableWrapperStyle}>
      {!hideUndoButton && (
        <View style={undoButtonContainerStyle}>
          <Button
            disabled={
              deleteMostRecentContestMutation.isPending ||
              !contests.length ||
              !contests.some(c => c.result)
            }
            onPress={handleUndoClick}
            style={undoButtonStyle}
            text="↺ Undo Recent Contest"
          />
        </View>
      )}
      {hideUndoButton && <View style={undoPlaceholderStyle} />}

      {deleteMostRecentContestMutation.isError && (
        <View style={errorContainerStyle}>
          <Text style={errorTextStyle}>
            Error reversing contest:{' '}
            {deleteMostRecentContestMutation.error?.message || 'Unknown error'}
          </Text>
        </View>
      )}

      <View style={[contestStyles.row, tableHeaderRowStyle]}>
        <View style={contestStyles.item}>
          <Text style={headerTextStyle}>Date</Text>
        </View>
        <View style={contestStyles.item}>
          <Text style={headerTextStyle}>
            {isUserB ? rivalry.displayUserBName() : rivalry.displayUserAName()}
          </Text>
        </View>
        <View style={contestStyles.item}>
          <Text style={headerTextStyle}>Score</Text>
        </View>
        <View style={contestStyles.item}>
          <Text style={headerTextStyle}>
            {isUserB ? rivalry.displayUserAName() : rivalry.displayUserBName()}
          </Text>
        </View>
      </View>
      <FlatList
        data={contests}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <View style={emptyStateContainerStyle}>
            <Text style={emptyStateTextStyle}>No contests yet</Text>
          </View>
        }
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => (
          <ContestRow
            contest={item}
            flip={isUserB}
            game={game}
            rivalry={rivalry}
            shouldFadeOut={fadingContestId === item.id}
          />
        )}
      />
    </View>
  );
}

const FADE_ANIMATION_DURATION_MS = 2000;

const loaderContainerStyle = {
  paddingVertical: 20,
  alignItems: center,
};

const undoButtonContainerStyle = {
  alignSelf: 'flex-start' as const,
  marginBottom: 8,
  marginTop: -14,
};

const undoButtonStyle = {
  paddingVertical: 0,
};

const undoPlaceholderStyle = {
  alignSelf: 'flex-start' as const,
  marginBottom: 8,
};

const errorContainerStyle = {
  marginBottom: 16,
  padding: 12,
  backgroundColor: colors.red900,
  borderRadius: 8,
};

const errorTextStyle = {
  ...styles.text,
  color: colors.red300,
};

const tableWrapperStyle = {
  padding: 10,
};

const tableHeaderStyle = {
  fontWeight: bold,
  fontSize: 20,
};

const headerTextStyle = {
  ...tableHeaderStyle,
  color: colors.white,
};

const tableHeaderRowStyle = {
  borderBottomWidth: 2,
  borderBottomColor: 'yellow',
};

const emptyStateContainerStyle = {
  paddingVertical: 40,
  alignItems: center,
};

const emptyStateTextStyle = {
  ...styles.text,
  color: colors.gray400,
};
