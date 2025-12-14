import { generateClient } from 'aws-amplify/data';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Schema } from '../../../amplify/data/resource';
import { getCurrentUser, signIn } from '../../lib/amplify-auth';
import { storeFirstName, updateStoredUuid } from '../../lib/user-identity';
import { colors } from '../../utils/colors';
import { darkStyles, styles } from '../../utils/styles';

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const errorName = (err as { name?: string }).name;
    if (errorName === 'NotAuthorizedException') {
      return 'Incorrect email or password';
    }
    if (errorName === 'UserNotFoundException') {
      return 'User not found';
    }
    if (errorName === 'UserNotConfirmedException') {
      return 'Please verify your email before signing in';
    }
    return err.message || 'Failed to link account. Please try again.';
  }
  return 'Failed to link account. Please try again.';
}

interface LinkAccountModalProps {
  visible: boolean;
  currentUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function LinkAccountModal({
  visible,
  currentUserId,
  onClose,
  onSuccess,
}: LinkAccountModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLinkAccount() {
    setError(null);
    setLoading(true);

    try {
      // 1. Sign in with Cognito
      await signIn(email.trim(), password.trim());

      // 2. Get Cognito user info
      const cognitoUser = await getCurrentUser();
      const cognitoAwsSub = cognitoUser.userId;

      const client = generateClient<Schema>();

      // 3. Find existing user by Cognito awsSub
      const listResult = await client.models.User.list({
        filter: {
          awsSub: {
            eq: cognitoAwsSub,
          },
        },
      });

      const existingCognitoUsers = listResult.data;

      if (existingCognitoUsers && existingCognitoUsers.length > 0) {
        // 4. Found existing Cognito user - delete the anonymous user and switch to existing
        const existingUser = existingCognitoUsers[0];

        // Delete the anonymous user
        await client.models.User.delete({ id: currentUserId });

        // Update stored UUID to the existing user's ID
        await updateStoredUuid(existingUser.id);

        // Store the existing user's firstName locally so they never see "Player_${shortId}" again
        if (existingUser.firstName && existingUser.firstName.trim() !== '') {
          await storeFirstName(existingUser.firstName.trim());
          console.log(
            '[LinkAccountModal] Stored existing user firstName:',
            existingUser.firstName
          );
        }

        // Success! The app will reload with the existing user
        onSuccess();
      } else {
        // 5. No existing user found - this Cognito account hasn't been used in the app before
        // Update the current anonymous user to link with Cognito
        await client.models.User.update({
          id: currentUserId,
          awsSub: cognitoAwsSub,
          email: email.trim(),
          role: 1, // Regular user role
        });

        // Success! User is now linked
        onSuccess();
      }
    } catch (err: unknown) {
      console.error('[LinkAccountModal] Error:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      visible={visible}
    >
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.container, darkStyles.container]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, paddingHorizontal: 24 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.gray750,
              }}
            >
              <Text style={[styles.text, { fontSize: 24, fontWeight: 'bold' }]}>
                Link Existing Account
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text
                  style={[
                    styles.text,
                    { fontSize: 16, color: colors.slate500 },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: 'center',
                paddingBottom: 40,
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
            >
              <Text
                style={[
                  styles.text,
                  {
                    marginBottom: 24,
                    textAlign: 'center',
                    color: colors.gray300,
                  },
                ]}
              >
                Sign in with your existing account to restore your data and
                rivalries
              </Text>

              <View style={{ marginBottom: 20 }}>
                <Text
                  style={[
                    styles.text,
                    { marginBottom: 8, fontSize: 16, fontWeight: '500' },
                  ]}
                >
                  Email
                </Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.gray200}
                  style={[
                    styles.text,
                    {
                      width: '100%',
                      borderRadius: 8,
                      fontSize: 16,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      backgroundColor: colors.gray800,
                      borderWidth: 2,
                      borderColor: colors.gray600,
                    },
                  ]}
                  value={email}
                />
              </View>

              <View style={{ marginBottom: 20 }}>
                <Text
                  style={[
                    styles.text,
                    { marginBottom: 8, fontSize: 16, fontWeight: '500' },
                  ]}
                >
                  Password
                </Text>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.gray200}
                  secureTextEntry
                  style={[
                    styles.text,
                    {
                      width: '100%',
                      borderRadius: 8,
                      fontSize: 16,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      backgroundColor: colors.gray800,
                      borderWidth: 2,
                      borderColor: colors.gray600,
                    },
                  ]}
                  value={password}
                />
              </View>

              {error && (
                <Text
                  style={[
                    styles.text,
                    {
                      marginBottom: 16,
                      textAlign: 'center',
                      color: colors.red400,
                    },
                  ]}
                >
                  {error}
                </Text>
              )}

              <TouchableOpacity
                disabled={loading || !email || !password}
                onPress={handleLinkAccount}
                style={{
                  backgroundColor: colors.amber400,
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
                {loading ? (
                  <ActivityIndicator color={colors.darkText} />
                ) : (
                  <Text
                    style={{
                      color: colors.darkText,
                      fontSize: 18,
                      fontWeight: 'bold',
                    }}
                  >
                    Link Account
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
