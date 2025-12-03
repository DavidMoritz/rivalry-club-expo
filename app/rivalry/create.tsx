import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';

import { darkStyles, styles } from '../../src/utils/styles';

export default function CreateRivalryRoute() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Create Rivalry' }} />
      <SafeAreaView style={[styles.container, darkStyles.container]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}>
          <Text style={[styles.text, { fontSize: 24, fontWeight: 'bold', marginBottom: 16 }]}>
            Create New Rivalry
          </Text>
          <Text style={[styles.text, { color: '#999' }]}>
            This screen will be implemented to create a new rivalry.
          </Text>
        </View>
      </SafeAreaView>
      <StatusBar style="light" />
    </>
  );
}
