import { generateClient } from 'aws-amplify/data';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Schema } from '../../../amplify/data/resource';
import { useAuthUser } from '../../hooks/useAuthUser';
import { deleteUser, signOut, updatePassword } from '../../lib/amplify-auth';
import { clearStoredUuid } from '../../lib/user-identity';
import { colors } from '../../utils/colors';
import { darkStyles, styles } from '../../utils/styles';
import { CreateAccountModal } from './CreateAccountModal';
import { LinkAccountModal } from './LinkAccountModal';

// Constants for timeouts and validation
const REDIRECT_DELAY_MS = 1000;
const SUCCESS_MESSAGE_DELAY_MS = 1500;
const MESSAGE_CLEAR_DELAY_MS = 3000;
const MIN_PASSWORD_LENGTH = 8;
const DEV_TAP_THRESHOLD = 5;

// Password validation helper
const validatePasswordFields = (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): string | null => {
  if (!(currentPassword && newPassword && confirmPassword)) {
    return 'All password fields are required';
  }
  if (newPassword !== confirmPassword) {
    return 'New passwords do not match';
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return 'Password must be at least 8 characters';
  }
  return null;
};

// Password error message mapper
const getPasswordErrorMessage = (error: unknown): string => {
  const errorName = error instanceof Error && 'name' in error ? error.name : '';
  const defaultMessage = error instanceof Error ? error.message : 'Failed to change password';

  if (errorName === 'NotAuthorizedException') {
    return 'Current password is incorrect';
  }
  if (errorName === 'InvalidPasswordException') {
    return 'Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols';
  }
  return defaultMessage;
};

// Extract error message from unknown error
const getUpdateErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Failed to update profile';

