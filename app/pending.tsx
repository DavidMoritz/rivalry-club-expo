import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { PendingRivalries } from '../src/components/screens/PendingRivalries';
import { useSetHeader } from '../src/providers/header';

export default function PendingRivalriesRoute() {
  useSetHeader({ title: 'Pending Rivalries', hide: 'pending' });

  return (
    <>
      <Stack.Screen
        options={{ title: 'Pending Rivalries', headerShown: false }}
      />
      <PendingRivalries />
      <StatusBar style="light" />
    </>
  );
}
