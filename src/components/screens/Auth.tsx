import { useCallback, useEffect, useState } from 'react';
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

import { confirmSignUp, getCurrentUser, signIn } from '../../lib/amplify-auth';
import { colors } from '../../utils/colors';
import { center, darkStyles, styles } from '../../utils/styles';
import { ForgotPassword } from './ForgotPassword';

interface AuthProps {
  onAuthSuccess: () => void;
}

interface CognitoError {
  name?: string;
  message?: string;
  underlyingError?: unknown;
}

function isCognitoError(err: unknown): err is CognitoError {
  return typeof err === 'object' && err !== null;
}

function getAuthTitle(needsVerification: boolean): string {
  if (needsVerification) return 'Verify Email';
  return 'Sign In';
}

function getSubmitButtonText(loading: boolean): string {
  if (loading) return 'Loading...';
  return 'Sign In';
}

function getSignInErrorMessage(err: unknown): string {
  const errorName = isCognitoError(err) ? err.name : undefined;
  const errorMessage = isCognitoError(err) ? err.message : undefined;

  const errorMap: Record<string, string> = {
    NotAuthorizedException: 'Incorrect email or password',
    UserNotFoundException: 'User not found',
    UserNotConfirmedException: 'Please verify your email before signing in'
  };

  return errorMap[errorName ?? ''] ?? errorMessage ?? 'Sign in failed. Please try again.';
}

function getVerificationErrorMessage(err: unknown): string {
  const errorName = isCognitoError(err) ? err.name : undefined;
  const errorMessage = isCognitoError(err) ? err.message : undefined;

  const errorMap: Record<string, string> = {
    CodeMismatchException: 'Invalid verification code',
    ExpiredCodeException: 'Verification code has expired. Please sign up again.'
  };

  return errorMap[errorName ?? ''] ?? errorMessage ?? 'Verification failed. Please try again.';
}

function getErrorColor(error: string): string {
  const isSuccess = error.includes('verified') || error.includes('success');
  return isSuccess ? colors.green300 : colors.red400;
}

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

const labelStyle = {
  marginBottom: 8,
  fontSize: 16,
  fontWeight: '500' as const
};

const buttonStyle = {
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
  fontWeight: 'bold' as const
};

const inputContainerStyle = {
  width: '100%' as const,
  marginBottom: 20
};

const errorTextStyle = {
  marginBottom: 16,
  textAlign: center
};

const linkTextStyle = {
  fontSize: 16
};

const linkContainerStyle = {
  marginTop: 12
};

const verificationInstructionStyle = {
  marginBottom: 24,
  textAlign: center
};

const titleContainerStyle = {
  marginBottom: 48
};

const scrollViewContentStyle = {
  flexGrow: 1,
  justifyContent: center,
  alignItems: center,
  paddingHorizontal: 32,
  paddingBottom: 40
};

interface VerificationFormProps {
  email: string;
  verificationCode: string;
  error: string | null;
  loading: boolean;
  onEmailChange: (text: string) => void;
  onCodeChange: (text: string) => void;
  onVerify: () => void;
  onBack: () => void;
}

function VerificationForm({
  email,
  verificationCode,
  error,
  loading,
  onEmailChange,
  onCodeChange,
  onVerify,
  onBack
}: VerificationFormProps) {
  return (
    <>
      <Text style={[styles.text, verificationInstructionStyle]}>
        Please enter your email and the verification code we sent you.
      </Text>

      <View style={inputContainerStyle}>
        <Text style={[styles.text, labelStyle]}>Email</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          onChangeText={onEmailChange}
          placeholder="Enter your email"
          placeholderTextColor={colors.gray200}
          secureTextEntry={false}
          style={[styles.text, inputStyle]}
          value={email}
        />
      </View>

      <View style={inputContainerStyle}>
        <Text style={[styles.text, labelStyle]}>Verification Code</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="number-pad"
          onChangeText={onCodeChange}
          placeholder="Enter verification code"
          placeholderTextColor={colors.gray200}
          style={[styles.text, inputStyle]}
          value={verificationCode}
        />
      </View>

      {error && (
        <Text style={[styles.text, errorTextStyle, { color: colors.red400 }]}>
          {error}
        </Text>
      )}

      <TouchableOpacity
        accessibilityState={{
          disabled: loading || !verificationCode || !email
        }}
        disabled={loading || !verificationCode || !email}
        onPress={onVerify}
        style={buttonStyle}
        testID="verify-submit-button"
      >
        <Text style={buttonTextStyle}>{loading ? 'Verifying...' : 'Verify'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onBack} style={linkContainerStyle}>
        <Text style={[linkTextStyle, { color: colors.cyan400 }]}>Back to Sign Up</Text>
      </TouchableOpacity>
    </>
  );
}

