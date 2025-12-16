import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthUser } from '../../hooks/useAuthUser';
import { signOut } from '../../lib/amplify-auth';
import { colors } from '../../utils/colors';

export function HamburgerMenu() {
  const router = useRouter();
  const { user } = useAuthUser();
  const [menuVisible, setMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();

  // Check if user is anonymous
  const isAnonymous = user?.awsSub === 'anonymous';

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
        style={[
          hamburgerButtonStyle,
          { top: insets.top + MENU_BUTTON_TOP_OFFSET },
        ]}
      >
        <Text style={hamburgerIconStyle}>☰</Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
        transparent
        visible={menuVisible}
      >
        <Pressable
          onPress={() => setMenuVisible(false)}
          style={modalBackdropStyle}
        >
          <View
            style={[
              menuContainerStyle,
              { top: insets.top + MENU_CONTAINER_TOP_OFFSET },
            ]}
          >
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

            <TouchableOpacity
              onPress={handlePendingRivalries}
              style={menuItemStyle}
            >
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

            {!isAnonymous && (
              <>
                <View style={dividerStyle} />

                <TouchableOpacity onPress={handleSignOut} style={menuItemStyle}>
                  <Text style={signOutIconStyle}>→</Text>
                  <Text style={signOutTextStyle}>Sign Out</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const MENU_BUTTON_TOP_OFFSET = 12;
const MENU_CONTAINER_TOP_OFFSET = 64;

const center = 'center' as const;
const absolute = 'absolute' as const;
const row = 'row' as const;

const hamburgerButtonStyle = {
  position: absolute,
  right: 16,
  zIndex: 100,
  padding: 12,
  backgroundColor: colors.slate700,
  borderRadius: 8,
};

const hamburgerIconStyle = {
  fontSize: 24,
  color: colors.white,
};

const modalBackdropStyle = {
  flex: 1,
  backgroundColor: colors.overlayLight,
};

const menuContainerStyle = {
  position: absolute,
  right: 16,
  backgroundColor: colors.slate900,
  borderRadius: 8,
  paddingVertical: 8,
  minWidth: 200,
  shadowColor: colors.black,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 5,
};

const menuItemStyle = {
  paddingVertical: 12,
  paddingHorizontal: 16,
  flexDirection: row,
  alignItems: center,
};

const dividerStyle = {
  height: 1,
  backgroundColor: colors.slate600,
  marginVertical: 4,
};

const menuIconStyle = {
  fontSize: 16,
  color: colors.white,
  marginRight: 12,
};

const menuTextStyle = {
  fontSize: 16,
  color: colors.white,
};

const signOutIconStyle = {
  fontSize: 16,
  color: colors.red600,
  marginRight: 12,
};

const signOutTextStyle = {
  fontSize: 16,
  color: colors.red600,
};
