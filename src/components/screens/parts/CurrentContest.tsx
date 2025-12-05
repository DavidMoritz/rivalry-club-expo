import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { range } from 'lodash';
import { ReactNode, useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import { Fighter } from '../../../API';
import { contestStyles, styles } from '../../../utils/styles';
import { MContest } from '../../../models/m-contest';
import { MGame, STOCK } from '../../../models/m-game';
import { MTierSlot } from '../../../models/m-tier-slot';
import { useGame } from '../../../providers/game';
import { useRivalry, useRivalryContext } from '../../../providers/rivalry';
import { fighterByIdFromGame } from '../../../utils';
import { CharacterDisplay } from '../../common/CharacterDisplay';

interface CurrentContestProps {
  onPressShuffle: () => void;
  onResolveContest?(contest: MContest): void;
}

function WinnerBadge() {
  return (
    <Image
      source={require('../../../../assets/winner.png')}
      style={{
        position: 'absolute',
        right: -100,
        top: '78%',
        width: 300,
        height: 100
      }}
      resizeMode="contain"
    />
  );
}

export function CurrentContest({
  onPressShuffle,
  onResolveContest
}: CurrentContestProps): ReactNode {
  const game = useGame() as MGame;
  const [fighterA, setFighterA] = useState<Fighter>();
  const [fighterB, setFighterB] = useState<Fighter>();
  const [winner, setWinner] = useState<MTierSlot>();
  const [stockRemaining, setStockRemaining] = useState<string | number>(1);

  const rivalry = useRivalry();
  const { userAName, userBName } = useRivalryContext();
  const contest = rivalry?.currentContest;

  useEffect(() => {
    if (!(rivalry && contest)) {
      return;
    }

    contest.setRivalryAndSlots(rivalry);

    if (!(contest.tierSlotA && contest.tierSlotB)) {
      return;
    }

    // Use baseGame which has the fighters.items structure from the cache
    const gameData = (game as any).baseGame || game;
    setFighterA(fighterByIdFromGame(gameData, contest.tierSlotA.fighterId));
    setFighterB(fighterByIdFromGame(gameData, contest.tierSlotB.fighterId));
  }, [contest, game, rivalry]);

  if (!rivalry) return null;

  function onPressResolve() {
    if (!(winner && onResolveContest && contest)) return;

    const resultStr = winner === contest?.tierSlotA ? stockRemaining : `-${stockRemaining}`;

    contest.result = Number(resultStr);

    onResolveContest(contest);
  }

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8
        }}
      >
        <Text style={{ fontSize: 14, color: 'white' }}>Current Contest</Text>
        <TouchableOpacity
          style={{
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: 'white',
            borderRadius: 12,
            backgroundColor: '#334155'
          }}
          onPress={onPressShuffle}
        >
          <FontAwesomeIcon icon="shuffle" color="white" />
        </TouchableOpacity>
      </View>

      <View
        style={{
          alignItems: 'center',
          marginVertical: 6,
          borderWidth: 1,
          borderColor: '#eab308',
          padding: 2
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginVertical: 6,
            padding: 2
          }}
        >
          {fighterA && (
            <TouchableOpacity
              style={{
                position: 'relative',
                borderWidth: 4,
                borderColor: winner && contest?.tierSlotA === winner ? '#15803d' : 'transparent',
                backgroundColor:
                  winner && contest?.tierSlotA === winner ? '#dbeafe' : 'transparent',
                alignItems: 'center',
                marginVertical: 20,
                padding: 8,
                borderRadius: 12
              }}
              onPress={() => {
                setWinner(contest?.tierSlotA);
              }}
            >
              <Text
                style={[
                  styles.currentContestUser,
                  { color: winner && contest?.tierSlotA === winner ? 'black' : 'white' }
                ]}
              >
                {userAName || rivalry.userA?.firstName} {rivalry.tierListA?.prestigeDisplay}
              </Text>
              <CharacterDisplay
                fighter={fighterA}
                hideName={true}
                height={180}
                width={140}
                zoomMultiplier={1.55}
              />
              <Text
                style={{
                  fontSize: 14,
                  color: winner && contest?.tierSlotA === winner ? 'black' : 'white'
                }}
              >
                {fighterA.name}{' '}
              </Text>
              {winner && contest?.tierSlotA === winner && <WinnerBadge />}
            </TouchableOpacity>
          )}

          {!fighterA && !fighterB && <Text style={{ color: '#e9d5ff' }}>Loading fighters...</Text>}
          {(fighterA || fighterB) && (
            <View style={contestStyles.item}>
              <Text style={{ fontSize: 14, color: 'white' }}>Vs.</Text>
            </View>
          )}
          {fighterB && (
            <TouchableOpacity
              style={{
                position: 'relative',
                borderWidth: 4,
                borderColor: winner && contest?.tierSlotB === winner ? '#15803d' : 'transparent',
                backgroundColor:
                  winner && contest?.tierSlotB === winner ? '#dbeafe' : 'transparent',
                alignItems: 'center',
                marginVertical: 20,
                padding: 8,
                borderRadius: 12
              }}
              onPress={() => {
                setWinner(contest?.tierSlotB);
              }}
            >
              <Text
                style={[
                  styles.currentContestUser,
                  { color: winner && contest?.tierSlotB === winner ? 'black' : 'white' }
                ]}
              >
                {userBName || rivalry.userB?.firstName} {rivalry.tierListB?.prestigeDisplay}
              </Text>
              <CharacterDisplay
                fighter={fighterB}
                hideName={true}
                height={180}
                width={140}
                zoomMultiplier={1.55}
              />
              <Text
                style={{
                  fontSize: 14,
                  color: winner && contest?.tierSlotB === winner ? 'black' : 'white'
                }}
              >
                {fighterB.name}
              </Text>
              {winner && contest?.tierSlotB === winner && <WinnerBadge />}
            </TouchableOpacity>
          )}
        </View>

        {winner ? (
          <>
            <Text style={{ fontSize: 14, color: 'white', marginTop: 8 }}>Stock remaining</Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              {range(1, STOCK + 1).map((value, idx) => (
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderLeftWidth: 1,
                    borderTopWidth: 1,
                    borderBottomWidth: 1,
                    borderRightWidth: idx === STOCK - 1 ? 1 : 0,
                    borderColor: '#7c3aed',
                    backgroundColor: stockRemaining === value ? '#1e293b' : '#f1f5f9',
                    borderTopLeftRadius: idx === 0 ? 8 : 0,
                    borderBottomLeftRadius: idx === 0 ? 8 : 0,
                    borderTopRightRadius: idx === STOCK - 1 ? 8 : 0,
                    borderBottomRightRadius: idx === STOCK - 1 ? 8 : 0
                  }}
                  key={value}
                  onPress={() => {
                    setStockRemaining(value);
                  }}
                >
                  <Text
                    style={{
                      fontSize: 24,
                      color: stockRemaining === value ? 'white' : 'black'
                    }}
                  >
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={{
                paddingHorizontal: 32,
                paddingVertical: 16,
                marginVertical: 16,
                backgroundColor: '#15803d',
                borderRadius: 8
              }}
              onPress={onPressResolve}
            >
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>Resolve!</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View>
            <Text style={{ color: '#e9d5ff' }}>Select the winner</Text>
          </View>
        )}
      </View>
    </>
  );
}
