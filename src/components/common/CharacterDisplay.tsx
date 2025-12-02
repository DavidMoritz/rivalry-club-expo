import { Image, Text, View } from 'react-native';
import { twMerge } from 'tailwind-merge';

import { fighterImages } from '../../../assets/images/games/ssbu';
import { styles } from '../../utils/styles';
import { sourceCase } from '../../utils';

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
}

function fighterImageSource(fighter: Fighter) {
  return fighterImages[sourceCase(fighter.name)];
}

export function CharacterDisplay({
  fighter,
  hideName,
  className,
}: CharacterDisplayProps) {
  if (!fighter) return null;

  return (
    <View
      key={fighter.id}
      className={twMerge(
        'items-center h-[150px] justify-between my-1.25',
        className,
      )}>
      <Image
        className="aspect-square"
        style={{
          aspectRatio: 1,
          flex: 4,
          resizeMode: 'contain',
        }}
        source={fighterImageSource(fighter)}
      />
      {!hideName && (
        <View style={styles.fighterText}>
          <Text className="text-sm text-white">{fighter.name}</Text>
        </View>
      )}
    </View>
  );
}
