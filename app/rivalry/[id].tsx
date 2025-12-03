import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';

import { darkStyles, styles } from '../../src/utils/styles';

import { ConnectedRivalryView } from '../../src/components/screens/ConnectedRivalryView';

export default function RivalryDetailRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rivalryId = params.id as string;

  // Create navigation object compatible with ConnectedRivalryView
  const navigation = {
    navigate: (screen: string) => {
      router.push(screen as any);
    },
    setOptions: (options: { title?: string; headerTitle?: string }) => {
      // This will be handled by Stack.Screen below
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.container, darkStyles.container]}>
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}
        >
          <Text style={[styles.text, { fontSize: 24, fontWeight: 'bold', marginBottom: 16 }]}>
            Current Rivalry
          </Text>
          <Text style={[styles.text, { color: '#999' }]}>
            This screen will be implemented to show the current rivalry.
          </Text>
        </View>
      </SafeAreaView>
      <StatusBar style="light" />
    </>
  );
}
