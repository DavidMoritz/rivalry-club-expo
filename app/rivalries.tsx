import { StatusBar } from 'expo-status-bar';
import React from 'react';

import { RivalryIndex } from '../src/components/screens/RivalryIndex';

export default function RivalriesRoute() {
  return (
    <>
      <RivalryIndex />
      <StatusBar style="light" />
    </>
  );
}
