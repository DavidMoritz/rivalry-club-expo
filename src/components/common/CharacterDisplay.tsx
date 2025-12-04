import { Image, Text, View } from 'react-native';
import { twMerge } from 'tailwind-merge';

import { styles } from '../../utils/styles';
import { fighterImageSource } from '../../utils';

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

  return (
    <View
      key={fighter.id}
      style={[
        styles.fighterWrapper,
        height !== undefined && { height, width: height }
      ]}
      className={className}
    >
      <Image
        style={{
          aspectRatio: 1,
          flex: 4,
          resizeMode: 'contain'
        }}
        source={fighterImageSource(fighter)}
      />
      {!hideName && (
        <View style={styles.fighterText}>
          <Text style={{ color: 'white', fontSize: 14 }}>{fighter.name}</Text>
        </View>
      )}
    </View>
  );
}
