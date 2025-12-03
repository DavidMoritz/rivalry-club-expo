import { useAuthenticator } from '@aws-amplify/ui-react-native';
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Get auth functions from useAuthenticator
  const { user } = useAuthenticator((context) => [context.user]);

  console.log('[Auth] Component rendering, user:', user?.username);

  // If user is authenticated, trigger success callback
  React.useEffect(() => {
    if (user) {
      console.log('[Auth] User authenticated:', user.username);
      onAuthSuccess();
    }
  }, [user, onAuthSuccess]);

  async function handleSignIn() {
    console.log('[Auth] Sign in attempt for:', email);
    setError(null);
    setLoading(true);

    try {
      const { signIn } = await import('aws-amplify/auth');
      const result = await signIn({ username: email, password });

      console.log('[Auth] Sign in result:', result);

      if (result.isSignedIn) {
        console.log('[Auth] Sign in successful!');
        onAuthSuccess();
      }
    } catch (err: any) {
      console.error('[Auth] Sign in error:', err);
      setError(err.message || 'Sign in failed');
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
      const { signUp } = await import('aws-amplify/auth');
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email
          }
        }
      });

      console.log('[Auth] Sign up result:', result);

      if (result.isSignUpComplete) {
        console.log('[Auth] Sign up complete, signing in...');
        await handleSignIn();
      } else if (result.nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        console.log('[Auth] Needs verification');
        setNeedsVerification(true);
      }
    } catch (err: any) {
      console.error('[Auth] Sign up error:', err);
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode() {
    console.log('[Auth] Verifying code for:', email);
    setError(null);
    setLoading(true);

    try {
      const { confirmSignUp } = await import('aws-amplify/auth');
      const result = await confirmSignUp({
        username: email,
        confirmationCode: verificationCode
      });

      console.log('[Auth] Verification result:', result);

      if (result.isSignUpComplete) {
        console.log('[Auth] Verification successful, signing in...');
        await handleSignIn();
      }
    } catch (err: any) {
      console.error('[Auth] Verification error:', err);
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  if (needsVerification) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-8">
        <Text className="text-white text-2xl font-bold mb-8">Verify Email</Text>

        <Text className="text-gray-400 mb-4 text-center">
          Check your email for the verification code
        </Text>

        <TextInput
          className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg mb-4"
          placeholder="Verification Code"
          placeholderTextColor="#666"
          value={verificationCode}
          onChangeText={setVerificationCode}
          keyboardType="number-pad"
          autoCapitalize="none"
        />

        {error && <Text className="text-red-500 mb-4 text-center">{error}</Text>}

        <TouchableOpacity
          className="w-full bg-purple-900 py-3 rounded-full mb-4"
          onPress={handleVerifyCode}
          disabled={loading || !verificationCode}
        >
          <Text className="text-white text-center font-bold">
            {loading ? 'Verifying...' : 'Verify'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setNeedsVerification(false)}>
          <Text className="text-blue-400">Back to Sign Up</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black items-center justify-center px-8">
      <Text className="text-white text-2xl font-bold mb-8">
        {isSignUp ? 'Sign Up' : 'Sign Ins'}
      </Text>

      <TextInput
        className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg mb-4"
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg mb-4"
        placeholder="Password"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      {isSignUp && (
        <TextInput
          className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg mb-4"
          placeholder="Confirm Password"
          placeholderTextColor="#666"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
        />
      )}

      {error && <Text className="text-red-500 mb-4 text-center">{error}</Text>}

      <TouchableOpacity
        className="w-full bg-purple-900 py-3 rounded-full mb-4"
        onPress={isSignUp ? handleSignUp : handleSignIn}
        disabled={loading || !email || !password}
      >
        <Text className="text-white text-center font-bold">
          {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign Ind'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
        <Text className="text-blue-400">
          {isSignUp ? 'Already have an account? Sign Inf' : "Don't have an account? Sign Up"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
