import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

import { HamburgerMenu } from '../src/components/common/HamburgerMenu';
import { PendingRivalries } from '../src/components/screens/PendingRivalries';

export default function PendingRivalriesRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Pending Rivalries', headerShown: false }} />
      <PendingRivalries />
      <HamburgerMenu />
      <StatusBar style="light" />
    </>
  );
}
