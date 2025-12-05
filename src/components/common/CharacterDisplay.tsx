import { Text, View } from 'react-native';
import { twMerge } from 'tailwind-merge';

import { styles } from '../../utils/styles';
import { sourceCase } from '../../utils';
import { CharacterFace } from '../../../assets/images/games/ssbu/CharacterFaceExample';

// Temporary Fighter type - will be replaced with GraphQL type later
interface Fighter {
  id: string;
  name: string;
  gamePosition?: number;
}

interface CharacterDisplayProps {
  fighter: Fighter;
  hideName?: boolean;
  className?: string;
  height?: number;
  width?: number;
  zoomMultiplier?: number;
}

export function CharacterDisplay({ fighter, hideName, className, height, width, zoomMultiplier }: CharacterDisplayProps) {
  if (!fighter) {
    return null;
  }

  const characterKey = sourceCase(fighter.name);
  const displayHeight = height || 100; // Use provided height or default to 100
  const displayWidth = width || height || 100; // Use width if provided, else height, else default to 100

  return (
    <View
      key={fighter.id}
      style={
        height !== undefined || width !== undefined
          ? {
              height: displayHeight,
              width: displayWidth,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }
          : styles.fighterWrapper
      }
      className={className}
    >
      <CharacterFace
        characterKey={characterKey}
        width={displayWidth}
        height={displayHeight}
        zoomMultiplier={zoomMultiplier}
      />
      {!hideName && (
        <View style={styles.fighterText}>
          <Text style={{ color: 'white', fontSize: 14 }}>{fighter.name}</Text>
        </View>
      )}
    </View>
  );
}
