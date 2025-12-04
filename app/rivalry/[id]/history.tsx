import { useLocalSearchParams, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';

import { darkStyles, styles } from '../../../src/utils/styles';

export default function HistoryRoute() {
  const params = useLocalSearchParams();
  const rivalryId = params.id as string;

  return (
    <>
      <Stack.Screen options={{ title: 'Contest History' }} />
      <SafeAreaView style={[styles.container, darkStyles.container]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}>
          <Text style={[styles.text, { fontSize: 24, fontWeight: 'bold', marginBottom: 16 }]}>
            Contest History
          </Text>
          <Text style={[styles.text, { color: '#999' }]}>
            Rivalry ID: {rivalryId}
          </Text>
          <Text style={[styles.text, { color: '#999', marginTop: 8 }]}>
            This screen will display past contests.
          </Text>
        </View>
      </SafeAreaView>
      <StatusBar style="light" />
    </>
  );
}
