import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { confirmResetPassword, resetPassword } from '../../lib/amplify-auth';
import { colors } from '../../utils/colors';
import { darkStyles, styles } from '../../utils/styles';

const MIN_PASSWORD_LENGTH = 8;
const REDIRECT_DELAY_MS = 2000;

interface CognitoError {
  name: string;
  message?: string;
}

function isCognitoError(err: unknown): err is CognitoError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    typeof (err as CognitoError).name === 'string'
  );
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (isCognitoError(err)) return err.message ?? fallback;
  if (err instanceof Error) return err.message;
  return fallback;
}

interface ForgotPasswordProps {
  onBack: () => void;
  initialEmail?: string;
}

export function ForgotPassword({
  onBack,
  initialEmail = '',
}: ForgotPasswordProps) {
  const [email, setEmail] = useState(initialEmail);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSendCode() {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await resetPassword(email.trim());
      setCodeSent(true);
      setSuccess('Password reset code sent to your email');
    } catch (err: unknown) {
      console.error('[ForgotPassword] Reset password error:', err);
      setError(getSendCodeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function getSendCodeErrorMessage(err: unknown): string {
    if (!isCognitoError(err))
      return getErrorMessage(err, 'Failed to send reset code');
    if (err.name === 'UserNotFoundException')
      return 'No account found with this email';
    if (err.name === 'LimitExceededException')
      return 'Too many attempts. Please try again later.';
    return getErrorMessage(err, 'Failed to send reset code');
  }

  async function handleResetPassword() {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError('Password must be at least 8 characters');
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await confirmResetPassword(
        email.trim(),
        resetCode.trim(),
        newPassword.trim()
      );
      setSuccess(
        'Password reset successfully! You can now sign in with your new password.'
      );

      // Wait a moment then go back to sign in
      setTimeout(() => {
        onBack();
      }, REDIRECT_DELAY_MS);
    } catch (err: unknown) {
      console.error('[ForgotPassword] Confirm reset error:', err);
      setError(getResetPasswordErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function getResetPasswordErrorMessage(err: unknown): string {
    if (!isCognitoError(err))
      return getErrorMessage(err, 'Failed to reset password');
    if (err.name === 'CodeMismatchException') return 'Invalid reset code';
    if (err.name === 'ExpiredCodeException')
      return 'Reset code has expired. Please request a new one.';
    if (err.name === 'InvalidPasswordException')
      return 'Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols';
    return getErrorMessage(err, 'Failed to reset password');
  }

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
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { marginBottom: 48 }]}>
            {codeSent ? 'Reset Password' : 'Forgot Password'}
          </Text>

          {codeSent ? (
            <>
              <Text
                style={[styles.text, { marginBottom: 24, textAlign: 'center' }]}
              >
                Enter the code we sent to your email and choose a new password.
              </Text>

              <View style={{ width: '100%', marginBottom: 20 }}>
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
                  secureTextEntry={false}
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

              <View style={{ width: '100%', marginBottom: 20 }}>
                <Text
                  style={[
                    styles.text,
                    { marginBottom: 8, fontSize: 16, fontWeight: '500' },
                  ]}
                >
                  Reset Code
                </Text>
                <TextInput
                  autoCapitalize="none"
                  keyboardType="number-pad"
                  onChangeText={setResetCode}
                  placeholder="Enter reset code"
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
                  value={resetCode}
                />
              </View>

              <View style={{ width: '100%', marginBottom: 20 }}>
                <Text
                  style={[
                    styles.text,
                    { marginBottom: 8, fontSize: 16, fontWeight: '500' },
                  ]}
                >
                  New Password
                </Text>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
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
                  value={newPassword}
                />
              </View>

              <View style={{ width: '100%', marginBottom: 20 }}>
                <Text
                  style={[
                    styles.text,
                    { marginBottom: 8, fontSize: 16, fontWeight: '500' },
                  ]}
                >
                  Confirm New Password
                </Text>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
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
                  value={confirmPassword}
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

              {success && (
                <Text
                  style={[
                    styles.text,
                    {
                      marginBottom: 16,
                      textAlign: 'center',
                      color: colors.green300,
                    },
                  ]}
                >
                  {success}
                </Text>
              )}

              <TouchableOpacity
                accessibilityState={{
                  disabled:
                    loading || !resetCode || !newPassword || !confirmPassword,
                }}
                disabled={
                  loading || !resetCode || !newPassword || !confirmPassword
                }
                onPress={handleResetPassword}
                style={{
                  backgroundColor: colors.purple900,
                  paddingHorizontal: 32,
                  paddingVertical: 16,
                  borderRadius: 25,
                  borderWidth: 1,
                  borderColor: colors.slate300,
                  width: '75%',
                  alignItems: 'center',
                  marginTop: 8,
                  marginBottom: 16,
                }}
                testID="reset-password-button"
              >
                <Text
                  style={{
                    color: colors.white,
                    fontSize: 18,
                    fontWeight: 'bold',
                  }}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setCodeSent(false);
                  setResetCode('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setError(null);
                  setSuccess(null);
                }}
                style={{ marginTop: 8 }}
              >
                <Text style={{ color: colors.cyan400, fontSize: 16 }}>
                  Back
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text
                style={[styles.text, { marginBottom: 24, textAlign: 'center' }]}
              >
                Enter your email address and we'll send you a code to reset your
                password.
              </Text>

              <View style={{ width: '100%', marginBottom: 20 }}>
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
                  secureTextEntry={false}
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

              {success && (
                <Text
                  style={[
                    styles.text,
                    {
                      marginBottom: 16,
                      textAlign: 'center',
                      color: colors.green300,
                    },
                  ]}
                >
                  {success}
                </Text>
              )}

              <TouchableOpacity
                accessibilityState={{ disabled: loading || !email }}
                disabled={loading || !email}
                onPress={handleSendCode}
                style={{
                  backgroundColor: colors.purple900,
                  paddingHorizontal: 32,
                  paddingVertical: 16,
                  borderRadius: 25,
                  borderWidth: 1,
                  borderColor: colors.slate300,
                  width: '75%',
                  alignItems: 'center',
                  marginTop: 8,
                  marginBottom: 16,
                }}
                testID="send-code-button"
              >
                <Text
                  style={{
                    color: colors.white,
                    fontSize: 18,
                    fontWeight: 'bold',
                  }}
                >
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onBack} style={{ marginTop: 8 }}>
                <Text style={{ color: colors.cyan400, fontSize: 16 }}>
                  Back to Sign In
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
