import { useState } from 'react';
import { Dimensions, Image, Modal, Pressable, Text, View, ViewStyle } from 'react-native';

import { colors } from '../../utils/colors';
import { sourceCase } from '../../utils';
import { CharacterFace } from '../../../assets/images/games/ssbu/CharacterFaceExample';
import { fighterImages } from '../../../assets/images/games/ssbu';
import { MTierSlot, computeTierFromPosition } from '../../models/m-tier-slot';
import { MFighter } from '../../models/m-fighter';

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
  onPress
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
  const displayHeight = height || 100; // Use provided height or default to 100
  const displayWidth = width || height || 100; // Use width if provided, else height, else default to 100

  return (
    <>
      <View
        key={fighter.id}
        style={[
          height !== undefined || width !== undefined
            ? {
                height: displayHeight,
                width: displayWidth,
                ...customSizeContainerStyle
              }
            : fighterWrapperStyle,
          style
        ]}
      >
        <Pressable
          onPress={onPress}
          onLongPress={handleLongPress}
          delayLongPress={300}
          style={{ flexShrink: 0 }}
        >
          <CharacterFace
            characterKey={characterKey}
            width={displayWidth}
            height={displayHeight}
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
        visible={showFullImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullImage(false)}
      >
        <Pressable style={modalBackdropStyle} onPress={() => setShowFullImage(false)}>
          <Image
            source={fighterImages[characterKey]}
            style={{
              width: screenWidth,
              height: screenWidth,
              resizeMode: 'contain' as const
            }}
          />
          <View style={statsContainerStyle}>
            {tierSlot && (
              <>
                <Text style={sectionHeaderStyle}>Rivalry Stats</Text>
                {tierSlot.position !== undefined && tierSlot.position !== null && (
                  <Text style={statTextStyle}>
                    Position: #{tierSlot.position + 1} (Tier{' '}
                    {computeTierFromPosition(tierSlot.position)})
                  </Text>
                )}
                {tierSlot.contestCount !== undefined && tierSlot.contestCount !== null && (
                  <Text style={statTextStyle}>Rivalry Contests: {tierSlot.contestCount}</Text>
                )}
                {tierSlot.winCount !== undefined && tierSlot.winCount !== null && (
                  <Text style={statTextStyle}>Rivalry Wins: {tierSlot.winCount}</Text>
                )}
                {tierSlot.contestCount !== undefined &&
                  tierSlot.contestCount !== null &&
                  tierSlot.contestCount > 0 &&
                  tierSlot.winCount !== undefined &&
                  tierSlot.winCount !== null && (
                    <Text style={winRateTextStyle}>
                      Rivalry Win Rate:{' '}
                      {((tierSlot.winCount / tierSlot.contestCount) * 100).toFixed(1)}%
                    </Text>
                  )}
              </>
            )}
            {fighter.contestCount !== undefined && fighter.contestCount !== null && (
              <>
                {tierSlot && <Text style={globalStatsHeaderStyle}>Global Stats</Text>}
                <Text style={statTextStyle}>Contests: {fighter.contestCount}</Text>
              </>
            )}
            {fighter.winCount !== undefined && fighter.winCount !== null && (
              <Text style={statTextLargeStyle}>Wins: {fighter.winCount}</Text>
            )}
            {fighter.contestCount !== undefined &&
              fighter.contestCount !== null &&
              fighter.contestCount > 0 &&
              fighter.winCount !== undefined &&
              fighter.winCount !== null && (
                <Text style={globalWinRateTextStyle}>
                  Win Rate: {((fighter.winCount / fighter.contestCount) * 100).toFixed(1)}%
                </Text>
              )}
            {fighter.rank !== undefined && <Text style={rankTextStyle}>Rank: #{fighter.rank}</Text>}
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
  overflow: 'hidden' as const
};

const fighterWrapperStyle = {
  alignItems: center,
  height: 150,
  justifyContent: 'space-between' as const,
  marginVertical: 0,
  marginHorizontal: 0,
  width: '33.33%' as const
};

const fighterTextStyle = {
  alignItems: center,
  flex: 1,
  fontWeight: 'bold' as const,
  justifyContent: center,
  width: '100%' as const,
  color: colors.white
};

const fighterNameTextStyle = {
  color: colors.white,
  fontSize: 14
};

const modalBackdropStyle = {
  flex: 1,
  backgroundColor: colors.overlayDark,
  justifyContent: center,
  alignItems: center
};

const statsContainerStyle = {
  marginTop: 20,
  backgroundColor: colors.overlayMedium,
  paddingHorizontal: 24,
  paddingVertical: 16,
  borderRadius: 12,
  alignItems: center
};

const sectionHeaderStyle = {
  color: colors.purple400,
  fontSize: 20,
  fontWeight: 'bold' as const,
  marginBottom: 8
};

const statTextStyle = {
  color: colors.white,
  fontSize: 18,
  marginBottom: 4
};

const statTextLargeStyle = {
  color: colors.white,
  fontSize: 18
};

const winRateTextStyle = {
  color: colors.blue400,
  fontSize: 16,
  marginBottom: 12
};

const globalStatsHeaderStyle = {
  color: colors.green400,
  fontSize: 20,
  fontWeight: 'bold' as const,
  marginTop: 8,
  marginBottom: 8
};

const globalWinRateTextStyle = {
  color: colors.blue400,
  fontSize: 16,
  marginTop: 8
};

const rankTextStyle = {
  color: colors.amber400,
  fontSize: 16,
  marginTop: 4
};
