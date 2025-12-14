import { useQuery } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

import type { MRivalry } from '../models/m-rivalry';
import { getMUser, type MUser } from '../models/m-user';

// Lazy client initialization to avoid crashes when Amplify isn't configured (e.g., Expo Go)
let client: ReturnType<typeof generateClient<Schema>> | null = null;

function getClient() {
  if (!client) {
    client = generateClient<Schema>();
  }

  return client;
}

// Reusable selection sets
const USER_SELECTION_SET = [
  'id',
  'email',
  'firstName',
  'lastName',
  'role',
  'awsSub',
  'createdAt',
  'updatedAt',
  'deletedAt',
] as const;

const RIVALRY_SELECTION_SET = [
  'id',
  'userAId',
  'userBId',
  'gameId',
  'contestCount',
  'currentContestId',
  'hiddenByA',
  'hiddenByB',
  'createdAt',
  'updatedAt',
  'deletedAt',
] as const;

// User search scoring constants
const SEARCH_SCORE = {
  EXACT_MATCH: 100,
  FULL_NAME_MATCH: 90,
  WORD_BOUNDARY_MATCH: 60,
  STARTS_WITH_FIRST_NAME: 50,
  STARTS_WITH_LAST_NAME: 50,
  STARTS_WITH_FULL_NAME: 45,
  STARTS_WITH_EMAIL: 40,
  CONTAINS_FIRST_NAME: 20,
  CONTAINS_LAST_NAME: 20,
  CONTAINS_EMAIL: 15,
  CONTAINS_FULL_NAME: 10,
} as const;

// User role constants
const USER_ROLE = {
  NPC: 13,
} as const;

// Search configuration
const SEARCH_CONFIG = {
  MAX_RANDOM_NPCS: 5,
  SHUFFLE_THRESHOLD: 0.5,
} as const;

// Top-level regex for word splitting (performance optimization)
const WHITESPACE_REGEX = /\s+/;

// Type for user data returned from selection set queries
type UserFromSelection = Schema['User']['type'];

// Helper to check if search matches word boundaries in name
function hasWordBoundaryMatch(
  searchLower: string,
  firstName: string,
  lastName: string
): boolean {
  const searchWords = searchLower.split(WHITESPACE_REGEX);
  const nameWords = [firstName, lastName].filter(Boolean);

  if (searchWords.length <= 1 || nameWords.length <= 1) return false;

  return searchWords.every((searchWord, idx) =>
    nameWords[idx]?.startsWith(searchWord)
  );
}

// Helper function to calculate user search relevance score
function calculateUserSearchScore(
  user: { firstName?: string | null; lastName?: string | null; email: string },
  searchLower: string
): number {
  const firstName = (user.firstName ?? '').toLowerCase();
  const lastName = (user.lastName ?? '').toLowerCase();
  const email = user.email.toLowerCase();
  const fullName = `${firstName} ${lastName}`.trim();

  let score = 0;

  // Exact matches get highest priority
  const hasExactMatch =
    firstName === searchLower ||
    lastName === searchLower ||
    email === searchLower;
  if (hasExactMatch) score += SEARCH_SCORE.EXACT_MATCH;

  // Full name exact match
  if (fullName === searchLower) score += SEARCH_SCORE.FULL_NAME_MATCH;

  // Starts with matches
  if (firstName.startsWith(searchLower))
    score += SEARCH_SCORE.STARTS_WITH_FIRST_NAME;
  if (lastName.startsWith(searchLower))
    score += SEARCH_SCORE.STARTS_WITH_LAST_NAME;
  if (email.startsWith(searchLower)) score += SEARCH_SCORE.STARTS_WITH_EMAIL;
  if (fullName.startsWith(searchLower))
    score += SEARCH_SCORE.STARTS_WITH_FULL_NAME;

  // Contains matches
  if (firstName.includes(searchLower))
    score += SEARCH_SCORE.CONTAINS_FIRST_NAME;
  if (lastName.includes(searchLower)) score += SEARCH_SCORE.CONTAINS_LAST_NAME;
  if (email.includes(searchLower)) score += SEARCH_SCORE.CONTAINS_EMAIL;
  if (fullName.includes(searchLower)) score += SEARCH_SCORE.CONTAINS_FULL_NAME;

  // Word boundary matches (e.g., "john doe" matches "j d")
  if (hasWordBoundaryMatch(searchLower, firstName, lastName)) {
    score += SEARCH_SCORE.WORD_BOUNDARY_MATCH;
  }

  return score;
}

interface UserDataQueryProps {
  rivalries: MRivalry[];
}

interface UserWithRivalriesByAwsSubProps {
  amplifyUser: { username?: string };
}

