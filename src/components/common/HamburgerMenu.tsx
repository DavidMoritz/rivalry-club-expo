import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

import { signOut } from '../../lib/amplify-auth';
import { darkStyles } from '../../utils/styles';

export function HamburgerMenu() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleSignOut = async () => {
    try {
      // Sign out from Cognito
      await signOut();

      setMenuVisible(false);
      // Navigate to home screen
      router.replace('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleBack = () => {
    setMenuVisible(false);
    router.back();
  };

  const handleRivalries = () => {
    setMenuVisible(false);
    router.push('/rivalries');
  };

  const handleProfile = () => {
    setMenuVisible(false);
    router.push('/profile');
  };

  const handlePendingRivalries = () => {
    setMenuVisible(false);
    router.push('/pending');
  };

  const handleHowToPlay = () => {
    setMenuVisible(false);
    router.push('/how-to-play');
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setMenuVisible(true)}
        style={{
          position: 'absolute',
          top: 60,
          right: 16,
          zIndex: 100,
          padding: 12,
          backgroundColor: '#334155',
          borderRadius: 8
        }}
      >
        <Text style={{ fontSize: 24, color: 'white' }}>☰</Text>
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={{
              position: 'absolute',
              top: 104,
              right: 16,
              backgroundColor: '#1e293b',
              borderRadius: 8,
              paddingVertical: 8,
              minWidth: 200,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5
            }}
          >
            <TouchableOpacity
              onPress={handleBack}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <Text style={{ fontSize: 16, color: 'white', marginRight: 12 }}>←</Text>
              <Text style={[darkStyles.text, { fontSize: 16 }]}>Back</Text>
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: '#475569', marginVertical: 4 }} />

            <TouchableOpacity
              onPress={handleRivalries}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <Text style={{ fontSize: 16, color: 'white', marginRight: 12 }}>📋</Text>
              <Text style={[darkStyles.text, { fontSize: 16 }]}>Rivalries</Text>
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: '#475569', marginVertical: 4 }} />

            <TouchableOpacity
              onPress={handlePendingRivalries}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <Text style={{ fontSize: 16, color: 'white', marginRight: 12 }}>🕐</Text>
              <Text style={[darkStyles.text, { fontSize: 16 }]}>Pending Rivalries</Text>
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: '#475569', marginVertical: 4 }} />

            <TouchableOpacity
              onPress={handleProfile}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <Text style={{ fontSize: 16, color: 'white', marginRight: 12 }}>👤</Text>
              <Text style={[darkStyles.text, { fontSize: 16 }]}>Profile</Text>
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: '#475569', marginVertical: 4 }} />

            <TouchableOpacity
              onPress={handleHowToPlay}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <Text style={{ fontSize: 16, color: 'white', marginRight: 12 }}>❓</Text>
              <Text style={[darkStyles.text, { fontSize: 16 }]}>How to Play</Text>
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: '#475569', marginVertical: 4 }} />

            <TouchableOpacity
              onPress={handleSignOut}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <Text style={{ fontSize: 16, color: '#ef4444', marginRight: 12 }}>→</Text>
              <Text style={[darkStyles.text, { fontSize: 16, color: '#ef4444' }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
