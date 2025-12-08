import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCreateRivalryMutation } from '../../controllers/c-rivalry';
import { useUserSearchQuery } from '../../controllers/c-user';
import { useAuthUser } from '../../hooks/useAuthUser';
import { MUser } from '../../models/m-user';
import { useGame } from '../../providers/game';
import { useAllRivalriesUpdate } from '../../providers/all-rivalries';
import { darkStyles, styles } from '../../utils/styles';

export function CreateRivalry() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const gameFromContext = useGame();
  const { user } = useAuthUser();
  const [searchText, setSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState<MUser | null>(null);
  const [creatingRivalry, setCreatingRivalry] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Try to get game from context first, then from params
  const gameId = gameFromContext?.id || (params.gameId as string);
  const gameName = gameFromContext?.name || (params.gameName as string) || 'this game';

  const { data: searchResults = [], isLoading: isSearching } = useUserSearchQuery({
    searchText,
    currentUserId: user?.id
  });

  const { addRivalry } = useAllRivalriesUpdate();

  const { mutate: createRivalry } = useCreateRivalryMutation({
    onSuccess: (newRivalry) => {
      // Add the newly created rivalry to the provider with user names
      if (newRivalry && selectedUser && user) {
        addRivalry({
          ...newRivalry as any,
          userAName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          userBName: `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || selectedUser.email
        });
      }
      setCreatingRivalry(false);
      router.back();
    },
    onError: (err) => {
      console.error('[CreateRivalry] Error creating rivalry:', err);
      setError(err.message || 'Failed to create rivalry');
      setCreatingRivalry(false);
    }
  });

  const handleCreateRivalry = () => {
    if (!selectedUser || !user || !gameId) {
      console.warn('[CreateRivalry] Missing required data:', {
        selectedUser: selectedUser?.id,
        user: user?.id,
        gameId
      });

      let errorMsg = 'Missing required information: ';
      if (!selectedUser) errorMsg += 'No user selected. ';
      if (!user) errorMsg += 'You are not logged in. ';
      if (!gameId) errorMsg += 'No game selected. Please go back and select a game first. ';

      setError(errorMsg);

      return;
    }

    setError(null);
    setCreatingRivalry(true);

    createRivalry({
      userAId: user.id,
      userBId: selectedUser.id,
      gameId
    });
  };

  const renderUserItem = ({ item }: { item: MUser }) => (
    <TouchableOpacity
      onPress={() => setSelectedUser(item)}
      style={{
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        backgroundColor: selectedUser?.id === item.id ? '#374151' : 'transparent'
      }}
    >
      <Text style={[styles.text, { fontSize: 16, fontWeight: 'bold' }]}>
        {item.firstName} {item.lastName}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, darkStyles.container]} edges={['top', 'bottom']}>
      <View style={{ flex: 1 }}>
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#333'
          }}
        >
          <Text style={[styles.text, { fontSize: 24, fontWeight: 'bold' }]}>
            Create New Rivalry
          </Text>
          <Text style={[styles.text, { marginTop: 4, color: '#999' }]}>
            Search for a user to challenge in {gameName}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search by name or email..."
            placeholderTextColor="#666"
            style={{
              backgroundColor: '#1e293b',
              color: 'white',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 8,
              fontSize: 16,
              borderWidth: 1,
              borderColor: '#475569'
            }}
          />
        </View>

        {error && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <Text style={[styles.text, { color: '#ef4444', fontSize: 14 }]}>
              Error: {error}
            </Text>
          </View>
        )}

        {isSearching && searchText.length >= 2 && (
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#6b21a8" />
          </View>
        )}

        {!isSearching && searchText.length >= 2 && searchResults.length === 0 && (
          <View style={{ paddingVertical: 32, paddingHorizontal: 16, alignItems: 'center' }}>
            <Text style={[styles.text, { color: '#999' }]}>
              No users found matching "{searchText}"
            </Text>
          </View>
        )}

        {searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            style={{ flex: 1 }}
          />
        )}

        {selectedUser && (
          <View
            style={{
              padding: 16,
              borderTopWidth: 1,
              borderTopColor: '#333',
              backgroundColor: '#0f172a'
            }}
          >
            <Text style={[styles.text, { fontSize: 14, color: '#999', marginBottom: 8 }]}>
              Challenging {selectedUser.firstName} {selectedUser.lastName}
            </Text>
            <TouchableOpacity
              onPress={handleCreateRivalry}
              disabled={creatingRivalry}
              style={{
                backgroundColor: creatingRivalry ? '#475569' : '#6b21a8',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: 'center'
              }}
            >
              {creatingRivalry ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={[styles.text, { fontSize: 16, fontWeight: 'bold' }]}>
                  Initiate Rivalry
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
