import { range } from 'lodash';
import { type ReactNode, useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import type { MContest } from '../../../models/m-contest';
import type { MFighter } from '../../../models/m-fighter';
import { type MGame, STOCK } from '../../../models/m-game';
import type { MRivalry } from '../../../models/m-rivalry';
import type { MTierSlot } from '../../../models/m-tier-slot';
import { useGame } from '../../../providers/game';
import { useRivalry, useRivalryContext } from '../../../providers/rivalry';
import { fighterByIdFromGame } from '../../../utils';
import { colors } from '../../../utils/colors';
import {
  absolute,
  center,
  contestStyles,
  relative,
  row,
} from '../../../utils/styles';
import { CharacterDisplay } from '../../common/CharacterDisplay';

interface CurrentContestProps {
  onPressShuffle: (slot: 'A' | 'B') => void;
  onResolveContest?(contest: MContest): void;
  shufflingSlot?: 'A' | 'B' | null;
  canShuffle: boolean;
  setCanShuffle: (canShuffle: boolean) => void;
}

interface FighterCardProps {
  canShuffle: boolean;
  contest: MContest | undefined;
  fighter: MFighter;
  isUserB: boolean;
  onPressShuffle: (slot: 'A' | 'B') => void;
  rivalry: MRivalry;
  setWinner: (winner: MTierSlot | undefined) => void;
  shufflingSlot: 'A' | 'B' | null | undefined;
  slot: 'A' | 'B';
  winner: MTierSlot | undefined;
}

interface StockButtonProps {
  isFirstButton: boolean;
  isLastButton: boolean;
  isSelected: boolean;
  onSelect: () => void;
  value: number;
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

function getTextColor(isWinner: boolean) {
  return isWinner ? colors.black : colors.white;
}

function FighterCard({
  canShuffle,
  contest,
  fighter,
  isUserB,
  onPressShuffle,
  rivalry,
  setWinner,
  shufflingSlot,
  slot,
  winner,
}: FighterCardProps): ReactNode {
  const tierSlot = slot === 'A' ? contest?.tierSlotA : contest?.tierSlotB;
  const isWinner = !!(winner && tierSlot === winner);
  const userName =
    slot === 'A' ? rivalry.displayUserAName() : rivalry.displayUserBName();
  const prestigeDisplay =
    slot === 'A'
      ? rivalry.tierListA?.prestigeDisplay
      : rivalry.tierListB?.prestigeDisplay;
  const getShufflePosition = () => {
    if (slot === 'A') return isUserB ? 'right' : 'left';
    return isUserB ? 'left' : 'right';
  };
  const shufflePosition = getShufflePosition();

  return (
    <View
      style={[
        fighterContainerStyle,
        isWinner ? fighterWinnerStyle : fighterNonWinnerStyle,
      ]}
    >
      {canShuffle && (
        <TouchableOpacity
          disabled={shufflingSlot === slot}
          onPress={() => {
            onPressShuffle(slot);
          }}
          style={[shuffleButtonStyle, { [shufflePosition]: -10 }]}
        >
          <Text style={shuffleEmojiStyle}>🔀</Text>
        </TouchableOpacity>
      )}
      <Text
        style={[currentContestUserStyle, { color: getTextColor(isWinner) }]}
      >
        {userName} {prestigeDisplay}
      </Text>
      <CharacterDisplay
        fighter={fighter}
        height={180}
        hideName={true}
        onPress={() => {
          setWinner(tierSlot);
        }}
        tierSlot={tierSlot}
        width={140}
        zoomMultiplier={1.55}
      />
      <Text style={[fighterNameStyle, { color: getTextColor(isWinner) }]}>
        {fighter.name}
        {slot === 'A' ? ' ' : ''}
      </Text>
      {isWinner && <WinnerBadge />}
    </View>
  );
}

function StockButton({
  isFirstButton,
  isLastButton,
  isSelected,
  onSelect,
  value,
}: StockButtonProps): ReactNode {
  return (
    <TouchableOpacity
      onPress={onSelect}
      style={[
        stockButtonStyle,
        {
          borderRightWidth: isLastButton ? 1 : 0,
          backgroundColor: isSelected ? colors.slate900 : colors.slate100,
          borderTopLeftRadius: isFirstButton ? BUTTON_BORDER_RADIUS : 0,
          borderBottomLeftRadius: isFirstButton ? BUTTON_BORDER_RADIUS : 0,
          borderTopRightRadius: isLastButton ? BUTTON_BORDER_RADIUS : 0,
          borderBottomRightRadius: isLastButton ? BUTTON_BORDER_RADIUS : 0,
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
    const gameData = game.baseGame || game;
    const foundFighterA = fighterByIdFromGame(
      gameData as Parameters<typeof fighterByIdFromGame>[0],
      contest.tierSlotA.fighterId
    );
    const foundFighterB = fighterByIdFromGame(
      gameData as Parameters<typeof fighterByIdFromGame>[0],
      contest.tierSlotB.fighterId
    );
    if (foundFighterA) setFighterA(foundFighterA);
    if (foundFighterB) setFighterB(foundFighterB);

    // Clear winner when contest changes (after shuffle or new contest)
    setWinner(undefined);
  }, [contest, game, rivalry]);

  if (!rivalry) return null;
  if (!game) return <Text style={loadingTextStyle}>Loading game data...</Text>;

  function onPressResolve() {
    if (!(winner && onResolveContest && contest)) return;

    const resultStr =
      winner === contest?.tierSlotA ? stockRemaining : `-${stockRemaining}`;

    contest.result = Number(resultStr);

    onResolveContest(contest);
  }

  return (
    <>
      <View style={headerContainerStyle}>
        <Text style={currentContestTitleStyle}>Current Contest</Text>
        {canShuffle ? (
          <View style={reshuffleButtonPlaceholderStyle}>
            <Text style={reshuffleTextPlaceholderStyle}>Reshuffle</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setCanShuffle(true)}
            style={reshuffleButtonStyle}
          >
            <Text style={reshuffleTextStyle}>🔀 Reshuffle</Text>
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
            <FighterCard
              canShuffle={canShuffle}
              contest={contest}
              fighter={fighterA}
              isUserB={isUserB}
              onPressShuffle={onPressShuffle}
              rivalry={rivalry}
              setWinner={setWinner}
              shufflingSlot={shufflingSlot}
              slot="A"
              winner={winner}
            />
          )}

          {!(fighterA || fighterB) && (
            <Text style={loadingTextStyle}>Loading fighters...</Text>
          )}
          {(fighterA || fighterB) && (
            <View style={contestStyles.item}>
              <Text style={vsTextStyle}>Vs</Text>
            </View>
          )}
          {fighterB && (
            <FighterCard
              canShuffle={canShuffle}
              contest={contest}
              fighter={fighterB}
              isUserB={isUserB}
              onPressShuffle={onPressShuffle}
              rivalry={rivalry}
              setWinner={setWinner}
              shufflingSlot={shufflingSlot}
              slot="B"
              winner={winner}
            />
          )}
        </View>

        {winner ? (
          <>
            <Text style={stockRemainingTextStyle}>Stock remaining</Text>
            <View style={stockButtonsContainerStyle}>
              {range(1, STOCK + 1).map((value, idx) => (
                <StockButton
                  isFirstButton={idx === 0}
                  isLastButton={idx === STOCK - 1}
                  isSelected={stockRemaining === value}
                  key={value}
                  onSelect={() => {
                    setStockRemaining(value);
                  }}
                  value={value}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={onPressResolve}
              style={resolveButtonStyle}
            >
              <Text style={resolveButtonTextStyle}>Resolve!</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={selectWinnerContainerStyle}>
            <Text style={loadingTextStyle}>Select the winner</Text>
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
const BUTTON_BORDER_RADIUS = 8;

const winnerBadgeStyle = {
  position: absolute,
  right: -100,
  top: '78%' as const,
  width: 300,
  height: 100,
};

const headerContainerStyle = {
  flexDirection: row,
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
  position: relative,
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
  flexDirection: row,
  alignItems: center,
  justifyContent: center,
  gap: 12,
  paddingVertical: 8,
};

const shuffleEmojiStyle = {
  fontSize: 16,
};

const loadingTextStyle = {
  color: colors.purple100,
};

const reshuffleTextStyle = {
  fontSize: 16,
  color: colors.white,
};

const reshuffleTextPlaceholderStyle = {
  fontSize: 16,
  color: colors.none,
};

const vsTextStyle = {
  fontSize: 14,
  color: colors.white,
};

const stockRemainingTextStyle = {
  fontSize: 14,
  color: colors.white,
  marginTop: 8,
};

const stockButtonsContainerStyle = {
  flexDirection: row,
  marginTop: 8,
};

const resolveButtonTextStyle = {
  fontSize: 20,
  fontWeight: 'bold' as const,
  color: colors.white,
};
