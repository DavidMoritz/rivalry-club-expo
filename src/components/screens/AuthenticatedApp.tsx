import React from 'react';
import { Text, View } from 'react-native';

import { useAuthUser } from '../../hooks/useAuthUser';

interface Game {
  id: string;
  name: string;
}

interface AuthenticatedAppProps {
  selectedGame: Game | null;
}

export function AuthenticatedApp({ selectedGame }: AuthenticatedAppProps) {
  console.log('[AuthenticatedApp] Component rendering! selectedGame:', selectedGame?.name);

  const { user, isLoading, error } = useAuthUser();

  console.log('[AuthenticatedApp] Hook result - user:', user, 'isLoading:', isLoading, 'error:', error);

  if (isLoading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white text-xl">Loading user data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-4">
        <Text className="text-red-500 text-xl font-bold mb-4">Error</Text>
        <Text className="text-white text-base mb-2">
          {error.message}
        </Text>
        {error.stack && (
          <Text className="text-gray-500 text-xs mt-4">
            {error.stack}
          </Text>
        )}
        <Text className="text-gray-400 mt-6">
          Please try signing out and back in.
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white text-xl">No user found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black items-center justify-center">
      <Text className="text-white text-2xl font-bold">
        Welcome{user.firstName ? `, ${user.firstName}` : ''}!
      </Text>
      <Text className="text-gray-400 mt-2">Email: {user.email}</Text>
      {selectedGame && (
        <Text className="text-gray-400 mt-4">
          Selected game: {selectedGame.name}
        </Text>
      )}
      <Text className="text-green-500 mt-8">✓ User created in database</Text>
      <Text className="text-gray-500 text-sm mt-2">User ID: {user.id}</Text>
    </View>
  );
}
