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
}

export function CharacterDisplay({ fighter, hideName, className, height }: CharacterDisplayProps) {
  if (!fighter) {
    return null;
  }

  const characterKey = sourceCase(fighter.name);
  const displaySize = height || 100; // Use provided height or default to 100

  return (
    <View
      key={fighter.id}
      style={[
        styles.fighterWrapper,
        height !== undefined && { height, width: height }
      ]}
      className={className}
    >
      <CharacterFace
        characterKey={characterKey}
        size={displaySize}
        style={{
          flex: 4,
        }}
      />
      {!hideName && (
        <View style={styles.fighterText}>
          <Text style={{ color: 'white', fontSize: 14 }}>{fighter.name}</Text>
        </View>
      )}
    </View>
  );
}
