import { type ReactNode, useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';

import type { MContest } from '../../../models/m-contest';
import type { MFighter } from '../../../models/m-fighter';
import { STEPS_PER_STOCK } from '../../../models/m-game';
import type { MRivalry } from '../../../models/m-rivalry';
import { TIERS } from '../../../models/m-tier-list';
import { computeTierFromPosition } from '../../../models/m-tier-slot';
import { colors } from '../../../utils/colors';
import { absolute, bold, center, relative } from '../../../utils/styles';
import { CharacterDisplay } from '../../common/CharacterDisplay';

// Layout constants for character displays
const WINNER_DISPLAY_WIDTH = 140;
const WINNER_DISPLAY_HEIGHT = 180;
const WINNER_BADGE_RATIO = 0.25;
const LOSER_DISPLAY_WIDTH = 91;
const LOSER_DISPLAY_HEIGHT = 117;
const LOSER_BADGE_RATIO = 0.35;

// Game constants
const MAX_TIER_POSITION = 82;

interface BattleResultsProps {
  contest: MContest;
  fighterA: MFighter;
  fighterB: MFighter;
  rivalry: MRivalry;
  isUserB: boolean;
  winnerPosition: number | null;
  loserPosition: number | null;
}

export function BattleResults({
  contest,
  fighterA,
  fighterB,
  rivalry,
  isUserB,
  winnerPosition,
  loserPosition,
}: BattleResultsProps): ReactNode {
  const isATheWinner = (contest.result || 0) > 0;
  const winnerFighter = isATheWinner ? fighterA : fighterB;
  const loserFighter = isATheWinner ? fighterB : fighterA;
  const winnerUser = isATheWinner
    ? rivalry.displayUserAName()
    : rivalry.displayUserBName();
  const loserUser = isATheWinner
    ? rivalry.displayUserBName()
    : rivalry.displayUserAName();
  const stockCount = Math.abs(contest.result || 0);
  const isUserTheWinner = isUserB ? !isATheWinner : isATheWinner;

  const winnerTierSlot = isATheWinner ? contest.tierSlotA : contest.tierSlotB;
  const loserTierSlot = isATheWinner ? contest.tierSlotB : contest.tierSlotA;

  // Calculate new tiers from positions returned by adjustStanding
  // Subtract for winner (moves up = lower position number), add for loser (moves down = higher position number)
  const winnerNewTier = computeTierFromPosition(
    winnerPosition !== null
      ? Math.max(0, winnerPosition - stockCount * STEPS_PER_STOCK)
      : null
  );
  const loserNewTier = computeTierFromPosition(
    loserPosition !== null
      ? Math.min(
          MAX_TIER_POSITION,
          loserPosition + stockCount * STEPS_PER_STOCK
        )
      : null
  );

  // Get tier colors
  const winnerTierData = TIERS.find(t => t.label === winnerNewTier);
  const loserTierData = TIERS.find(t => t.label === loserNewTier);

  // Animation for winner growing
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: 1.15,
      duration: 2000,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <View style={containerStyle}>
      <Text style={titleStyle}>BATTLE RESULTS!</Text>

      <View
        style={[
          fightersContainerStyle,
          { flexDirection: isUserTheWinner ? 'row' : 'row-reverse' },
        ]}
      >
        {/* Winner Side */}
        <View style={winnerContainerStyle}>
          <Text style={winnerUserNameStyle}>{winnerUser}</Text>
          <Animated.View
            style={[
              winnerFighterBoxStyle,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={relativePositionStyle}>
              <CharacterDisplay
                fighter={winnerFighter}
                height={WINNER_DISPLAY_HEIGHT}
                hideName={true}
                tierSlot={winnerTierSlot}
                width={WINNER_DISPLAY_WIDTH}
                zoomMultiplier={1.75}
              />
              {/* Tier Badge Overlay */}
              {winnerTierData && (
                <View
                  style={[
                    tierBadgeStyle,
                    {
                      backgroundColor: winnerTierData.color,
                      width: WINNER_DISPLAY_WIDTH * WINNER_BADGE_RATIO,
                      height: WINNER_DISPLAY_WIDTH * WINNER_BADGE_RATIO,
                      bottom: 8,
                      right: 8,
                    },
                  ]}
                >
                  <Text style={tierBadgeTextStyle}>{winnerNewTier}</Text>
                </View>
              )}
            </View>
          </Animated.View>
          <Text style={winnerFighterNameStyle}>{winnerFighter.name}</Text>
          <Text style={victoryTextStyle}>VICTORY!</Text>
        </View>

        {/* Loser Side */}
        <View style={loserContainerStyle}>
          {/* Score */}
          <View style={scoreContainerStyle}>
            <Text style={scoreTextStyle}>{stockCount}-0</Text>
          </View>
          <Text style={loserUserNameStyle}>{loserUser}</Text>
          <View style={loserFighterBoxStyle}>
            <View style={relativePositionStyle}>
              <CharacterDisplay
                fighter={loserFighter}
                height={LOSER_DISPLAY_HEIGHT}
                hideName={true}
                tierSlot={loserTierSlot}
                width={LOSER_DISPLAY_WIDTH}
                zoomMultiplier={0.95}
              />
              {/* Tier Badge Overlay */}
              {loserTierData && (
                <View
                  style={[
                    tierBadgeStyle,
                    {
                      backgroundColor: loserTierData.color,
                      width: LOSER_DISPLAY_WIDTH * LOSER_BADGE_RATIO,
                      height: LOSER_DISPLAY_WIDTH * LOSER_BADGE_RATIO,
                      bottom: 4,
                      right: 4,
                    },
                  ]}
                >
                  <Text style={[tierBadgeTextStyle, { fontSize: 15 }]}>
                    {loserNewTier}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <Text style={loserFighterNameStyle}>{loserFighter.name}</Text>
          <Text style={defeatTextStyle}>DEFEAT</Text>
        </View>
      </View>
    </View>
  );
}

// Styles
const containerStyle = {
  flex: 1,
  backgroundColor: colors.slate900,
  alignItems: center,
  justifyContent: center,
  padding: 16,
};

const titleStyle = {
  fontSize: 28,
  fontWeight: bold,
  color: colors.yellow500,
  marginBottom: 24,
};

const fightersContainerStyle = {
  alignItems: center,
  justifyContent: 'space-around' as const,
  width: '100%' as const,
  marginBottom: 24,
};

const winnerContainerStyle = {
  alignItems: center,
  flex: 1,
};

const loserContainerStyle = {
  ...winnerContainerStyle,
  opacity: 0.6,
};

const relativePositionStyle = {
  position: relative,
};

const winnerUserNameStyle = {
  fontSize: 18,
  fontWeight: bold,
  color: colors.white,
  marginBottom: 8,
};

const loserUserNameStyle = {
  ...winnerUserNameStyle,
  color: colors.gray400,
};

const winnerFighterBoxStyle = {
  borderWidth: 4,
  borderColor: colors.green700,
  backgroundColor: colors.green900,
  borderRadius: 12,
  padding: 8,
  shadowColor: colors.green700,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.8,
  shadowRadius: 10,
};

const loserFighterBoxStyle = {
  borderWidth: 4,
  borderColor: colors.gray600,
  backgroundColor: colors.gray800,
  borderRadius: 12,
  padding: 8,
};

const winnerFighterNameStyle = {
  fontSize: 16,
  fontWeight: bold,
  color: colors.white,
  marginTop: 8,
};

const loserFighterNameStyle = {
  fontSize: 16,
  fontWeight: bold,
  color: colors.gray400,
  marginTop: 8,
};

const victoryTextStyle = {
  fontSize: 20,
  fontWeight: bold,
  color: colors.green400,
  marginTop: 4,
};

const defeatTextStyle = {
  fontSize: 20,
  fontWeight: bold,
  color: colors.red400,
  marginTop: 4,
};

const scoreContainerStyle = {
  alignItems: center,
  justifyContent: center,
  marginHorizontal: 16,
};

const scoreTextStyle = {
  fontSize: 32,
  fontWeight: bold,
  color: colors.white,
  marginBottom: 8,
};

const tierBadgeStyle = {
  position: absolute,
  borderRadius: 8,
  alignItems: center,
  justifyContent: center,
  borderWidth: 2,
  borderColor: colors.black,
  padding: 2,
};

const tierBadgeTextStyle = {
  fontSize: 18,
  fontWeight: bold,
  color: colors.black,
};
