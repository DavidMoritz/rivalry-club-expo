import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import type { MRivalry } from '../../../models/m-rivalry';
import { useRivalryContext } from '../../../providers/rivalry';
import { darkStyles } from '../../../utils/styles';
import { TierListDisplay } from './TierListDisplay';

interface TierListsDisplayProps {
  rivalry: MRivalry;
  unlinked: boolean;
}

export function TierListsDisplay({
  rivalry,
  unlinked,
}: TierListsDisplayProps): ReactNode {
  const { userId } = useRivalryContext();

  return (
    <View
      style={{
        marginTop: -45,
        flex: 1,
        flexDirection: userId === rivalry.userBId ? 'column-reverse' : 'column',
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={[darkStyles.text, tierListHeaderStyle]}>
          {rivalry.displayUserAName()} tier list
        </Text>
        {rivalry.tierListA && (
          <TierListDisplay
            tierList={rivalry.tierListA}
            tierListSignifier="A"
            unlinked={unlinked}
          />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[darkStyles.text, tierListHeaderStyle]}>
          {rivalry.displayUserBName()} tier list
        </Text>
        {rivalry.tierListB && (
          <TierListDisplay
            tierList={rivalry.tierListB}
            tierListSignifier="B"
            unlinked={unlinked}
          />
        )}
      </View>
    </View>
  );
}

const tierListHeaderStyle = {
  fontSize: 18,
  marginBottom: 8,
  marginTop: 16,
};
