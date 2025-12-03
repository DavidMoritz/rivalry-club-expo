import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../../lib/supabase';
import { darkStyles, styles } from '../../utils/styles';

interface AuthProps {
  onAuthSuccess: () => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if user is already authenticated on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  async function checkAuthStatus() {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        console.log('[Auth] Found cached session for:', session.user.email);
        console.log('[Auth] Clearing cached session...');
        // Clear the cached session since we deleted the user in Supabase
        await supabase.auth.signOut();
        console.log('[Auth] Session cleared. Please sign in again.');
      } else {
        console.log('[Auth] No authenticated user found');
      }
    } catch (err) {
      console.log('[Auth] Error checking auth status:', err);
    }
  }

  async function handleSignIn() {
    console.log('[Auth] Sign in attempt for:', email);
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (signInError) {
        console.error('[Auth] Sign in error:', signInError);
        setError(signInError.message);
        return;
      }

      if (data.session) {
        console.log('[Auth] Sign in successful!', data.user?.email);
        onAuthSuccess();
      }
    } catch (err: any) {
      console.error('[Auth] Unexpected sign in error:', err);
      setError(err?.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp() {
    console.log('[Auth] Sign up attempt for:', email);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });

      if (signUpError) {
        console.error('[Auth] Sign up error:', signUpError);
        setError(signUpError.message);
        return;
      }

      console.log('[Auth] Sign up successful!', data.user?.email);

      // Supabase automatically signs in after sign up (if email confirmation is disabled)
      // Or requires email confirmation (check your Supabase dashboard settings)
      if (data.session) {
        console.log('[Auth] Automatically signed in after sign up');
        onAuthSuccess();
      } else {
        setError('Sign up successful! Please check your email to confirm your account, then sign in.');
        setIsSignUp(false); // Switch back to sign in mode
      }
    } catch (err: any) {
      console.error('[Auth] Unexpected sign up error:', err);
      setError(err?.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, darkStyles.container]} edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-center px-8">
        <Text style={styles.title} className="mb-12">
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </Text>

        <View className="w-full mb-5">
          <Text style={styles.text} className="mb-2 text-base font-medium">
            Email
          </Text>
          <TextInput
            className="w-full rounded-lg text-base"
            style={[
              styles.text,
              {
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

        <View className="w-full mb-5">
          <Text style={styles.text} className="mb-2 text-base font-medium">
            Password
          </Text>
          <TextInput
            className="w-full rounded-lg text-base"
            style={[
              styles.text,
              {
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
          <View className="w-full mb-5">
            <Text style={styles.text} className="mb-2 text-base font-medium">
              Confirm Password
            </Text>
            <TextInput
              className="w-full rounded-lg text-base"
              style={[
                styles.text,
                {
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
          <Text style={styles.text} className="mb-4 text-center text-red-400">
            {error}
          </Text>
        )}

        <TouchableOpacity
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
        >
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign in nows'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={{ marginTop: 8 }}>
          <Text style={{ color: '#22d3ee', fontSize: 16 }}>
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
