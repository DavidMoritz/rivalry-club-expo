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
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Schema } from '../../../amplify/data/resource';
import { confirmSignUp, getCurrentUser, signIn, signUp } from '../../lib/amplify-auth';
import { colors } from '../../utils/colors';
import { center, darkStyles, styles } from '../../utils/styles';

interface CreateAccountModalProps {
  visible: boolean;
  currentUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateAccountModal({
  visible,
  currentUserId,
  onClose,
  onSuccess
}: CreateAccountModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await signUp(email.trim(), password.trim());

      // Check if email confirmation is required
      if (result.nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setNeedsVerification(true);
        setHasCredentials(true);
        setError(null);
      } else {
        // Auto sign-in successful, link the account
        await linkAccountToCognito();
      }
    } catch (err: unknown) {
      console.error('[CreateAccountModal] Sign up error:', err);

      const caughtError = err as Error & { name?: string };
      if (caughtError.name === 'UsernameExistsException') {
        setError('An account with this email already exists');
      } else if (caughtError.name === 'InvalidPasswordException') {
        setError(
          'Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols'
        );
      } else {
        setError(caughtError?.message || 'Sign up failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode() {
    setError(null);
    setLoading(true);

    try {
      await confirmSignUp(email.trim(), verificationCode.trim());

      // After successful verification, sign in and link account
      await signIn(email.trim(), password.trim());
      await linkAccountToCognito();
    } catch (err: unknown) {
      console.error('[CreateAccountModal] Verification error:', err);

      const caughtError = err as Error & { name?: string };
      if (caughtError.name === 'CodeMismatchException') {
        setError('Invalid verification code');
      } else if (caughtError.name === 'ExpiredCodeException') {
        setError('Verification code has expired. Please try again.');
      } else {
        setError(caughtError?.message || 'Verification failed. Please try again.');
      }
      setLoading(false);
    }
  }

  async function linkAccountToCognito() {
    try {
      // Get Cognito user info
      const cognitoUser = await getCurrentUser();
      const cognitoAwsSub = cognitoUser.userId;

      const client = generateClient<Schema>();

      // Update the current user to link with Cognito
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
    } catch (err: unknown) {
      console.error('[CreateAccountModal] Link error:', err);
      const caughtError = err as Error;
      setError(caughtError?.message || 'Failed to link account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible={visible}>
      <SafeAreaView edges={['top', 'bottom']} style={[styles.container, darkStyles.container]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
          style={flexOneStyle}
        >
          <View style={contentContainerStyle}>
            <View style={headerContainerStyle}>
              <Text style={[styles.text, headerTitleStyle]}>
                {needsVerification ? 'Verify Email' : 'Create New Account'}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={[styles.text, cancelTextStyle]}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={scrollContentStyle}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={flexOneStyle}
            >
              {needsVerification ? (
                <>
                  <Text style={[styles.text, instructionTextStyle]}>
                    Please enter{' '}
                    {hasCredentials
                      ? 'the verification code we sent to your email'
                      : 'your email and the verification code we sent you'}
                  </Text>

                  {!hasCredentials && (
                    <>
                      <View style={inputContainerStyle}>
                        <Text style={[styles.text, labelTextStyle]}>Email</Text>
                        <TextInput
                          autoCapitalize="none"
                          autoCorrect={false}
                          keyboardType="email-address"
                          onChangeText={setEmail}
                          placeholder="Enter your email"
                          placeholderTextColor={colors.gray200}
                          style={[styles.text, textInputStyle]}
                          value={email}
                        />
                      </View>

                      <View style={inputContainerStyle}>
                        <Text style={[styles.text, labelTextStyle]}>Password</Text>
                        <TextInput
                          autoCapitalize="none"
                          onChangeText={setPassword}
                          placeholder="Enter your password"
                          placeholderTextColor={colors.gray200}
                          secureTextEntry
                          style={[styles.text, textInputStyle]}
                          value={password}
                        />
                      </View>
                    </>
                  )}
                  <View style={inputContainerStyle}>
                    <Text style={[styles.text, labelTextStyle]}>Verification Code</Text>
                    <TextInput
                      autoCapitalize="none"
                      keyboardType="number-pad"
                      onChangeText={setVerificationCode}
                      placeholder="Enter verification code"
                      placeholderTextColor={colors.gray200}
                      style={[styles.text, textInputStyle]}
                      value={verificationCode}
                    />
                  </View>

                  {error && <Text style={[styles.text, errorTextStyle]}>{error}</Text>}

                  <TouchableOpacity
                    disabled={loading || !verificationCode || !email}
                    onPress={handleVerifyCode}
                    style={primaryButtonStyle}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={buttonTextStyle}>Verify</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setNeedsVerification(false);
                      setHasCredentials(false);
                      setVerificationCode('');
                      setError(null);
                    }}
                    style={secondaryButtonStyle}
                  >
                    <Text style={linkTextStyle}>Back</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={[styles.text, instructionTextStyle]}>
                    Create an account to back up your data and sync across devices
                  </Text>

                  <View style={inputContainerStyle}>
                    <Text style={[styles.text, labelTextStyle]}>Email</Text>
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      onChangeText={setEmail}
                      placeholder="Enter your email"
                      placeholderTextColor={colors.gray200}
                      style={[styles.text, textInputStyle]}
                      value={email}
                    />
                  </View>

                  <View style={inputContainerStyle}>
                    <Text style={[styles.text, labelTextStyle]}>Password</Text>
                    <TextInput
                      autoCapitalize="none"
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.gray200}
                      secureTextEntry
                      style={[styles.text, textInputStyle]}
                      value={password}
                    />
                  </View>

                  <View style={inputContainerStyle}>
                    <Text style={[styles.text, labelTextStyle]}>Confirm Password</Text>
                    <TextInput
                      autoCapitalize="none"
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm your password"
                      placeholderTextColor={colors.gray200}
                      secureTextEntry
                      style={[styles.text, textInputStyle]}
                      value={confirmPassword}
                    />
                  </View>

                  {error && <Text style={[styles.text, errorTextStyle]}>{error}</Text>}

                  <TouchableOpacity
                    disabled={loading || !email || !password || !confirmPassword}
                    onPress={handleSignUp}
                    style={primaryButtonStyle}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={buttonTextStyle}>Create Account</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setNeedsVerification(true);
                      setError(null);
                    }}
                    style={secondaryButtonStyle}
                  >
                    <Text style={verificationLinkTextStyle}>
                      Have a confirmation code? Verify
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// Container styles
const flexOneStyle = { flex: 1 };

const contentContainerStyle = {
  flex: 1,
  paddingHorizontal: 24
};

const headerContainerStyle = {
  flexDirection: 'row' as const,
  justifyContent: 'space-between' as const,
  alignItems: center,
  paddingVertical: 16,
  borderBottomWidth: 1,
  borderBottomColor: colors.gray750
};

const scrollContentStyle = {
  flexGrow: 1,
  justifyContent: center,
  paddingBottom: 40
};

const inputContainerStyle = {
  marginBottom: 20
};

// Text styles
const headerTitleStyle = {
  fontSize: 24,
  fontWeight: 'bold' as const
};

const cancelTextStyle = {
  fontSize: 16,
  color: colors.slate500
};

const instructionTextStyle = {
  marginBottom: 24,
  textAlign: center,
  color: colors.gray300
};

const labelTextStyle = {
  marginBottom: 8,
  fontSize: 16,
  fontWeight: '500' as const
};

const errorTextStyle = {
  marginBottom: 16,
  textAlign: center,
  color: colors.red400
};

const linkTextStyle = {
  color: colors.cyan400,
  fontSize: 16
};

const verificationLinkTextStyle = {
  color: colors.gray200,
  fontSize: 16
};

// Input styles
const textInputStyle = {
  width: '100%' as const,
  borderRadius: 8,
  fontSize: 16,
  paddingHorizontal: 16,
  paddingVertical: 14,
  backgroundColor: colors.gray800,
  borderWidth: 2,
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

const secondaryButtonStyle = {
  marginTop: 16,
  alignItems: center
};

const buttonTextStyle = {
  color: colors.white,
  fontSize: 18,
  fontWeight: 'bold' as const
};
