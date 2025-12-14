import { useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { fighterImages } from '../../../assets/images/games/ssbu';
import { CharacterFace } from '../../../assets/images/games/ssbu/character-face-example';
import type { MFighter } from '../../models/m-fighter';
import {
  computeTierFromPosition,
  type MTierSlot,
} from '../../models/m-tier-slot';
import { sourceCase } from '../../utils';
import { colors } from '../../utils/colors';

const DEFAULT_DIMENSION = 100;
const PERCENTAGE_MULTIPLIER = 100;

function TierSlotStats({ tierSlot }: { tierSlot: MTierSlot }) {
  const hasPosition =
    tierSlot.position !== undefined && tierSlot.position !== null;
  const hasContestCount =
    tierSlot.contestCount !== undefined && tierSlot.contestCount !== null;
  const hasWinCount =
    tierSlot.winCount !== undefined && tierSlot.winCount !== null;
  const canShowWinRate =
    hasContestCount && hasWinCount && tierSlot.contestCount > 0;

  return (
    <>
      <Text style={sectionHeaderStyle}>Rivalry Stats</Text>
      {hasPosition && (
        <Text style={statTextStyle}>
          Position: #{tierSlot.position + 1} (Tier{' '}
          {computeTierFromPosition(tierSlot.position)})
        </Text>
      )}
      {hasContestCount && (
        <Text style={statTextStyle}>
          Rivalry Contests: {tierSlot.contestCount}
        </Text>
      )}
      {hasWinCount && (
        <Text style={statTextStyle}>Rivalry Wins: {tierSlot.winCount}</Text>
      )}
      {canShowWinRate && (
        <Text style={winRateTextStyle}>
          Rivalry Win Rate:{' '}
          {(
            (tierSlot.winCount / tierSlot.contestCount) *
            PERCENTAGE_MULTIPLIER
          ).toFixed(1)}
          %
        </Text>
      )}
    </>
  );
}

function FighterStats({
  fighter,
  showGlobalHeader,
}: {
  fighter: MFighter;
  showGlobalHeader: boolean;
}) {
  const hasContestCount =
    fighter.contestCount !== undefined && fighter.contestCount !== null;
  const hasWinCount =
    fighter.winCount !== undefined && fighter.winCount !== null;
  const canShowWinRate =
    hasContestCount && hasWinCount && fighter.contestCount > 0;
  const hasRank = fighter.rank !== undefined;

  return (
    <>
      {hasContestCount && (
        <>
          {showGlobalHeader && (
            <Text style={globalStatsHeaderStyle}>Global Stats</Text>
          )}
          <Text style={statTextStyle}>Contests: {fighter.contestCount}</Text>
        </>
      )}
      {hasWinCount && (
        <Text style={statTextLargeStyle}>Wins: {fighter.winCount}</Text>
      )}
      {canShowWinRate && (
        <Text style={globalWinRateTextStyle}>
          Win Rate:{' '}
          {(
            (fighter.winCount / fighter.contestCount) *
            PERCENTAGE_MULTIPLIER
          ).toFixed(1)}
          %
        </Text>
      )}
      {hasRank && <Text style={rankTextStyle}>Rank: #{fighter.rank}</Text>}
    </>
  );
}

interface CharacterDisplayProps {
  fighter: MFighter;
  tierSlot?: MTierSlot;
  hideName?: boolean;
  style?: ViewStyle;
  height?: number;
  width?: number;
  zoomMultiplier?: number;
  onPress?: () => void;
}

export function CharacterDisplay({
  fighter,
  tierSlot,
  hideName,
  style,
  height,
  width,
  zoomMultiplier,
  onPress,
}: CharacterDisplayProps) {
  const [showFullImage, setShowFullImage] = useState(false);
  const screenWidth = Dimensions.get('window').width;

  if (!fighter) {
    return null;
  }

  // Log fighter data on long press to debug stats display
  const handleLongPress = () => {
    setShowFullImage(true);
  };

  const characterKey = sourceCase(fighter.name);
  const displayHeight = height || DEFAULT_DIMENSION;
  const displayWidth = width || height || DEFAULT_DIMENSION;

  return (
    <>
      <View
        key={fighter.id}
        style={[
          height !== undefined || width !== undefined
            ? {
                height: displayHeight,
                width: displayWidth,
                ...customSizeContainerStyle,
              }
            : fighterWrapperStyle,
          style,
        ]}
      >
        <Pressable
          delayLongPress={300}
          onLongPress={handleLongPress}
          onPress={onPress}
          style={{ flexShrink: 0 }}
        >
          <CharacterFace
            characterKey={characterKey}
            height={displayHeight}
            width={displayWidth}
            zoomMultiplier={zoomMultiplier}
          />
        </Pressable>
        {!hideName && (
          <View style={fighterTextStyle}>
            <Text style={fighterNameTextStyle}>{fighter.name}</Text>
          </View>
        )}
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setShowFullImage(false)}
        transparent={true}
        visible={showFullImage}
      >
        <Pressable
          onPress={() => setShowFullImage(false)}
          style={modalBackdropStyle}
        >
          <Image
            source={fighterImages[characterKey]}
            style={{
              width: screenWidth,
              height: screenWidth,
              resizeMode: 'contain' as const,
            }}
          />
          <View style={statsContainerStyle}>
            {tierSlot && <TierSlotStats tierSlot={tierSlot} />}
            <FighterStats fighter={fighter} showGlobalHeader={!!tierSlot} />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const center = 'center' as const;

const customSizeContainerStyle = {
  alignItems: center,
  justifyContent: center,
  overflow: 'hidden' as const,
};

const fighterWrapperStyle = {
  alignItems: center,
  height: 150,
  justifyContent: 'space-between' as const,
  marginVertical: 0,
  marginHorizontal: 0,
  width: '33.33%' as const,
};

const fighterTextStyle = {
  alignItems: center,
  flex: 1,
  fontWeight: 'bold' as const,
  justifyContent: center,
  width: '100%' as const,
  color: colors.white,
};

const fighterNameTextStyle = {
  color: colors.white,
  fontSize: 14,
};

const modalBackdropStyle = {
  flex: 1,
  backgroundColor: colors.overlayDark,
  justifyContent: center,
  alignItems: center,
};

const statsContainerStyle = {
  marginTop: 20,
  backgroundColor: colors.overlayMedium,
  paddingHorizontal: 24,
  paddingVertical: 16,
  borderRadius: 12,
  alignItems: center,
};

const sectionHeaderStyle = {
  color: colors.purple400,
  fontSize: 20,
  fontWeight: 'bold' as const,
  marginBottom: 8,
};

const statTextStyle = {
  color: colors.white,
  fontSize: 18,
  marginBottom: 4,
};

const statTextLargeStyle = {
  color: colors.white,
  fontSize: 18,
};

const winRateTextStyle = {
  color: colors.blue400,
  fontSize: 16,
  marginBottom: 12,
};

const globalStatsHeaderStyle = {
  color: colors.green400,
  fontSize: 20,
  fontWeight: 'bold' as const,
  marginTop: 8,
  marginBottom: 8,
};

const globalWinRateTextStyle = {
  color: colors.blue400,
  fontSize: 16,
  marginTop: 8,
};

const rankTextStyle = {
  color: colors.amber400,
  fontSize: 16,
  marginTop: 4,
};
