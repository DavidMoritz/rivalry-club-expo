import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { CreateRivalry } from '../../src/components/screens/CreateRivalry';
import { useSetHeader } from '../../src/providers/header';

export default function CreateRivalryRoute() {
  useSetHeader({ title: 'Create Rivalry' });

  return (
    <>
      <Stack.Screen options={{ title: 'Create Rivalry', headerShown: false }} />
      <CreateRivalry />
      <StatusBar style="light" />
    </>
  );
}
