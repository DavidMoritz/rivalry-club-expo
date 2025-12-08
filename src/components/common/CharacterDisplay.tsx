import { useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  Text,
  View,
  ViewStyle
} from 'react-native';

import { styles } from '../../utils/styles';
import { sourceCase } from '../../utils';
import { CharacterFace } from '../../../assets/images/games/ssbu/CharacterFaceExample';
import { fighterImages } from '../../../assets/images/games/ssbu';

// Temporary Fighter type - will be replaced with GraphQL type later
interface Fighter {
  id: string;
  name: string;
  gamePosition?: number;
}

interface CharacterDisplayProps {
  fighter: Fighter;
  hideName?: boolean;
  style?: ViewStyle;
  height?: number;
  width?: number;
  zoomMultiplier?: number;
  onPress?: () => void;
}

export function CharacterDisplay({ fighter, hideName, style, height, width, zoomMultiplier, onPress }: CharacterDisplayProps) {
  const [showFullImage, setShowFullImage] = useState(false);
  const screenWidth = Dimensions.get('window').width;

  if (!fighter) {
    return null;
  }

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
            : styles.fighterWrapper,
          style
        ]}
      >
        <Pressable
          onPress={onPress}
          onLongPress={() => setShowFullImage(true)}
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
          <View style={styles.fighterText}>
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
        </Pressable>
      </Modal>
    </>
  );
}
