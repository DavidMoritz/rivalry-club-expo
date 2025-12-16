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
import { bold, center, darkStyles, styles } from '../../utils/styles';
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
        <View style={loadingContainerStyle}>
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
        style={fullFlexStyle}
      >
        <ScrollView
          contentContainerStyle={scrollContentStyle}
          keyboardShouldPersistTaps="handled"
          ref={scrollViewRef}
          style={fullFlexStyle}
        >
          <TouchableOpacity activeOpacity={0.9} onPress={handleDevTap}>
            <Text style={[styles.title, titleMarginStyle]}>Profile</Text>
          </TouchableOpacity>

          {isNewUser && (
            <View style={welcomeBannerStyle}>
              <Text style={welcomeHeaderStyle}>Welcome! 👋</Text>
              <Text style={centeredWhiteTextStyle}>
                Please enter your first name to get started
              </Text>
            </View>
          )}

          {successMessage ? (
            <View style={successBannerStyle}>
              <Text style={centeredWhiteTextStyle}>{successMessage}</Text>
            </View>
          ) : null}

          {errorMessage ? (
            <View style={errorBannerStyle}>
              <Text style={centeredWhiteTextStyle}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={sectionStyle}>
            <Text style={[styles.text, sectionHeaderStyle]}>Personal Information</Text>

            <View style={fieldContainerStyle}>
              <Text style={[styles.text, fieldLabelStyle]}>First Name</Text>
              <TextInput
                autoCapitalize="words"
                onChangeText={setFirstName}
                placeholder="Enter first name"
                placeholderTextColor={colors.gray400}
                style={[styles.text, textInputStyle]}
                value={firstName}
              />
            </View>

            <View style={fieldContainerStyle}>
              <Text style={[styles.text, fieldLabelStyle]}>Last Name</Text>
              <TextInput
                autoCapitalize="words"
                onChangeText={setLastName}
                placeholder="Enter last name"
                placeholderTextColor={colors.gray400}
                style={[styles.text, textInputStyle]}
                value={lastName}
              />
            </View>

            <View style={fieldContainerStyle}>
              {user?.email.endsWith('@anonymous.local') ? (
                <>
                  <Text style={[styles.text, smallLabelStyle]}>Friend Code</Text>
                  <Text style={[styles.text, friendCodeStyle]}>
                    {user.email.replace('Player_', '').replace('@anonymous.local', '')}
                  </Text>
                  <Text style={[styles.text, helperTextStyle]}>
                    Friends can search for you using this code
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.text, smallLabelStyle]}>Email</Text>
                  <Text style={[styles.text, emailDisplayStyle]}>{user?.email}</Text>
                </>
              )}
            </View>

            <TouchableOpacity
              disabled={isUpdating}
              onPress={handleUpdateProfile}
              style={primaryButtonStyle}
            >
              <Text style={buttonTextStyle}>
                {isUpdating ? 'Updating...' : 'Update Profile'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={dividerSectionStyle}>
            <Text style={[styles.text, sectionHeaderStyle]}>Account Linking</Text>

            {user?.awsSub === 'anonymous' ? (
              <>
                <View style={anonymousInfoBannerStyle}>
                  <Text style={bannerHeaderStyle}>📱 Anonymous Account</Text>
                  <Text style={bannerSubtextStyle}>
                    Your data is saved locally. Link an account for recovery and multi-device sync.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setShowLinkAccountModal(true)}
                  style={linkExistingButtonStyle}
                >
                  <Text style={linkExistingButtonTextStyle}>Link Existing Account</Text>
                  <Text style={linkExistingSubtextStyle}>
                    Already have an account? Restore your data. This will remove all data for{' '}
                    {user?.email.split('@')[0] ?? 'this profile'}.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowCreateAccountModal(true)}
                  style={createAccountButtonStyle}
                >
                  <Text style={createAccountButtonTextStyle}>Create New Account</Text>
                  <Text style={createAccountSubtextStyle}>Link email for recovery</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={linkedAccountBannerStyle}>
                <Text style={bannerHeaderStyle}>✅ Linked to Account</Text>
                <Text style={linkedAccountSubtextStyle}>
                  Your data is backed up and synced across devices
                </Text>
              </View>
            )}
          </View>

          {user?.awsSub !== 'anonymous' && !viewChangePassword && (
            <View style={dividerSectionNoPaddingStyle}>
              <TouchableOpacity onPress={() => setViewChangePassword(true)} style={primaryButtonStyle}>
                <Text style={buttonTextStyle}>Change Password</Text>
              </TouchableOpacity>
            </View>
          )}
          {viewChangePassword && (
            <View style={dividerSectionNoPaddingStyle}>
              <Text style={[styles.text, sectionHeaderStyle]}>Change Password</Text>

              <View style={fieldContainerStyle}>
                <Text style={[styles.text, fieldLabelStyle]}>Current Password</Text>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor={colors.gray400}
                  secureTextEntry
                  style={[styles.text, textInputStyle]}
                  value={currentPassword}
                />
              </View>

              <View style={fieldContainerStyle}>
                <Text style={[styles.text, fieldLabelStyle]}>New Password</Text>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setNewPassword}
                  placeholder="Enter new password (min 8 characters)"
                  placeholderTextColor={colors.gray400}
                  secureTextEntry
                  style={[styles.text, textInputStyle]}
                  value={newPassword}
                />
              </View>

              <View style={fieldContainerStyle}>
                <Text style={[styles.text, fieldLabelStyle]}>Confirm New Password</Text>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter new password"
                  placeholderTextColor={colors.gray400}
                  secureTextEntry
                  style={[styles.text, textInputStyle]}
                  value={confirmPassword}
                />
              </View>

              <TouchableOpacity
                disabled={isChangingPassword}
                onPress={handleChangePassword}
                style={primaryButtonStyle}
              >
                <Text style={buttonTextStyle}>
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Account Deletion Section */}
          <View style={deleteSectionStyle}>
            <Text style={[styles.text, sectionHeaderWithSmallMarginStyle]}>Delete Account</Text>
            <Text style={[styles.text, deleteDescriptionStyle]}>
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
              style={deleteButtonStyle}
            >
              <Text style={buttonTextStyle}>Delete Account</Text>
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

