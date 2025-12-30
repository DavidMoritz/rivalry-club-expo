import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { Header, HEADER_HEIGHT } from '../src/components/common/Header';
import { Profile } from '../src/components/screens/Profile';

export default function ProfileRoute() {
  return (
    <>
      <Header title="Account" hide="profile" />
      <View style={{ paddingTop: HEADER_HEIGHT }}>
        <Profile />
      </View>
      <StatusBar style="light" />
    </>
  );
}
