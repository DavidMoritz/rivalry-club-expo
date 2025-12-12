import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { signOut } from '../../lib/amplify-auth';
import { darkStyles } from '../../utils/styles';

export function HamburgerMenu() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();

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
        style={[hamburgerButtonStyle, { top: insets.top + 12 }]}
      >
        <Text style={hamburgerIconStyle}>☰</Text>
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={modalBackdropStyle} onPress={() => setMenuVisible(false)}>
          <View style={[menuContainerStyle, { top: insets.top + 64 }]}>
            <TouchableOpacity onPress={handleBack} style={menuItemStyle}>
              <Text style={menuIconStyle}>←</Text>
              <Text style={menuTextStyle}>Back</Text>
            </TouchableOpacity>

            <View style={dividerStyle} />

            <TouchableOpacity onPress={handleRivalries} style={menuItemStyle}>
              <Text style={menuIconStyle}>📋</Text>
              <Text style={menuTextStyle}>Rivalries</Text>
            </TouchableOpacity>

            <View style={dividerStyle} />

            <TouchableOpacity onPress={handlePendingRivalries} style={menuItemStyle}>
              <Text style={menuIconStyle}>🕐</Text>
              <Text style={menuTextStyle}>Pending Rivalries</Text>
            </TouchableOpacity>

            <View style={dividerStyle} />

            <TouchableOpacity onPress={handleProfile} style={menuItemStyle}>
              <Text style={menuIconStyle}>👤</Text>
              <Text style={menuTextStyle}>Profile</Text>
            </TouchableOpacity>

            <View style={dividerStyle} />

            <TouchableOpacity onPress={handleHowToPlay} style={menuItemStyle}>
              <Text style={menuIconStyle}>❓</Text>
              <Text style={menuTextStyle}>How to Play</Text>
            </TouchableOpacity>

            <View style={dividerStyle} />

            <TouchableOpacity onPress={handleSignOut} style={menuItemStyle}>
              <Text style={signOutIconStyle}>→</Text>
              <Text style={signOutTextStyle}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const center = 'center' as const;
const absolute = 'absolute' as const;
const row = 'row' as const;

const hamburgerButtonStyle = {
  position: absolute,
  right: 16,
  zIndex: 100,
  padding: 12,
  backgroundColor: '#334155',
  borderRadius: 8
};

const hamburgerIconStyle = {
  fontSize: 24,
  color: 'white'
};

const modalBackdropStyle = {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)'
};

const menuContainerStyle = {
  position: absolute,
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
};

const menuItemStyle = {
  paddingVertical: 12,
  paddingHorizontal: 16,
  flexDirection: row,
  alignItems: center
};

const dividerStyle = {
  height: 1,
  backgroundColor: '#475569',
  marginVertical: 4
};

const menuIconStyle = {
  fontSize: 16,
  color: 'white',
  marginRight: 12
};

const menuTextStyle = {
  fontSize: 16,
  color: 'white'
};

const signOutIconStyle = {
  fontSize: 16,
  color: '#ef4444',
  marginRight: 12
};

const signOutTextStyle = {
  fontSize: 16,
  color: '#ef4444'
};