// Layout styles
const fullFlexStyle = { flex: 1 };

const loadingContainerStyle = {
  flex: 1,
  alignItems: center,
  justifyContent: center
};

const scrollContentStyle = { padding: 24 };

const titleMarginStyle = { marginBottom: 24 };

const sectionStyle = { marginBottom: 32 };

const dividerSectionStyle = {
  borderTopWidth: 1,
  borderTopColor: colors.gray700,
  paddingTop: 32,
  marginBottom: 32
};

const dividerSectionNoPaddingStyle = {
  borderTopWidth: 1,
  borderTopColor: colors.gray700,
  paddingTop: 32
};

const deleteSectionStyle = {
  borderTopWidth: 1,
  borderTopColor: colors.gray700,
  paddingTop: 32,
  marginTop: 32
};

const fieldContainerStyle = { marginBottom: 16 };

// Text styles
const sectionHeaderStyle = {
  fontSize: 20,
  fontWeight: '600' as const,
  marginBottom: 16
};

const sectionHeaderWithSmallMarginStyle = {
  fontSize: 20,
  fontWeight: '600' as const,
  marginBottom: 8
};

const fieldLabelStyle = { marginBottom: 8 };

const centeredWhiteTextStyle = {
  color: colors.white,
  textAlign: center
};

const smallLabelStyle = {
  marginBottom: 4,
  fontSize: 12,
  color: colors.gray400
};

const friendCodeStyle = {
  fontSize: 18,
  color: colors.cyan400,
  fontWeight: '600' as const,
  fontFamily: 'monospace' as const
};

const emailDisplayStyle = {
  fontSize: 18,
  color: colors.white,
  fontWeight: '600' as const
};

const helperTextStyle = {
  marginTop: 4,
  fontSize: 11,
  color: colors.gray500,
  fontStyle: 'italic' as const
};

const deleteDescriptionStyle = {
  fontSize: 14,
  color: colors.gray400,
  marginBottom: 16,
  lineHeight: 20
};

// Input styles
const textInputStyle = {
  backgroundColor: colors.gray800,
  color: colors.white,
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.gray600
};

// Button styles
const primaryButtonStyle = {
  backgroundColor: colors.purple900,
  paddingHorizontal: 32,
  paddingVertical: 16,
  borderRadius: 25,
  borderWidth: 1,
  borderColor: colors.slate300,
  width: '100%' as const,
  alignItems: center,
  marginTop: 8
};

const buttonTextStyle = {
  color: colors.white,
  fontSize: 18,
  fontWeight: bold
};

const deleteButtonStyle = {
  ...primaryButtonStyle,
  backgroundColor: colors.red600,
  borderColor: colors.red900
};

// Banner styles (base)
const baseBannerStyle = {
  padding: 12,
  borderRadius: 8,
  marginBottom: 16
};

const welcomeBannerStyle = {
  ...baseBannerStyle,
  backgroundColor: colors.blue500,
  padding: 16
};

const successBannerStyle = {
  ...baseBannerStyle,
  backgroundColor: colors.green600
};

const errorBannerStyle = {
  ...baseBannerStyle,
  backgroundColor: colors.red600
};

const anonymousInfoBannerStyle = {
  ...baseBannerStyle,
  backgroundColor: colors.slate600
};

const linkedAccountBannerStyle = {
  ...baseBannerStyle,
  backgroundColor: colors.green600
};

// Banner text styles
const welcomeHeaderStyle = {
  color: colors.white,
  textAlign: center,
  fontWeight: '600' as const,
  marginBottom: 4
};

const bannerHeaderStyle = {
  color: colors.white,
  textAlign: center,
  fontWeight: '600' as const
};

const bannerSubtextStyle = {
  color: colors.slate300,
  textAlign: center,
  marginTop: 4,
  fontSize: 13
};

const linkedAccountSubtextStyle = {
  color: colors.green100,
  textAlign: center,
  marginTop: 4,
  fontSize: 13
};

// Account linking button styles
const linkExistingButtonStyle = {
  backgroundColor: colors.amber400,
  paddingHorizontal: 24,
  paddingVertical: 14,
  borderRadius: 8,
  alignItems: center,
  marginBottom: 12
};

const linkExistingButtonTextStyle = {
  color: colors.darkText,
  fontSize: 16,
  fontWeight: bold
};

const linkExistingSubtextStyle = {
  color: colors.darkText,
  fontSize: 12,
  marginTop: 2,
  textAlign: center
};

const createAccountButtonStyle = {
  backgroundColor: colors.purple900,
  paddingHorizontal: 24,
  paddingVertical: 14,
  borderRadius: 8,
  alignItems: center
};

const createAccountButtonTextStyle = {
  color: colors.white,
  fontSize: 16,
  fontWeight: bold
};

const createAccountSubtextStyle = {
  color: colors.slate300,
  fontSize: 12,
  marginTop: 2
};
