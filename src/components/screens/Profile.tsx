import { generateClient } from 'aws-amplify/data';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Schema } from '../../../amplify/data/resource';
import { useAuthUser } from '../../hooks/useAuthUser';
import { supabase } from '../../lib/supabase';
import { darkStyles, styles } from '../../utils/styles';

export function Profile() {
  const { user, isLoading: userLoading } = useAuthUser();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('First name and last name are required');

      return;
    }

    setIsUpdating(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const client = generateClient<Schema>();

      const result = await client.models.User.update({
        id: user.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message);
      }

      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to update profile',
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage('All password fields are required');

      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match');

      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters');

      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      setSuccessMessage('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Failed to change password');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (userLoading) {
    return (
      <SafeAreaView style={[styles.container, darkStyles.container]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={styles.text}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, darkStyles.container]} edges={['top', 'bottom']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <Text style={[styles.title, { marginBottom: 24 }]}>Profile</Text>

        {successMessage ? (
          <View
            style={{
              backgroundColor: '#10b981',
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
            }}>
            <Text style={{ color: 'white', textAlign: 'center' }}>{successMessage}</Text>
          </View>
        ) : null}

        {errorMessage ? (
          <View
            style={{
              backgroundColor: '#ef4444',
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
            }}>
            <Text style={{ color: 'white', textAlign: 'center' }}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={{ marginBottom: 32 }}>
          <Text style={[styles.text, { fontSize: 20, fontWeight: '600', marginBottom: 16 }]}>
            Personal Information
          </Text>

          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.text, { marginBottom: 8 }]}>First Name</Text>
            <TextInput
              style={[
                styles.text,
                {
                  backgroundColor: '#2d3748',
                  color: 'white',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#4a5568',
                },
              ]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.text, { marginBottom: 8 }]}>Last Name</Text>
            <TextInput
              style={[
                styles.text,
                {
                  backgroundColor: '#2d3748',
                  color: 'white',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#4a5568',
                },
              ]}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.text, { marginBottom: 8, color: '#9ca3af' }]}>Email</Text>
            <Text
              style={[
                styles.text,
                {
                  backgroundColor: '#1f2937',
                  color: 'white',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#374151',
                },
              ]}>
              {user?.email}
            </Text>
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: '#6b21a8',
              paddingHorizontal: 32,
              paddingVertical: 16,
              borderRadius: 25,
              borderWidth: 1,
              borderColor: '#cbd5e1',
              width: '100%',
              alignItems: 'center',
              marginTop: 8,
            }}
            onPress={handleUpdateProfile}
            disabled={isUpdating}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
              {isUpdating ? 'Updating...' : 'Update Profile'}
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: '#374151',
            paddingTop: 32,
          }}>
          <Text style={[styles.text, { fontSize: 20, fontWeight: '600', marginBottom: 16 }]}>
            Change Password
          </Text>

          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.text, { marginBottom: 8 }]}>Current Password</Text>
            <TextInput
              style={[
                styles.text,
                {
                  backgroundColor: '#2d3748',
                  color: 'white',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#4a5568',
                },
              ]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor="#999"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.text, { marginBottom: 8 }]}>New Password</Text>
            <TextInput
              style={[
                styles.text,
                {
                  backgroundColor: '#2d3748',
                  color: 'white',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#4a5568',
                },
              ]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password (min 8 characters)"
              placeholderTextColor="#999"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.text, { marginBottom: 8 }]}>Confirm New Password</Text>
            <TextInput
              style={[
                styles.text,
                {
                  backgroundColor: '#2d3748',
                  color: 'white',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#4a5568',
                },
              ]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
              placeholderTextColor="#999"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: '#6b21a8',
              paddingHorizontal: 32,
              paddingVertical: 16,
              borderRadius: 25,
              borderWidth: 1,
              borderColor: '#cbd5e1',
              width: '100%',
              alignItems: 'center',
              marginTop: 8,
            }}
            onPress={handleChangePassword}
            disabled={isChangingPassword}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
              {isChangingPassword ? 'Changing...' : 'Change Password'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
