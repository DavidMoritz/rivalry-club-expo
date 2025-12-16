import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { range } from 'lodash';
import { type ReactNode, useEffect, useState } from 'react';
import { FlatList, Image, Share, Text, TouchableOpacity, View } from 'react-native';

import { characterImageMap } from '../assets/images/games/ssbu/character_image_map';
import { CharacterFace } from '../assets/images/games/ssbu/character-face-example';
import { Button } from '../src/components/common/Button';
import { STOCK } from '../src/models/m-game';
import { colors } from '../src/utils/colors';

interface OfflineContestResult {
  timestamp: Date;
  winner: 'A' | 'B';
  fighterAName: string;
  fighterBName: string;
  stockRemaining: number;
}

interface FighterCardProps {
  fighter: string;
  onPressShuffle: () => void;
  slot: 'A' | 'B';
  winner: 'A' | 'B' | null;
  setWinner: (winner: 'A' | 'B') => void;
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
    <Image resizeMode="contain" source={require('../assets/winner.png')} style={winnerBadgeStyle} />
  );
}

function getTextColor(isWinner: boolean) {
  return isWinner ? colors.black : colors.white;
}

function formatFighterName(fighter: string) {
  return fighter
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function FighterCard({
  fighter,
  onPressShuffle,
  slot,
  winner,
  setWinner
}: FighterCardProps): ReactNode {
  const isWinner = winner === slot;
  const fighterName = formatFighterName(fighter);

  return (
    <View style={[fighterContainerStyle, isWinner ? fighterWinnerStyle : fighterNonWinnerStyle]}>
      <TouchableOpacity
        onPress={onPressShuffle}
        style={[shuffleButtonStyle, { [slot === 'A' ? 'left' : 'right']: -10 }]}
      >
        <Text style={{ fontSize: 16 }}>🔀</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setWinner(slot)} style={{ alignItems: 'center' }}>
        <CharacterFace characterKey={fighter} height={180} width={140} zoomMultiplier={1.55} />
      </TouchableOpacity>
      <Text style={[fighterNameStyle, { color: getTextColor(isWinner) }]}>{fighterName}</Text>
      {isWinner && <WinnerBadge />}
    </View>
  );
}

function StockButton({
  isFirstButton,
  isLastButton,
  isSelected,
  onSelect,
  value
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
          borderBottomRightRadius: isLastButton ? BUTTON_BORDER_RADIUS : 0
        }
      ]}
    >
      <Text
        style={{
          fontSize: 24,
          color: isSelected ? colors.white : colors.black
        }}
      >
        {value}
      </Text>
    </TouchableOpacity>
  );
}

