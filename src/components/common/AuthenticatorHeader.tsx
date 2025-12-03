import React from 'react';
import { Image, Text, View } from 'react-native';

import { s3Favicons } from '../../utils';
import { styles } from '../../utils/styles';

export function AuthenticatorHeader(): JSX.Element {
  return (
    <View>
      <Image
        style={styles.siteLogoImage}
        source={{
          uri: `${s3Favicons}/swords-144.png`
        }}
      />
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Rivalry Club</Text>
      </View>
    </View>
  );
}
