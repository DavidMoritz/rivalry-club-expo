import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';

import { HamburgerMenu } from '../src/components/common/HamburgerMenu';
import { RivalryIndex } from '../src/components/screens/RivalryIndex';
import { useAuthUser } from '../src/hooks/useAuthUser';

export default function RivalriesRoute() {
  const router = useRouter();
  const { user, isLoading } = useAuthUser();

  // Redirect to profile if user hasn't set their name
  useEffect(() => {
    if (!isLoading && user) {
      if (!user.firstName || user.firstName.trim() === '') {
        console.log('[RivalriesRoute] User has no name, redirecting to profile');
        router.replace('/profile');
      }
    }
  }, [user, isLoading, router]);

  return (
    <>
      <RivalryIndex />
      <HamburgerMenu />
      <StatusBar style="light" />
    </>
  );
}