interface AuthFormProps {
  email: string;
  password: string;
  confirmPassword: string;
  error: string | null;
  loading: boolean;
  onEmailChange: (text: string) => void;
  onPasswordChange: (text: string) => void;
  onConfirmPasswordChange: (text: string) => void;
  onSubmit: () => void;
  onForgotPassword: () => void;
  onVerifyCode: () => void;
}

function AuthForm({
  email,
  password,
  error,
  loading,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onForgotPassword,
  onVerifyCode
}: AuthFormProps) {
  return (
    <>
      <View style={inputContainerStyle}>
        <Text style={[styles.text, labelStyle]}>Email</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          onChangeText={onEmailChange}
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
          onChangeText={onPasswordChange}
          placeholder="Enter your password"
          placeholderTextColor={colors.gray200}
          secureTextEntry
          style={[styles.text, inputStyle]}
          value={password}
        />
      </View>

      {error && (
        <Text style={[styles.text, errorTextStyle, { color: getErrorColor(error) }]}>
          {error}
        </Text>
      )}

      <TouchableOpacity
        accessibilityState={{ disabled: loading || !email || !password }}
        disabled={loading || !email || !password}
        onPress={onSubmit}
        style={buttonStyle}
        testID="auth-submit-button"
      >
        <Text style={buttonTextStyle}>{getSubmitButtonText(loading)}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onForgotPassword} style={linkContainerStyle}>
        <Text style={[linkTextStyle, { color: colors.gray200 }]}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onVerifyCode} style={linkContainerStyle}>
        <Text style={[linkTextStyle, { color: colors.gray200 }]}>
          Have a confirmation code? Verify
        </Text>
      </TouchableOpacity>
    </>
  );
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkAuthStatus = useCallback(async () => {
    try {
      await getCurrentUser();
      onAuthSuccess();
    } catch {
      // User not authenticated, stay on auth screen
    }
  }, [onAuthSuccess]);

  // Check if user is already authenticated on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  async function handleSignIn() {
    setError(null);
    setLoading(true);

    try {
      await signIn(email.trim(), password.trim());
      onAuthSuccess();
    } catch (err: unknown) {
      console.error('[Auth] Sign in error:', err);
      console.error('[Auth] Full error object:', JSON.stringify(err, null, 2));
      setError(getSignInErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode() {
    setError(null);
    setLoading(true);

    try {
      await confirmSignUp(email.trim(), verificationCode.trim());

      // After successful verification, redirect to sign-in screen
      setNeedsVerification(false);
      setVerificationCode('');
      setPassword('');
      setConfirmPassword('');
      setError('Account verified! Please sign in with your password.');
    } catch (err: unknown) {
      console.error('[Auth] Verification error:', err);
      setError(getVerificationErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // Show forgot password screen if requested
  if (showForgotPassword) {
    return <ForgotPassword initialEmail={email} onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.container, darkStyles.container]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={scrollViewContentStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, titleContainerStyle]}>
            {getAuthTitle(needsVerification)}
          </Text>

          {needsVerification ? (
            <VerificationForm
              email={email}
              error={error}
              loading={loading}
              onBack={() => {
                setNeedsVerification(false);
                setVerificationCode('');
                setError(null);
              }}
              onCodeChange={setVerificationCode}
              onEmailChange={setEmail}
              onVerify={handleVerifyCode}
              verificationCode={verificationCode}
            />
          ) : (
            <AuthForm
              confirmPassword={confirmPassword}
              email={email}
              error={error}
              loading={loading}
              onConfirmPasswordChange={setConfirmPassword}
              onEmailChange={setEmail}
              onForgotPassword={() => {
                setShowForgotPassword(true);
                setError(null);
              }}
              onPasswordChange={setPassword}
              onSubmit={handleSignIn}
              onVerifyCode={() => {
                setNeedsVerification(true);
                setError(null);
              }}
              password={password}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
