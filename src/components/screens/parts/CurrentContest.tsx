import { range } from 'lodash';
import { ReactNode, useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import { contestStyles, styles } from '../../../utils/styles';
import { MContest } from '../../../models/m-contest';
import { MFighter } from '../../../models/m-fighter';
import { MGame, STOCK } from '../../../models/m-game';
import { MTierSlot } from '../../../models/m-tier-slot';
import { useGame } from '../../../providers/game';
import { useRivalry, useRivalryContext } from '../../../providers/rivalry';
import { fighterByIdFromGame } from '../../../utils';
import { CharacterDisplay } from '../../common/CharacterDisplay';

interface CurrentContestProps {
  onPressShuffle: (slot: 'A' | 'B') => void;
  onResolveContest?(contest: MContest): void;
  shufflingSlot?: 'A' | 'B' | null;
  canShuffle: boolean;
  setCanShuffle: (canShuffle: boolean) => void;
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
  onResolveContest,
  shufflingSlot,
  canShuffle,
  setCanShuffle
}: CurrentContestProps): ReactNode {
  const game = useGame() as MGame;
  const [fighterA, setFighterA] = useState<MFighter>();
  const [fighterB, setFighterB] = useState<MFighter>();
  const [winner, setWinner] = useState<MTierSlot>();
  const [stockRemaining, setStockRemaining] = useState<string | number>(1);

  const rivalry = useRivalry();
  const { isUserB } = useRivalryContext();
  const contest = rivalry?.currentContest;

  useEffect(() => {
    if (!(rivalry && contest && game)) {
      return;
    }

    contest.setRivalryAndSlots(rivalry);

    if (!(contest.tierSlotA && contest.tierSlotB)) {
      return;
    }

    // Use baseGame which has the fighters.items structure from the cache
    const gameData = (game as any).baseGame || game;
    const foundFighterA = fighterByIdFromGame(gameData, contest.tierSlotA.fighterId);
    const foundFighterB = fighterByIdFromGame(gameData, contest.tierSlotB.fighterId);
    if (foundFighterA) setFighterA(foundFighterA);
    if (foundFighterB) setFighterB(foundFighterB);
  }, [contest, game, rivalry]);

  if (!rivalry) return null;
  if (!game) return <Text style={{ color: '#e9d5ff' }}>Loading game data...</Text>;

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
          justifyContent: 'center',
          marginBottom: 8
        }}
      >
        <Text style={{ fontSize: 18, color: 'white', position: 'absolute', left: 0 }}>
          Current Contest
        </Text>
        {!canShuffle ? (
          <TouchableOpacity
            style={{
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: 'white',
              borderRadius: 12,
              backgroundColor: '#334155',
              marginStart: 80
            }}
            onPress={() => setCanShuffle(true)}
          >
            <Text style={{ fontSize: 16, color: 'white' }}>🔀 Reshuffle</Text>
          </TouchableOpacity>
        ) : (
          <View
            style={{
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: 'transparent',
              borderRadius: 12,
              marginStart: 80
            }}
          >
            <Text style={{ fontSize: 16, color: 'transparent' }}>Reshuffle</Text>
          </View>
        )}
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
            flexDirection: isUserB ? 'row-reverse' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginVertical: 6,
            padding: 2
          }}
        >
          {fighterA && (
            <View
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
            >
              {canShuffle && (
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    top: -25,
                    [isUserB ? 'right' : 'left']: -10,
                    padding: 10,
                    zIndex: 10
                  }}
                  onPress={() => {
                    setWinner(undefined);
                    onPressShuffle('A');
                  }}
                  disabled={shufflingSlot === 'A'}
                >
                  <Text style={{ fontSize: 16 }}>🔀</Text>
                </TouchableOpacity>
              )}
              <Text
                style={[
                  styles.currentContestUser,
                  { color: winner && contest?.tierSlotA === winner ? 'black' : 'white' }
                ]}
              >
                {rivalry.displayUserAName()} {rivalry.tierListA?.prestigeDisplay}
              </Text>
              <CharacterDisplay
                fighter={fighterA}
                tierSlot={contest?.tierSlotA}
                hideName={true}
                height={180}
                width={140}
                zoomMultiplier={1.55}
                onPress={() => {
                  setWinner(contest?.tierSlotA);
                }}
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
            </View>
          )}

          {!fighterA && !fighterB && <Text style={{ color: '#e9d5ff' }}>Loading fighters...</Text>}
          {(fighterA || fighterB) && (
            <View style={contestStyles.item}>
              <Text style={{ fontSize: 14, color: 'white' }}>Vs</Text>
            </View>
          )}
          {fighterB && (
            <View
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
            >
              {canShuffle && (
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    top: -25,
                    [isUserB ? 'left' : 'right']: -10,
                    padding: 10,
                    zIndex: 10
                  }}
                  onPress={() => {
                    setWinner(undefined);
                    onPressShuffle('B');
                  }}
                  disabled={shufflingSlot === 'B'}
                >
                  <Text style={{ fontSize: 16 }}>🔀</Text>
                </TouchableOpacity>
              )}
              <Text
                style={[
                  styles.currentContestUser,
                  { color: winner && contest?.tierSlotB === winner ? 'black' : 'white' }
                ]}
              >
                {rivalry.displayUserBName()} {rivalry.tierListB?.prestigeDisplay}
              </Text>
              <CharacterDisplay
                fighter={fighterB}
                tierSlot={contest?.tierSlotB}
                hideName={true}
                height={180}
                width={140}
                zoomMultiplier={1.55}
                onPress={() => {
                  setWinner(contest?.tierSlotB);
                }}
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
            </View>
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
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              paddingVertical: 8
            }}
          >
            <Text style={{ color: '#e9d5ff' }}>Select the winner</Text>
          </View>
        )}
      </View>
    </>
  );
}