interface UserSearchQueryProps {
  searchText: string;
  currentUserId?: string;
}

/** Queries */

export const useUserWithRivalriesByAwsSubQuery = ({
  amplifyUser,
}: UserWithRivalriesByAwsSubProps) =>
  useQuery({
    queryKey: ['usersByAwsSub', amplifyUser?.username],
    queryFn: async () => {
      if (!amplifyUser?.username) return null;

      // Query users by awsSub using Gen 2 client
      const { data: users, errors } = await getClient().models.User.list({
        filter: {
          awsSub: {
            eq: amplifyUser.username,
          },
        },
        selectionSet: USER_SELECTION_SET,
      });

      if (errors) {
        console.error('[useUserWithRivalriesByAwsSubQuery] Errors:', errors);
        throw new Error(errors[0]?.message || 'Failed to fetch user');
      }

      // Fetch rivalries for the user if found
      if (users && users.length > 0) {
        const user = users[0];

        // Fetch rivalries where user is userA
        const { data: rivalriesA } = await getClient().models.Rivalry.list({
          filter: {
            userAId: {
              eq: user.id,
            },
          },
          selectionSet: RIVALRY_SELECTION_SET,
        });

        // Fetch rivalries where user is userB
        const { data: rivalriesB } = await getClient().models.Rivalry.list({
          filter: {
            userBId: {
              eq: user.id,
            },
          },
          selectionSet: RIVALRY_SELECTION_SET,
        });

        return {
          user,
          rivalriesA: rivalriesA || [],
          rivalriesB: rivalriesB || [],
        };
      }

      return null;
    },
  });

export const useUserDataQuery = ({ rivalries }: UserDataQueryProps) => {
  const uniqueUserIds: string[] = [
    ...new Set(rivalries.flatMap(({ userAId, userBId }) => [userAId, userBId])),
  ].filter(Boolean);

  return useQuery({
    queryKey: ['getUsersNames', uniqueUserIds],
    queryFn: async () => {
      if (!uniqueUserIds.length) return null;

      // Fetch all users in parallel using Gen 2 client
      const apiClient = getClient();
      const userPromises = uniqueUserIds.map(userId =>
        apiClient.models.User.get(
          { id: userId },
          {
            selectionSet: USER_SELECTION_SET,
          }
        )
      );

      const results = await Promise.all(userPromises);

      // Filter out errors and extract data
      const users = results
        .filter(result => !result.errors && result.data)
        .map(result => result.data);

      return users;
    },
  });
};

export const useUserSearchQuery = ({
  searchText,
  currentUserId,
}: UserSearchQueryProps) => {
  return useQuery({
    queryKey: ['userSearch', searchText, currentUserId],
    queryFn: async () => {
      if (!searchText || searchText.trim().length < 2) {
        return [];
      }

      const searchLower = searchText.toLowerCase().trim();
      const isNpcSearch =
        searchLower === 'np' ||
        searchLower === 'cp' ||
        searchLower.includes('npc') ||
        searchLower.includes('cpu');

      // Fetch all users (in production, you'd want server-side filtering)
      const { data: users, errors } = await getClient().models.User.list({
        selectionSet: USER_SELECTION_SET,
      });

      if (errors) {
        console.error('[useUserSearchQuery] Errors:', errors);
        throw new Error(errors[0]?.message || 'Failed to fetch users');
      }

      // Separate NPC users from other users
      const npcUsers = users.filter(
        user =>
          user.role === USER_ROLE.NPC &&
          user.id !== currentUserId &&
          !user.deletedAt
      );
      const regularUsers = users.filter(
        user =>
          user.role !== USER_ROLE.NPC &&
          user.id !== currentUserId &&
          !user.deletedAt
      );

      const finalResults: MUser[] = [];

      // If NPC search, add random NPCs at the top
      if (isNpcSearch && npcUsers.length > 0) {
        // Shuffle and take random NPCs
        const shuffledNpcs = [...npcUsers].sort(
          () => Math.random() - SEARCH_CONFIG.SHUFFLE_THRESHOLD
        );
        const randomNpcs = shuffledNpcs
          .slice(0, SEARCH_CONFIG.MAX_RANDOM_NPCS)
          .map(user => getMUser({ user: user as UserFromSelection }));
        finalResults.push(...randomNpcs);
      }

      // Filter and score regular users based on search relevance
      const scoredUsers = regularUsers
        .map(user => ({
          user,
          score: calculateUserSearchScore(user, searchLower),
        }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ user }) => getMUser({ user: user as UserFromSelection }));

      // Add regular search results after NPCs
      finalResults.push(...scoredUsers);

      return finalResults;
    },
    enabled: searchText.trim().length >= 2,
  });
};
