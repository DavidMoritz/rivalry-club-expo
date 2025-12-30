import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Text, View } from 'react-native';
import { colors } from '../../utils/colors';
import { center, darkStyles, styles } from '../../utils/styles';
import { fighterImages } from '../../../assets/images/games/ssbu';

interface LoadingWithCharacterProps {
  message: string;
  seed?: number;
}

const screenWidth = Dimensions.get('window').width;
const contain = 'contain' as const;

export function LoadingWithCharacter({ message, seed }: LoadingWithCharacterProps) {
  const [randomFighter, setRandomFighter] = useState<any | null>(null);

  useEffect(() => {
    const fighterKeys = Object.keys(fighterImages);
    // Use seed if provided (with modulo to keep in bounds), otherwise random
    const index = seed !== undefined
      ? seed % fighterKeys.length
      : Math.floor(Math.random() * fighterKeys.length);
    setRandomFighter(fighterKeys[index]);
  }, [seed]);

  return (
    <View style={containerStyle}>
      {randomFighter && (
        <>
          <View style={characterContainerStyle}>
            <Image source={fighterImages[randomFighter]} style={characterImageStyle} />
          </View>
          <Text>{randomFighter}</Text>
        </>
      )}
      <ActivityIndicator color={colors.white} size="large" style={{ marginTop: 16 }} />
      <Text style={messageTextStyle}>{message}</Text>
    </View>
  );
}

const containerStyle = {
  flex: 1,
  alignItems: center,
  justifyContent: center
} as const;

const characterContainerStyle = {
  marginBottom: 24,
  alignItems: center,
  justifyContent: center
} as const;

const characterImageStyle = {
  width: screenWidth,
  height: screenWidth,
  resizeMode: contain
};

const messageTextStyle = {
  ...styles.text,
  ...darkStyles.text,
  fontSize: 18,
  marginTop: 16,
  textAlign: center
} as const;
