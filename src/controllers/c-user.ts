import { useMutation, useQuery } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

import { MRivalry } from '../models/m-rivalry';
import { getMUser, MUser } from '../models/m-user';

// Lazy client initialization to avoid crashes when Amplify isn't configured (e.g., Expo Go)
let client: ReturnType<typeof generateClient<Schema>> | null = null;

function getClient() {
  if (!client) {
    client = generateClient<Schema>();
  }

  return client;
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
        selectionSet: [
          'id',
          'email',
          'firstName',
          'lastName',
          'role',
          'awsSub',
          'createdAt',
          'updatedAt',
          'deletedAt',
        ],
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
          selectionSet: [
            'id',
            'userAId',
            'userBId',
            'gameId',
            'contestCount',
            'currentContestId',
            'createdAt',
            'updatedAt',
            'deletedAt',
          ],
        });

        // Fetch rivalries where user is userB
        const { data: rivalriesB } = await getClient().models.Rivalry.list({
          filter: {
            userBId: {
              eq: user.id,
            },
          },
          selectionSet: [
            'id',
            'userAId',
            'userBId',
            'gameId',
            'contestCount',
            'currentContestId',
            'createdAt',
            'updatedAt',
            'deletedAt',
          ],
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
    ...new Set(
      rivalries.map(({ userAId, userBId }) => [userAId, userBId]).flat(),
    ),
  ].filter(Boolean);

  return useQuery({
    queryKey: ['getUsersNames', uniqueUserIds],
    queryFn: async () => {
      if (!uniqueUserIds.length) return null;

      // Fetch all users in parallel using Gen 2 client
      const userPromises = uniqueUserIds.map((userId) =>
        client.models.User.get(
          { id: userId },
          {
            selectionSet: [
              'id',
              'email',
              'firstName',
              'lastName',
              'role',
              'awsSub',
              'createdAt',
              'updatedAt',
              'deletedAt',
            ],
          }
        )
      );

      const results = await Promise.all(userPromises);

      // Filter out errors and extract data
      const users = results
        .filter((result) => !result.errors && result.data)
        .map((result) => result.data);

      return users;
    },
  });
};

export const useUserSearchQuery = ({ searchText, currentUserId }: UserSearchQueryProps) => {
  return useQuery({
    queryKey: ['userSearch', searchText, currentUserId],
    queryFn: async () => {
      if (!searchText || searchText.trim().length < 2) {
        return [];
      }

      const searchLower = searchText.toLowerCase().trim();

      // Fetch all users (in production, you'd want server-side filtering)
      const { data: users, errors } = await getClient().models.User.list({
        selectionSet: [
          'id',
          'email',
          'firstName',
          'lastName',
          'role',
          'awsSub',
          'createdAt',
          'updatedAt',
          'deletedAt'
        ]
      });

      if (errors) {
        console.error('[useUserSearchQuery] Errors:', errors);
        throw new Error(errors[0]?.message || 'Failed to fetch users');
      }

      // Filter and score users based on search relevance
      const scoredUsers = users
        .filter((user) => user.id !== currentUserId && !user.deletedAt)
        .map((user) => {
          const firstName = (user.firstName || '').toLowerCase();
          const lastName = (user.lastName || '').toLowerCase();
          const email = (user.email || '').toLowerCase();
          const fullName = `${firstName} ${lastName}`.trim();

          let score = 0;

          // Exact matches get highest priority
          if (firstName === searchLower || lastName === searchLower || email === searchLower) {
            score += 100;
          }

          // Full name exact match
          if (fullName === searchLower) {
            score += 90;
          }

          // Starts with matches
          if (firstName.startsWith(searchLower)) score += 50;
          if (lastName.startsWith(searchLower)) score += 50;
          if (email.startsWith(searchLower)) score += 40;
          if (fullName.startsWith(searchLower)) score += 45;

          // Contains matches
          if (firstName.includes(searchLower)) score += 20;
          if (lastName.includes(searchLower)) score += 20;
          if (email.includes(searchLower)) score += 15;
          if (fullName.includes(searchLower)) score += 10;

          // Word boundary matches (e.g., "john doe" matches "j d")
          const searchWords = searchLower.split(/\s+/);
          const nameWords = [firstName, lastName].filter(Boolean);

          if (searchWords.length > 1 && nameWords.length > 1) {
            const allWordsMatch = searchWords.every((searchWord, idx) =>
              nameWords[idx]?.startsWith(searchWord)
            );
            if (allWordsMatch) score += 60;
          }

          return { user, score };
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ user }) => getMUser({ user: user as any }));

      return scoredUsers;
    },
    enabled: searchText.trim().length >= 2
  });
};
