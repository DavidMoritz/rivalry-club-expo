import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { contestStyles } from '../../utils/styles';
import { dateDisplay, fighterByIdFromGame, scoreDisplay } from '../../utils';
import { MContest } from '../../models/m-contest';
import { MGame } from '../../models/m-game';
import { MRivalry } from '../../models/m-rivalry';
import { CharacterDisplay } from './CharacterDisplay';

interface ContestRowProps {
  contest: MContest;
  game: MGame;
  rivalry: MRivalry;
}

export function ContestRow({ contest, game, rivalry }: ContestRowProps) {
  const [updatedDisplay, setUpdatedDisplay] = useState<string>('');
  const [fighterA, setFighterA] = useState<any>();
  const [fighterB, setFighterB] = useState<any>();

  useEffect(() => {
    if (!contest?.updatedAt) return;

    setUpdatedDisplay(dateDisplay(contest.updatedAt));
  }, [contest?.updatedAt]);

  useEffect(() => {
    const tierSlotA = rivalry?.tierListA?.slots.find(
      (thisTierSlot) => thisTierSlot?.id === contest?.tierSlotAId
    );
    const tierSlotB = rivalry?.tierListB?.slots.find(
      (thisTierSlot) => thisTierSlot?.id === contest?.tierSlotBId
    );

    setFighterA(fighterByIdFromGame(game, tierSlotA?.fighterId || ''));
    setFighterB(fighterByIdFromGame(game, tierSlotB?.fighterId || ''));
  }, [contest, game, rivalry]);

  if (!(contest?.result && fighterA && fighterB)) return null;

  return (
    <View style={contestStyles.row}>
      <View style={contestStyles.item}>
        <Text style={{ color: 'white', fontSize: 14 }}>{updatedDisplay}</Text>
      </View>
      <View style={[contestStyles.item, contest.result > 0 ? contestStyles.winner : null]}>
        <CharacterDisplay fighter={fighterA} hideName={true} height={75} />
      </View>
      <View style={contestStyles.item}>
        <Text style={{ color: 'white', fontSize: 14 }}>{scoreDisplay(contest.result)}</Text>
      </View>
      <View style={[contestStyles.item, contest.result < 0 ? contestStyles.winner : null]}>
        <CharacterDisplay fighter={fighterB} hideName={true} height={75} />
      </View>
    </View>
  );
}
