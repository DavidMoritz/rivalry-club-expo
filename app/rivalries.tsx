import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';

import { Header, HEADER_HEIGHT } from '../src/components/common/Header';
import { RivalryIndex } from '../src/components/screens/RivalryIndex';
import { useAuthUser } from '../src/hooks/useAuthUser';

export default function RivalriesRoute() {
  const router = useRouter();
  const { user, isLoading } = useAuthUser();

  // Redirect to profile if user hasn't set their name
  useEffect(() => {
    if (!isLoading && user && (!user.firstName || user.firstName.trim() === '')) {
      router.replace('/profile');
    }
  }, [user, isLoading, router]);

  return (
    <>
      <Header title="Rivalries" hide="rivalries" />
      <View style={{ paddingTop: HEADER_HEIGHT }}>
        <RivalryIndex />
      </View>
      <StatusBar style="light" />
    </>
  );
}
