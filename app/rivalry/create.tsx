import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { Header, HEADER_HEIGHT } from '../../src/components/common/Header';
import { CreateRivalry } from '../../src/components/screens/CreateRivalry';

export default function CreateRivalryRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Create Rivalry', headerShown: false }} />
      <Header title="Create Rivalry" />
      <View style={{ paddingTop: HEADER_HEIGHT }}>
        <CreateRivalry />
      </View>
      <StatusBar style="light" />
    </>
  );
}