export default function OfflineMode() {
  const router = useRouter();
  const [fighterA, setFighterA] = useState<string>('');
  const [fighterB, setFighterB] = useState<string>('');
  const [winner, setWinner] = useState<'A' | 'B' | null>(null);
  const [stockRemaining, setStockRemaining] = useState<number>(1);
  const [contestHistory, setContestHistory] = useState<OfflineContestResult[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const characterKeys = Object.keys(characterImageMap);

  const getRandomCharacter = (excludedFighters: string[] = []) => {
    const availableCharacters = characterKeys.filter(
      (char) => !excludedFighters.includes(char)
    );

    // If all characters are excluded, fall back to all characters
    if (availableCharacters.length === 0) {
      return characterKeys[Math.floor(Math.random() * characterKeys.length)];
    }

    return availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
  };

  const getRecentFightersForSide = (side: 'A' | 'B', count = 20): string[] => {
    return contestHistory
      .slice(0, count)
      .map((contest) => (side === 'A' ? contest.fighterAName : contest.fighterBName))
      .map((name) => name.toLowerCase().split(' ').join('_'));
  };

  const shuffleBoth = () => {
    const recentA = getRecentFightersForSide('A');
    const recentB = getRecentFightersForSide('B');
    setFighterA(getRandomCharacter(recentA));
    setFighterB(getRandomCharacter(recentB));
    setWinner(null);
    setStockRemaining(1);
  };

  const shuffleA = () => {
    const recentA = getRecentFightersForSide('A');
    setFighterA(getRandomCharacter(recentA));
  };

  const shuffleB = () => {
    const recentB = getRecentFightersForSide('B');
    setFighterB(getRandomCharacter(recentB));
  };

  // Initialize with random characters
  useEffect(() => {
    shuffleBoth();
  }, []);

  const handleShareHistory = async () => {
    if (contestHistory.length === 0) return;

    // Format the history as text
    const historyText = contestHistory
      .map((item, index) => {
        const timeString = item.timestamp.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }).toLowerCase();
        const result = `${item.stockRemaining} stock${item.stockRemaining !== 1 ? 's' : ''}`;
        const verb = item.winner === 'A' ? 'beat' : 'lost to';

        return `${index + 1}. ${timeString} - ${item.fighterAName} ${verb} ${item.fighterBName} (${result})`;
      })
      .join('\n');

    const message = `Offline Mode Match History\n\nTotal Matches: ${contestHistory.length}\n\n${historyText}`;

    try {
      await Share.share({
        message,
        title: 'Offline Mode History'
      });
    } catch (error) {
      console.error('Error sharing history:', error);
    }
  };

  const onPressResolve = () => {
    // Store the contest result in history before shuffling
    if (winner && fighterA && fighterB) {
      const newResult: OfflineContestResult = {
        timestamp: new Date(),
        winner,
        fighterAName: formatFighterName(fighterA),
        fighterBName: formatFighterName(fighterB),
        stockRemaining
      };
      setContestHistory((prev) => [newResult, ...prev]);
    }

    // Then shuffle both characters
    shuffleBoth();
  };

  return (
    <View style={containerStyle}>
      <StatusBar style="light" />

      {/* Header with back button and offline mode label */}
      <View style={topHeaderStyle}>
        <TouchableOpacity onPress={() => router.back()} style={backButtonStyle}>
          <Text style={{ fontSize: 24, color: colors.white }}>←</Text>
        </TouchableOpacity>
        <View style={offlineBadgeStyle}>
          <Text style={offlineBadgeTextStyle}>🔌 OFFLINE MODE</Text>
        </View>
      </View>

      <View style={contestOuterContainerStyle}>
        <View style={fightersRowContainerStyle}>
          {fighterA && (
            <FighterCard
              fighter={fighterA}
              onPressShuffle={shuffleA}
              slot="A"
              winner={winner}
              setWinner={setWinner}
            />
          )}

          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: colors.white }}>Vs</Text>
          </View>

          {fighterB && (
            <FighterCard
              fighter={fighterB}
              onPressShuffle={shuffleB}
              slot="B"
              winner={winner}
              setWinner={setWinner}
            />
          )}
        </View>

        {winner ? (
          <>
            <Text style={{ fontSize: 14, color: colors.white, marginTop: 8 }}>Stock remaining</Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
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

            <TouchableOpacity onPress={onPressResolve} style={resolveButtonStyle}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: colors.white
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

      {/* Show History and Share buttons - only appear after at least one contest is resolved */}
      {contestHistory.length > 0 && (
        <View style={historyButtonsContainerStyle}>
          <Button
            onPress={() => setShowHistory(!showHistory)}
            style={linkButtonStyle}
            text={showHistory ? 'Hide History' : 'Show History'}
            textStyle={linkTextStyle}
          />
          <Button
            onPress={handleShareHistory}
            style={linkButtonStyle}
            text="Share History"
            textStyle={linkTextStyle}
          />
        </View>
      )}

      {/* History display */}
      {showHistory && contestHistory.length > 0 && (
        <View style={historyContainerStyle}>
          <FlatList
            data={contestHistory}
            keyExtractor={(item, index) => `${item.timestamp.getTime()}-${index}`}
            renderItem={({ item }) => {
              const timeString = item.timestamp
                .toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })
                .toLowerCase();
              const result = `${item.stockRemaining} stock${item.stockRemaining !== 1 ? 's' : ''}`;
              const isAWinner = item.winner === 'A';

              return (
                <View style={historyRowStyle}>
                  <View style={historyItemStyle}>
                    <Text style={historyTextStyle}>{timeString}</Text>
                  </View>
                  <View style={[historyItemStyle, isAWinner && historyWinnerStyle]}>
                    <Text style={historyTextStyle}>{item.fighterAName}</Text>
                  </View>
                  <View style={historyItemStyle}>
                    <Text style={historyTextStyle}>{result}</Text>
                  </View>
                  <View style={[historyItemStyle, !isAWinner && historyWinnerStyle]}>
                    <Text style={historyTextStyle}>{item.fighterBName}</Text>
                  </View>
                </View>
              );
            }}
            style={historyScrollStyle}
          />
        </View>
      )}
    </View>
  );
}

