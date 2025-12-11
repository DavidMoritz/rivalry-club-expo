import React, { useEffect, useState } from 'react';
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

import { confirmSignUp, getCurrentUser, signIn, signUp } from '../../lib/amplify-auth';
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
        onBack={() => setShowForgotPassword(false)}
        initialEmail={email}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, darkStyles.container]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32,
            paddingBottom: 40
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { marginBottom: 48 }]}>
            {needsVerification ? 'Verify Email' : isSignUp ? 'Sign Up' : 'Sign In'}
          </Text>

        {needsVerification ? (
          <>
            <Text style={[styles.text, { marginBottom: 24, textAlign: 'center' }]}>
              Please enter your email and the verification code we sent you.
            </Text>

            <View style={{ width: '100%', marginBottom: 20 }}>
              <Text style={[styles.text, { marginBottom: 8, fontSize: 16, fontWeight: '500' }]}>
                Email
              </Text>
              <TextInput
                style={[
                  styles.text,
                  {
                    width: '100%',
                    borderRadius: 8,
                    fontSize: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    backgroundColor: '#2d3748',
                    borderWidth: 2,
                    borderColor: '#4a5568'
                  }
                ]}
                placeholder="Enter your email"
                placeholderTextColor="#a0aec0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={false}
              />
            </View>

            <View style={{ width: '100%', marginBottom: 20 }}>
              <Text style={[styles.text, { marginBottom: 8, fontSize: 16, fontWeight: '500' }]}>
                Verification Code
              </Text>
              <TextInput
                style={[
                  styles.text,
                  {
                    width: '100%',
                    borderRadius: 8,
                    fontSize: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    backgroundColor: '#2d3748',
                    borderWidth: 2,
                    borderColor: '#4a5568'
                  }
                ]}
                placeholder="Enter verification code"
                placeholderTextColor="#a0aec0"
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                autoCapitalize="none"
              />
            </View>

            {error && (
              <Text style={[styles.text, { marginBottom: 16, textAlign: 'center', color: '#f87171' }]}>
                {error}
              </Text>
            )}

            <TouchableOpacity
              testID="verify-submit-button"
              style={{
                backgroundColor: '#6b21a8',
                paddingHorizontal: 32,
                paddingVertical: 16,
                borderRadius: 25,
                borderWidth: 1,
                borderColor: '#cbd5e1',
                width: '75%',
                alignItems: 'center',
                marginTop: 8,
                marginBottom: 16
              }}
              onPress={handleVerifyCode}
              disabled={loading || !verificationCode || !email}
              accessibilityState={{ disabled: loading || !verificationCode || !email }}
            >
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
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
              <Text style={{ color: '#22d3ee', fontSize: 16 }}>Back to Sign Up</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={{ width: '100%', marginBottom: 20 }}>
              <Text style={[styles.text, { marginBottom: 8, fontSize: 16, fontWeight: '500' }]}>
                Email
              </Text>
              <TextInput
                style={[
                  styles.text,
                  {
                    width: '100%',
                    borderRadius: 8,
                    fontSize: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    backgroundColor: '#2d3748',
                    borderWidth: 2,
                    borderColor: '#4a5568'
                  }
                ]}
                placeholder="Enter your email"
                placeholderTextColor="#a0aec0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={{ width: '100%', marginBottom: 20 }}>
              <Text style={[styles.text, { marginBottom: 8, fontSize: 16, fontWeight: '500' }]}>
                Password
              </Text>
              <TextInput
                style={[
                  styles.text,
                  {
                    width: '100%',
                    borderRadius: 8,
                    fontSize: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    backgroundColor: '#2d3748',
                    borderWidth: 2,
                    borderColor: '#4a5568'
                  }
                ]}
                placeholder="Enter your password"
                placeholderTextColor="#a0aec0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {isSignUp && (
              <View style={{ width: '100%', marginBottom: 20 }}>
                <Text style={[styles.text, { marginBottom: 8, fontSize: 16, fontWeight: '500' }]}>
                  Confirm Password
                </Text>
                <TextInput
                  style={[
                    styles.text,
                    {
                      width: '100%',
                      borderRadius: 8,
                      fontSize: 16,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      backgroundColor: '#2d3748',
                      borderWidth: 2,
                      borderColor: '#4a5568'
                    }
                  ]}
                  placeholder="Confirm your password"
                  placeholderTextColor="#a0aec0"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
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
                    color: error.includes('verified') || error.includes('success') ? '#4ade80' : '#f87171'
                  }
                ]}
              >
                {error}
              </Text>
            )}

            <TouchableOpacity
              testID="auth-submit-button"
              style={{
                backgroundColor: '#6b21a8',
                paddingHorizontal: 32,
                paddingVertical: 16,
                borderRadius: 25,
                borderWidth: 1,
                borderColor: '#cbd5e1',
                width: '75%',
                alignItems: 'center',
                marginTop: 8,
                marginBottom: 16
              }}
              onPress={isSignUp ? handleSignUp : handleSignIn}
              disabled={loading || !email || !password}
              accessibilityState={{ disabled: loading || !email || !password }}
            >
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
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
              <Text style={{ color: '#22d3ee', fontSize: 16 }}>
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
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
                <Text style={{ color: '#a0aec0', fontSize: 16 }}>
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
              <Text style={{ color: '#a0aec0', fontSize: 16 }}>
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
