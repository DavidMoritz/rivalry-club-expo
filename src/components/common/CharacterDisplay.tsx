import { useState } from 'react';
import { Dimensions, Image, Modal, Pressable, Text, View, ViewStyle } from 'react-native';

import { styles } from '../../utils/styles';
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
    console.log(
      '[CharacterDisplay] Long press on fighter:',
      fighter.name,
      'winCount:',
      fighter.winCount,
      'contestCount:',
      fighter.contestCount,
      'rank:',
      fighter.rank
    );
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
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
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
            <Text style={{ color: 'white', fontSize: 14 }}>{fighter.name}</Text>
          </View>
        )}
      </View>

      <Modal
        visible={showFullImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullImage(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          onPress={() => setShowFullImage(false)}
        >
          <Image
            source={fighterImages[characterKey]}
            style={{
              width: screenWidth,
              height: screenWidth,
              resizeMode: 'contain'
            }}
          />
          <View
            style={{
              marginTop: 20,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              paddingHorizontal: 24,
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center'
            }}
          >
            {tierSlot && (
              <>
                <Text
                  style={{ color: '#a78bfa', fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}
                >
                  Rivalry Stats
                </Text>
                {tierSlot.position !== undefined && tierSlot.position !== null && (
                  <Text style={{ color: 'white', fontSize: 18, marginBottom: 4 }}>
                    Position: #{tierSlot.position + 1} (Tier{' '}
                    {computeTierFromPosition(tierSlot.position)})
                  </Text>
                )}
                {tierSlot.contestCount !== undefined && tierSlot.contestCount !== null && (
                  <Text style={{ color: 'white', fontSize: 18, marginBottom: 4 }}>
                    Rivalry Contests: {tierSlot.contestCount}
                  </Text>
                )}
                {tierSlot.winCount !== undefined && tierSlot.winCount !== null && (
                  <Text style={{ color: 'white', fontSize: 18, marginBottom: 4 }}>
                    Rivalry Wins: {tierSlot.winCount}
                  </Text>
                )}
                {tierSlot.contestCount !== undefined &&
                  tierSlot.contestCount !== null &&
                  tierSlot.contestCount > 0 &&
                  tierSlot.winCount !== undefined &&
                  tierSlot.winCount !== null && (
                    <Text style={{ color: '#60a5fa', fontSize: 16, marginBottom: 12 }}>
                      Rivalry Win Rate:{' '}
                      {((tierSlot.winCount / tierSlot.contestCount) * 100).toFixed(1)}%
                    </Text>
                  )}
              </>
            )}
            {fighter.contestCount !== undefined && fighter.contestCount !== null && (
              <>
                {tierSlot && (
                  <Text
                    style={{
                      color: '#34d399',
                      fontSize: 20,
                      fontWeight: 'bold',
                      marginTop: 8,
                      marginBottom: 8
                    }}
                  >
                    Global Stats
                  </Text>
                )}
                <Text style={{ color: 'white', fontSize: 18, marginBottom: 4 }}>
                  Contests: {fighter.contestCount}
                </Text>
              </>
            )}
            {fighter.winCount !== undefined && fighter.winCount !== null && (
              <Text style={{ color: 'white', fontSize: 18 }}>Wins: {fighter.winCount}</Text>
            )}
            {fighter.contestCount !== undefined &&
              fighter.contestCount !== null &&
              fighter.contestCount > 0 &&
              fighter.winCount !== undefined &&
              fighter.winCount !== null && (
                <Text style={{ color: '#60a5fa', fontSize: 16, marginTop: 8 }}>
                  Win Rate: {((fighter.winCount / fighter.contestCount) * 100).toFixed(1)}%
                </Text>
              )}
            {fighter.rank !== undefined && (
              <Text style={{ color: '#fbbf24', fontSize: 16, marginTop: 4 }}>
                Rank: #{fighter.rank}
              </Text>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const fighterWrapperStyle = {
  alignItems: 'center' as const,
  height: 150,
  justifyContent: 'space-between' as const,
  marginVertical: 0,
  marginHorizontal: 0,
  width: '33.33%' as const
};

const fighterTextStyle = {
  alignItems: 'center' as const,
  flex: 1,
  fontWeight: 'bold' as const,
  justifyContent: 'center' as const,
  width: '100%' as const,
  color: 'white'
};
