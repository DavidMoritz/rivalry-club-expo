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
import { updateStoredUuid } from '../../lib/user-identity';
import { colors } from '../../utils/colors';
import { center, darkStyles, styles } from '../../utils/styles';

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const errorName = (err as { name?: string }).name;
    if (errorName === 'NotAuthorizedException')
      return 'Incorrect email or password';
    if (errorName === 'UserNotFoundException') return 'User not found';
    if (errorName === 'UserNotConfirmedException')
      return 'Please verify your email before signing in';
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

      if (existingCognitoUsers?.length > 0) {
        // 4. Found existing Cognito user - delete the anonymous user and switch to existing
        const existingUser = existingCognitoUsers[0];

        // Delete the anonymous user
        await client.models.User.delete({ id: currentUserId });

        // Update stored UUID to the existing user's ID (app will reload with existing user)
        await updateStoredUuid(existingUser.id);

        // Success! The app will reload with the existing user
        // DB is the single source of truth for their name
        onSuccess();
      } else {
        // 5. No existing user found - this Cognito account hasn't been used in the app before
        // Update the current anonymous user to link with Cognito
        await client.models.User.update({
          id: currentUserId,
          awsSub: cognitoAwsSub,
          email: email.trim(),
          role: 1 // Regular user role
          // Keep existing firstName/lastName - user can change anytime in Profile
        });

        // Success! User is now linked
        // DB is the single source of truth for their name
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
          <View style={containerStyle}>
            <View style={headerContainerStyle}>
              <Text style={[styles.text, headerTitleStyle]}>
                Link Existing Account
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={[styles.text, cancelTextStyle]}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={scrollContentStyle}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={scrollViewStyle}
            >
              <Text style={[styles.text, descriptionTextStyle]}>
                Sign in with your existing account to restore your data and
                rivalries
              </Text>

              <View style={inputContainerStyle}>
                <Text style={[styles.text, labelStyle]}>Email</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.gray200}
                  style={[styles.text, inputStyle]}
                  value={email}
                />
              </View>

              <View style={inputContainerStyle}>
                <Text style={[styles.text, labelStyle]}>Password</Text>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.gray200}
                  secureTextEntry
                  style={[styles.text, inputStyle]}
                  value={password}
                />
              </View>

              {error && (
                <Text style={[styles.text, errorTextStyle]}>{error}</Text>
              )}

              <TouchableOpacity
                disabled={loading || !email || !password}
                onPress={handleLinkAccount}
                style={buttonStyle}
              >
                {loading ? (
                  <ActivityIndicator color={colors.darkText} />
                ) : (
                  <Text style={buttonTextStyle}>Link Account</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const containerStyle = {
  flex: 1,
  paddingHorizontal: 24,
};

const headerContainerStyle = {
  flexDirection: 'row' as const,
  justifyContent: 'space-between' as const,
  alignItems: center,
  paddingVertical: 16,
  borderBottomWidth: 1,
  borderBottomColor: colors.gray750,
};

const headerTitleStyle = {
  fontSize: 24,
  fontWeight: 'bold' as const,
};

const cancelTextStyle = {
  fontSize: 16,
  color: colors.slate500,
};

const scrollViewStyle = {
  flex: 1,
};

const scrollContentStyle = {
  flexGrow: 1,
  justifyContent: center,
  paddingBottom: 40,
};

const descriptionTextStyle = {
  marginBottom: 24,
  textAlign: center,
  color: colors.gray300,
};

const inputContainerStyle = {
  marginBottom: 20,
};

const labelStyle = {
  marginBottom: 8,
  fontSize: 16,
  fontWeight: '500' as const,
};

const inputStyle = {
  width: '100%' as const,
  borderRadius: 8,
  fontSize: 16,
  paddingHorizontal: 16,
  paddingVertical: 14,
  backgroundColor: colors.gray800,
  borderWidth: 2,
  borderColor: colors.gray600,
};

const errorTextStyle = {
  marginBottom: 16,
  textAlign: center,
  color: colors.red400,
};

const buttonStyle = {
  backgroundColor: colors.amber400,
  paddingHorizontal: 32,
  paddingVertical: 16,
  borderRadius: 25,
  borderWidth: 1,
  borderColor: colors.slate300,
  width: '100%' as const,
  alignItems: center,
  marginTop: 8,
};

const buttonTextStyle = {
  color: colors.darkText,
  fontSize: 18,
  fontWeight: 'bold' as const,
};
