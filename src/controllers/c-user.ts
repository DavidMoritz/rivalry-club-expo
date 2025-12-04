import { useQuery } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

import { MRivalry } from '../models/m-rivalry';

const client = generateClient<Schema>();

interface UserDataQueryProps {
  rivalries: MRivalry[];
}

interface UserWithRivalriesByAwsSubProps {
  amplifyUser: { username?: string };
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
      const { data: users, errors } = await client.models.User.list({
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
        const { data: rivalriesA } = await client.models.Rivalry.list({
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
        const { data: rivalriesB } = await client.models.Rivalry.list({
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
