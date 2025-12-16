import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { confirmResetPassword, resetPassword } from '../../lib/amplify-auth';
import { colors } from '../../utils/colors';
import { bold, center, darkStyles, styles } from '../../utils/styles';

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

export function ForgotPassword({ onBack, initialEmail = '' }: ForgotPasswordProps) {
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
    if (!isCognitoError(err)) return getErrorMessage(err, 'Failed to send reset code');
    if (err.name === 'UserNotFoundException') return 'No account found with this email';
    if (err.name === 'LimitExceededException') return 'Too many attempts. Please try again later.';
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
      await confirmResetPassword(email.trim(), resetCode.trim(), newPassword.trim());
      setSuccess('Password reset successfully! You can now sign in with your new password.');

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
    if (!isCognitoError(err)) return getErrorMessage(err, 'Failed to reset password');
    if (err.name === 'CodeMismatchException') return 'Invalid reset code';
    if (err.name === 'ExpiredCodeException')
      return 'Reset code has expired. Please request a new one.';
    if (err.name === 'InvalidPasswordException')
      return 'Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols';
    return getErrorMessage(err, 'Failed to reset password');
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.container, darkStyles.container]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        style={flexContainer}
      >
        <ScrollView
          contentContainerStyle={scrollContentStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, titleMarginStyle]}>
            {codeSent ? 'Reset Password' : 'Forgot Password'}
          </Text>

          {codeSent ? (
            <>
              <Text style={[styles.text, instructionTextStyle]}>
                Enter the code we sent to your email and choose a new password.
              </Text>

              <View style={fieldContainerStyle}>
                <Text style={[styles.text, fieldLabelStyle]}>Email</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  secureTextEntry={false}
                  style={[styles.text, inputStyle]}
                  value={email}
                />
              </View>

              <View style={fieldContainerStyle}>
                <Text style={[styles.text, fieldLabelStyle]}>Reset Code</Text>
                <TextInput
                  autoCapitalize="none"
                  keyboardType="number-pad"
                  onChangeText={setResetCode}
                  placeholder="Enter reset code"
                  placeholderTextColor={colors.gray200}
                  style={[styles.text, inputStyle]}
                  value={resetCode}
                />
              </View>

              <View style={fieldContainerStyle}>
                <Text style={[styles.text, fieldLabelStyle]}>New Password</Text>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.gray200}
                  secureTextEntry
                  style={[styles.text, inputStyle]}
                  value={newPassword}
                />
              </View>

              <View style={fieldContainerStyle}>
                <Text style={[styles.text, fieldLabelStyle]}>Confirm New Password</Text>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.gray200}
                  secureTextEntry
                  style={[styles.text, inputStyle]}
                  value={confirmPassword}
                />
              </View>

              {error && <Text style={[styles.text, errorMessageStyle]}>{error}</Text>}

              {success && <Text style={[styles.text, successMessageStyle]}>{success}</Text>}

              <TouchableOpacity
                accessibilityState={{
                  disabled: loading || !resetCode || !newPassword || !confirmPassword
                }}
                disabled={loading || !resetCode || !newPassword || !confirmPassword}
                onPress={handleResetPassword}
                style={primaryButtonStyle}
                testID="reset-password-button"
              >
                <Text style={buttonTextStyle}>{loading ? 'Resetting...' : 'Reset Password'}</Text>
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
                style={backButtonStyle}
              >
                <Text style={linkTextStyle}>Back</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.text, instructionTextStyle]}>
                Enter your email address and we'll send you a code to reset your password.
              </Text>

              <View style={fieldContainerStyle}>
                <Text style={[styles.text, fieldLabelStyle]}>Email</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.gray200}
                  secureTextEntry={false}
                  style={[styles.text, inputStyle]}
                  value={email}
                />
              </View>

              {error && <Text style={[styles.text, errorMessageStyle]}>{error}</Text>}

              {success && <Text style={[styles.text, successMessageStyle]}>{success}</Text>}

              <TouchableOpacity
                accessibilityState={{ disabled: loading || !email }}
                disabled={loading || !email}
                onPress={handleSendCode}
                style={primaryButtonStyle}
                testID="send-code-button"
              >
                <Text style={buttonTextStyle}>{loading ? 'Sending...' : 'Send Reset Code'}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onBack} style={backButtonStyle}>
                <Text style={linkTextStyle}>Back to Sign In</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Extracted styles
const flexContainer = { flex: 1 };

const scrollContentStyle = {
  flexGrow: 1,
  justifyContent: center,
  alignItems: center,
  paddingHorizontal: 32,
  paddingBottom: 40
};

const titleMarginStyle = { marginBottom: 48 };

const instructionTextStyle = { marginBottom: 24, textAlign: center };

const fieldContainerStyle = { width: '100%' as const, marginBottom: 20 };

const fieldLabelStyle = {
  marginBottom: 8,
  fontSize: 16,
  fontWeight: '500' as const
};

const inputStyle = {
  width: '100%' as const,
  borderRadius: 8,
  fontSize: 16,
  paddingHorizontal: 16,
  paddingVertical: 14,
  backgroundColor: colors.gray800,
  borderWidth: 2,
  borderColor: colors.gray600
};

const messageStyle = {
  marginBottom: 16,
  textAlign: center
};

const errorMessageStyle = {
  ...messageStyle,
  color: colors.red400
};

const successMessageStyle = {
  ...messageStyle,
  color: colors.green300
};

const primaryButtonStyle = {
  backgroundColor: colors.purple900,
  paddingHorizontal: 32,
  paddingVertical: 16,
  borderRadius: 25,
  borderWidth: 1,
  borderColor: colors.slate300,
  width: '75%' as const,
  alignItems: center,
  marginTop: 8,
  marginBottom: 16
};

const buttonTextStyle = {
  color: colors.white,
  fontSize: 18,
  fontWeight: bold
};

const backButtonStyle = { marginTop: 8 };

const linkTextStyle = { color: colors.cyan400, fontSize: 16 };
