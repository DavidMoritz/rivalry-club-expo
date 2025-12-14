import { StatusBar } from 'expo-status-bar';

import { HamburgerMenu } from '../src/components/common/HamburgerMenu';
import { Profile } from '../src/components/screens/Profile';

export default function ProfileRoute() {
  return (
    <>
      <Profile />
      <HamburgerMenu />
      <StatusBar style="light" />
    </>
  );
}
