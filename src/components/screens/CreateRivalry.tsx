import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useAcceptRivalryMutation,
  useCreateNpcRivalryMutation,
  useCreateRivalryMutation
} from '../../controllers/c-rivalry';
import { useUserSearchQuery } from '../../controllers/c-user';
import { useAuthUser } from '../../hooks/useAuthUser';
import type { MUser } from '../../models/m-user';
import {
  type RivalryWithUsers,
  useAllRivalries,
  useAllRivalriesUpdate
} from '../../providers/all-rivalries';
import { useGame } from '../../providers/game';
import { colors } from '../../utils/colors';
import { center, darkStyles, styles } from '../../utils/styles';

// User role constant for NPC users
const NPC_ROLE = 13;

// Opacity for disabled items
const DISABLED_OPACITY = 0.5;

interface SelectedUserPanelProps {
  creatingRivalry: boolean;
  onCreateOrAccept: () => void;
  rivalries: RivalryWithUsers[];
  selectedUser: MUser;
  userId?: string;
}

function SelectedUserPanel({
  creatingRivalry,
  onCreateOrAccept,
  rivalries,
  selectedUser,
  userId
}: SelectedUserPanelProps) {
  // Check if this is an acceptance scenario
  const pendingRivalry = rivalries.find(
    (r) => r.userAId === selectedUser.id && r.userBId === userId && !r.accepted
  );
  const isAccepting = Boolean(pendingRivalry);
  const isNpc = selectedUser.role === NPC_ROLE;

  const getButtonText = () => {
    if (isAccepting) return 'Accept Rivalry';
    if (isNpc) return 'Start NPC Rivalry';
    return 'Send Rivalry Request';
  };
  const buttonText = getButtonText();

  return (
    <View style={selectedUserPanelContainerStyle}>
      <Text style={[styles.text, selectedUserLabelStyle]}>
        Selected: {selectedUser.firstName} {selectedUser.lastName}
      </Text>
      <TouchableOpacity
        disabled={creatingRivalry}
        onPress={onCreateOrAccept}
        style={{
          ...createRivalryButtonStyle,
          opacity: creatingRivalry ? DISABLED_OPACITY : 1
        }}
      >
        {creatingRivalry ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <Text style={buttonTextStyle}>{buttonText}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

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
          ...(newRivalry as unknown as RivalryWithUsers),
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
          ...(newRivalry as unknown as RivalryWithUsers),
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

  const buildValidationError = (): string | null => {
    if (selectedUser && user && gameId) return null;

    let errorMsg = 'Missing required information: ';
    if (!selectedUser) errorMsg += 'No user selected. ';
    if (!user) errorMsg += 'You are not logged in. ';
    if (!gameId) errorMsg += 'No game selected. Please go back and select a game first. ';
    return errorMsg;
  };

  const handleCreateOrAcceptRivalry = () => {
    const validationError = buildValidationError();
    if (validationError) {
      console.warn('[CreateRivalry] Missing required data:', {
        selectedUser: selectedUser?.id,
        user: user?.id,
        gameId
      });
      setError(validationError);
      return;
    }

    // After validation, we know these are defined
    if (!(user && selectedUser)) return;

    const currentUser = user;
    const opponent = selectedUser;

    setError(null);
    setCreatingRivalry(true);

    // Check if this is accepting an existing rivalry request
    const pendingRivalry = rivalries.find(
      (r) => r.userAId === opponent.id && r.userBId === currentUser.id && !r.accepted
    );

    if (pendingRivalry) {
      // Accept the existing rivalry
      acceptRivalry(pendingRivalry.id);
    } else if (opponent.role === NPC_ROLE) {
      // Create an NPC rivalry (auto-accepted with tier lists for both users)
      createNpcRivalry({
        userAId: currentUser.id,
        userBId: opponent.id,
        gameId
      });
    } else {
      // Create a regular rivalry
      createRivalry({
        userAId: currentUser.id,
        userBId: opponent.id,
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
    } else if (item.role === NPC_ROLE) {
      // Priority 4: NPC user
      badge = { text: 'NPC', color: colors.purple600 };
      isDisabled = false;
    }

    return (
      <TouchableOpacity
        disabled={isDisabled}
        onPress={() => {
          if (!isDisabled) {
            Keyboard.dismiss();
            setSelectedUser(item);
          }
        }}
        style={{
          ...userItemStyle,
          backgroundColor: selectedUser?.id === item.id ? colors.gray700 : colors.none,
          opacity: isDisabled ? DISABLED_OPACITY : 1
        }}
      >
        <View style={userItemRowStyle}>
          <Text style={userNameTextStyle}>
            {item.firstName} {item.lastName}
          </Text>
          {badge && (
            <View
              style={{
                ...badgeContainerStyle,
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
    <SafeAreaView edges={['top', 'bottom']} style={[styles.container, darkStyles.container]}>
      <View style={{ flex: 1 }}>
        <View style={headerContainerStyle}>
          <Text style={headerTitleStyle}>Create New Rivalry</Text>
          <Text style={headerSubtitleStyle}>Search for a user to challenge in {gameName}</Text>
        </View>

        <View style={searchContainerStyle}>
          <TextInput
            onChangeText={setSearchText}
            placeholder="Type 'npc', friend code, or name/email..."
            placeholderTextColor={colors.gray500}
            style={searchInputStyle}
            value={searchText}
          />
        </View>

        {error && (
          <View style={errorContainerStyle}>
            <Text style={errorTextStyle}>Error: {error}</Text>
          </View>
        )}

        {isSearching && searchText.length >= 2 && (
          <View style={loadingContainerStyle}>
            <ActivityIndicator color={colors.purple900} size="large" />
          </View>
        )}

        {!isSearching && searchText.length >= 2 && searchResults.length === 0 && (
          <View style={noResultsContainerStyle}>
            <Text style={noResultsTextStyle}>No users found matching "{searchText}"</Text>
          </View>
        )}

        {searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {selectedUser && (
          <SelectedUserPanel
            creatingRivalry={creatingRivalry}
            onCreateOrAccept={handleCreateOrAcceptRivalry}
            rivalries={rivalries}
            selectedUser={selectedUser}
            userId={user?.id}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// Base padding style - used in multiple containers
const basePaddingStyle = {
  paddingHorizontal: 16,
  paddingVertical: 16
};

// SelectedUserPanel styles
const selectedUserPanelContainerStyle = {
  ...basePaddingStyle,
  borderTopWidth: 1,
  borderTopColor: colors.gray750,
  backgroundColor: colors.slate900
};

const selectedUserLabelStyle = {
  marginBottom: 8
};

const createRivalryButtonStyle = {
  backgroundColor: colors.purple600,
  paddingVertical: 14,
  borderRadius: 8,
  alignItems: center
};

const buttonTextStyle = {
  ...styles.text,
  fontWeight: 'bold' as const,
  color: colors.white
};

// User item styles
const userItemStyle = {
  paddingVertical: 16,
  paddingHorizontal: 16,
  borderBottomWidth: 1,
  borderBottomColor: colors.gray750
};

const userItemRowStyle = {
  flexDirection: 'row' as const,
  alignItems: center,
  justifyContent: 'space-between' as const
};

const userNameTextStyle = {
  ...styles.text,
  fontSize: 16,
  fontWeight: 'bold' as const
};

const badgeContainerStyle = {
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 4
};

// Header styles
const headerContainerStyle = {
  ...basePaddingStyle,
  borderBottomWidth: 1,
  borderBottomColor: colors.gray750
};

const headerTitleStyle = {
  ...styles.text,
  fontSize: 24,
  fontWeight: 'bold' as const
};

const headerSubtitleStyle = {
  ...styles.text,
  marginTop: 14,
  color: colors.gray400
};

// Search input styles
const searchContainerStyle = basePaddingStyle;

const searchInputStyle = {
  backgroundColor: colors.slate900,
  color: colors.white,
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderRadius: 8,
  fontSize: 16,
  borderWidth: 1,
  borderColor: colors.slate600
};

// Error styles
const errorContainerStyle = {
  paddingHorizontal: 16,
  paddingBottom: 16
};

const errorTextStyle = {
  ...styles.text,
  color: colors.red600,
  fontSize: 14
};

// Loading and no results styles
const loadingContainerStyle = {
  paddingVertical: 32,
  alignItems: center
};

const noResultsContainerStyle = {
  paddingVertical: 32,
  paddingHorizontal: 16,
  alignItems: center
};

const noResultsTextStyle = {
  ...styles.text,
  color: colors.gray400
};