// Check if user is new (no first name set)
const isUserNew = (userFirstName: string | undefined | null): boolean =>
  !userFirstName || userFirstName.trim() === '';

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

    // Check if this is a new user before the update
    const wasNewUser = isUserNew(user.firstName);

    try {
      const client = generateClient<Schema>();
      const result = await client.models.User.update({
        id: user.id,
        firstName: firstName.trim(),
        lastName: lastName.trim() || ' '
      });

      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message);
      }

      // DB is the single source of truth for firstName (no local storage)
      setSuccessMessage('Profile updated successfully');

      // Handle post-update navigation/cleanup
      const delay = wasNewUser ? REDIRECT_DELAY_MS : MESSAGE_CLEAR_DELAY_MS;
      const action = wasNewUser ? () => router.replace('/rivalries') : () => setSuccessMessage('');
      setTimeout(action, delay);
    } catch (error) {
      setErrorMessage(getUpdateErrorMessage(error));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    const validationError = validatePasswordFields(currentPassword, newPassword, confirmPassword);
    if (validationError) {
      setErrorMessage(validationError);
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

      setTimeout(() => setSuccessMessage(''), MESSAGE_CLEAR_DELAY_MS);
    } catch (error: unknown) {
      console.error('[Profile] Password change error:', error);
      setErrorMessage(getPasswordErrorMessage(error));

      // Scroll to top to show the error message
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDevTap = () => {
    const newCount = devTapCount + 1;
    setDevTapCount(newCount);

    if (newCount >= DEV_TAP_THRESHOLD) {
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
                await clearStoredUuid();
                await signOut();
                setDevTapCount(0);
                // Navigate to home to restart flow
                router.replace('/');
              } catch (error) {
                console.error('[Profile] Error clearing UUID:', error);
                Alert.alert('Error', 'Failed to reset UUID');
              }
            }
          }
        ]
      );
    }
  };

  if (userLoading) {
    return (
      <SafeAreaView style={[styles.container, darkStyles.container]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={styles.text}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Check if this is a new user
  const isNewUser = isUserNew(user?.firstName);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.container, darkStyles.container]}>
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
                marginBottom: 16
              }}
            >
              <Text
                style={{
                  color: colors.white,
                  textAlign: 'center',
                  fontWeight: '600',
                  marginBottom: 4
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
                marginBottom: 16
              }}
            >
              <Text style={{ color: colors.white, textAlign: 'center' }}>{successMessage}</Text>
            </View>
          ) : null}

          {errorMessage ? (
            <View
              style={{
                backgroundColor: colors.red600,
                padding: 12,
                borderRadius: 8,
                marginBottom: 16
              }}
            >
              <Text style={{ color: colors.white, textAlign: 'center' }}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={{ marginBottom: 32 }}>
            <Text style={[styles.text, { fontSize: 20, fontWeight: '600', marginBottom: 16 }]}>
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
                    borderColor: colors.gray600
                  }
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
                    borderColor: colors.gray600
                  }
                ]}
                value={lastName}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              {user?.email.endsWith('@anonymous.local') ? (
                <>
                  <Text
                    style={[styles.text, { marginBottom: 4, fontSize: 12, color: colors.gray400 }]}
                  >
                    Friend Code
                  </Text>
                  <Text
                    style={[
                      styles.text,
                      {
                        fontSize: 18,
                        color: colors.cyan400,
                        fontWeight: '600',
                        fontFamily: 'monospace'
                      }
                    ]}
                  >
                    {user.email.replace('Player_', '').replace('@anonymous.local', '')}
                  </Text>
                  <Text
                    style={[
                      styles.text,
                      { marginTop: 4, fontSize: 11, color: colors.gray500, fontStyle: 'italic' }
                    ]}
                  >
                    Friends can search for you using this code
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    style={[styles.text, { marginBottom: 4, fontSize: 12, color: colors.gray400 }]}
                  >
                    Email
                  </Text>
                  <Text
                    style={[
                      styles.text,
                      {
                        fontSize: 18,
                        color: colors.white,
                        fontWeight: '600'
                      }
                    ]}
                  >
                    {user?.email}
                  </Text>
                </>
              )}
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
                marginTop: 8
              }}
            >
              <Text
                style={{
                  color: colors.white,
                  fontSize: 18,
                  fontWeight: 'bold'
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
              marginBottom: 32
            }}
          >
            <Text style={[styles.text, { fontSize: 20, fontWeight: '600', marginBottom: 16 }]}>
              Account Linking
            </Text>

            {user?.awsSub === 'anonymous' ? (
              <>
                <View
                  style={{
                    backgroundColor: colors.slate600,
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 16
                  }}
                >
                  <Text
                    style={{
                      color: colors.white,
                      textAlign: 'center',
                      fontWeight: '600'
                    }}
                  >
                    📱 Anonymous Account
                  </Text>
                  <Text
                    style={{
                      color: colors.slate300,
                      textAlign: 'center',
                      marginTop: 4,
                      fontSize: 13
                    }}
                  >
                    Your data is saved locally. Link an account for recovery and multi-device sync.
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
                    marginBottom: 12
                  }}
                >
                  <Text
                    style={{
                      color: colors.darkText,
                      fontSize: 16,
                      fontWeight: 'bold'
                    }}
                  >
                    Link Existing Account
                  </Text>
                  <Text
                    style={{
                      color: colors.darkText,
                      fontSize: 12,
                      marginTop: 2,
                      textAlign: 'center'
                    }}
                  >
                    Already have an account? Restore your data. This will remove all data for{' '}
                    {user?.email.split('@')[0] ?? 'this profile'}.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowCreateAccountModal(true)}
                  style={{
                    backgroundColor: colors.purple900,
                    paddingHorizontal: 24,
                    paddingVertical: 14,
                    borderRadius: 8,
                    alignItems: 'center'
                  }}
                >
                  <Text
                    style={{
                      color: colors.white,
                      fontSize: 16,
                      fontWeight: 'bold'
                    }}
                  >
                    Create New Account
                  </Text>
                  <Text
                    style={{
                      color: colors.slate300,
                      fontSize: 12,
                      marginTop: 2
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
                  marginBottom: 16
                }}
              >
                <Text
                  style={{
                    color: colors.white,
                    textAlign: 'center',
                    fontWeight: '600'
                  }}
                >
                  ✅ Linked to Account
                </Text>
                <Text
                  style={{
                    color: colors.green100,
                    textAlign: 'center',
                    marginTop: 4,
                    fontSize: 13
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
                paddingTop: 32
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
                  marginTop: 8
                }}
              >
                <Text
                  style={{
                    color: colors.white,
                    fontSize: 18,
                    fontWeight: 'bold'
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
                paddingTop: 32
              }}
            >
              <Text style={[styles.text, { fontSize: 20, fontWeight: '600', marginBottom: 16 }]}>
                Change Password
              </Text>

              <View style={{ marginBottom: 16 }}>
                <Text style={[styles.text, { marginBottom: 8 }]}>Current Password</Text>
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
                      borderColor: colors.gray600
                    }
                  ]}
                  value={currentPassword}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={[styles.text, { marginBottom: 8 }]}>New Password</Text>
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
                      borderColor: colors.gray600
                    }
                  ]}
                  value={newPassword}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={[styles.text, { marginBottom: 8 }]}>Confirm New Password</Text>
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
                      borderColor: colors.gray600
                    }
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
                  marginTop: 8
                }}
              >
                <Text
                  style={{
                    color: colors.white,
                    fontSize: 18,
                    fontWeight: 'bold'
                  }}
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Account Deletion Section */}
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: colors.gray700,
              paddingTop: 32,
              marginTop: 32
            }}
          >
            <Text style={[styles.text, { fontSize: 20, fontWeight: '600', marginBottom: 8 }]}>
              Delete Account
            </Text>
            <Text
              style={[
                styles.text,
                { fontSize: 14, color: colors.gray400, marginBottom: 16, lineHeight: 20 }
              ]}
            >
              {user?.awsSub === 'anonymous'
                ? 'Deleting your account will make all your current rivalries inaccessible. This action cannot be undone.'
                : 'Permanently delete your account and all associated data. Once deleted, you will not be able to recover your rivalries. This action cannot be undone.'}
            </Text>

            <TouchableOpacity
              onPress={() => {
                const isAnonymous = user?.awsSub === 'anonymous';

                const warningMessage = isAnonymous
                  ? 'All your current rivalries will no longer be accessible.\n\nThis action cannot be undone.'
                  : 'Once your account is deleted, you will no longer be able to recover your rivalries.\n\nThis will permanently delete your account from our system.\n\nThis action cannot be undone.';

                Alert.alert('Delete Account', warningMessage, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete Account',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        if (!user) {
                          throw new Error('No user found');
                        }

                        // Step 1: Update database - set email to "anonymous" and role to 5 (deleted)
                        const client = generateClient<Schema>();
                        const updateResult = await client.models.User.update({
                          id: user.id,
                          email: 'anonymous',
                          role: 5
                        });

                        if (updateResult.errors && updateResult.errors.length > 0) {
                          throw new Error(updateResult.errors[0].message);
                        }

                        // Step 2: Delete from Cognito if not anonymous
                        if (!isAnonymous) {
                          await deleteUser();
                        }

                        // Step 3: Clear UUID and sign out
                        await clearStoredUuid();
                        await signOut();

                        // Navigate to home to restart flow
                        router.replace('/');
                      } catch (error) {
                        console.error('[Profile] Error deleting account:', error);
                        Alert.alert('Error', 'Failed to delete account. Please try again.');
                      }
                    }
                  }
                ]);
              }}
              style={{
                backgroundColor: colors.red600,
                paddingHorizontal: 32,
                paddingVertical: 16,
                borderRadius: 25,
                borderWidth: 1,
                borderColor: colors.red900,
                width: '100%',
                alignItems: 'center'
              }}
            >
              <Text
                style={{
                  color: colors.white,
                  fontSize: 18,
                  fontWeight: 'bold'
                }}
              >
                Delete Account
              </Text>
            </TouchableOpacity>
          </View>
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
              }, SUCCESS_MESSAGE_DELAY_MS);
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
              }, SUCCESS_MESSAGE_DELAY_MS);
            }}
            visible={showCreateAccountModal}
          />
        </>
      )}
    </SafeAreaView>
  );
}
