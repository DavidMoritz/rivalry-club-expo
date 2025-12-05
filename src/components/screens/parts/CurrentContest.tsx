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
  const [fighterLoggedIn, setFighterLoggedIn] = useState<Fighter>();
  const [fighterOther, setFighterOther] = useState<Fighter>();
  const [winner, setWinner] = useState<MTierSlot>();
  const [stockRemaining, setStockRemaining] = useState<string | number>(1);

  const rivalry = useRivalry();
  const { userAName, userBName } = useRivalryContext();
  const contest = rivalry?.currentContest;

  // Get display names with fallbacks
  const loggedInUserName = rivalry?.isLoggedInUserA()
    ? userAName || rivalry?.loggedInUser?.firstName
    : userBName || rivalry?.loggedInUser?.firstName;

  const otherUserName = rivalry?.isLoggedInUserA()
    ? userBName || rivalry?.otherUser?.firstName
    : userAName || rivalry?.otherUser?.firstName;

  useEffect(() => {
    if (!(rivalry && contest)) {
      return;
    }

    contest.setRivalryAndSlots(rivalry);

    if (!(contest.loggedInUserTierSlot && contest.otherUserTierSlot)) {
      return;
    }

    // Use baseGame which has the fighters.items structure from the cache
    const gameData = (game as any).baseGame || game;
    setFighterLoggedIn(fighterByIdFromGame(gameData, contest.loggedInUserTierSlot.fighterId));
    setFighterOther(fighterByIdFromGame(gameData, contest.otherUserTierSlot.fighterId));
  }, [contest, game, rivalry]);

  if (!rivalry) return null;

  function onPressResolve() {
    if (!(winner && onResolveContest && contest)) return;

    // Calculate result based on actual A/B slots, not display order
    const isLoggedInUserA = rivalry.isLoggedInUserA();
    const loggedInUserWon = winner === contest?.loggedInUserTierSlot;

    let resultStr: string | number;

    if (isLoggedInUserA) {
      // Logged-in user is A, so positive result means A won
      resultStr = loggedInUserWon ? stockRemaining : `-${stockRemaining}`;
    } else {
      // Logged-in user is B, so negative result means B won
      resultStr = loggedInUserWon ? `-${stockRemaining}` : stockRemaining;
    }

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
          marginBottom: 8,
          position: 'relative'
        }}
      >
        <Text style={{ fontSize: 18, color: 'white', position: 'absolute', left: 0 }}>
          Current Contest
        </Text>
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
          {fighterLoggedIn && (
            <TouchableOpacity
              style={{
                position: 'relative',
                borderWidth: 4,
                borderColor:
                  winner && contest?.loggedInUserTierSlot === winner ? '#15803d' : 'transparent',
                backgroundColor:
                  winner && contest?.loggedInUserTierSlot === winner ? '#dbeafe' : 'transparent',
                alignItems: 'center',
                marginVertical: 20,
                padding: 8,
                borderRadius: 12
              }}
              onPress={() => {
                setWinner(contest?.loggedInUserTierSlot);
              }}
            >
              <Text
                style={[
                  styles.currentContestUser,
                  { color: winner && contest?.loggedInUserTierSlot === winner ? 'black' : 'white' }
                ]}
              >
                {loggedInUserName} {rivalry.loggedInUserTierList?.prestigeDisplay}
              </Text>
              <CharacterDisplay
                fighter={fighterLoggedIn}
                hideName={true}
                height={180}
                width={140}
                zoomMultiplier={1.55}
              />
              <Text
                style={{
                  fontSize: 14,
                  color: winner && contest?.loggedInUserTierSlot === winner ? 'black' : 'white'
                }}
              >
                {fighterLoggedIn.name}{' '}
              </Text>
              {winner && contest?.loggedInUserTierSlot === winner && <WinnerBadge />}
            </TouchableOpacity>
          )}

          {!fighterLoggedIn && !fighterOther && (
            <Text style={{ color: '#e9d5ff' }}>Loading fighters...</Text>
          )}
          {(fighterLoggedIn || fighterOther) && (
            <View style={contestStyles.item}>
              <Text style={{ fontSize: 14, color: 'white' }}>Vs.</Text>
            </View>
          )}
          {fighterOther && (
            <TouchableOpacity
              style={{
                position: 'relative',
                borderWidth: 4,
                borderColor:
                  winner && contest?.otherUserTierSlot === winner ? '#15803d' : 'transparent',
                backgroundColor:
                  winner && contest?.otherUserTierSlot === winner ? '#dbeafe' : 'transparent',
                alignItems: 'center',
                marginVertical: 20,
                padding: 8,
                borderRadius: 12
              }}
              onPress={() => {
                setWinner(contest?.otherUserTierSlot);
              }}
            >
              <Text
                style={[
                  styles.currentContestUser,
                  { color: winner && contest?.otherUserTierSlot === winner ? 'black' : 'white' }
                ]}
              >
                {otherUserName} {rivalry.otherUserTierList?.prestigeDisplay}
              </Text>
              <CharacterDisplay
                fighter={fighterOther}
                hideName={true}
                height={180}
                width={140}
                zoomMultiplier={1.55}
              />
              <Text
                style={{
                  fontSize: 14,
                  color: winner && contest?.otherUserTierSlot === winner ? 'black' : 'white'
                }}
              >
                {fighterOther.name}
              </Text>
              {winner && contest?.otherUserTierSlot === winner && <WinnerBadge />}
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
