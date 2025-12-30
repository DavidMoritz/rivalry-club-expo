import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { RivalryIndex } from '../src/components/screens/RivalryIndex';
import { useAuthUser } from '../src/hooks/useAuthUser';
import { useSetHeader } from '../src/providers/header';

export default function RivalriesRoute() {
  const router = useRouter();
  const { user, isLoading } = useAuthUser();

  // Configure header
  useSetHeader({ title: 'Rivalries', hide: 'rivalries' });

  // Redirect to profile if user hasn't set their name
  useEffect(() => {
    if (!isLoading && user && (!user.firstName || user.firstName.trim() === '')) {
      router.replace('/profile');
    }
  }, [user, isLoading, router]);

  return (
    <>
      <RivalryIndex />
      <StatusBar style="light" />
    </>
  );
}
