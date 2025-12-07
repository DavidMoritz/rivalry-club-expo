import { ReactNode } from 'react';
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
}

export function ContestHistoryTable({
  contests,
  game,
  rivalry,
  deleteMostRecentContestMutation,
  loadMore,
  isLoadingMore
}: ContestHistoryTableProps): ReactNode {
  const { userId } = useRivalryContext();
  const isUserB = userId === rivalry.userBId;

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#fff" />
      </View>
    );
  };

  return (
    <View style={contestStyles.tableWrapper}>
      <View style={{ alignSelf: 'flex-start', marginTop: -24, marginBottom: 16 }}>
        <Button
          onPress={() => deleteMostRecentContestMutation.mutate()}
          text="↺ Undo Recent Contest"
          disabled={
            deleteMostRecentContestMutation.isPending ||
            !contests.length ||
            !contests.some((c) => c.result)
          }
        />
      </View>

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

      <View style={[contestStyles.row, contestStyles.tableHeaderRow]}>
        <View style={contestStyles.item}>
          <Text style={[contestStyles.tableHeader, { color: 'white' }]}>Date</Text>
        </View>
        <View style={contestStyles.item}>
          <Text style={[contestStyles.tableHeader, { color: 'white' }]}>
            {isUserB ? rivalry.displayUserBName() : rivalry.displayUserAName()}
          </Text>
        </View>
        <View style={contestStyles.item}>
          <Text style={[contestStyles.tableHeader, { color: 'white' }]}>Score</Text>
        </View>
        <View style={contestStyles.item}>
          <Text style={[contestStyles.tableHeader, { color: 'white' }]}>
            {isUserB ? rivalry.displayUserAName() : rivalry.displayUserBName()}
          </Text>
        </View>
      </View>
      <FlatList
        data={contests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ContestRow contest={item} game={game} rivalry={rivalry} flip={isUserB} />
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
