import { useEffect, useState, useRef } from 'react';
import { Animated, Text, View } from 'react-native';

import { contestStyles } from '../../utils/styles';
import { dateDisplay, fighterByIdFromGame, scoreDisplay } from '../../utils';
import { MContest } from '../../models/m-contest';
import { MGame } from '../../models/m-game';
import { MRivalry } from '../../models/m-rivalry';
import { MTierSlot } from '../../models/m-tier-slot';
import { CharacterDisplay } from './CharacterDisplay';

interface ContestRowProps {
  contest: MContest;
  game: MGame;
  rivalry: MRivalry;
  flip?: boolean;
  shouldFadeOut?: boolean;
}

export function ContestRow({ contest, game, rivalry, flip, shouldFadeOut }: ContestRowProps) {
  const [updatedDisplay, setUpdatedDisplay] = useState<string>('');
  const [fighterA, setFighterA] = useState<any>();
  const [fighterB, setFighterB] = useState<any>();
  const [tierSlotA, setTierSlotA] = useState<MTierSlot>();
  const [tierSlotB, setTierSlotB] = useState<MTierSlot>();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!contest?.updatedAt) return;

    setUpdatedDisplay(dateDisplay(contest.updatedAt));
  }, [contest?.updatedAt]);

  useEffect(() => {
    if (shouldFadeOut) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 2000,
        useNativeDriver: true,
      }).start();
    }
  }, [shouldFadeOut, fadeAnim, contest.id]);

  useEffect(() => {
    const foundTierSlotA = rivalry?.tierListA?.slots.find(
      (thisTierSlot) => thisTierSlot?.id === contest?.tierSlotAId
    );
    const foundTierSlotB = rivalry?.tierListB?.slots.find(
      (thisTierSlot) => thisTierSlot?.id === contest?.tierSlotBId
    );

    setTierSlotA(foundTierSlotA);
    setTierSlotB(foundTierSlotB);
    setFighterA(fighterByIdFromGame(game, foundTierSlotA?.fighterId || ''));
    setFighterB(fighterByIdFromGame(game, foundTierSlotB?.fighterId || ''));
  }, [contest, game, rivalry]);

  if (!(contest?.result && fighterA && fighterB)) return null;

  if (flip) {
    contest.result = -contest.result;
  }

  return (
    <Animated.View
      style={[
        contestStyles.row,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <View style={contestStyles.item}>
        <Text style={{ color: 'white', fontSize: 14 }}>{updatedDisplay}</Text>
      </View>
      <View style={[contestStyles.item, contest.result > 0 ? winnerStyle : null]}>
        <CharacterDisplay
          fighter={flip ? fighterB : fighterA}
          tierSlot={flip ? tierSlotB : tierSlotA}
          hideName={true}
          height={75}
        />
      </View>
      <View style={contestStyles.item}>
        <Text style={{ color: 'white', fontSize: 14 }}>{scoreDisplay(contest.result)}</Text>
      </View>
      <View style={[contestStyles.item, contest.result < 0 ? winnerStyle : null]}>
        <CharacterDisplay
          fighter={flip ? fighterA : fighterB}
          tierSlot={flip ? tierSlotA : tierSlotB}
          hideName={true}
          height={75}
        />
      </View>
    </Animated.View>
  );
}

const winnerStyle = {
  backgroundColor: 'hsl(150, 100%, 13%)'
};
