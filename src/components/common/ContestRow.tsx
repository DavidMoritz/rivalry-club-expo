import { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import type { MContest } from '../../models/m-contest';
import type { MFighter } from '../../models/m-fighter';
import type { MGame } from '../../models/m-game';
import type { MRivalry } from '../../models/m-rivalry';
import type { MTierSlot } from '../../models/m-tier-slot';
import { dateDisplay, fighterByIdFromGame, scoreDisplay } from '../../utils';
import { colors } from '../../utils/colors';
import { contestStyles } from '../../utils/styles';
import { CharacterDisplay } from './CharacterDisplay';

interface ContestRowProps {
  contest: MContest;
  game: MGame;
  rivalry: MRivalry;
  flip?: boolean;
  shouldFadeOut?: boolean;
}

export function ContestRow({
  contest,
  game,
  rivalry,
  flip,
  shouldFadeOut,
}: ContestRowProps) {
  const [updatedDisplay, setUpdatedDisplay] = useState<string>('');
  const [fighterA, setFighterA] = useState<MFighter | null>();
  const [fighterB, setFighterB] = useState<MFighter | null>();
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
  }, [shouldFadeOut, fadeAnim]);

  useEffect(() => {
    const foundTierSlotA = rivalry?.tierListA?.slots.find(
      thisTierSlot => thisTierSlot?.id === contest?.tierSlotAId
    );
    const foundTierSlotB = rivalry?.tierListB?.slots.find(
      thisTierSlot => thisTierSlot?.id === contest?.tierSlotBId
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
        <Text style={textStyle}>{updatedDisplay}</Text>
      </View>
      <View
        style={[contestStyles.item, contest.result > 0 ? winnerStyle : null]}
      >
        <CharacterDisplay
          fighter={flip ? fighterB : fighterA}
          height={75}
          hideName={true}
          tierSlot={flip ? tierSlotB : tierSlotA}
        />
      </View>
      <View style={contestStyles.item}>
        <Text style={textStyle}>{scoreDisplay(contest.result)}</Text>
      </View>
      <View
        style={[contestStyles.item, contest.result < 0 ? winnerStyle : null]}
      >
        <CharacterDisplay
          fighter={flip ? fighterA : fighterB}
          height={75}
          hideName={true}
          tierSlot={flip ? tierSlotA : tierSlotB}
        />
      </View>
    </Animated.View>
  );
}

const textStyle = {
  color: colors.white,
  fontSize: 14,
};

const winnerStyle = {
  backgroundColor: colors.green900,
};
