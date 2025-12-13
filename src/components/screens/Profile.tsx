import { generateClient } from 'aws-amplify/data';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Schema } from '../../../amplify/data/resource';
import { useAuthUser } from '../../hooks/useAuthUser';
import { signOut, updatePassword } from '../../lib/amplify-auth';
import { clearStoredUuid, storeFirstName } from '../../lib/user-identity';
import { colors } from '../../utils/colors';
import { darkStyles, styles } from '../../utils/styles';
import { CreateAccountModal } from './CreateAccountModal';
import { LinkAccountModal } from './LinkAccountModal';

export function Profile() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useAuthUser();
  const scrollViewRef = useRef<ScrollView>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [viewChangePassword, setViewChangePassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showLinkAccountModal, setShowLinkAccountModal] = useState(false);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [devTapCount, setDevTapCount] = useState(0);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;

    if (!firstName.trim()) {
      setErrorMessage('First name is required');

      return;
    }

    setIsUpdating(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const client = generateClient<Schema>();

      // Check if this is a new user (no previous first name)
      const isNewUser = !user.firstName || user.firstName.trim() === '';

      const result = await client.models.User.update({
        id: user.id,
        firstName: firstName.trim(),
        lastName: lastName.trim() || ' ',
      });

      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message);
      }

      // Store firstName locally so user never sees "Player_${shortId}" again
      await storeFirstName(firstName.trim());

      setSuccessMessage('Profile updated successfully');

      // If this was a new user completing their profile, redirect to rivalries
      if (isNewUser) {
        setTimeout(() => {
          router.replace('/rivalries');
        }, 1000);
      } else {
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to update profile'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!(currentPassword && newPassword && confirmPassword)) {
      setErrorMessage('All password fields are required');

      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match');

      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters');

      return;
    }

    setIsChangingPassword(true);

    try {
      await updatePassword(currentPassword, newPassword);

      setSuccessMessage('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Scroll to top to show the success message
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('[Profile] Password change error:', error);

      if (error.name === 'NotAuthorizedException') {
        setErrorMessage('Current password is incorrect');
      } else if (error.name === 'InvalidPasswordException') {
        setErrorMessage(
          'Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols'
        );
      } else {
        setErrorMessage(error?.message || 'Failed to change password');
      }

      // Scroll to top to show the error message
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDevTap = () => {
    const newCount = devTapCount + 1;
    setDevTapCount(newCount);

    if (newCount >= 5) {
      Alert.alert(
        '🛠️ Developer Tools',
        'Reset UUID and test as new user?\n\nThis will:\n• Clear UUID from Keychain\n• Sign out of Cognito\n• Restart the app\n\nYou will appear as a brand new user.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setDevTapCount(0) },
          {
            text: 'Reset',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log(
                  '[Profile] 🛠️ DEV MODE: Clearing UUID and signing out...'
                );
                await clearStoredUuid();
                await signOut();
                console.log('[Profile] ✅ UUID cleared, signed out');
                setDevTapCount(0);
                // Navigate to home to restart flow
                router.replace('/');
              } catch (error) {
                console.error('[Profile] Error clearing UUID:', error);
                Alert.alert('Error', 'Failed to reset UUID');
              }
            },
          },
        ]
      );
    }
  };

  if (userLoading) {
    return (
      <SafeAreaView style={[styles.container, darkStyles.container]}>
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={styles.text}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Check if this is a new user
  const isNewUser = !user?.firstName || user.firstName.trim() === '';

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.container, darkStyles.container]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ padding: 24 }}
          keyboardShouldPersistTaps="handled"
          ref={scrollViewRef}
          style={{ flex: 1 }}
        >
          <TouchableOpacity activeOpacity={0.9} onPress={handleDevTap}>
            <Text style={[styles.title, { marginBottom: 24 }]}>Profile</Text>
          </TouchableOpacity>

          {isNewUser && (
            <View
              style={{
                backgroundColor: colors.blue500,
                padding: 16,
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  color: colors.white,
                  textAlign: 'center',
                  fontWeight: '600',
                  marginBottom: 4,
                }}
              >
                Welcome! 👋
              </Text>
              <Text style={{ color: colors.white, textAlign: 'center' }}>
                Please enter your first name to get started
              </Text>
            </View>
          )}

          {successMessage ? (
            <View
              style={{
                backgroundColor: colors.green600,
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <Text style={{ color: colors.white, textAlign: 'center' }}>
                {successMessage}
              </Text>
            </View>
          ) : null}

          {errorMessage ? (
            <View
              style={{
                backgroundColor: colors.red600,
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <Text style={{ color: colors.white, textAlign: 'center' }}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          <View style={{ marginBottom: 32 }}>
            <Text
              style={[
                styles.text,
                { fontSize: 20, fontWeight: '600', marginBottom: 16 },
              ]}
            >
              Personal Information
            </Text>

            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.text, { marginBottom: 8 }]}>First Name</Text>
              <TextInput
                autoCapitalize="words"
                onChangeText={setFirstName}
                placeholder="Enter first name"
                placeholderTextColor={colors.gray400}
                style={[
                  styles.text,
                  {
                    backgroundColor: colors.gray800,
                    color: colors.white,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.gray600,
                  },
                ]}
                value={firstName}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.text, { marginBottom: 8 }]}>Last Name</Text>
              <TextInput
                autoCapitalize="words"
                onChangeText={setLastName}
                placeholder="Enter last name"
                placeholderTextColor={colors.gray400}
                style={[
                  styles.text,
                  {
                    backgroundColor: colors.gray800,
                    color: colors.white,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.gray600,
                  },
                ]}
                value={lastName}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text
                style={[
                  styles.text,
                  { marginBottom: 8, color: colors.gray300 },
                ]}
              >
                Email
              </Text>
              <Text
                style={[
                  styles.text,
                  {
                    backgroundColor: colors.slate800,
                    color: colors.white,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.gray700,
                  },
                ]}
              >
                {user?.email}
              </Text>
            </View>

            <TouchableOpacity
              disabled={isUpdating}
              onPress={handleUpdateProfile}
              style={{
                backgroundColor: colors.purple900,
                paddingHorizontal: 32,
                paddingVertical: 16,
                borderRadius: 25,
                borderWidth: 1,
                borderColor: colors.slate300,
                width: '100%',
                alignItems: 'center',
                marginTop: 8,
              }}
            >
              <Text
                style={{
                  color: colors.white,
                  fontSize: 18,
                  fontWeight: 'bold',
                }}
              >
                {isUpdating ? 'Updating...' : 'Update Profile'}
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: colors.gray700,
              paddingTop: 32,
              marginBottom: 32,
            }}
          >
            <Text
              style={[
                styles.text,
                { fontSize: 20, fontWeight: '600', marginBottom: 16 },
              ]}
            >
              Account Linking
            </Text>

            {user?.awsSub === 'anonymous' ? (
              <>
                <View
                  style={{
                    backgroundColor: colors.slate600,
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 16,
                  }}
                >
                  <Text
                    style={{
                      color: colors.white,
                      textAlign: 'center',
                      fontWeight: '600',
                    }}
                  >
                    📱 Anonymous Account
                  </Text>
                  <Text
                    style={{
                      color: colors.slate300,
                      textAlign: 'center',
                      marginTop: 4,
                      fontSize: 13,
                    }}
                  >
                    Your data is saved locally. Link an account for recovery and
                    multi-device sync.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setShowLinkAccountModal(true)}
                  style={{
                    backgroundColor: colors.amber400,
                    paddingHorizontal: 24,
                    paddingVertical: 14,
                    borderRadius: 8,
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      color: colors.darkText,
                      fontSize: 16,
                      fontWeight: 'bold',
                    }}
                  >
                    Link Existing Account
                  </Text>
                  <Text
                    style={{
                      color: colors.darkText,
                      fontSize: 12,
                      marginTop: 2,
                      textAlign: 'center',
                    }}
                  >
                    Already have an account? Restore your data. This will remove
                    all data for {user?.email.split('@')[0] ?? 'this profile'}.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowCreateAccountModal(true)}
                  style={{
                    backgroundColor: colors.purple900,
                    paddingHorizontal: 24,
                    paddingVertical: 14,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: colors.white,
                      fontSize: 16,
                      fontWeight: 'bold',
                    }}
                  >
                    Create New Account
                  </Text>
                  <Text
                    style={{
                      color: colors.slate300,
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    Link email for recovery
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View
                style={{
                  backgroundColor: colors.green600,
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    color: colors.white,
                    textAlign: 'center',
                    fontWeight: '600',
                  }}
                >
                  ✅ Linked to Account
                </Text>
                <Text
                  style={{
                    color: colors.green100,
                    textAlign: 'center',
                    marginTop: 4,
                    fontSize: 13,
                  }}
                >
                  Your data is backed up and synced across devices
                </Text>
              </View>
            )}
          </View>

          {user?.awsSub !== 'anonymous' && !viewChangePassword && (
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: colors.gray700,
                paddingTop: 32,
              }}
            >
              <TouchableOpacity
                onPress={() => setViewChangePassword(true)}
                style={{
                  backgroundColor: colors.purple900,
                  paddingHorizontal: 32,
                  paddingVertical: 16,
                  borderRadius: 25,
                  borderWidth: 1,
                  borderColor: colors.slate300,
                  width: '100%',
                  alignItems: 'center',
                  marginTop: 8,
                }}
              >
                <Text
                  style={{
                    color: colors.white,
                    fontSize: 18,
                    fontWeight: 'bold',
                  }}
                >
                  Change Password
                </Text>
              </TouchableOpacity>
            </View>
          )}
          {viewChangePassword && (
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: colors.gray700,
                paddingTop: 32,
              }}
            >
              <Text
                style={[
                  styles.text,
                  { fontSize: 20, fontWeight: '600', marginBottom: 16 },
                ]}
              >
                Change Password
              </Text>

              <View style={{ marginBottom: 16 }}>
                <Text style={[styles.text, { marginBottom: 8 }]}>
                  Current Password
                </Text>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor={colors.gray400}
                  secureTextEntry
                  style={[
                    styles.text,
                    {
                      backgroundColor: colors.gray800,
                      color: colors.white,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.gray600,
                    },
                  ]}
                  value={currentPassword}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={[styles.text, { marginBottom: 8 }]}>
                  New Password
                </Text>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setNewPassword}
                  placeholder="Enter new password (min 8 characters)"
                  placeholderTextColor={colors.gray400}
                  secureTextEntry
                  style={[
                    styles.text,
                    {
                      backgroundColor: colors.gray800,
                      color: colors.white,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.gray600,
                    },
                  ]}
                  value={newPassword}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={[styles.text, { marginBottom: 8 }]}>
                  Confirm New Password
                </Text>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter new password"
                  placeholderTextColor={colors.gray400}
                  secureTextEntry
                  style={[
                    styles.text,
                    {
                      backgroundColor: colors.gray800,
                      color: colors.white,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.gray600,
                    },
                  ]}
                  value={confirmPassword}
                />
              </View>

              <TouchableOpacity
                disabled={isChangingPassword}
                onPress={handleChangePassword}
                style={{
                  backgroundColor: colors.purple900,
                  paddingHorizontal: 32,
                  paddingVertical: 16,
                  borderRadius: 25,
                  borderWidth: 1,
                  borderColor: colors.slate300,
                  width: '100%',
                  alignItems: 'center',
                  marginTop: 8,
                }}
              >
                <Text
                  style={{
                    color: colors.white,
                    fontSize: 18,
                    fontWeight: 'bold',
                  }}
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Account Linking Modals */}
      {user && (
        <>
          <LinkAccountModal
            currentUserId={user.id}
            onClose={() => setShowLinkAccountModal(false)}
            onSuccess={() => {
              setShowLinkAccountModal(false);
              setSuccessMessage('Account linked successfully!');
              // The app will reload with the linked account
              setTimeout(() => {
                router.replace('/rivalries');
              }, 1500);
            }}
            visible={showLinkAccountModal}
          />

          <CreateAccountModal
            currentUserId={user.id}
            onClose={() => setShowCreateAccountModal(false)}
            onSuccess={() => {
              setShowCreateAccountModal(false);
              setSuccessMessage('Account created successfully!');
              // The user is now linked to Cognito
              setTimeout(() => {
                router.replace('/rivalries');
              }, 1500);
            }}
            visible={showCreateAccountModal}
          />
        </>
      )}
    </SafeAreaView>
  );
}
