import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { Header, HEADER_HEIGHT } from '../src/components/common/Header';
import { PendingRivalries } from '../src/components/screens/PendingRivalries';

export default function PendingRivalriesRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Pending Rivalries', headerShown: false }} />
      <Header title="Pending Rivalries" hide="pending" />
      <View style={{ paddingTop: HEADER_HEIGHT }}>
        <PendingRivalries />
      </View>
      <StatusBar style="light" />
    </>
  );
}
