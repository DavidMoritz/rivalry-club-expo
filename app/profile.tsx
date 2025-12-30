import { StatusBar } from 'expo-status-bar';

import { Profile } from '../src/components/screens/Profile';
import { useSetHeader } from '../src/providers/header';

export default function ProfileRoute() {
  useSetHeader({ title: 'Account', hide: 'profile' });

  return (
    <>
      <Profile />
      <StatusBar style="light" />
    </>
  );
}
