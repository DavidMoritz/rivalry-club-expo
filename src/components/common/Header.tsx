import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthUser } from '../../hooks/useAuthUser';
import { signOut } from '../../lib/amplify-auth';
import { useUnsavedChanges } from '../../providers/unsaved-changes';
import { colors } from '../../utils/colors';
import { absolute, center, row } from '../../utils/styles';

interface HeaderProps {
  title?: string;
  hide?: 'rivalries' | 'pending' | 'profile' | 'how-to-play';
}

export function Header({ title = 'Rivalry Club', hide }: HeaderProps) {
  const router = useRouter();
  const { user } = useAuthUser();
  const [menuVisible, setMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const { hasUnsavedChanges, setHasUnsavedChanges } = useUnsavedChanges();

  // Check if user is anonymous
  const isAnonymous = user?.awsSub === 'anonymous';

  // Helper function to check for unsaved changes before navigation
  const navigateWithUnsavedCheck = (navigationFn: () => void) => {
    if (hasUnsavedChanges) {
      Alert.alert('Unsaved Changes', 'You have unsaved changes. What would you like to do?', [
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setHasUnsavedChanges(false);
            setMenuVisible(false);
            navigationFn();
          }
        },
        { text: 'Stay', style: 'cancel' }
      ]);
    } else {
      setMenuVisible(false);
      navigationFn();
    }
  };

  const handleSignOut = async () => {
    navigateWithUnsavedCheck(async () => {
      try {
        // Sign out from Cognito
        await signOut();

        // Navigate to home screen
        router.replace('/auth');
      } catch (error) {
        console.error('Error signing out:', error);
      }
    });
  };

  const handleBack = () => {
    navigateWithUnsavedCheck(() => {
      router.back();
    });
  };

  const handleRivalries = () => {
    navigateWithUnsavedCheck(() => {
      router.push('/rivalries');
    });
  };

  const handleProfile = () => {
    navigateWithUnsavedCheck(() => {
      router.push('/profile');
    });
  };

  const handlePendingRivalries = () => {
    navigateWithUnsavedCheck(() => {
      router.push('/pending');
    });
  };

  const handleHowToPlay = () => {
    navigateWithUnsavedCheck(() => {
      router.push('/how-to-play');
    });
  };

  return (
    <>
      {/* Fixed Header Bar */}
      <View style={[headerContainerStyle, { paddingTop: insets.top + HEADER_VERTICAL_PADDING }]}>
        {/* Back Button */}
        <TouchableOpacity onPress={handleBack} style={buttonStyle}>
          <Text style={topIconStyle}>←</Text>
        </TouchableOpacity>

        {/* Title */}
        <View style={titleContainerStyle}>
          <Text style={titleTextStyle} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {/* Menu Button */}
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={buttonStyle}>
          <Text style={topIconStyle}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* Dropdown Menu Modal */}
      <Modal
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
        transparent
        visible={menuVisible}
      >
        <Pressable onPress={() => setMenuVisible(false)} style={modalBackdropStyle}>
          <View style={[menuContainerStyle, { top: insets.top + MENU_CONTAINER_TOP_OFFSET }]}>
            {hide !== 'rivalries' && (
              <>
                <TouchableOpacity onPress={handleRivalries} style={menuItemStyle}>
                  <Text style={menuItemIconStyle}>📋</Text>
                  <Text style={menuItemTextStyle}>Rivalries</Text>
                </TouchableOpacity>

                <View style={dividerStyle} />
              </>
            )}

            {hide !== 'pending' && (
              <>
                <TouchableOpacity onPress={handlePendingRivalries} style={menuItemStyle}>
                  <Text style={menuItemIconStyle}>🕐</Text>
                  <Text style={menuItemTextStyle}>Pending Rivalries</Text>
                </TouchableOpacity>

                <View style={dividerStyle} />
              </>
            )}

            {hide !== 'profile' && (
              <>
                <TouchableOpacity onPress={handleProfile} style={menuItemStyle}>
                  <Text style={menuItemIconStyle}>👤</Text>
                  <Text style={menuItemTextStyle}>Profile</Text>
                </TouchableOpacity>

                {hide !== 'how-to-play' && <View style={dividerStyle} />}
              </>
            )}

            {hide !== 'how-to-play' && (
              <>
                <TouchableOpacity onPress={handleHowToPlay} style={menuItemStyle}>
                  <Text style={menuItemIconStyle}>❓</Text>
                  <Text style={menuItemTextStyle}>How to Play</Text>
                </TouchableOpacity>
              </>
            )}

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

const BASE_HEADER_HEIGHT = 31;
const HEADER_VERTICAL_PADDING = 0;
const MENU_CONTAINER_TOP_OFFSET = 35;

// Export the full header height including safe area insets
export const HEADER_HEIGHT = BASE_HEADER_HEIGHT + 65;

const spaceBetween = 'space-between' as const;
const flexStart = 'flex-start' as const;

const headerContainerStyle = {
  position: absolute,
  top: 0,
  left: 0,
  right: 0,
  height: HEADER_HEIGHT,
  flexDirection: row,
  alignItems: center,
  justifyContent: spaceBetween,
  paddingHorizontal: 16,
  paddingBottom: HEADER_VERTICAL_PADDING,
  backgroundColor: colors.slate900,
  borderBottomWidth: 1,
  borderBottomColor: colors.slate700,
  zIndex: 100
};

const buttonStyle = {
  paddingVertical: 0,
  paddingHorizontal: 8,
  minWidth: 40,
  alignItems: flexStart
};

const topIconStyle = {
  fontSize: 24,
  color: colors.white
};

const titleContainerStyle = {
  flex: 1,
  alignItems: center,
  paddingHorizontal: 8
};

const fontWeight600 = '600' as const;

const titleTextStyle = {
  fontSize: 18,
  fontWeight: fontWeight600,
  color: colors.white
};

const modalBackdropStyle = {
  flex: 1,
  backgroundColor: colors.overlayLight
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
  backgroundColor: colors.slate600,
  marginVertical: 4
};

const menuItemTextStyle = {
  fontSize: 16,
  color: colors.white
};

const signOutTextStyle = {
  ...menuItemTextStyle,
  color: colors.red600
};

const menuItemIconStyle = {
  ...menuItemTextStyle,
  marginRight: 12
};

const signOutIconStyle = {
  ...signOutTextStyle,
  marginRight: 12
};
