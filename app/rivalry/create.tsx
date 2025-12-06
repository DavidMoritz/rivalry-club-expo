import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

import { HamburgerMenu } from '../../src/components/common/HamburgerMenu';
import { CreateRivalry } from '../../src/components/screens/CreateRivalry';

export default function CreateRivalryRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Create Rivalry', headerShown: false }} />
      <CreateRivalry />
      <HamburgerMenu />
      <StatusBar style="light" />
    </>
  );
}
