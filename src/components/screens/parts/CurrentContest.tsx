import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { range } from 'lodash';
import { ReactNode, useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { twMerge } from 'tailwind-merge';

import { Fighter } from '../../../API';
import { MContest } from '../../../models/m-contest';
import { MGame, STOCK } from '../../../models/m-game';
import { MTierSlot } from '../../../models/m-tier-slot';
import { useGame } from '../../../providers/game';
import { useRivalry } from '../../../providers/rivalry';
import { fighterByIdFromGame } from '../../../utils';
import { styles } from '../../../utils/styles';
import { CharacterDisplay } from '../../common/CharacterDisplay';

interface CurrentContestProps {
  onPressShuffle: () => void;
  onResolveContest?(contest: MContest): void;
}

function WinnerBadge() {
  return (
    <View
      className="absolute right-[-15px] px-2 bg-yellow-50 border-2 border-red-500 rounded-md top-[92%] flex flex-row items-center"
      style={{ transform: [{ rotate: '-30deg' }] }}>
      <Text className="text-sm font-bold text-red-600">{'\u2606'} </Text>
      <Text className="text-2xl font-bold text-red-600 uppercase">Winner</Text>
      <Text className="text-sm font-bold text-red-600"> {'\u2606'}</Text>
    </View>
  );
}

export function CurrentContest({
  onPressShuffle,
  onResolveContest,
}: CurrentContestProps): ReactNode {
  const game = useGame() as MGame;
  const [fighterA, setFighterA] = useState<Fighter | null>();
  const [fighterB, setFighterB] = useState<Fighter | null>();
  const [winner, setWinner] = useState<MTierSlot>();
  const [stockRemaining, setStockRemaining] = useState<string | number>(1);

  const rivalry = useRivalry();
  const contest = rivalry?.currentContest;

  useEffect(() => {
    if (!(rivalry && contest)) return;

    contest.setRivalryAndSlots(rivalry);

    if (!(contest.tierSlotA && contest.tierSlotB)) return;

    setFighterA(fighterByIdFromGame(game, contest.tierSlotA.fighterId));
    setFighterB(fighterByIdFromGame(game, contest.tierSlotB.fighterId));
  }, [contest, game, rivalry]);

  if (!rivalry) return null;

  function onPressResolve() {
    if (!(winner && onResolveContest && contest)) return;

    const resultStr =
      winner === contest?.tierSlotA ? stockRemaining : `-${stockRemaining}`;

    contest.result = Number(resultStr);

    onResolveContest(contest);
  }

  return (
    <>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-white">Current Contest</Text>
        <TouchableOpacity
          className="items-center px-4 py-2 border border-white rounded-xl bg-slate-700"
          onPress={onPressShuffle}>
          <FontAwesomeIcon icon="shuffle" color="white" />
        </TouchableOpacity>
      </View>

      <View className="items-center my-1.5 border-yellow-500 border p-0.5">
        <View className="flex-row items-center justify-between my-1.5 p-0.5">
          {fighterA && (
            <TouchableOpacity
              className={twMerge(
                'border-4 border-transparent items-center my-5 p-2 rounded-xl',
                winner && contest?.tierSlotA === winner
                  ? 'border-green-700 bg-blue-100'
                  : '',
              )}
              onPress={() => {
                setWinner(contest?.tierSlotA);
              }}>
              <Text
                style={styles.currentContestUser}
                className="text-sm text-white">
                {rivalry.userA?.firstName} {rivalry.tierListA?.prestigeDisplay}
              </Text>
              <CharacterDisplay fighter={fighterA} hideName={true} />
              <Text className="text-sm text-white">{fighterA.name} </Text>
              {winner && contest?.tierSlotA === winner && <WinnerBadge />}
            </TouchableOpacity>
          )}

          <View className="flex-1 items-center">
            <Text className="text-sm text-white">Vs.</Text>
          </View>

          {fighterB && (
            <TouchableOpacity
              className={twMerge(
                'relative border-4 border-transparent items-center my-5 p-2 rounded-xl',
                winner && contest?.tierSlotB === winner
                  ? 'border-green-700 bg-blue-100'
                  : '',
              )}
              onPress={() => {
                setWinner(contest?.tierSlotB);
              }}>
              <Text
                style={styles.currentContestUser}
                className="text-sm text-white">
                {rivalry.userB?.firstName} {rivalry.tierListB?.prestigeDisplay}
              </Text>
              <CharacterDisplay fighter={fighterB} hideName={true} />
              <Text className="text-sm text-white">{fighterB.name}</Text>
              {winner && contest?.tierSlotB === winner && <WinnerBadge />}
            </TouchableOpacity>
          )}
        </View>

        {winner ? (
          <>
            <Text className="text-sm text-white">Stock remaining</Text>
            <View className="flex flex-row">
              {range(1, STOCK + 1).map((value, idx) => (
                <TouchableOpacity
                  className={twMerge(
                    'px-6 py-3 border-l border-purple-700 border-y bg-slate-100',
                    idx === 0 ? 'rounded-l-lg' : '',
                    idx === STOCK - 1 ? 'rounded-r-lg border-r' : '',
                    stockRemaining === value ? 'bg-slate-800' : '',
                  )}
                  key={value}
                  onPress={() => {
                    setStockRemaining(value);
                  }}>
                  <Text
                    className={`text-2xl ${
                      stockRemaining === value ? 'text-white' : 'text-black'
                    }`}>
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              className="px-8 py-4 my-4 bg-green-700 rounded-lg"
              onPress={onPressResolve}>
              <Text className="text-xl font-bold text-white">Resolve!</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View>
            <Text className="text-purple-200">Select the winner</Text>
          </View>
        )}
      </View>
    </>
  );
}