// Style constants
const BUTTON_BORDER_RADIUS = 8;

// Common style value constants
const center = 'center' as const;
const row = 'row' as const;
const absolute = 'absolute' as const;
const relative = 'relative' as const;
const auto = 'auto' as const;
const bold = 'bold' as const;
const normal = 'normal' as const;
const underline = 'underline' as const;

const containerStyle = {
  flex: 1,
  backgroundColor: colors.black,
  paddingHorizontal: 16,
  paddingTop: 60
};

const topHeaderStyle = {
  flexDirection: row,
  alignItems: center,
  justifyContent: center,
  marginBottom: 20
};

const backButtonStyle = {
  position: absolute,
  left: 0,
  padding: 8
};

const offlineBadgeStyle = {
  backgroundColor: colors.orange500,
  paddingHorizontal: 20,
  paddingVertical: 8,
  borderRadius: 20,
  borderWidth: 2,
  borderColor: colors.orange700
};

const offlineBadgeTextStyle = {
  fontSize: 18,
  fontWeight: bold,
  color: colors.black,
  letterSpacing: 1
};

const winnerBadgeStyle = {
  position: absolute,
  right: -100,
  top: '78%' as const,
  width: 300,
  height: 100
};

const contestOuterContainerStyle = {
  alignItems: center,
  marginVertical: 6,
  borderWidth: 1,
  borderColor: colors.yellow500,
  padding: 2
};

const fightersRowContainerStyle = {
  alignItems: center,
  justifyContent: 'space-between' as const,
  marginVertical: 6,
  padding: 2,
  flexDirection: row
};

const fighterContainerStyle = {
  position: relative,
  borderWidth: 4,
  alignItems: center,
  marginVertical: 20,
  padding: 8,
  borderRadius: 12,
  backgroundColor: colors.none,
  borderColor: colors.none
};

const fighterWinnerStyle = {
  borderColor: colors.green700,
  backgroundColor: colors.blue100
};

const fighterNonWinnerStyle = {
  borderColor: colors.none,
  backgroundColor: colors.none
};

const shuffleButtonStyle = {
  position: absolute,
  top: -25,
  padding: 10,
  zIndex: 10
};

const fighterNameStyle = {
  fontSize: 14,
  marginTop: 4
};

const stockButtonStyle = {
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderLeftWidth: 1,
  borderTopWidth: 1,
  borderBottomWidth: 1,
  borderColor: colors.violet600
};

const resolveButtonStyle = {
  paddingHorizontal: 32,
  paddingVertical: 16,
  marginVertical: 16,
  backgroundColor: colors.green700,
  borderRadius: 8
};

const selectWinnerContainerStyle = {
  flexDirection: row,
  alignItems: center,
  justifyContent: center,
  gap: 12,
  paddingVertical: 8
};

const historyButtonsContainerStyle = {
  flexDirection: row,
  alignItems: center,
  justifyContent: center,
  gap: 16,
  marginTop: 8
};

const linkButtonStyle = {
  backgroundColor: colors.none,
  borderWidth: 0,
  height: auto,
  width: auto,
  paddingHorizontal: 4,
  paddingVertical: 4,
  marginTop: 0
};

const linkTextStyle = {
  color: colors.slate400,
  fontSize: 14,
  fontWeight: normal,
  textDecorationLine: underline
};

const historyContainerStyle = {
  marginTop: 16,
  borderTopWidth: 2,
  borderTopColor: colors.yellow500,
  paddingTop: 16,
  maxHeight: 300
};

const historyScrollStyle = {
  flexGrow: 0
};

const historyRowStyle = {
  flexDirection: row,
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: colors.slate700
};

const historyItemStyle = {
  flex: 1,
  alignItems: center,
  justifyContent: center
};

const historyWinnerStyle = {
  backgroundColor: colors.green900
};

const historyTextStyle = {
  color: colors.white,
  fontSize: 12
};
