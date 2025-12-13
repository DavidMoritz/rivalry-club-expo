import { range } from 'lodash';
import { type ReactNode, useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import type { MContest } from '../../../models/m-contest';
import type { MFighter } from '../../../models/m-fighter';
import { type MGame, STOCK } from '../../../models/m-game';
import type { MTierSlot } from '../../../models/m-tier-slot';
import { useGame } from '../../../providers/game';
import { useRivalry, useRivalryContext } from '../../../providers/rivalry';
import { fighterByIdFromGame } from '../../../utils';
import { colors } from '../../../utils/colors';
import { contestStyles, styles } from '../../../utils/styles';
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
      resizeMode="contain"
      source={require('../../../../assets/winner.png')}
      style={winnerBadgeStyle}
    />
  );
}

export function CurrentContest({
  onPressShuffle,
  onResolveContest,
  shufflingSlot,
  canShuffle,
  setCanShuffle,
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
    const foundFighterA = fighterByIdFromGame(
      gameData,
      contest.tierSlotA.fighterId
    );
    const foundFighterB = fighterByIdFromGame(
      gameData,
      contest.tierSlotB.fighterId
    );
    if (foundFighterA) setFighterA(foundFighterA);
    if (foundFighterB) setFighterB(foundFighterB);

    // Clear winner when contest changes (after shuffle or new contest)
    setWinner(undefined);
  }, [contest, game, rivalry]);

  if (!rivalry) return null;
  if (!game)
    return (
      <Text style={{ color: colors.purple100 }}>Loading game data...</Text>
    );

  function onPressResolve() {
    if (!(winner && onResolveContest && contest)) return;

    const resultStr =
      winner === contest?.tierSlotA ? stockRemaining : `-${stockRemaining}`;

    contest.result = Number(resultStr);

    onResolveContest(contest);
  }

  const getTextColor = (isWinner: boolean) =>
    isWinner ? colors.black : colors.white;

  return (
    <>
      <View style={headerContainerStyle}>
        <Text style={currentContestTitleStyle}>Current Contest</Text>
        {canShuffle ? (
          <View style={reshuffleButtonPlaceholderStyle}>
            <Text style={{ fontSize: 16, color: colors.none }}>Reshuffle</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setCanShuffle(true)}
            style={reshuffleButtonStyle}
          >
            <Text style={{ fontSize: 16, color: colors.white }}>
              🔀 Reshuffle
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={contestOuterContainerStyle}>
        <View
          style={[
            fightersRowContainerStyle,
            { flexDirection: isUserB ? 'row-reverse' : 'row' },
          ]}
        >
          {fighterA && (
            <View
              style={[
                fighterContainerStyle,
                winner && contest?.tierSlotA === winner
                  ? fighterWinnerStyle
                  : fighterNonWinnerStyle,
              ]}
            >
              {canShuffle && (
                <TouchableOpacity
                  disabled={shufflingSlot === 'A'}
                  onPress={() => {
                    onPressShuffle('A');
                  }}
                  style={[
                    shuffleButtonStyle,
                    { [isUserB ? 'right' : 'left']: -10 },
                  ]}
                >
                  <Text style={{ fontSize: 16 }}>🔀</Text>
                </TouchableOpacity>
              )}
              <Text
                style={[
                  currentContestUserStyle,
                  {
                    color: getTextColor(
                      !!(winner && contest?.tierSlotA === winner)
                    ),
                  },
                ]}
              >
                {rivalry.displayUserAName()}{' '}
                {rivalry.tierListA?.prestigeDisplay}
              </Text>
              <CharacterDisplay
                fighter={fighterA}
                height={180}
                hideName={true}
                onPress={() => {
                  setWinner(contest?.tierSlotA);
                }}
                tierSlot={contest?.tierSlotA}
                width={140}
                zoomMultiplier={1.55}
              />
              <Text
                style={[
                  fighterNameStyle,
                  {
                    color: getTextColor(
                      !!(winner && contest?.tierSlotA === winner)
                    ),
                  },
                ]}
              >
                {fighterA.name}{' '}
              </Text>
              {winner && contest?.tierSlotA === winner && <WinnerBadge />}
            </View>
          )}

          {!(fighterA || fighterB) && (
            <Text style={{ color: colors.purple100 }}>Loading fighters...</Text>
          )}
          {(fighterA || fighterB) && (
            <View style={contestStyles.item}>
              <Text style={{ fontSize: 14, color: colors.white }}>Vs</Text>
            </View>
          )}
          {fighterB && (
            <View
              style={[
                fighterContainerStyle,
                winner && contest?.tierSlotB === winner
                  ? fighterWinnerStyle
                  : fighterNonWinnerStyle,
              ]}
            >
              {canShuffle && (
                <TouchableOpacity
                  disabled={shufflingSlot === 'B'}
                  onPress={() => {
                    onPressShuffle('B');
                  }}
                  style={[
                    shuffleButtonStyle,
                    { [isUserB ? 'left' : 'right']: -10 },
                  ]}
                >
                  <Text style={{ fontSize: 16 }}>🔀</Text>
                </TouchableOpacity>
              )}
              <Text
                style={[
                  currentContestUserStyle,
                  {
                    color: getTextColor(
                      !!(winner && contest?.tierSlotB === winner)
                    ),
                  },
                ]}
              >
                {rivalry.displayUserBName()}{' '}
                {rivalry.tierListB?.prestigeDisplay}
              </Text>
              <CharacterDisplay
                fighter={fighterB}
                height={180}
                hideName={true}
                onPress={() => {
                  setWinner(contest?.tierSlotB);
                }}
                tierSlot={contest?.tierSlotB}
                width={140}
                zoomMultiplier={1.55}
              />
              <Text
                style={[
                  fighterNameStyle,
                  {
                    color: getTextColor(
                      !!(winner && contest?.tierSlotB === winner)
                    ),
                  },
                ]}
              >
                {fighterB.name}
              </Text>
              {winner && contest?.tierSlotB === winner && <WinnerBadge />}
            </View>
          )}
        </View>

        {winner ? (
          <>
            <Text style={{ fontSize: 14, color: colors.white, marginTop: 8 }}>
              Stock remaining
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              {range(1, STOCK + 1).map((value, idx) => {
                const isFirstButton = idx === 0;
                const isLastButton = idx === STOCK - 1;
                const isSelected = stockRemaining === value;

                return (
                  <TouchableOpacity
                    key={value}
                    onPress={() => {
                      setStockRemaining(value);
                    }}
                    style={[
                      stockButtonStyle,
                      {
                        borderRightWidth: isLastButton ? 1 : 0,
                        backgroundColor: isSelected
                          ? colors.slate900
                          : colors.slate100,
                        borderTopLeftRadius: isFirstButton ? 8 : 0,
                        borderBottomLeftRadius: isFirstButton ? 8 : 0,
                        borderTopRightRadius: isLastButton ? 8 : 0,
                        borderBottomRightRadius: isLastButton ? 8 : 0,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 24,
                        color: isSelected ? colors.white : colors.black,
                      }}
                    >
                      {value}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={onPressResolve}
              style={resolveButtonStyle}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: colors.white,
                }}
              >
                Resolve!
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={selectWinnerContainerStyle}>
            <Text style={{ color: colors.purple100 }}>Select the winner</Text>
          </View>
        )}
      </View>
    </>
  );
}

// Static style objects for winner/non-winner states
const fighterWinnerStyle = {
  borderColor: colors.green700,
  backgroundColor: colors.blue100,
};

const fighterNonWinnerStyle = {
  borderColor: colors.none,
  backgroundColor: colors.none,
};

// Style constants
const center = 'center' as const;
const absolute = 'absolute' as const;

const winnerBadgeStyle = {
  position: absolute,
  right: -100,
  top: '78%' as const,
  width: 300,
  height: 100,
};

const headerContainerStyle = {
  flexDirection: 'row' as const,
  alignItems: center,
  justifyContent: center,
  marginBottom: 8,
};

const currentContestTitleStyle = {
  fontSize: 18,
  color: colors.white,
  position: absolute,
  left: 0,
};

const reshuffleButtonStyle = {
  alignItems: center,
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderWidth: 1,
  borderColor: colors.white,
  borderRadius: 12,
  backgroundColor: colors.slate700,
  marginStart: 80,
};

const reshuffleButtonPlaceholderStyle = {
  ...reshuffleButtonStyle,
  borderColor: colors.none,
  backgroundColor: colors.none,
};

const contestOuterContainerStyle = {
  alignItems: center,
  marginVertical: 6,
  borderWidth: 1,
  borderColor: colors.yellow500,
  padding: 2,
};

const fightersRowContainerStyle = {
  alignItems: center,
  justifyContent: 'space-between' as const,
  marginVertical: 6,
  padding: 2,
};

const fighterContainerStyle = {
  position: 'relative' as const,
  borderWidth: 4,
  alignItems: center,
  marginVertical: 20,
  padding: 8,
  borderRadius: 12,
  backgroundColor: colors.none,
  borderColor: colors.none,
};

const shuffleButtonStyle = {
  position: absolute,
  top: -25,
  padding: 10,
  zIndex: 10,
};

const currentContestUserStyle = {
  fontSize: 16,
  fontWeight: 'bold' as const,
};

const fighterNameStyle = {
  fontSize: 14,
};

const stockButtonStyle = {
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderLeftWidth: 1,
  borderTopWidth: 1,
  borderBottomWidth: 1,
  borderColor: colors.violet600,
};

const resolveButtonStyle = {
  paddingHorizontal: 32,
  paddingVertical: 16,
  marginVertical: 16,
  backgroundColor: colors.green700,
  borderRadius: 8,
};

const selectWinnerContainerStyle = {
  flexDirection: 'row' as const,
  alignItems: center,
  justifyContent: center,
  gap: 12,
  paddingVertical: 8,
};
