import React, { useEffect, useState } from 'react';
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

import {
  confirmSignUp,
  getCurrentUser,
  signIn,
  signUp,
} from '../../lib/amplify-auth';
import { colors } from '../../utils/colors';
import { darkStyles, styles } from '../../utils/styles';
import { ForgotPassword } from './ForgotPassword';

interface AuthProps {
  onAuthSuccess: () => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if user is already authenticated on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  async function checkAuthStatus() {
    try {
      await getCurrentUser();
      onAuthSuccess();
    } catch (err) {
      // User not authenticated, stay on auth screen
    }
  }

  async function handleSignIn() {
    setError(null);
    setLoading(true);

    try {
      await signIn(email.trim(), password.trim());
      onAuthSuccess();
    } catch (err: any) {
      console.error('[Auth] Sign in error:', err);
      console.error('[Auth] Error name:', err?.name);
      console.error('[Auth] Error message:', err?.message);
      console.error('[Auth] Error underlyingError:', err?.underlyingError);
      console.error('[Auth] Full error object:', JSON.stringify(err, null, 2));

      // Handle Cognito error codes
      if (err.name === 'NotAuthorizedException') {
        setError('Incorrect email or password');
      } else if (err.name === 'UserNotFoundException') {
        setError('User not found');
      } else if (err.name === 'UserNotConfirmedException') {
        setError('Please verify your email before signing in');
      } else {
        setError(err?.message || 'Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

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
        setError(null);
      } else {
        // Auto sign-in successful
        onAuthSuccess();
      }
    } catch (err: any) {
      console.error('[Auth] Sign up error:', err);

      // Handle Cognito error codes
      if (err.name === 'UsernameExistsException') {
        setError('An account with this email already exists');
      } else if (err.name === 'InvalidPasswordException') {
        setError(
          'Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols'
        );
      } else {
        setError(err?.message || 'Sign up failed. Please try again.');
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

      // After successful verification, redirect to sign-in screen
      setNeedsVerification(false);
      setIsSignUp(false);
      setVerificationCode('');
      setPassword('');
      setConfirmPassword('');
      setError('Account verified! Please sign in with your password.');
    } catch (err: any) {
      console.error('[Auth] Verification error:', err);

      // Handle Cognito error codes
      if (err.name === 'CodeMismatchException') {
        setError('Invalid verification code');
      } else if (err.name === 'ExpiredCodeException') {
        setError('Verification code has expired. Please sign up again.');
      } else {
        setError(err?.message || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  // Show forgot password screen if requested
  if (showForgotPassword) {
    return (
      <ForgotPassword
        initialEmail={email}
        onBack={() => setShowForgotPassword(false)}
      />
    );
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
            {needsVerification
              ? 'Verify Email'
              : isSignUp
                ? 'Sign Up'
                : 'Sign In'}
          </Text>

          {needsVerification ? (
            <>
              <Text
                style={[styles.text, { marginBottom: 24, textAlign: 'center' }]}
              >
                Please enter your email and the verification code we sent you.
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

              <View style={{ width: '100%', marginBottom: 20 }}>
                <Text
                  style={[
                    styles.text,
                    { marginBottom: 8, fontSize: 16, fontWeight: '500' },
                  ]}
                >
                  Verification Code
                </Text>
                <TextInput
                  autoCapitalize="none"
                  keyboardType="number-pad"
                  onChangeText={setVerificationCode}
                  placeholder="Enter verification code"
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
                  value={verificationCode}
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
                accessibilityState={{
                  disabled: loading || !verificationCode || !email,
                }}
                disabled={loading || !verificationCode || !email}
                onPress={handleVerifyCode}
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
                testID="verify-submit-button"
              >
                <Text
                  style={{
                    color: colors.white,
                    fontSize: 18,
                    fontWeight: 'bold',
                  }}
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setNeedsVerification(false);
                  setVerificationCode('');
                  setError(null);
                }}
                style={{ marginTop: 8 }}
              >
                <Text style={{ color: colors.cyan400, fontSize: 16 }}>
                  Back to Sign Up
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
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

              {isSignUp && (
                <View style={{ width: '100%', marginBottom: 20 }}>
                  <Text
                    style={[
                      styles.text,
                      { marginBottom: 8, fontSize: 16, fontWeight: '500' },
                    ]}
                  >
                    Confirm Password
                  </Text>
                  <TextInput
                    autoCapitalize="none"
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm your password"
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
              )}

              {error && (
                <Text
                  style={[
                    styles.text,
                    {
                      marginBottom: 16,
                      textAlign: 'center',
                      color:
                        error.includes('verified') || error.includes('success')
                          ? colors.green300
                          : colors.red400,
                    },
                  ]}
                >
                  {error}
                </Text>
              )}

              <TouchableOpacity
                accessibilityState={{
                  disabled: loading || !email || !password,
                }}
                disabled={loading || !email || !password}
                onPress={isSignUp ? handleSignUp : handleSignIn}
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
                testID="auth-submit-button"
              >
                <Text
                  style={{
                    color: colors.white,
                    fontSize: 18,
                    fontWeight: 'bold',
                  }}
                >
                  {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                style={{ marginTop: 8 }}
              >
                <Text style={{ color: colors.cyan400, fontSize: 16 }}>
                  {isSignUp
                    ? 'Already have an account? Sign In'
                    : "Don't have an account? Sign Up"}
                </Text>
              </TouchableOpacity>

              {!isSignUp && (
                <TouchableOpacity
                  onPress={() => {
                    setShowForgotPassword(true);
                    setError(null);
                  }}
                  style={{ marginTop: 12 }}
                >
                  <Text style={{ color: colors.gray200, fontSize: 16 }}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  setNeedsVerification(true);
                  setError(null);
                }}
                style={{ marginTop: 12 }}
              >
                <Text style={{ color: colors.gray200, fontSize: 16 }}>
                  Have a confirmation code? Verify
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
