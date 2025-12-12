import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useAcceptRivalryMutation,
  useCreateRivalryMutation,
  useCreateNpcRivalryMutation
} from '../../controllers/c-rivalry';
import { useUserSearchQuery } from '../../controllers/c-user';
import { useAuthUser } from '../../hooks/useAuthUser';
import { MUser } from '../../models/m-user';
import { useGame } from '../../providers/game';
import { useAllRivalries, useAllRivalriesUpdate } from '../../providers/all-rivalries';
import { colors } from '../../utils/colors';
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

  // Auto-search for NPC if this is a first-time user
  useEffect(() => {
    if (params.autoSearchNpc === 'true') {
      setSearchText('npc');
    }
  }, [params.autoSearchNpc]);

  const { data: searchResults = [], isLoading: isSearching } = useUserSearchQuery({
    searchText,
    currentUserId: user?.id
  });

  const { rivalries } = useAllRivalries();
  const { addRivalry, updateRivalry } = useAllRivalriesUpdate();

  const { mutate: createRivalry } = useCreateRivalryMutation({
    onSuccess: (newRivalry) => {
      // Add the newly created rivalry to the provider with user names
      if (newRivalry && selectedUser && user) {
        addRivalry({
          ...(newRivalry as any),
          userAName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          userBName:
            `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() ||
            selectedUser.email
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

  const { mutate: acceptRivalry } = useAcceptRivalryMutation({
    onSuccess: () => {
      // Update the rivalry to accepted in the provider
      if (selectedUser && user) {
        const rivalryToAccept = rivalries.find(
          (r) => r.userAId === selectedUser.id && r.userBId === user.id && !r.accepted
        );
        if (rivalryToAccept) {
          updateRivalry(rivalryToAccept.id, { accepted: true });
        }
      }
      setCreatingRivalry(false);
      router.back();
    },
    onError: (err) => {
      console.error('[CreateRivalry] Error accepting rivalry:', err);
      setError(err.message || 'Failed to accept rivalry');
      setCreatingRivalry(false);
    }
  });

  const { mutate: createNpcRivalry } = useCreateNpcRivalryMutation({
    onSuccess: (newRivalry) => {
      // Add the newly created NPC rivalry to the provider with user names
      if (newRivalry && selectedUser && user) {
        addRivalry({
          ...(newRivalry as any),
          userAName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          userBName:
            `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() ||
            selectedUser.email
        });
      }
      setCreatingRivalry(false);
      // Navigate to the rivalry detail screen
      router.push(`/rivalry/${newRivalry.id}`);
    },
    onError: (err) => {
      console.error('[CreateRivalry] Error creating NPC rivalry:', err);
      setError(err.message || 'Failed to create NPC rivalry');
      setCreatingRivalry(false);
    }
  });

  const handleCreateOrAcceptRivalry = () => {
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

    // Check if this is accepting an existing rivalry request
    const pendingRivalry = rivalries.find(
      (r) => r.userAId === selectedUser.id && r.userBId === user.id && !r.accepted
    );

    if (pendingRivalry) {
      // Accept the existing rivalry
      acceptRivalry(pendingRivalry.id);
    } else if (selectedUser.role === 13) {
      // Create an NPC rivalry (auto-accepted with tier lists for both users)
      createNpcRivalry({
        userAId: user.id,
        userBId: selectedUser.id,
        gameId
      });
    } else {
      // Create a regular rivalry
      createRivalry({
        userAId: user.id,
        userBId: selectedUser.id,
        gameId
      });
    }
  };

  const renderUserItem = ({ item }: { item: MUser }) => {
    // Find if there's an existing rivalry with this user
    const existingRivalry = rivalries.find((r) => r.userAId === item.id || r.userBId === item.id);

    // Determine badge to show (mutually exclusive, in priority order)
    let badge: { text: string; color: string } | null = null;
    let isDisabled = false;

    if (existingRivalry?.accepted) {
      // Priority 1: Active rivalry exists
      badge = { text: 'Active Rivalry', color: colors.green600 };
      isDisabled = true; // Can't select someone you already have an active rivalry with
    } else if (
      existingRivalry &&
      existingRivalry.userAId === item.id &&
      existingRivalry.userBId === user?.id
    ) {
      // Priority 2: This user initiated a rivalry with the logged-in user (needs acceptance)
      badge = { text: 'Awaiting Your Acceptance', color: colors.amber400 };
      isDisabled = false; // Allow selection to accept
    } else if (
      existingRivalry &&
      existingRivalry.userAId === user?.id &&
      existingRivalry.userBId === item.id
    ) {
      // Priority 3: Logged-in user already initiated a rivalry with this person
      badge = { text: 'Rivalry Initiated', color: colors.slate500 };
      isDisabled = true; // Can't initiate another rivalry until they accept
    } else if (item.role === 13) {
      // Priority 4: NPC user
      badge = { text: 'NPC', color: colors.purple600 };
      isDisabled = false;
    }

    return (
      <TouchableOpacity
        onPress={() => !isDisabled && setSelectedUser(item)}
        disabled={isDisabled}
        style={{
          paddingVertical: 16,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.gray750,
          backgroundColor: selectedUser?.id === item.id ? colors.gray700 : 'transparent',
          opacity: isDisabled ? 0.5 : 1
        }}
      >
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text style={[styles.text, { fontSize: 16, fontWeight: 'bold' }]}>
            {item.firstName} {item.lastName}
          </Text>
          {badge && (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
                backgroundColor: `${badge.color}20`
              }}
            >
              <Text style={[styles.text, { fontSize: 12, color: badge.color }]}>{badge.text}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, darkStyles.container]} edges={['top', 'bottom']}>
      <View style={{ flex: 1 }}>
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.gray750
          }}
        >
          <Text style={[styles.text, { fontSize: 24, fontWeight: 'bold' }]}>
            Create New Rivalry
          </Text>
          <Text style={[styles.text, { marginTop: 4, color: colors.gray400 }]}>
            Search for a user to challenge in {gameName}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Type 'npc' or search by name/email..."
            placeholderTextColor={colors.gray500}
            style={{
              backgroundColor: colors.slate900,
              color: 'white',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 8,
              fontSize: 16,
              borderWidth: 1,
              borderColor: colors.slate600
            }}
          />
        </View>

        {error && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <Text style={[styles.text, { color: colors.red600, fontSize: 14 }]}>
              Error: {error}
            </Text>
          </View>
        )}

        {isSearching && searchText.length >= 2 && (
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.purple900} />
          </View>
        )}

        {!isSearching && searchText.length >= 2 && searchResults.length === 0 && (
          <View style={{ paddingVertical: 32, paddingHorizontal: 16, alignItems: 'center' }}>
            <Text style={[styles.text, { color: colors.gray400 }]}>
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

        {selectedUser &&
          (() => {
            // Determine if this is accepting an existing rivalry
            const pendingRivalry = rivalries.find(
              (r) => r.userAId === selectedUser.id && r.userBId === user?.id && !r.accepted
            );
            const isAccepting = !!pendingRivalry;
            const isNpc = selectedUser.role === 13;

            return (
              <View
                style={{
                  padding: 16,
                  borderTopWidth: 1,
                  borderTopColor: colors.gray750,
                  backgroundColor: colors.slate950
                }}
              >
                <Text
                  style={[styles.text, { fontSize: 14, color: colors.gray400, marginBottom: 8 }]}
                >
                  {isAccepting
                    ? `Accept rivalry from ${selectedUser.firstName} ${selectedUser.lastName}`
                    : isNpc
                      ? `Starting rivalry with NPC ${selectedUser.firstName} ${selectedUser.lastName}`
                      : `Challenging ${selectedUser.firstName} ${selectedUser.lastName}`}
                </Text>
                <TouchableOpacity
                  onPress={handleCreateOrAcceptRivalry}
                  disabled={creatingRivalry}
                  style={{
                    backgroundColor: creatingRivalry
                      ? colors.slate600
                      : isAccepting
                        ? colors.amber400
                        : isNpc
                          ? colors.purple600
                          : colors.purple900,
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
                      {isAccepting
                        ? 'Accept Rivalry'
                        : isNpc
                          ? 'Start NPC Rivalry'
                          : 'Initiate Rivalry'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })()}
      </View>
    </SafeAreaView>
  );
}
