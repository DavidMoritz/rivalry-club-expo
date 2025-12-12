import { generateClient } from 'aws-amplify/data';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Schema } from '../../../amplify/data/resource';
import { signUp, confirmSignUp, signIn, getCurrentUser } from '../../lib/amplify-auth';
import { colors } from '../../utils/colors';
import { darkStyles, styles } from '../../utils/styles';

interface CreateAccountModalProps {
  visible: boolean;
  currentUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateAccountModal({ visible, currentUserId, onClose, onSuccess }: CreateAccountModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
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
        setError(null);
      } else {
        // Auto sign-in successful, link the account
        await linkAccountToCognito();
      }
    } catch (err: any) {
      console.error('[CreateAccountModal] Sign up error:', err);

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

      // After successful verification, sign in and link account
      await signIn(email.trim(), password.trim());
      await linkAccountToCognito();
    } catch (err: any) {
      console.error('[CreateAccountModal] Verification error:', err);

      if (err.name === 'CodeMismatchException') {
        setError('Invalid verification code');
      } else if (err.name === 'ExpiredCodeException') {
        setError('Verification code has expired. Please try again.');
      } else {
        setError(err?.message || 'Verification failed. Please try again.');
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
        role: 1, // Regular user role
      });

      // Success!
      onSuccess();
    } catch (err: any) {
      console.error('[CreateAccountModal] Link error:', err);
      setError(err?.message || 'Failed to link account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, darkStyles.container]} edges={['top', 'bottom']}>
        <View style={{ flex: 1, paddingHorizontal: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.gray750,
            }}>
            <Text style={[styles.text, { fontSize: 24, fontWeight: 'bold' }]}>
              {needsVerification ? 'Verify Email' : 'Create New Account'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.text, { fontSize: 16, color: colors.slate500 }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, justifyContent: 'center' }}>
            {needsVerification ? (
              <>
                <Text style={[styles.text, { marginBottom: 24, textAlign: 'center', color: colors.gray300 }]}>
                  Please enter the verification code we sent to your email
                </Text>

                <View style={{ marginBottom: 20 }}>
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
                        backgroundColor: colors.gray800,
                        borderWidth: 2,
                        borderColor: colors.gray600,
                      },
                    ]}
                    placeholder="Enter verification code"
                    placeholderTextColor={colors.gray200}
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="number-pad"
                    autoCapitalize="none"
                  />
                </View>

                {error && (
                  <Text style={[styles.text, { marginBottom: 16, textAlign: 'center', color: colors.red400 }]}>
                    {error}
                  </Text>
                )}

                <TouchableOpacity
                  style={{
                    backgroundColor: colors.purple900,
                    paddingHorizontal: 32,
                    paddingVertical: 16,
                    borderRadius: 25,
                    borderWidth: 1,
                    borderColor: colors.slate300,
                    width: '100%',
                    alignItems: 'center',
                    marginTop: 8,
                  }}
                  onPress={handleVerifyCode}
                  disabled={loading || !verificationCode}>
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                      Verify
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setNeedsVerification(false);
                    setVerificationCode('');
                    setError(null);
                  }}
                  style={{ marginTop: 16, alignItems: 'center' }}>
                  <Text style={{ color: colors.cyan400, fontSize: 16 }}>Back</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.text, { marginBottom: 24, textAlign: 'center', color: colors.gray300 }]}>
                  Create an account to back up your data and sync across devices
                </Text>

                <View style={{ marginBottom: 20 }}>
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
                        backgroundColor: colors.gray800,
                        borderWidth: 2,
                        borderColor: colors.gray600,
                      },
                    ]}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.gray200}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={{ marginBottom: 20 }}>
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
                        backgroundColor: colors.gray800,
                        borderWidth: 2,
                        borderColor: colors.gray600,
                      },
                    ]}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.gray200}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

                <View style={{ marginBottom: 20 }}>
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
                        backgroundColor: colors.gray800,
                        borderWidth: 2,
                        borderColor: colors.gray600,
                      },
                    ]}
                    placeholder="Confirm your password"
                    placeholderTextColor={colors.gray200}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

                {error && (
                  <Text style={[styles.text, { marginBottom: 16, textAlign: 'center', color: colors.red400 }]}>
                    {error}
                  </Text>
                )}

                <TouchableOpacity
                  style={{
                    backgroundColor: colors.purple900,
                    paddingHorizontal: 32,
                    paddingVertical: 16,
                    borderRadius: 25,
                    borderWidth: 1,
                    borderColor: colors.slate300,
                    width: '100%',
                    alignItems: 'center',
                    marginTop: 8,
                  }}
                  onPress={handleSignUp}
                  disabled={loading || !email || !password || !confirmPassword}>
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                      Create Account
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
